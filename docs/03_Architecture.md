# 03 – System Architecture

## Overview

The platform uses a **layered, clean architecture** with a clear separation of concerns between the API backend, the web frontend, and the mobile app.

```
┌──────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│         React (Web)          React Native (Mobile)       │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS / REST / JSON
┌───────────────────────▼──────────────────────────────────┐
│                    API Gateway (Nginx)                   │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│              Backend: Symfony 7 / PHP 8.3                │
│                                                          │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │  Controller  │  │   Service    │  │  Repository  │  │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│          │                 │                  │          │
│   ┌──────▼─────────────────▼──────────────────▼───────┐  │
│   │              Domain / Entity Layer                │  │
│   └───────────────────────────────────────────────────┘  │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │      API Platform (REST + OpenAPI/Swagger)       │   │
│   └──────────────────────────────────────────────────┘   │
│                                                          │
│   ┌──────────────┐  ┌──────────────┐                     │
│   │ Symfony Sec  │  │  JWT Auth    │                     │
│   └──────────────┘  └──────────────┘                     │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│               Data Layer: MySQL 8 + Doctrine             │
└──────────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│            File Storage (Local → S3-compatible)          │
└──────────────────────────────────────────────────────────┘
```

## Backend Modules

| Module | Purpose |
|--------|---------|
| User | Authentication, roles, invitations |
| Branch | Family Branch Ownership |
| Person | Family member profiles |
| Relationship | Parent, child, spouse, adoption, step-family |
| Address | Current and historical addresses |
| Media | Photos, videos, documents |
| Story | Memories and historical notes |
| Event | Births, marriages, deaths, migrations |
| Report | PDF family books and printable trees |
| Map | Geographic visualization |
| Audit | Version history and approvals |
| Notification | Birthdays, approvals, updates |

## Backend Layer Architecture

Each module follows this structure:

```
src/
├── Entity/           # Doctrine ORM entities (database models)
├── Repository/       # Data access layer
├── Service/          # Business logic
├── Controller/       # API endpoints (API Platform resources)
├── DTO/              # Data Transfer Objects (input/output)
├── Security/         # Voters, access control
├── EventListener/    # Domain event listeners
├── Command/          # CLI commands
└── Exception/        # Custom exceptions
```

## Relationship Data Model

The family tree is modelled as a **directed graph**, not a simple tree.

This supports:
- Multiple marriages
- Adoptions
- Foster parents
- Step-families
- Half-siblings
- Unknown parents
- Guardianships
- Historical corrections

```
Person ←──── Relationship ────→ Person
               (type, dates, notes)
```

Relationship types:
- `parent`
- `child`
- `spouse`
- `sibling`
- `half_sibling`
- `step_parent`
- `step_child`
- `adopted_parent`
- `adopted_child`
- `guardian`
- `foster_parent`

## Privacy Architecture

Every entity has a `visibility` field:

| Level | Who Can See |
|-------|------------|
| `public` | Anyone (future: public site) |
| `family` | Any logged-in member |
| `branch` | Members of the same branch |
| `private` | Only Super Admin and Branch Admin |
| `custom` | Specific list of users |

## Branch Ownership Architecture

```
Super Admin
    │
    ├── Branch: Maternal Side
    │       └── Branch Admin → Members
    │
    └── Branch: Paternal Side
            └── Branch Admin → Members
```

- Each branch has a `root_person_id`
- Each person can belong to multiple branches
- Changes require approval from the branch's admin

## Docker Architecture (Local Development)

```
┌─────────────────────────────────────┐
│         Docker Compose              │
│                                     │
│  ┌─────────┐  ┌────────────────┐   │
│  │  Nginx  │  │  PHP-FPM 8.3  │   │
│  │ :8000   │  │  (Symfony)    │   │
│  └────┬────┘  └───────┬────────┘   │
│       │               │            │
│  ┌────▼───────────────▼────────┐   │
│  │        MySQL 8 :3306        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐  │
│  │    phpMyAdmin :8080          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

