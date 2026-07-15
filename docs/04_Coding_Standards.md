# 04 – Coding Standards

## PHP / Symfony Backend

### General Rules

- PHP version: **8.3**
- Strict types: `declare(strict_types=1);` in every file
- PSR-12 coding style
- PHPStan level **8** (strict)
- Typed properties on all classes
- Constructor property promotion where appropriate
- Named arguments for readability
- Enums for fixed sets of values (PHP 8.1+)
- Readonly properties where applicable

### File & Class Naming

| Type | Convention | Example |
|------|-----------|---------|
| Class | PascalCase | `PersonService` |
| Interface | PascalCase + `Interface` | `PersonRepositoryInterface` |
| Trait | PascalCase + `Trait` | `TimestampableTrait` |
| Enum | PascalCase | `RelationshipType` |
| File | Same as class | `PersonService.php` |
| Template | snake_case | `person/show.html.twig` |

### Namespace Structure

```
App\
  Entity\
  Repository\
  Service\
  Controller\
  DTO\
  Security\
  EventListener\
  Command\
  Exception\
  Enum\
```

### Entity Rules

- All entities extend nothing (no base class, use traits instead)
- Use `#[ORM\Entity]` attributes (not annotations)
- UUID primary keys (not auto-increment integers)
- `createdAt` and `updatedAt` on every entity (via `TimestampableTrait`)
- Soft deletes using `deletedAt` (via `SoftDeletableTrait`)
- Visibility field on sensitive entities

### Service Rules

- Services are `final` classes
- All dependencies injected via constructor
- No static methods
- No direct access to `$_GET`, `$_POST`, `$_REQUEST`
- Services do not return Doctrine entities to controllers — they return DTOs

### Controller Rules

- Controllers are thin — no business logic
- Use `#[Route]` attributes
- Return `JsonResponse` or API Platform resource responses
- Input validation via Symfony Validator on DTOs

### Repository Rules

- All repositories implement an interface
- No raw SQL unless performance requires it (use DQL or QueryBuilder)
- Paginated results via `Pagerfanta` or API Platform pagination

### Testing Rules

- PHPUnit for unit and integration tests
- At least 80% coverage on Service classes
- Use factories for test data (Foundry)
- Test file mirrors source file structure: `tests/Service/PersonServiceTest.php`

---

## Git Workflow

### Branch Strategy

```
main            ← production-ready, protected
develop         ← integration branch
feature/xxx     ← new features
bugfix/xxx      ← bug fixes
hotfix/xxx      ← production hotfixes
release/x.x.x  ← release preparation
```

### Commit Message Format

```
type(scope): short description

Types: feat, fix, docs, style, refactor, test, chore
```

Examples:
```
feat(person): add birth place field to Person entity
fix(auth): resolve JWT refresh token expiry issue
docs(readme): update local setup instructions
test(person): add unit tests for PersonService
```

### Pull Request Rules

1. All PRs target `develop` (not `main`)
2. PR must include tests
3. PR must pass PHPStan and PHP-CS-Fixer
4. At least one review required before merge

---

## AI Coding Guidelines

When using Claude Code, Cursor, or GitHub Copilot:

1. **Always read the docs first** — reference the relevant `docs/` files
2. **Read the database spec** before generating entities
3. **Read the API spec** before generating controllers
4. **Generate one module at a time**
5. **Never modify unrelated files**
6. **Always generate PHPUnit tests**
7. **Always generate PHPStan-clean code**
8. **Use DTOs** — never expose entities directly in API responses
9. **Use migrations** — never modify the schema manually
10. **Document every public method**

See `prompts/claude/` for ready-made Claude Code prompts.

