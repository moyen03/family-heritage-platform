# Family Heritage Platform

A secure, multi-branch family history and genealogy platform built with Symfony 7, React, and React Native. Families can collaboratively build, manage, and explore their heritage across generations — with branch-level access control so each grandparent's family line has its own private scope.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.3 + Symfony 7 |
| Database | MySQL 8 |
| ORM | Doctrine ORM |
| API | API Platform (REST + OpenAPI) |
| Authentication | Symfony Security + JWT |
| Web Frontend | React 18 + TypeScript + Vite |
| Tree Visualization | React Flow + Dagre |
| Maps | OpenStreetMap + Leaflet + Clustering |
| Mobile App | React Native *(planned)* |
| File Storage | Local (S3-compatible later) |
| Local Dev | Docker + Docker Compose |
| CI | GitHub Actions (PHP CS Fixer + PHPStan + PHPUnit) |

## Quick Start

### Prerequisites

- Docker Desktop
- Docker Compose v2+
- Node.js 18+
- Git

### Local Development Setup

```bash
# Clone the repository
git clone <your-repo-url> family-heritage-platform
cd family-heritage-platform

# Start Docker containers (backend + MySQL)
docker compose -f docker/docker-compose.yml up -d

# Install backend dependencies
docker compose -f docker/docker-compose.yml exec php composer install

# Run database migrations
docker compose -f docker/docker-compose.yml exec php bin/console doctrine:migrations:migrate --no-interaction

# Seed Moyen family data
docker compose -f docker/docker-compose.yml exec php bin/console app:seed-moyen-family

# Install frontend dependencies and start dev server
cd frontend && npm install && npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Web App (React) | http://localhost:3000 |
| API (Symfony) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| phpMyAdmin | http://localhost:8080 |

### Default Login

| Account | Email | Password |
|---------|-------|----------|
| Super Admin | admin@family.local | Admin1234! |
| Family Member | moyen@family.local | Member1234! |

## Development Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation (Docker, Symfony, Auth, Roles, Branches) | ✅ Complete |
| Phase 2 | Core Genealogy (Persons, Relationships, Ancestors) | ✅ Complete |
| Phase 3 | Interactive Family Tree UI | ✅ Complete |
| Phase 4 | Media (Photos, Videos, Documents, Audio) | ✅ Complete |
| Phase 5 | Addresses and Maps | ✅ Complete |
| Phase 6 | Branch Management (multi-branch access control) | 🚧 In Progress |
| Phase 7 | Reports (PDF Family Book, Printable Tree) | ⏳ Planned |
| Phase 8 | Mobile App | ⏳ Planned |
| Phase 9 | AI Features (OCR, Duplicate Detection, Suggestions) | ⏳ Planned |

See [`docs/12_Development_Roadmap.md`](./docs/12_Development_Roadmap.md) for detailed task breakdown.

## Branch System

The platform supports multi-branch family trees. Each **grandparent line** is its own branch:

```
Great-Grandparent (common ancestor — visible to everyone)
├── Grandparent A → "Branch A" (their descendants only see Branch A)
└── Grandparent B → "Branch B" (their descendants only see Branch B)
```

- **Super Admin** — sees everything across all branches
- **Branch Admin** — manages their branch, approves edits, invites members
- **Member** — views their branch, can suggest edits (requires approval)
- **Viewer** — read-only access to their branch

## Project Structure

```
family-heritage-platform/
├── README.md
├── .github/
│   └── workflows/ci.yml        # GitHub Actions CI
├── docker/
│   ├── nginx/
│   ├── php/
│   ├── mysql/
│   └── docker-compose.yml
├── docs/                        # Full documentation
│   ├── 00_Project_Overview.md
│   ├── 09_User_Roles.md
│   ├── 10_Business_Rules.md
│   ├── 12_Development_Roadmap.md
│   ├── DECISIONS.md
│   └── family-data-collection-guide.md
├── backend/                     # Symfony 7 application
│   ├── src/
│   │   ├── Entity/              # Person, Branch, Address, Media, etc.
│   │   ├── Controller/Api/      # Custom endpoints (photo upload, etc.)
│   │   ├── Doctrine/Extension/  # Visibility filters
│   │   └── State/               # API Platform state processors
│   └── migrations/
├── frontend/                    # React + TypeScript
│   └── src/
│       ├── components/          # PersonFormModal, AddressFormModal, etc.
│       ├── pages/               # Tree, Persons, Map, Media, etc.
│       ├── services/            # API service layer
│       └── types/               # TypeScript types
├── mobile/                      # React Native (planned)
├── database/
│   ├── seed/                    # moyen_family_data.json
│   └── schema/
└── prompts/                     # AI coding prompts
```

## Documentation

All detailed documentation lives in the [`docs/`](./docs/) folder.

| Doc | Contents |
|-----|---------|
| [00_Project_Overview](./docs/00_Project_Overview.md) | Goals, capabilities, principles |
| [09_User_Roles](./docs/09_User_Roles.md) | Roles, permissions, branch structure |
| [10_Business_Rules](./docs/10_Business_Rules.md) | All business rules |
| [12_Development_Roadmap](./docs/12_Development_Roadmap.md) | Phase-by-phase task list |
| [DECISIONS](./docs/DECISIONS.md) | Architecture decision records |
| [family-data-collection-guide](./docs/family-data-collection-guide.md) | How to add family data |

## Contributing

See [docs/04_Coding_Standards.md](./docs/04_Coding_Standards.md) for coding standards and Git workflow.

## License

See [LICENSE](./LICENSE).
