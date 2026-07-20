# Architecture Decision Records (DECISIONS.md)

This document records every significant architectural and technical decision made during the project.

---

## ADR-001: PHP 8.3 + Symfony 7 for Backend

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
We needed a backend framework for a long-term, large genealogy platform with complex access control, a relational database, API support, and security features.

**Decision:**  
Use PHP 8.3 + Symfony 7.

**Reasons:**
- Symfony has excellent security, DI container, Doctrine ORM, and API Platform
- PHP 8.3 has modern features: enums, readonly, fibers, typed properties
- Strong ecosystem for genealogy-type applications (lots of Doctrine experience)
- PhpStorm has first-class PHP support
- Claude Code and Cursor work well with PHP/Symfony
- Long-term LTS support (Symfony 7 LTS)

**Alternatives considered:**
- ASP.NET Core (C#): Better suited for Windows/Azure environments
- Laravel: Good but less structured for large enterprise apps
- Node.js/NestJS: Less mature for complex relational data

---

## ADR-002: MySQL 8 for Database

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
We need a relational database for structured family data with complex queries (ancestor traversal, relationships, approvals).

**Decision:**  
Use MySQL 8.

**Reasons:**
- Wide hosting support
- Strong Doctrine ORM support
- JSON column support for flexible metadata
- Full-text search for person names
- Well-understood by most developers

**Alternatives considered:**
- PostgreSQL: Also excellent, but MySQL is more universally available on shared hosting

---

## ADR-003: Graph Model for Relationships

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
Family relationships are complex — multiple marriages, adoptions, step-families, unknown parents, remarriages. A simple parent/child tree model fails.

**Decision:**  
Model relationships as a **directed graph** (`relationships` table with `person1_id`, `person2_id`, `type`).

**Reasons:**
- Handles all real-world family structures
- Ancestor/descendant traversal still works via graph traversal
- More flexible for future relationship types
- Industry standard (GEDCOM uses this model)

**Alternatives considered:**
- Adjacency list (simple parent_id column): Too rigid, breaks with multiple parents/adoptions
- Nested sets: Good for reads but complex writes and doesn't support multiple parents

---

## ADR-004: UUID Primary Keys

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
We need stable, globally unique IDs that don't leak sequence information and can be generated client-side.

**Decision:**  
Use UUID v4 (Ramsey UUID library) for all entity primary keys.

**Reasons:**
- No sequential ID exposure (security)
- IDs can be pre-generated before DB insert
- Safe for data merging across systems (e.g., import from another database)
- Works with GEDCOM export

**Alternatives considered:**
- Auto-increment integers: Simpler but expose record counts, harder to merge

---

## ADR-005: API Platform for REST API

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
We need a well-documented, filterable, paginated REST API with OpenAPI/Swagger documentation.

**Decision:**  
Use API Platform on top of Symfony.

**Reasons:**
- Auto-generates OpenAPI docs
- Built-in pagination, filtering, sorting
- Works natively with Doctrine entities
- Highly customizable with operations and state processors

---

## ADR-006: JWT Authentication

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
The API needs to be consumed by both the web frontend and the mobile app. Session-based auth doesn't work well for APIs.

**Decision:**  
Use LexikJWTAuthenticationBundle with short-lived access tokens (1h) and long-lived refresh tokens (30d).

---

## ADR-007: Soft Deletes

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
Family data is irreplaceable. Accidental deletions could destroy years of research.

**Decision:**  
Use soft deletes on all entities — set `deleted_at` timestamp instead of hard-deleting rows.

**Reasons:**
- Full audit trail preserved
- Data can be restored by Super Admin
- Accidental deletion is recoverable

---

## ADR-008: Invite-Only Registration

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
This is a private family platform. Public registration would expose family data.

**Decision:**  
No public sign-up. All accounts are created via invitation by Super Admin or Branch Admin.

---

## ADR-009: Dompdf for PDF Reports

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
We need to generate PDF family books and printable trees.

**Decision:**  
Use Dompdf (PHP library) for PDF generation, with Twig templates for layout.

**Alternatives considered:**
- TCPDF: More low-level, harder to use with HTML/CSS layouts
- wkhtmltopdf: External binary, harder to deploy in Docker

---

## ADR-010: React + TypeScript for Web Frontend

**Date:** 2026-07-15  
**Status:** Accepted

**Context:**  
We need a modern, interactive web frontend with complex tree visualization.

**Decision:**  
Use React 18 + TypeScript with React Flow for tree visualization.

**Reasons:**
- Component-based architecture suits the profile/tree UI
- TypeScript catches type errors early
- React Flow is purpose-built for node graphs (perfect for family trees)
- Large ecosystem

---

## ADR-011: Docker for Local Development

**Date:** 2026-07-15
**Status:** Accepted

**Context:**
Developers need a consistent local environment without manual PHP/MySQL setup.

**Decision:**
Docker Compose with PHP-FPM, Nginx, MySQL, and phpMyAdmin.

**Reasons:**
- Same environment for all developers
- No "works on my machine" issues
- Easy onboarding for new contributors

---

## ADR-012: Branch Structure by Grandparent Lineage

**Date:** 2026-07-20
**Status:** Accepted

**Context:**
The family has multiple grandparent lines descending from common great-grandparents. Different cousins and their families need separate access scopes so each sub-family only sees their own branch.

**Decision:**
Each **grandparent** defines one branch. Common great-grandparents and above are shared ancestors visible to all descendent branches.

**Rules:**
- Person's primary branch = father's branch
- Common ancestors belong to all descendent branches
- A person may belong to multiple branches (e.g. when parents come from different branches)
- Super Admin sees everything; Branch Admin sees their branch only; Members read their branch only by default

**Alternatives considered:**
- One flat branch per family: Too coarse — doesn't support sub-family privacy
- Branch per generation: Too granular — hard to manage

---

## ADR-013: Invite-Only Branch Membership

**Date:** 2026-07-20
**Status:** Accepted

**Context:**
Branch members should only be able to join by invitation, not by self-registering and selecting a branch.

**Decision:**
Branch membership is created only via an invitation link sent by Super Admin or Branch Admin. New invitees default to Viewer (read-only). Branch Admin can upgrade them to Member (edit with approval).

**Reasons:**
- Prevents unauthorized access to family data
- Keeps branch membership controlled
- Aligns with the invite-only registration principle (ADR-008)

---

## ADR-014: Profile Photo Upload via Custom Endpoint

**Date:** 2026-07-20
**Status:** Accepted

**Context:**
API Platform uses JSON for all CRUD operations, but profile photos require multipart/form-data upload which doesn't fit the standard API Platform resource model.

**Decision:**
Use a custom Symfony controller (`PersonPhotoController`) for `POST /api/persons/{id}/photo` and `DELETE /api/persons/{id}/photo`, storing files in `public/uploads/persons/`.

**Reasons:**
- Clean separation of JSON API and file upload
- Avoids VichUploader complexity for a simple use case
- Files served directly by Nginx with no PHP overhead

---

## ADR-015: Smart Date Precision Input

**Date:** 2026-07-20
**Status:** Accepted

**Context:**
Many historical birth/death dates in the family are only known by year (e.g. "born around 1945"). The standard HTML date picker requires a full YYYY-MM-DD, making it unusable for year-only data.

**Decision:**
The `SmartDateInput` component adapts its UI based on the selected `DatePrecision`:
- `unknown` → disabled placeholder input
- `year` → plain text input (4 digits), stored as `YYYY-01-01` internally
- `exact` / `approximate` → date picker + manual text fallback

**Reasons:**
- Matches real-world genealogy data quality
- Prevents forcing fake "Jan 1" dates when only year is known
- Consistent with GEDCOM date precision model
