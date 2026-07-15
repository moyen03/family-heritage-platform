# Family Heritage Platform

A comprehensive, enterprise-grade family history and genealogy platform built with Symfony 7, React, and React Native.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend | PHP 8.3 + Symfony 7 |
| Database | MySQL 8 |
| ORM | Doctrine ORM |
| API | API Platform (REST + OpenAPI) |
| Authentication | Symfony Security + JWT |
| Web Frontend | React + TypeScript |
| Mobile App | React Native |
| File Storage | Local (S3-compatible later) |
| Maps | OpenStreetMap + Leaflet |
| Local Dev | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Docker Desktop
- Docker Compose v2+
- Git

### Local Development Setup

```bash
# Clone the repository
git clone <your-repo-url> family-heritage-platform
cd family-heritage-platform

# Start Docker containers
docker compose -f docker/docker-compose.yml up -d

# Install backend dependencies
docker exec fhp-php composer install

# Run database migrations
docker exec fhp-php php bin/console doctrine:migrations:migrate --no-interaction

# Seed initial data (optional)
docker exec fhp-php php bin/console doctrine:fixtures:load --no-interaction
```

### Access Points

| Service | URL |
|---------|-----|
| API (Symfony) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| phpMyAdmin | http://localhost:8080 |
| Frontend (React) | http://localhost:3000 |

## Development Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation (Docker, Symfony, Auth, Roles, Branches) | 🚧 In Progress |
| Phase 2 | Core Genealogy (Persons, Relationships, Ancestors, Descendants) | ⏳ Planned |
| Phase 3 | Interactive Family Tree UI | ⏳ Planned |
| Phase 4 | Media (Photos, Videos, Documents) | ⏳ Planned |
| Phase 5 | Addresses and Maps | ⏳ Planned |
| Phase 6 | Reports (PDF Family Book, Printable Tree) | ⏳ Planned |
| Phase 7 | Mobile App | ⏳ Planned |
| Phase 8 | AI Features (OCR, Duplicate Detection, Suggestions) | ⏳ Planned |

## Project Structure

```
family-heritage-platform/
├── README.md
├── LICENSE
├── .gitignore
├── docker/
│   ├── nginx/
│   ├── php/
│   ├── mysql/
│   └── docker-compose.yml
├── docs/
│   ├── 00_Project_Overview.md
│   ├── 01_Project_Vision.md
│   ├── 02_Product_Requirements.md
│   ├── 03_Architecture.md
│   ├── 04_Coding_Standards.md
│   ├── 05_Database_Design.md
│   ├── 06_API_Design.md
│   ├── 07_UI_UX.md
│   ├── 08_Security.md
│   ├── 09_User_Roles.md
│   ├── 10_Business_Rules.md
│   ├── 11_AI_Guidelines.md
│   ├── 12_Development_Roadmap.md
│   └── DECISIONS.md
├── backend/          # Symfony 7 application
├── frontend/         # React + TypeScript
├── mobile/           # React Native
├── database/
│   ├── schema/
│   ├── seed/
│   ├── migrations/
│   └── diagrams/
├── prompts/
│   ├── claude/
│   ├── cursor/
│   └── github-copilot/
└── scripts/
```

## Documentation

All detailed documentation lives in the [`docs/`](./docs/) folder.

## Contributing

See [docs/04_Coding_Standards.md](./docs/04_Coding_Standards.md) for coding standards and Git workflow.

## License

See [LICENSE](./LICENSE).

