# 12 – Development Roadmap

> **Last updated:** July 2026

## Phase 1 – Foundation ✅

**Goal:** Working project skeleton that can be opened in PhpStorm and run locally.

| Task | Status |
|------|--------|
| Project folder structure | ✅ Done |
| Documentation (all docs/ files) | ✅ Done |
| Docker Compose (PHP, Nginx, MySQL, phpMyAdmin) | ✅ Done |
| Symfony 7 skeleton | ✅ Done |
| PHP 8.3 configuration | ✅ Done |
| Doctrine ORM | ✅ Done |
| API Platform | ✅ Done |
| JWT Authentication (LexikJWT) | ✅ Done |
| PHPUnit | ✅ Done |
| PHPStan | ✅ Done |
| PHP-CS-Fixer | ✅ Done |
| GitHub Actions CI pipeline | ✅ Done |
| Git initialized | ✅ Done |
| User entity + authentication | ✅ Done |
| Role system | ✅ Done |
| Branch entity + PersonBranch + BranchAdmin entities | ✅ Done |

---

## Phase 2 – Core Genealogy ✅

**Goal:** The core of the platform — persons, relationships, ancestors, descendants.

| Task | Status |
|------|--------|
| Person entity + CRUD API | ✅ Done |
| Person names (multiple names / nicknames) | ✅ Done |
| Relationship entity (directed graph model) | ✅ Done |
| Marriage entity | ✅ Done |
| Ancestor traversal algorithm | ✅ Done |
| Descendant traversal algorithm | ✅ Done |
| Relationship path finder (A → B) | ✅ Done |
| Data seeder (Moyen family JSON import) | ✅ Done |

---

## Phase 3 – Interactive Family Tree UI ✅

**Goal:** A web-based interactive family tree.

| Task | Status |
|------|--------|
| React + TypeScript + Vite project setup | ✅ Done |
| JWT Authentication (login/logout/refresh) | ✅ Done |
| Tree visualization (React Flow + Dagre layout) | ✅ Done |
| Zoom, pan, expand/collapse | ✅ Done |
| Highlight ancestors / descendants | ✅ Done |
| Search by name | ✅ Done |
| Person profile drawer | ✅ Done |
| Relationship path finder (A→B) | ✅ Done |
| Add / Edit person form (modal) | ✅ Done |
| Profile photo upload | ✅ Done |
| Phone / mobile number field | ✅ Done |
| NID number, blood group, profession, highest education fields | ✅ Done |
| Nickname field (quick entry in form + shown in hero) | ✅ Done |
| Smart date precision input (year-only, exact, approximate) | ✅ Done |
| Adoption / step display (dashed edges + legend) | ✅ Done |
| Person detail page (enriched profile view) | ✅ Done |
| Person detail page — 3-col overview grid (all facts compact) | ✅ Done |
| Person detail page — Biography at bottom full-width | ✅ Done |
| Person detail page — Family connections 2×2 grid (Parents\|Siblings, Spouse\|Children) | ✅ Done |
| Person detail page — Alternative Names + Addresses side by side | ✅ Done |
| All Persons list page (paginated) | ✅ Done |
| Relationships page (searchable table) | ✅ Done |
| Marriages page (card grid, filter active/divorced) | ✅ Done |
| Address panel per person (CRUD) | ✅ Done |
| Visibility extension (public / family / branch / private) | ✅ Done |
| Family connector nodes (genealogy bracket layout) | ✅ Done |
| Married couples Y-aligned side by side in tree | ✅ Done |
| Form fields 2-column layout (50% width pairs) | ✅ Done |
| Tree — add relative from node (+button, QuickAddRelativeModal, 7 roles) | ✅ Done |
| Tree — sibling inherits full parent/grandparent chain on add | ✅ Done |
| Tree — generation-depth Y grid (clean horizontal rows per generation) | ✅ Done |
| Tree — bottom-up subtree-width + top-down centering (no row width overflow) | ✅ Done |
| Tree — cross-family marriage layout (both spouses stay in own family, children centred between) | ✅ Done |
| Tree — person card with photo/initials avatar + gender-coloured border | ✅ Done |
| Tree — invisible connector node (clean routing point, no visual dot) | ✅ Done |

---

## Phase 4 – Media ✅

**Goal:** Rich media library with tagging and privacy.

| Task | Status |
|------|--------|
| Photo / Video / Document / Audio upload | ✅ Done |
| Media metadata (date, place, source, title, description) | ✅ Done |
| Tag people in photos (MediaTag entity + API) | ✅ Done |
| Privacy levels per media item | ✅ Done |
| Media gallery UI (responsive grid, type filter, search) | ✅ Done |
| Upload modal (drag & drop, all metadata fields) | ✅ Done |
| Media detail modal (inline preview, download) | ✅ Done |

---

## Phase 5 – Addresses and Maps ✅

**Goal:** Address history and geographic visualization.

| Task | Status |
|------|--------|
| Address entity + CRUD API | ✅ Done |
| Current / historical / birth / childhood address types | ✅ Done |
| Address panel on person detail page | ✅ Done |
| Map view (Leaflet + OpenStreetMap) | ✅ Done |
| Marker clustering (react-leaflet-cluster) | ✅ Done |
| Migration path visualization | ✅ Done |
| Family heat map by region | ✅ Done |
| Sidebar: family by country stats + missing-coords list | ✅ Done |
| Bulk address defaults (Naogaon, Bangladesh) | ✅ Done |

---

## Phase 6 – Branch Management 🔄

**Goal:** Multi-branch family support — each grandparent line is its own branch with controlled access.

### Branch Structure

```
Shared (common ancestors — visible to ALL branches)
└── Md Azim Uddin Molla + Rahima Begum
    ├── Md Hafez Uddin Molla  → "Hafez Family" branch
    ├── Md Hazar Uddin Molla  → "Hazar Family" branch
    ├── Md Zillur Rahman      → "Zillur Family" branch
    ├── Md Siraz Uddin Molla  → "Siraz Family" branch  (blood = primary ⭐)
    └── Md Royes Uddin Molla  → "Royes Family" branch
```

**Rules (Option B — full bloodline tracking):**
- Every blood descendant of the branch founder is **Primary ⭐** in that branch
- Spouses who married in are **Secondary** in that branch
- Daughters' children tracked in father's birth branch (primary) — full lineage preserved
- Shared branch persons visible to ALL authenticated users regardless of membership

### Phase 6a – Branch Management UI ✅

| Task | Status |
|------|--------|
| Branch API resource (CRUD with API Platform) | ✅ Done |
| `is_shared` flag (common ancestors visible to all branches) | ✅ Done |
| Branch management page (super admin: create/edit/delete) | ✅ Done |
| Assign persons to branches (primary ⭐ / secondary) | ✅ Done |
| Branch detail page with Persons + Users tabs | ✅ Done |
| Branch listing with member count | ✅ Done |
| Auto-assign all family members (`app:assign-branches` command) | ✅ Done |
| `isCurrentUserAdmin` virtual field on Branch API response | ✅ Done |
| Branch Admin can assign/remove persons from their own branch | ✅ Done |

### Phase 6b – Branch Visibility Enforcement ✅

| Task | Status |
|------|--------|
| `BranchMembership` entity (User → Branch access control) | ✅ Done |
| `PersonVisibilityExtension` filters persons by branch membership + shared | ✅ Done |
| Shared branch persons visible to all authenticated users | ✅ Done |
| Branch tree view (`/branches/:id/tree`) with shared ancestors included | ✅ Done |
| Grant / revoke user branch access (viewer or member role) | ✅ Done |
| `BranchScopingExtension` scopes relationships, marriages, addresses, media | ✅ Done |
| Super Admin delete + Branch Admin unassign actions on All Persons list | ✅ Done |

### Phase 6c – Invitation & Edit Approval 🔄

| Task | Status |
|------|--------|
| Invite user by email to a branch (Super Admin or Branch Admin) | ✅ Done |
| Accept invitation page (creates account + joins branch) | ✅ Done |
| Invited members get read-only (Viewer) access by default | ✅ Done |
| Branch Admin invitation list (`GET /branches/{id}/invitations`) | ✅ Done |
| Resend / expire old pending invitations | ✅ Done |
| `ApprovalRequest` entity + API (POST by members, PATCH/review by branch admin) | ✅ Done |
| Apply approved changes back to Person entity | ✅ Done |
| Branch Admin approval UI (approve / reject edits with notes) | ✅ Done |
| Invitation email sent on invite (with manual-link fallback) | ✅ Done |
| Email notification on approval result (approved / rejected) | ⏳ |
| Member UI to submit edit requests from Person profile | ⏳ |

### Phase 6d – In-Law / Cross-Branch Person Assignment ⏳

**Problem:** In-laws marry into one branch but originate from another (or have their own branch).
They should be assignable to multiple branches so both sides of the family can see and manage them.
The infrastructure (multi-`PersonBranch` rows, `isPrimary` flag) already supports this; what is
missing is the UX workflow to make cross-branch assignment friction-free.

**Agreed approach (to implement):**

| Task | Status |
|------|--------|
| Wire `forAssign=1` flag in `PersonVisibilityExtension` so the "Add Person to Branch" search returns **all non-private persons** across all branches (not just the admin's own branch) | ✅ Done |
| Frontend: pass `?forAssign=1` query param when branch admin opens the assign-person panel in `BranchDetailPage` | ✅ Done |
| Post-marriage suggestion: after saving a marriage between persons from different branches, show a prompt "Add [Spouse] to your branch as an in-law?" (Accept / Skip) | ⏳ |
| (Optional) Per-`PersonBranch` visibility override — in-law visible in branch but with limited info shown to that branch's members | ⏳ |

> **See also:** ADR-022 in `DECISIONS.md` for the full design discussion.

---

## Phase 7 – Reports ⏳

**Goal:** Generate PDF reports for printing and archiving.

| Task | Status |
|------|--------|
| PDF library integration (Dompdf) | ⏳ |
| Family Book report | ⏳ |
| Ancestor report | ⏳ |
| Descendant report | ⏳ |
| Relationship report | ⏳ |
| Birthday report | ⏳ |
| Printable family tree (A0–A3) | ⏳ |
| Statistics report | ⏳ |

---

## Phase 8 – Mobile App ⏳

**Goal:** iOS and Android app for family members.

| Task | Status |
|------|--------|
| React Native project setup | ⏳ |
| Login / JWT auth | ⏳ |
| Family tree view (SVG) | ⏳ |
| Person profile | ⏳ |
| Photo upload from camera | ⏳ |
| Push notifications | ⏳ |

---

## Phase 9 – AI Features ⏳

**Goal:** AI-assisted data entry and discovery.

| Task | Status |
|------|--------|
| OCR for uploaded documents | ⏳ |
| Duplicate person detection | ⏳ |
| Relationship suggestions | ⏳ |
| Auto-biography generation | ⏳ |
| Name spelling normalization | ⏳ |

---

## Current Progress Summary

| Phase | Status |
|-------|--------|
| Phase 1 – Foundation | ✅ Complete |
| Phase 2 – Core Genealogy | ✅ Complete |
| Phase 3 – Family Tree UI | ✅ Complete |
| Phase 4 – Media | ✅ Complete |
| Phase 5 – Addresses & Maps | ✅ Complete |
| Phase 6 – Branch Management | 🔄 Mostly complete (6c partially pending) |
| Phase 7 – Reports | ⏳ Planned |
| Phase 8 – Mobile App | ⏳ Planned |
| Phase 9 – AI Features | ⏳ Planned |

> **Last updated:** July 2026
