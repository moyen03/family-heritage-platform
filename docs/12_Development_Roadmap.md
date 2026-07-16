# 12 – Development Roadmap

## Phase 1 – Foundation ✅ (Current)

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
| Git initialized | ✅ Done |
| Claude Code prompts | ✅ Done |
| DECISIONS.md | ✅ Done |
| User entity + authentication | ✅ Done |
| Role system | ✅ Done |
| Branch entity + branch ownership | ✅ Done |

---

## Phase 2 – Core Genealogy ✅

**Goal:** The core of the platform — persons, relationships, ancestors, descendants.

| Task | Status |
|------|--------|
| Person entity + CRUD API | ✅ Done |
| Person names (multiple names) | ✅ Done |
| Relationship entity (graph model) | ✅ Done |
| Marriage entity | ✅ Done |
| Ancestor traversal algorithm | ✅ Done |
| Descendant traversal algorithm | ✅ Done |
| Relationship finder (A to B path) | ✅ Done |
| Approval workflow for Member edits | ✅ Done |
| Audit log for all person/relationship changes | ✅ Done |

---

## Phase 3 – Interactive Family Tree UI ✅ (mostly done)

**Goal:** A web-based interactive family tree.

| Task | Status |
|------|--------|
| React project setup | ✅ Done |
| Authentication (login/logout) | ✅ Done |
| Tree visualization (React Flow + Dagre layout) | ✅ Done |
| Zoom and pan | ✅ Done |
| Expand/collapse branches | ⏳ |
| Highlight ancestors | ✅ Done |
| Highlight descendants | ✅ Done |
| Search by name | ✅ Done |
| Person profile drawer | ✅ Done |
| Relationship path finder (A→B) | ✅ Done |
| Multiple spouses display | ⏳ |
| Adoption/step display | ⏳ |

---

## Phase 4 – Media ⏳

**Goal:** Rich media library with tagging and privacy.

| Task | Status |
|------|--------|
| Photo upload | ⏳ |
| Video upload | ⏳ |
| Document upload (PDF) | ⏳ |
| Audio upload | ⏳ |
| Media metadata (date, place, source) | ⏳ |
| Tag people in photos | ⏳ |
| Privacy levels per media item | ⏳ |
| Media gallery UI | ⏳ |

---

## Phase 5 – Addresses and Maps ⏳

**Goal:** Address history and geographic visualization.

| Task | Status |
|------|--------|
| Address entity + CRUD | ⏳ |
| Current address per person | ⏳ |
| Historical addresses | ⏳ |
| Map view (Leaflet + OpenStreetMap) | ⏳ |
| Migration path visualization | ⏳ |
| Family heat map by region | ⏳ |

---

## Phase 6 – Reports ⏳

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

## Phase 7 – Mobile App ⏳

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

## Phase 8 – AI Features ⏳

**Goal:** AI-assisted data entry and discovery.

| Task | Status |
|------|--------|
| OCR for uploaded documents | ⏳ |
| Duplicate person detection | ⏳ |
| Relationship suggestions | ⏳ |
| Auto-biography generation | ⏳ |
| Name spelling normalization | ⏳ |

