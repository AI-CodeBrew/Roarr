"""
Postgres document table shim (Supabase).

Stores each item as jsonb so DocumentStore call sites
(get_item / put_item / update_item / query / scan) keep working.
"""
from __future__ import annotations

import copy
import logging
import re
from decimal import Decimal
from typing import Any, Dict, List, Optional

from psycopg.types.json import Json

from .pg_pool import pg_conn

logger = logging.getLogger(__name__)


class ClientErrorCompat(Exception):
    def __init__(self, message: str = "", response: Optional[Dict] = None):
        super().__init__(message)
        self.response = response or {"Error": {"Code": str(message), "Message": str(message)}}


CONDITION_FAILED = "ConditionalCheckFailedException"


def condition_failed_error() -> ClientErrorCompat:
    """The error DynamoDB raises when a ConditionExpression is false; callers match on its name."""
    return ClientErrorCompat(
        CONDITION_FAILED,
        {"Error": {"Code": CONDITION_FAILED, "Message": "The conditional request failed"}},
    )


_COND_FUNC_RE = re.compile(
    r"^(attribute_exists|attribute_not_exists)\s*\(\s*(#?[A-Za-z0-9_]+)\s*\)$", re.I
)
_COND_CMP_RE = re.compile(r"^(#?[A-Za-z0-9_]+)\s*(<>|<=|>=|=|<|>)\s*(:[A-Za-z0-9_]+)$")


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float, Decimal)) and not isinstance(value, bool)


def _compare(left: Any, op: str, right: Any) -> bool:
    if op in ("=", "<>"):
        if isinstance(left, bool) or isinstance(right, bool):
            equal = isinstance(left, bool) and isinstance(right, bool) and left == right
        elif _is_number(left) and _is_number(right):
            equal = float(left) == float(right)
        else:
            equal = left == right
        return equal if op == "=" else not equal
    if _is_number(left) and _is_number(right):
        a, b = float(left), float(right)
    elif isinstance(left, str) and isinstance(right, str):
        a, b = left, right
    else:
        return False
    return {"<": a < b, "<=": a <= b, ">": a > b, ">=": a >= b}[op]


def eval_condition_expression(
    item: Dict[str, Any],
    expression: Any,
    names: Optional[Dict[str, str]] = None,
    values: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Evaluate a DynamoDB ConditionExpression against an item (an empty dict when it doesn't exist).

    Supports the forms Roarr uses: attribute_exists(x), attribute_not_exists(x), and
    `x <op> :value` with =, <>, <, <=, >, >=, joined by AND / OR (AND binds tighter).
    Anything else raises ValueError, so an unsupported condition blocks the write instead of
    being skipped. As in DynamoDB, a comparison on a missing attribute is false, except `<>`.
    """
    if not isinstance(expression, str):
        raise ValueError(f"Unsupported ConditionExpression type: {type(expression).__name__}")
    names = names or {}
    values = values or {}

    def resolve(token: str) -> str:
        return names.get(token, token.lstrip("#"))

    def atom(text: str) -> bool:
        text = text.strip()
        while text.startswith("(") and text.endswith(")"):
            text = text[1:-1].strip()
        m = _COND_FUNC_RE.match(text)
        if m:
            present = resolve(m.group(2)) in item
            return present if m.group(1).lower() == "attribute_exists" else not present
        m = _COND_CMP_RE.match(text)
        if m:
            attr, op, placeholder = resolve(m.group(1)), m.group(2), m.group(3)
            if placeholder not in values:
                raise ValueError(f"ConditionExpression value {placeholder} is missing")
            if attr not in item:
                return op == "<>"
            return _compare(_json_safe(item[attr]), op, _json_safe(values[placeholder]))
        raise ValueError(f"Unsupported ConditionExpression clause: {text!r}")

    terms = re.split(r"\s+OR\s+", expression.strip(), flags=re.I)
    return any(
        all(atom(part) for part in re.split(r"\s+AND\s+", term, flags=re.I)) for term in terms
    )


_SET_RE = re.compile(
    r"#?(?P<path>[A-Za-z0-9_]+)(?:\.#?(?P<sub>[A-Za-z0-9_]+))?\s*=\s*(?P<val>:[A-Za-z0-9_]+)"
)


def _json_safe(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_safe(v) for v in obj]
    return obj


def _pk_from_key(key: Dict[str, Any]) -> tuple[str, str]:
    if not key:
        return "", ""
    # Common Roarr patterns: PK only, or session_id, or composite
    if "PK" in key:
        pk = str(key["PK"])
        sk = str(key.get("SK", key.get("sk", "")))
        return pk, sk
    if "session_id" in key:
        return str(key["session_id"]), ""
    if "user_id" in key and "pack_id" in key:
        return f"{key['user_id']}#{key['pack_id']}", ""
    if "user_id" in key:
        return str(key["user_id"]), str(key.get("SK", key.get("ledger_id", "")))
    # Fallback: first key = pk, second = sk
    items = list(key.items())
    pk = str(items[0][1])
    sk = str(items[1][1]) if len(items) > 1 else ""
    return pk, sk


def _pk_from_item(item: Dict[str, Any]) -> tuple[str, str]:
    if "PK" in item:
        return str(item["PK"]), str(item.get("SK", ""))
    if "session_id" in item:
        return str(item["session_id"]), ""
    if "user_id" in item and "id" in item:
        return str(item["user_id"]), str(item["id"])
    if "user_id" in item:
        return str(item["user_id"]), str(item.get("SK", item.get("created_at", "")))
    if "coupon_code" in item:
        return str(item["coupon_code"]), ""
    # last resort: hash of sorted keys is unstable — use first string-ish field
    for k in ("id", "shopify_domain", "domain", "page_id"):
        if k in item:
            return str(item[k]), ""
    raise ValueError(f"Cannot derive primary key from item keys: {list(item.keys())}")


def _apply_update_expr_local(
    item: Dict[str, Any],
    update_expression: str,
    names: Dict[str, str],
    values: Dict[str, Any],
) -> Dict[str, Any]:
    """Handle ADD + SET UpdateExpressions (credits wallets)."""
    out = copy.deepcopy(item)
    expr = update_expression or ""
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
                    out[field] = _json_safe(float(out.get(field) or 0) + float(delta))
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
    if add_m or set_m:
        return out
    return _apply_update(item, update_expression, names, values)


def _apply_update(
    item: Dict[str, Any],
    update_expression: str,
    names: Optional[Dict[str, str]],
    values: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    names = names or {}
    values = values or {}
    out = copy.deepcopy(item)

    expr = update_expression or ""
    # Handle REMOVE
    if "REMOVE" in expr.upper():
        remove_part = re.split(r"\bREMOVE\b", expr, flags=re.I)[-1]
        set_part = re.split(r"\bREMOVE\b", expr, flags=re.I)[0]
        for token in re.split(r"[,\s]+", remove_part.strip()):
            if not token:
                continue
            path = names.get(token, token.lstrip("#"))
            out.pop(path, None)
    else:
        set_part = expr

    set_part = re.sub(r"^\s*SET\s+", "", set_part, flags=re.I).strip()
    if not set_part:
        return out

    # Split on commas not inside nested paths — simple split is enough for Roarr exprs
    clauses = [c.strip() for c in set_part.split(",") if c.strip()]
    for clause in clauses:
        # if_not_exists(attr, :val)
        m_ife = re.match(
            r"(#?\w+)\s*=\s*if_not_exists\((#?\w+)\s*,\s*(:\w+)\)",
            clause,
            flags=re.I,
        )
        if m_ife:
            dest = names.get(m_ife.group(1), m_ife.group(1).lstrip("#"))
            src = names.get(m_ife.group(2), m_ife.group(2).lstrip("#"))
            val = values.get(m_ife.group(3))
            if src not in out:
                out[dest] = _json_safe(val)
            continue

        # list_append / nested — keep simple SET attr = :val
        m = re.match(
            r"(#?[\w.]+)\s*=\s*(:\w+)",
            clause,
        )
        if not m:
            # try path with ExpressionAttributeNames only
            m2 = _SET_RE.search(clause.replace(" ", ""))
            if not m2:
                logger.warning("Unhandled UpdateExpression clause: %s", clause)
                continue
            path = names.get("#" + m2.group("path"), m2.group("path"))
            if m2.group("sub"):
                sub = names.get("#" + m2.group("sub"), m2.group("sub"))
                base = out.get(path)
                if not isinstance(base, dict):
                    base = {}
                base[sub] = _json_safe(values.get(":" + m2.group("val").lstrip(":")))
                out[path] = base
            else:
                out[path] = _json_safe(values.get(":" + m2.group("val").lstrip(":")))
            continue

        left, right = m.group(1), m.group(2)
        # resolve name tokens
        parts = left.split(".")
        resolved = [names.get(p, p.lstrip("#")) for p in parts]
        val = _json_safe(values.get(right))
        if len(resolved) == 1:
            out[resolved[0]] = val
        else:
            cur = out
            for p in resolved[:-1]:
                if p not in cur or not isinstance(cur[p], dict):
                    cur[p] = {}
                cur = cur[p]
            cur[resolved[-1]] = val

    return out


def _match_filter(item: Dict[str, Any], filter_expression: Any) -> bool:
    """Accepts callable conditions from app.modules.database.conditions."""
    if filter_expression is None:
        return True
    if callable(filter_expression):
        return bool(filter_expression(item))
    # Attr/Key condition objects — evaluate via serialized expression when possible
    try:
        # Common: Attr('x').eq(y) → hasattr
        expr = getattr(filter_expression, "get_expression", None)
        if expr:
            # Too opaque to parse fully — keep item (post-filter in manager when needed)
            return True
    except Exception:
        pass
    return True


class PgTable:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def get_item(self, Key: Dict[str, Any], **_kwargs) -> Dict[str, Any]:
        pk, sk = _pk_from_key(Key)
        with pg_conn() as conn:
            row = conn.execute(
                """
                SELECT item FROM dynamo_items
                WHERE table_name = %s AND pk = %s AND sk = %s
                """,
                (self.table_name, pk, sk),
            ).fetchone()
        if not row:
            return {}
        return {"Item": row["item"]}

    def put_item(self, Item: Dict[str, Any], **_kwargs) -> Dict[str, Any]:
        item = _json_safe(Item)
        pk, sk = _pk_from_item(item)
        with pg_conn() as conn:
            conn.execute(
                """
                INSERT INTO dynamo_items (table_name, pk, sk, item, updated_at)
                VALUES (%s, %s, %s, %s::jsonb, NOW())
                ON CONFLICT (table_name, pk, sk)
                DO UPDATE SET item = EXCLUDED.item, updated_at = NOW()
                """,
                (self.table_name, pk, sk, Json(item)),
            )
            conn.commit()
        return {}

    def delete_item(self, Key: Dict[str, Any], **_kwargs) -> Dict[str, Any]:
        pk, sk = _pk_from_key(Key)
        with pg_conn() as conn:
            conn.execute(
                """
                DELETE FROM dynamo_items
                WHERE table_name = %s AND pk = %s AND sk = %s
                """,
                (self.table_name, pk, sk),
            )
            conn.commit()
        return {}

    def locked_write(self, Key: Dict[str, Any], build) -> Dict[str, Any]:
        """
        Read one item, let `build(current_or_None)` return the new item, and write it, all in a
        single transaction that holds a per-item advisory lock. Concurrent conditional or
        read-modify-write updates of the same item therefore run one after another instead of
        overwriting each other. If `build` raises (e.g. a failed condition), nothing is written.
        """
        pk, sk = _pk_from_key(Key)
        with pg_conn() as conn:
            with conn.transaction():
                conn.execute(
                    "SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))",
                    (f"{self.table_name}\x1f{pk}\x1f{sk}",),
                )
                row = conn.execute(
                    """
                    SELECT item FROM dynamo_items
                    WHERE table_name = %s AND pk = %s AND sk = %s
                    """,
                    (self.table_name, pk, sk),
                ).fetchone()
                updated = _json_safe(build(row["item"] if row else None))
                write_pk, write_sk = _pk_from_item(updated)
                conn.execute(
                    """
                    INSERT INTO dynamo_items (table_name, pk, sk, item, updated_at)
                    VALUES (%s, %s, %s, %s::jsonb, NOW())
                    ON CONFLICT (table_name, pk, sk)
                    DO UPDATE SET item = EXCLUDED.item, updated_at = NOW()
                    """,
                    (self.table_name, write_pk, write_sk, Json(updated)),
                )
        return updated

    def update_item(
        self,
        Key: Dict[str, Any],
        UpdateExpression: str = "",
        ExpressionAttributeNames: Optional[Dict[str, str]] = None,
        ExpressionAttributeValues: Optional[Dict[str, Any]] = None,
        ReturnValues: str = "NONE",
        ConditionExpression: Optional[str] = None,
        **_kwargs,
    ) -> Dict[str, Any]:
        names = ExpressionAttributeNames or {}
        values = ExpressionAttributeValues or {}

        def build(current: Optional[Dict[str, Any]]) -> Dict[str, Any]:
            if ConditionExpression and not eval_condition_expression(
                current or {}, ConditionExpression, names, values
            ):
                raise condition_failed_error()
            updated = _apply_update_expr_local(
                current or dict(Key), UpdateExpression or "", names, values
            )
            for k, v in Key.items():
                updated.setdefault(k, v)
            return updated

        updated = self.locked_write(Key, build)
        if ReturnValues and ReturnValues.upper() != "NONE":
            return {"Attributes": updated}
        return {}

    def query(self, **kwargs) -> Dict[str, Any]:
        # Load all for table then filter — OK for v2 MVP; optimize later with GSI cols
        items = self._all_items()
        key_cond = kwargs.get("KeyConditionExpression")
        filt = kwargs.get("FilterExpression")
        # Prefer FilterExpressionAttr if managers pass Limit etc.
        out: List[Dict[str, Any]] = []
        for item in items:
            if key_cond is not None and not _eval_condition(item, key_cond):
                continue
            if filt is not None and not _eval_condition(item, filt):
                continue
            out.append(item)
        limit = kwargs.get("Limit")
        if limit:
            out = out[: int(limit)]
        return {"Items": out, "Count": len(out)}

    def scan(self, **kwargs) -> Dict[str, Any]:
        items = self._all_items()
        filt = kwargs.get("FilterExpression")
        out = []
        for item in items:
            if filt is not None and not _eval_condition(item, filt):
                continue
            out.append(item)
        exclusive = kwargs.get("ExclusiveStartKey")
        # pagination stub — return all; managers use LastEvaluatedKey loops
        limit = kwargs.get("Limit")
        if exclusive:
            # skip until after exclusive pk
            pk, _ = _pk_from_key(exclusive)
            seen = False
            filtered = []
            for item in out:
                ipk, _ = _pk_from_item(item)
                if not seen:
                    if ipk == pk:
                        seen = True
                    continue
                filtered.append(item)
            out = filtered
        resp: Dict[str, Any] = {"Items": out if not limit else out[: int(limit)], "Count": 0}
        resp["Count"] = len(resp["Items"])
        if limit and len(out) > int(limit):
            last = resp["Items"][-1]
            pk, sk = _pk_from_item(last)
            resp["LastEvaluatedKey"] = {"PK": pk, "SK": sk} if sk else {"PK": pk}
        return resp

    def _all_items(self) -> List[Dict[str, Any]]:
        with pg_conn() as conn:
            rows = conn.execute(
                "SELECT item FROM dynamo_items WHERE table_name = %s",
                (self.table_name,),
            ).fetchall()
        return [r["item"] for r in rows]


def psycopg_json(obj: Any) -> str:
    import json

    return json.dumps(obj, default=str)


def _eval_condition(item: Dict[str, Any], condition: Any) -> bool:
    """Evaluate condition helpers from app.modules.database.conditions."""
    if condition is None:
        return True
    if callable(condition):
        try:
            return bool(condition(item))
        except Exception as e:
            logger.debug("condition eval failed: %s", e)
            return True
    return True


class PgDynamoResource:

    def Table(self, name: str) -> PgTable:
        return PgTable(name)
