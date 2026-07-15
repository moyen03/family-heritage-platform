# Claude Code – GitHub Copilot Instructions

You are working on the **Family Heritage Platform**.

## Stack

- PHP 8.3 + Symfony 7 (backend)
- MySQL 8 + Doctrine ORM
- API Platform 3 (REST + OpenAPI)
- JWT Authentication (LexikJWT)
- React + TypeScript (frontend)
- React Native (mobile)
- Docker (local dev)

## Key Rules

1. Always `declare(strict_types=1)` in every PHP file
2. Use PHP 8.3 enums, readonly, typed properties
3. UUID primary keys (not auto-increment)
4. Services are `final` and return DTOs — never entities
5. Use Doctrine migrations — never modify schema manually
6. PHPStan level 8 — no errors allowed
7. PSR-12 code style
8. Use `TimestampableTrait` and `SoftDeletableTrait` from `App\Trait\`
9. Write PHPUnit tests for every Service class
10. Living persons' private data is always protected

## Project Documentation

All project specs are in `docs/`:
- `docs/05_Database_Design.md` — all entities and columns
- `docs/06_API_Design.md` — all API endpoints
- `docs/09_User_Roles.md` — permission matrix
- `docs/10_Business_Rules.md` — business logic rules

## Folder Structure

```
backend/src/
  Entity/       ← Doctrine entities
  Repository/   ← Data access
  Service/      ← Business logic (final classes, return DTOs)
  Controller/Api/ ← Thin API controllers
  DTO/Input/    ← Validated input DTOs
  DTO/Output/   ← Response DTOs
  Enum/         ← PHP 8.1+ enums
  Trait/        ← Shared traits
  Security/Voter/ ← Symfony Voters
```

