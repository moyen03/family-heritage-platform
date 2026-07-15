# 09 – User Roles & Permissions

## Roles Overview

| Role | Code | Description |
|------|------|-------------|
| Super Admin | `ROLE_SUPER_ADMIN` | Owns the entire platform |
| Branch Admin | `ROLE_BRANCH_ADMIN` | Manages one or more family branches |
| Member | `ROLE_MEMBER` | Standard family member |
| Viewer | `ROLE_VIEWER` | Read-only guest access |

---

## Permission Matrix

| Permission | Super Admin | Branch Admin | Member | Viewer |
|-----------|:-----------:|:------------:|:------:|:------:|
| View any person | ✅ | ✅ (branch) | ✅ (family) | ✅ (public) |
| Create person | ✅ | ✅ | 🔄 (needs approval) | ❌ |
| Edit person | ✅ | ✅ (branch) | 🔄 (needs approval) | ❌ |
| Delete person | ✅ | ✅ (branch) | ❌ | ❌ |
| View private persons | ✅ | ✅ (branch) | ❌ | ❌ |
| Create branch | ✅ | ❌ | ❌ | ❌ |
| Manage branch admins | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ✅ (branch) | ❌ | ❌ |
| Upload media | ✅ | ✅ | ✅ | ❌ |
| Delete media | ✅ | ✅ (own branch) | ✅ (own uploads) | ❌ |
| Create story | ✅ | ✅ | ✅ | ❌ |
| Approve changes | ✅ | ✅ (branch) | ❌ | ❌ |
| View audit logs | ✅ | ✅ (branch) | ❌ | ❌ |
| Generate reports | ✅ | ✅ | ✅ | ❌ |
| Manage system settings | ✅ | ❌ | ❌ | ❌ |

🔄 = Submitted as approval request

---

## Branch Admin Scope

A Branch Admin can only manage:
- Persons that belong to **their branch**
- Media uploaded within **their branch**
- Approval requests for **their branch**
- Members who belong to **their branch**

---

## Invitation Flow

1. Super Admin or Branch Admin creates an invitation (email + role)
2. System sends invitation email with one-time link
3. Invitee clicks link, sets password, account is created
4. New member is automatically assigned to the branch

