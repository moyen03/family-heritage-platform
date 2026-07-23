# 09 – User Roles & Permissions

## Roles Overview

| Role | Code | Description |
|------|------|-------------|
| Super Admin | `ROLE_SUPER_ADMIN` | Owns the entire platform — sees everything across all branches |
| Branch Admin | `ROLE_BRANCH_ADMIN` | Manages one family branch — can approve edits, invite members |
| Member | `ROLE_MEMBER` | Standard family member — can view their branch, suggest edits |
| Viewer | `ROLE_VIEWER` | Read-only access — can only see public / family records |

---

## Visibility Levels

Each person record has a `visibility` field that controls who can see it:

| Visibility | Who can see |
|-----------|-------------|
| `public` | All logged-in users (and unauthenticated if firewall allows) |
| `family` | All logged-in users on the platform *(default)* |
| `branch` | Only members of the same branch the person belongs to |
| `private` | Super Admin only |

**Common ancestors** (e.g. great-grandparents shared by multiple branches) are visible to all branches they belong to, regardless of `branch` visibility.

---

## Permission Matrix

| Permission | Super Admin | Branch Admin | Member | Viewer |
|-----------|:-----------:|:------------:|:------:|:------:|
| View `public` persons | ✅ | ✅ | ✅ | ✅ |
| View `family` persons | ✅ | ✅ | ✅ | ❌ |
| View `branch` persons | ✅ | ✅ (own branch) | ✅ (own branch) | ❌ |
| View `private` persons | ✅ | ❌ | ❌ | ❌ |
| Create person | ✅ | ✅ | 🔄 (needs approval) | ❌ |
| Edit person | ✅ | ✅ (own branch) | 🔄 (needs approval) | ❌ |
| Delete person | ✅ | ✅ (own branch) | ❌ | ❌ |
| Upload profile photo | ✅ | ✅ | ✅ | ❌ |
| Create branch | ✅ | ❌ | ❌ | ❌ |
| Manage branch admins | ✅ | ❌ | ❌ | ❌ |
| Assign persons to branches | ✅ | ✅ (own branch) | ❌ | ❌ |
| Invite members | ✅ | ✅ (own branch) | ❌ | ❌ |
| Upload media | ✅ | ✅ | ✅ | ❌ |
| Delete media | ✅ | ✅ (own branch) | ✅ (own uploads) | ❌ |
| Approve member edits | ✅ | ✅ (own branch) | ❌ | ❌ |
| View audit logs | ✅ | ✅ (own branch) | ❌ | ❌ |
| Generate reports | ✅ | ✅ | ✅ | ❌ |
| Manage system settings | ✅ | ❌ | ❌ | ❌ |

🔄 = Submitted as approval request, applied after Branch Admin or Super Admin approves

---

## Branch Structure

Branches are organized by **grandparent lineage**:

```
Great-Grandparent (common ancestor → visible to all descendent branches)
├── Grandparent A → "Branch A"
│       ├── their children → Branch A members
│       └── their grandchildren → Branch A members
└── Grandparent B → "Branch B"
        ├── their children → Branch B members
        └── their grandchildren → Branch B members
```

- A person **primarily belongs to their father's branch**
- A person can belong to **multiple branches** (e.g. if parents are from different branches)
- **Common ancestors** belong to all descendent branches

---

## Branch Admin Scope

A Branch Admin can only manage:
- Persons that belong to **their branch**
- Media uploaded within **their branch**
- Approval requests from members of **their branch**
- Members who belong to **their branch**
- **Assigning and removing persons** from **their branch** (via Branch Detail page → "Add Person to Branch" panel)
- Cannot create new branches (Super Admin only)

### How Branch Admin Role Is Determined

A user is treated as a Branch Admin if **either** of the following is true:

1. The `branch_admins` table has a row for `(branch_id, user_id)`
2. The `branch_memberships` table has a row for `(branch_id, user_id)` with `role = 'branch_admin'`

On login, `JWTCreatedListener` checks both tables. If either condition is met, `ROLE_BRANCH_ADMIN` is added to the JWT payload. The global `users.global_role` column does **not** need to be `branch_admin` — a user can have `global_role = member` and still receive `ROLE_BRANCH_ADMIN` in their token.

At the controller level, `BranchPersonController` additionally runs an `isAdminOfBranch()` check to confirm the user is admin of **the specific branch** being modified, not just any branch.

---

## Invitation Flow

1. Super Admin or Branch Admin sends an invitation (email + branch assignment)
2. System sends invitation email with a one-time secure link
3. Invitee clicks link, sets password, account is created
4. New member is automatically assigned to the branch as **read-only (Viewer)**
5. Branch Admin can upgrade them to **Member** (edit with approval) at any time
