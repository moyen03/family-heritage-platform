# 11 – AI Coding Guidelines

## Purpose

This document tells AI coding assistants (Claude Code, Cursor, GitHub Copilot) how to work on this project correctly and consistently.

---

## Before Writing Any Code

1. **Read `docs/00_Project_Overview.md`** — understand what the project is
2. **Read `docs/03_Architecture.md`** — understand the system design
3. **Read `docs/04_Coding_Standards.md`** — follow PHP, Git, and naming conventions
4. **Read `docs/05_Database_Design.md`** — understand all entities before touching the database
5. **Read `docs/06_API_Design.md`** — check existing endpoints before creating new ones
6. **Read `docs/10_Business_Rules.md`** — understand the rules before implementing logic
7. **Read `docs/DECISIONS.md`** — understand why decisions were made

---

## General Rules for AI

- Generate **one module at a time**
- Never modify files that are not part of the current task
- Always use **strict_types=1**
- Always use **PHP 8.3 features** (enums, readonly, named args, constructor promotion)
- Always use **Doctrine attributes** (not annotations)
- Always generate **PHPUnit tests** for every Service class
- Always generate **PHPStan level 8** clean code
- Never return Doctrine entities from Services — return **DTOs**
- Always use **UUID** for IDs (Ramsey UUID)
- Use **Symfony Messenger** for async tasks (notifications, report generation)
- Use **migrations** for any database change (`doctrine:migrations:diff`)
- Follow **PSR-12** formatting
- Use **PHP-CS-Fixer** before committing

---

## When Generating an Entity

1. Use `#[ORM\Entity(repositoryClass: XxxRepository::class)]`
2. Add `#[ORM\Table(name: 'xxx')]`
3. UUID primary key using `Ramsey\Uuid\Uuid`
4. Use `TimestampableTrait` for `createdAt` / `updatedAt`
5. Use `SoftDeletableTrait` for `deletedAt`
6. Add `visibility` field if the entity contains personal data
7. Run `php bin/console doctrine:migrations:diff` to generate migration

## When Generating a Service

1. Mark class as `final`
2. Inject all dependencies via constructor
3. Accept DTOs as input, return DTOs as output
4. Validate input at the DTO level (Symfony Validator)
5. Wrap database operations in transactions where needed
6. Dispatch domain events where appropriate
7. Log important actions

## When Generating a Controller

1. Keep controllers thin — no business logic
2. Use `#[Route]` attributes
3. Deserialize request into DTO
4. Call Service
5. Return `JsonResponse` or API Platform response
6. Handle exceptions via a global exception handler

## When Generating a Repository

1. Implement an interface (e.g., `PersonRepositoryInterface`)
2. Use QueryBuilder for complex queries
3. Use API Platform filters for list endpoints
4. Add pagination support

---

## Claude Code Prompts

See `prompts/claude/` for ready-made prompts:

- `prompts/claude/01_backend_module.md` — Generate a new backend module
- `prompts/claude/02_entity.md` — Generate a Doctrine entity
- `prompts/claude/03_service.md` — Generate a Service class
- `prompts/claude/04_api_endpoint.md` — Generate an API endpoint
- `prompts/claude/05_tests.md` — Generate PHPUnit tests
- `prompts/claude/06_frontend_component.md` — Generate a React component
- `prompts/claude/07_migration.md` — Generate a Doctrine migration

