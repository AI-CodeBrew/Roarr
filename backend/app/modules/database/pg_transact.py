"""Minimal DynamoDB transact_write_items shim on top of PgDynamoResource."""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from .pg_document_store import PgDynamoResource, ClientErrorCompat, _json_safe

logger = logging.getLogger(__name__)


def _eval_condition_expr(
    item: Dict[str, Any], expr: str, values: Dict[str, Any]
) -> bool:
    """Support common conditions: attribute_not_exists(PK), balance >= :cost."""
    e = (expr or "").strip()
    if not e:
        return True
    if "attribute_not_exists" in e:
        # attribute_not_exists(PK)
        import re

        m = re.search(r"attribute_not_exists\((\w+)\)", e)
        if m and m.group(1) in item:
            return False
        return True
    if ">=" in e:
        left, right = [x.strip() for x in e.split(">=", 1)]
        lv = item.get(left)
        rv = values.get(right, right)
        try:
            return float(lv or 0) >= float(rv)
        except Exception:
            return False
    return True


def _apply_update_expr(
    item: Dict[str, Any],
    update_expression: str,
    names: Dict[str, str],
    values: Dict[str, Any],
) -> Dict[str, Any]:
    import copy
    import re

    out = copy.deepcopy(item)
    expr = update_expression or ""

    # ADD a :x, b :y
    add_m = re.search(r"\bADD\b(.+?)(?=\bSET\b|$)", expr, flags=re.I | re.S)
    if add_m:
        for part in add_m.group(1).split(","):
            part = part.strip()
            if not part:
                continue
            bits = part.split()
            if len(bits) >= 2:
                field, val_key = bits[0], bits[1]
                field = names.get(field, field.lstrip("#"))
                delta = values.get(val_key, 0)
                try:
                    out[field] = _json_safe(
                        (float(out.get(field) or 0) + float(delta))
                    )
                    if float(out[field]) == int(out[field]):
                        out[field] = int(out[field])
                except Exception:
                    out[field] = delta

    set_m = re.search(r"\bSET\b(.+)$", expr, flags=re.I | re.S)
    if set_m:
        for part in set_m.group(1).split(","):
            part = part.strip()
            if not part or "=" not in part:
                continue
            left, right = [x.strip() for x in part.split("=", 1)]
            left = names.get(left, left.lstrip("#"))
            if right.startswith(":"):
                out[left] = _json_safe(values.get(right))
            else:
                out[left] = right
    return out


def _from_av(av: Any) -> Any:
    """Convert Dynamo AttributeValue map to Python."""
    if not isinstance(av, dict) or len(av) != 1:
        return av
    t, v = next(iter(av.items()))
    if t == "S":
        return v
    if t == "N":
        try:
            return int(v) if "." not in str(v) else float(v)
        except Exception:
            return v
    if t == "BOOL":
        return bool(v)
    if t == "NULL":
        return None
    if t == "M":
        return {k: _from_av(x) for k, x in (v or {}).items()}
    if t == "L":
        return [_from_av(x) for x in (v or [])]
    return v


def _deserialize_item(item: Dict[str, Any]) -> Dict[str, Any]:
    # Already plain dict (resource API) vs AttributeValue map
    if not item:
        return {}
    sample = next(iter(item.values()))
    if isinstance(sample, dict) and len(sample) == 1 and next(iter(sample)) in (
        "S",
        "N",
        "BOOL",
        "M",
        "L",
        "NULL",
    ):
        return {k: _from_av(v) for k, v in item.items()}
    return item


class PgTransactClient:
    def __init__(self, resource: PgDynamoResource | None = None):
        self.resource = resource or PgDynamoResource()

    def transact_write_items(self, TransactItems: List[Dict[str, Any]], **_kwargs):
        # Execute sequentially; raise ClientErrorCompat on condition failure
        for entry in TransactItems or []:
            if "Put" in entry:
                put = entry["Put"]
                table = self.resource.Table(put["TableName"])
                item = _deserialize_item(put["Item"])
                cond = put.get("ConditionExpression") or ""
                if "attribute_not_exists" in cond:
                    # Check PK
                    key = {"PK": item.get("PK")}
                    if "SK" in item:
                        key["SK"] = item["SK"]
                    existing = table.get_item(Key=key).get("Item")
                    if existing:
                        raise ClientErrorCompat(
                            "ConditionalCheckFailedException",
                            {"Error": {"Code": "ConditionalCheckFailedException"}},
                        )
                table.put_item(Item=item)
            elif "Update" in entry:
                upd = entry["Update"]
                table = self.resource.Table(upd["TableName"])
                key = _deserialize_item(upd["Key"])
                values_raw = upd.get("ExpressionAttributeValues") or {}
                # AttributeValue map → {":amt": 5}
                values: Dict[str, Any] = {}
                for vk, vv in values_raw.items():
                    values[vk] = _from_av(vv) if isinstance(vv, dict) else vv
                current = table.get_item(Key=key).get("Item") or dict(key)
                cond = upd.get("ConditionExpression") or ""
                if cond and not _eval_condition_expr(current, cond, values):
                    raise ClientErrorCompat(
                        "ConditionalCheckFailedException",
                        {"Error": {"Code": "ConditionalCheckFailedException"}},
                    )
                updated = _apply_update_expr(
                    current,
                    upd.get("UpdateExpression", ""),
                    upd.get("ExpressionAttributeNames") or {},
                    values,
                )
                for k, v in key.items():
                    updated.setdefault(k, v)
                table.put_item(Item=updated)
            elif "Delete" in entry:
                dele = entry["Delete"]
                table = self.resource.Table(dele["TableName"])
                key = _deserialize_item(dele["Key"])
                table.delete_item(Key=key)
            else:
                logger.warning("Unhandled transact entry: %s", list(entry.keys()))
        return {}
