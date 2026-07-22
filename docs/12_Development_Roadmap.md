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

## Phase 6 – Branch Management ✅

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

### Phase 6b – Branch Visibility Enforcement ✅

| Task | Status |
|------|--------|
| `BranchMembership` entity (User → Branch access control) | ✅ Done |
| `PersonVisibilityExtension` filters by branch membership | ✅ Done |
| Shared branch persons visible to all authenticated users | ✅ Done |
| Branch tree view (`/branches/:id/tree`) with shared ancestors included | ✅ Done |
| Grant / revoke user branch access (viewer or member role) | ✅ Done |

### Phase 6c – Invitation & Edit Approval ⏳

| Task | Status |
|------|--------|
| Invite user by email to a branch (Super Admin or Branch Admin) | ⏳ |
| Invited members get read-only access by default | ⏳ |
| Member edit request workflow | ⏳ |
| Branch Admin approval UI (approve / reject edits) | ⏳ |
| Email notification on invitation and approval | ⏳ |

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
| Phase 6 – Branch Management | ✅ Complete (6c pending) |
| Phase 7 – Reports | ⏳ Planned |
| Phase 8 – Mobile App | ⏳ Planned |
| Phase 9 – AI Features | ⏳ Planned |

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
| Smart date precision input (year-only, exact, approximate) | ✅ Done |
| Removed Middle Name / Maiden Name from form | ✅ Done |
| Adoption / step display (dashed edges + legend) | ✅ Done |
| Person detail page | ✅ Done |
| All Persons list page (paginated) | ✅ Done |
| Relationships page (searchable table) | ✅ Done |
| Marriages page (card grid, filter active/divorced) | ✅ Done |
| Address panel per person (CRUD) | ✅ Done |
| Visibility extension (public / family / branch / private) | ✅ Done |

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

## Phase 6 – Branch Management 🚧 In Progress

**Goal:** Multi-branch family support — each grandparent line is its own branch with controlled access.

### Branch Structure Design

```
Great-Grandparent (common ancestor → visible to ALL branches)
├── Grandparent A → "Branch A"  (e.g. Aziz Uddin family)
└── Grandparent B → "Branch B"  (e.g. Azim Uddin family)
    ├── Son 1 → belongs to Branch B
    ├── Son 2 → belongs to Branch B
    └── ...
```

### Phase 6a – Branch Management UI (Option B, Step 1) 🚧

| Task | Status |
|------|--------|
| Branch API resource (CRUD with API Platform) | ⏳ |
| Branch management page (super admin: create/edit/delete branches) | ⏳ |
| Assign persons to branches (UI + API) | ⏳ |
| Mark common ancestors as shared (visible to all descendent branches) | ⏳ |
| Branch listing with member count | ⏳ |

### Phase 6b – Branch Visibility Enforcement (Step 2) ⏳

| Task | Status |
|------|--------|
| Update PersonVisibilityExtension to filter by actual branch membership | ⏳ |
| Common ancestors visible to all branches they appear in | ⏳ |
| Branch Admin scope enforcement (edit only own branch) | ⏳ |
| Family tree respects branch visibility | ⏳ |

### Phase 6c – Invitation & Edit Approval (Step 3) ⏳

| Task | Status |
|------|--------|
| Invite user by email to a branch (Super Admin or Branch Admin) | ⏳ |
| Invited members get read-only access by default | ⏳ |
| Member edit request workflow | ⏳ |
| Branch Admin approval UI (approve / reject edits) | ⏳ |
| Email notification on invitation and approval | ⏳ |

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
| Phase 6 – Branch Management | 🚧 In Progress |
| Phase 7 – Reports | ⏳ Planned |
| Phase 8 – Mobile App | ⏳ Planned |
| Phase 9 – AI Features | ⏳ Planned |
