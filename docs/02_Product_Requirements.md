# 02 – Product Requirements

## Functional Requirements

### Authentication & Authorization

- FR-AUTH-01: Users must register with email and password
- FR-AUTH-02: Email verification required on registration
- FR-AUTH-03: Password reset via email
- FR-AUTH-04: JWT-based API authentication
- FR-AUTH-05: Role-based access control (Super Admin, Branch Admin, Member, Viewer)
- FR-AUTH-06: Invitation-based registration (new members invited by admins)
- FR-AUTH-07: Session management and token refresh

### Family Branches

- FR-BRANCH-01: Super Admin can create family branches
- FR-BRANCH-02: Each branch has one or more Branch Admins
- FR-BRANCH-03: Branch Admins can invite members to their branch
- FR-BRANCH-04: A person can belong to multiple branches
- FR-BRANCH-05: Each branch has a root person (the ancestor)
- FR-BRANCH-06: Cross-branch relationships are visible based on permissions

### Person Profiles

- FR-PERSON-01: Create, read, update, delete person profiles
- FR-PERSON-02: Core fields: first name, middle name, last name, maiden name, nickname, birth date, birth place, death date, death place, gender, biography, phone
- FR-PERSON-03: Support for unknown dates (year only, approximate)
- FR-PERSON-04: Privacy level per person (public, family, branch, private)
- FR-PERSON-05: Living person flag with automatic privacy protection
- FR-PERSON-06: Profile photo upload (JPEG/PNG/WebP, max 5 MB)
- FR-PERSON-07: Multiple alternative names (birth name, nickname, title, alias, married name) with date ranges
- FR-PERSON-08: Personal details: NID/National ID number, blood group (ABO/Rh), profession/occupation
- FR-PERSON-09: Education: highest academic qualification (None → Primary → SSC → HSC → Diploma → Bachelor's → Master's → PhD)

### Relationships

- FR-REL-01: Define relationships: parent, child, spouse, sibling, half-sibling, step-parent, step-child, adopted parent, adopted child, guardian, foster parent
- FR-REL-02: Marriages with start date, end date, divorce flag
- FR-REL-03: Support multiple marriages per person
- FR-REL-04: Support for unknown parents
- FR-REL-05: Relationship notes

### Family Tree

- FR-TREE-01: Interactive visual tree (zoom, pan)
- FR-TREE-02: Expand/collapse branches
- FR-TREE-03: Highlight ancestors, descendants, maternal/paternal lines
- FR-TREE-04: Search by name in tree
- FR-TREE-05: Click-through to full profile
- FR-TREE-06: Display multiple spouses
- FR-TREE-07: Display adopted and step relationships distinctly

### Addresses & Maps

- FR-ADDR-01: Current and historical addresses per person
- FR-ADDR-02: Fields: country, state, district, city, village, street, postal code, lat/lng, from date, to date
- FR-ADDR-03: Map view of family locations (current)
- FR-ADDR-04: Historical migration paths
- FR-ADDR-05: Family heat map by country/region

### Media

- FR-MEDIA-01: Upload photos, videos, PDF documents, audio
- FR-MEDIA-02: Media metadata: description, date, location, photographer, source
- FR-MEDIA-03: Tag multiple people in a photo
- FR-MEDIA-04: Privacy level per media item
- FR-MEDIA-05: Album/collection grouping
- FR-MEDIA-06: Supported document types: birth cert, marriage cert, passport, letter, diploma

### Stories & Events

- FR-STORY-01: Write stories and memories linked to a person
- FR-STORY-02: Events: birth, marriage, death, migration, education, military, occupation
- FR-STORY-03: Events have date, location, description, and linked media

### Approval Workflow

- FR-APPR-01: All edits by Members require Branch Admin approval
- FR-APPR-02: Approval requests show old value vs. new value
- FR-APPR-03: Branch Admin can approve, reject, or request revision
- FR-APPR-04: Notifications sent for pending approvals
- FR-APPR-05: Super Admin can override any approval

### Audit Trail

- FR-AUDIT-01: Every change is recorded (who, when, what, old value, new value)
- FR-AUDIT-02: Soft deletes only — nothing is permanently destroyed
- FR-AUDIT-03: Full history per entity
- FR-AUDIT-04: Restore previous versions

### Reports

- FR-RPT-01: PDF Family Book (narrative format)
- FR-RPT-02: Ancestor Report
- FR-RPT-03: Descendant Report
- FR-RPT-04: Relationship Report between any two people
- FR-RPT-05: Birthday Report (upcoming birthdays)
- FR-RPT-06: Printable Family Tree (A0–A3 paper sizes)
- FR-RPT-07: Statistics report (totals, averages, geographical distribution)

### Notifications

- FR-NOTIF-01: Birthday reminders
- FR-NOTIF-02: Approval request notifications
- FR-NOTIF-03: New member joined notification
- FR-NOTIF-04: Media tagged notification
- FR-NOTIF-05: In-app and email notifications

### AI Features (Phase 8)

- FR-AI-01: OCR for uploaded documents
- FR-AI-02: Duplicate person detection
- FR-AI-03: Relationship suggestions based on shared data
- FR-AI-04: Auto-biography generation from events and stories

## Non-Functional Requirements

- NFR-01: API response time < 300ms for standard queries
- NFR-02: Support 100+ concurrent users
- NFR-03: All API endpoints documented via OpenAPI/Swagger
- NFR-04: HTTPS only in production
- NFR-05: All passwords hashed with bcrypt
- NFR-06: JWT tokens expire in 1 hour (refresh tokens: 30 days)
- NFR-07: Full data export in JSON, XML, and GEDCOM format
- NFR-08: Database backups every 24 hours
- NFR-09: PHPStan level 8 compliance
- NFR-10: 80%+ unit test coverage for Services

