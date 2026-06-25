from __future__ import annotations

from enum import Enum


class Permission(str, Enum):
    READ_LISTINGS = "read:listings"
    READ_NEIGHBOURHOOD = "read:neighbourhood"
    READ_PREFERENCES = "read:preferences"
    CREATE_ACTION = "create:action"
    APPROVE_ACTION = "approve:action"
    EXECUTE_ACTION = "execute:action"
    VIEW_AUDIT = "view:audit"


# In the PoC, all permissions are granted to the demo user.
# In production, this would be replaced with proper RBAC.
DEMO_PERMISSIONS: set[Permission] = set(Permission)


def has_permission(requested: Permission) -> bool:
    return requested in DEMO_PERMISSIONS
