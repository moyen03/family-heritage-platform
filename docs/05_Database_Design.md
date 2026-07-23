# 05 – Database Design

## Design Principles

1. **Graph-based relationships** — persons are nodes, relationships are edges
2. **UUID primary keys** on all tables (not auto-increment)
3. **Soft deletes** — `deleted_at` column, nothing is hard-deleted
4. **Audit trail** — every change stored in `audit_logs`
5. **Privacy levels** — visibility column on sensitive tables
6. **Temporal data** — date ranges for addresses, names, marriages
7. **JSON columns** — for flexible metadata (media, events)

---

## Core Tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| role | ENUM | super_admin, branch_admin, member, viewer |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| is_active | TINYINT(1) | |
| email_verified_at | DATETIME NULL | |
| last_login_at | DATETIME NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | soft delete |

### roles
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| name | VARCHAR(50) UNIQUE | super_admin, branch_admin, member, viewer |
| description | TEXT | |

### permissions
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| name | VARCHAR(100) UNIQUE | e.g. person.create |
| description | TEXT | |

### role_permissions
| Column | Type | Notes |
|--------|------|-------|
| role_id | CHAR(36) FK | |
| permission_id | CHAR(36) FK | |

---

## Branch Tables

### branches
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| name | VARCHAR(255) | e.g. "Hafez Family" |
| description | TEXT NULL | |
| is_shared | TINYINT(1) | 1 = common ancestors visible to ALL branches |
| created_by | CHAR(36) FK | user_id |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

### branch_admins
| Column | Type | Notes |
|--------|------|-------|
| branch_id | CHAR(36) FK | |
| user_id | CHAR(36) FK | |
| granted_at | DATETIME | |
| granted_by | CHAR(36) FK | user_id |

### branch_memberships
| Column | Type | Notes |
|--------|------|-------|
| branch_id | CHAR(36) FK | |
| user_id | CHAR(36) FK | links a platform User to a branch for access control |
| role | VARCHAR(255) | `viewer`, `member`, `branch_admin` — `branch_admin` grants the same privileges as an entry in `branch_admins` |
| joined_at | DATETIME | |
| invited_by | CHAR(36) FK | user_id |

> **Note:** A user is considered a Branch Admin for a given branch if they have an entry in `branch_admins` **or** if their `branch_memberships.role = 'branch_admin'` for that branch. On login, `JWTCreatedListener` checks both tables and adds `ROLE_BRANCH_ADMIN` to the JWT payload if either condition is true.

### person_branches
| Column | Type | Notes |
|--------|------|-------|
| person_id | CHAR(36) FK | |
| branch_id | CHAR(36) FK | |
| is_primary | TINYINT(1) | 1 = born into this branch (blood); 0 = married in (in-law) |

---

## Person Tables

### persons
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| first_name | VARCHAR(100) | |
| middle_name | VARCHAR(100) NULL | |
| last_name | VARCHAR(100) | |
| maiden_name | VARCHAR(100) NULL | |
| nickname | VARCHAR(100) NULL | common/family name shown in hero |
| gender | ENUM | male, female, other, unknown |
| birth_date | DATE NULL | |
| birth_date_precision | ENUM | exact, year, approximate, unknown |
| birth_place | VARCHAR(255) NULL | |
| death_date | DATE NULL | |
| death_date_precision | ENUM | exact, year, approximate, unknown |
| death_place | VARCHAR(255) NULL | |
| is_living | TINYINT(1) | default 1 |
| phone | VARCHAR(50) NULL | mobile/phone number |
| nid_number | VARCHAR(30) NULL | National ID number |
| profession | VARCHAR(150) NULL | occupation / job title |
| blood_group | VARCHAR(5) NULL | A+, A-, B+, B-, AB+, AB-, O+, O- |
| highest_education | VARCHAR(150) NULL | None, Primary, SSC, HSC, Diploma, Bachelor's, Master's, PhD, Other |
| biography | TEXT NULL | |
| profile_picture_path | VARCHAR(255) NULL | relative path to uploaded photo |
| visibility | ENUM | public, family, branch, private |
| created_by | CHAR(36) FK | user_id |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

### person_names
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| person_id | CHAR(36) FK | |
| name_type | ENUM | birth, nickname, title, alias, married |
| name | VARCHAR(255) | |
| from_date | DATE NULL | |
| to_date | DATE NULL | |
| notes | TEXT NULL | |

---

## Relationship Tables

### relationships
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| person1_id | CHAR(36) FK | |
| person2_id | CHAR(36) FK | |
| type | ENUM | parent, child, sibling, half_sibling, step_parent, step_child, adopted_parent, adopted_child, guardian, foster_parent |
| notes | TEXT NULL | |
| created_by | CHAR(36) FK | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### marriages
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| spouse1_id | CHAR(36) FK | person.id |
| spouse2_id | CHAR(36) FK | person.id |
| marriage_date | DATE NULL | |
| marriage_date_precision | ENUM | exact, year, approximate, unknown |
| marriage_place | VARCHAR(255) NULL | |
| divorce_date | DATE NULL | |
| divorce_date_precision | ENUM | exact, year, approximate, unknown |
| is_divorced | TINYINT(1) | default 0 |
| notes | TEXT NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## Address Tables

### addresses
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| person_id | CHAR(36) FK | |
| address_type | ENUM | current, historical, birth, childhood |
| country | VARCHAR(100) | |
| state_province | VARCHAR(100) NULL | |
| district | VARCHAR(100) NULL | |
| city | VARCHAR(100) NULL | |
| village | VARCHAR(100) NULL | |
| street | VARCHAR(255) NULL | |
| postal_code | VARCHAR(20) NULL | |
| latitude | DECIMAL(10,8) NULL | |
| longitude | DECIMAL(11,8) NULL | |
| from_date | DATE NULL | |
| to_date | DATE NULL | |
| notes | TEXT NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## Media Tables

### media
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| media_type | ENUM | photo, video, document, audio |
| document_type | ENUM NULL | birth_cert, marriage_cert, passport, letter, diploma, other |
| title | VARCHAR(255) NULL | |
| description | TEXT NULL | |
| file_path | VARCHAR(500) | |
| file_name | VARCHAR(255) | |
| file_size | INT | bytes |
| mime_type | VARCHAR(100) | |
| taken_at | DATE NULL | |
| taken_at_precision | ENUM | exact, year, approximate, unknown |
| location | VARCHAR(255) NULL | |
| photographer | VARCHAR(255) NULL | |
| source | VARCHAR(255) NULL | |
| visibility | ENUM | public, family, branch, private |
| uploaded_by | CHAR(36) FK | user_id |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

### media_persons
| Column | Type | Notes |
|--------|------|-------|
| media_id | CHAR(36) FK | |
| person_id | CHAR(36) FK | |
| notes | TEXT NULL | |

---

## Story & Event Tables

### stories
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| person_id | CHAR(36) FK | |
| title | VARCHAR(255) | |
| content | LONGTEXT | |
| story_date | DATE NULL | |
| visibility | ENUM | public, family, branch, private |
| created_by | CHAR(36) FK | |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

### events
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| person_id | CHAR(36) FK | |
| event_type | ENUM | birth, death, marriage, divorce, migration, graduation, military, occupation, religion, other |
| title | VARCHAR(255) NULL | |
| description | TEXT NULL | |
| event_date | DATE NULL | |
| event_date_precision | ENUM | exact, year, approximate, unknown |
| location | VARCHAR(255) NULL | |
| latitude | DECIMAL(10,8) NULL | |
| longitude | DECIMAL(11,8) NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## Approval & Audit Tables

### approval_requests
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| entity_type | VARCHAR(100) | e.g. "Person" |
| entity_id | CHAR(36) | |
| requested_by | CHAR(36) FK | user_id |
| reviewed_by | CHAR(36) FK NULL | user_id |
| status | ENUM | pending, approved, rejected, revision_requested |
| changes_json | JSON | old and new values |
| notes | TEXT NULL | |
| created_at | DATETIME | |
| reviewed_at | DATETIME NULL | |

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| user_id | CHAR(36) FK NULL | |
| action | ENUM | created, updated, deleted, restored, approved, rejected |
| entity_type | VARCHAR(100) | |
| entity_id | CHAR(36) | |
| old_values | JSON NULL | |
| new_values | JSON NULL | |
| ip_address | VARCHAR(45) NULL | |
| user_agent | TEXT NULL | |
| created_at | DATETIME | |

---

## Notification Tables

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | UUID |
| user_id | CHAR(36) FK | |
| type | ENUM | birthday, approval_request, approval_result, new_member, tagged_in_media, general |
| title | VARCHAR(255) | |
| message | TEXT | |
| data_json | JSON NULL | extra context |
| is_read | TINYINT(1) | default 0 |
| read_at | DATETIME NULL | |
| created_at | DATETIME | |

---

## Occupations & Education

### occupations
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | |
| person_id | CHAR(36) FK | |
| title | VARCHAR(255) | |
| employer | VARCHAR(255) NULL | |
| from_date | DATE NULL | |
| to_date | DATE NULL | |
| description | TEXT NULL | |

### educations
| Column | Type | Notes |
|--------|------|-------|
| id | CHAR(36) PK | |
| person_id | CHAR(36) FK | |
| institution | VARCHAR(255) | |
| degree | VARCHAR(255) NULL | |
| field | VARCHAR(255) NULL | |
| from_date | DATE NULL | |
| to_date | DATE NULL | |

---

## Estimated Table Count

| Group | Tables |
|-------|--------|
| Users & Auth | users, roles, permissions, role_permissions |
| Branches | branches, branch_admins, branch_memberships, person_branches |
| Persons | persons, person_names |
| Relationships | relationships, marriages |
| Addresses | addresses |
| Media | media, media_persons |
| Stories & Events | stories, events |
| Approval & Audit | approval_requests, audit_logs |
| Notifications | notifications |
| Career & Education | occupations, educations |
| **Total** | **~23 core tables** (grows with features) |

