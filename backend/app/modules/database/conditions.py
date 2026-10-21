"""
Lightweight Attr/Key condition helpers (replaces boto3.dynamodb.conditions).
Used with the Postgres document store filter evaluator.
"""
from __future__ import annotations

from typing import Any, Callable, Optional


class Condition:
    def __init__(self, fn: Callable[[dict], bool], description: str = ""):
        self._fn = fn
        self.description = description

    def __call__(self, item: dict) -> bool:
        return bool(self._fn(item))

    def __and__(self, other: "Condition") -> "Condition":
        return Condition(lambda i: self(i) and other(i), f"({self.description}) AND ({other.description})")

    def __or__(self, other: "Condition") -> "Condition":
        return Condition(lambda i: self(i) or other(i), f"({self.description}) OR ({other.description})")

    def __invert__(self) -> "Condition":
        return Condition(lambda i: not self(i), f"NOT ({self.description})")


class _AttrName:
    def __init__(self, name: str):
        self.name = name

    def eq(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: i.get(n) == value, f"{n}={value}")

    def ne(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: i.get(n) != value, f"{n}!={value}")

    def lt(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: (i.get(n) is not None and i.get(n) < value), f"{n}<{value}")

    def lte(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: (i.get(n) is not None and i.get(n) <= value), f"{n}<={value}")

    def gt(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: (i.get(n) is not None and i.get(n) > value), f"{n}>{value}")

    def gte(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: (i.get(n) is not None and i.get(n) >= value), f"{n}>={value}")

    def begins_with(self, prefix: str) -> Condition:
        n = self.name
        return Condition(
            lambda i: str(i.get(n) or "").startswith(str(prefix)),
            f"{n} begins_with {prefix}",
        )

    def between(self, low: Any, high: Any) -> Condition:
        n = self.name
        return Condition(
            lambda i: i.get(n) is not None and low <= i.get(n) <= high,
            f"{n} between {low} {high}",
        )

    def exists(self) -> Condition:
        n = self.name
        return Condition(lambda i: n in i, f"{n} exists")

    def not_exists(self) -> Condition:
        n = self.name
        return Condition(lambda i: n not in i, f"{n} not_exists")

    def contains(self, value: Any) -> Condition:
        n = self.name
        return Condition(lambda i: value in str(i.get(n) or ""), f"{n} contains {value}")


def Attr(name: str) -> _AttrName:
    return _AttrName(name)


def Key(name: str) -> _AttrName:
    """Alias of Attr for former Dynamo KeyConditionExpression usage."""
    return _AttrName(name)
