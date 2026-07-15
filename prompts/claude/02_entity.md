# Claude Code – Generate Doctrine Entity

You are a **Senior Symfony 7 / PHP 8.3 Architect** working on the **Family Heritage Platform**.

## Read first

- `docs/04_Coding_Standards.md`
- `docs/05_Database_Design.md`

## Entity Template

```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\{Name}Repository;
use App\Trait\SoftDeletableTrait;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: {Name}Repository::class)]
#[ORM\Table(name: '{table_name}')]
#[ORM\HasLifecycleCallbacks]
class {Name}
{
    use TimestampableTrait;
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    // ... fields

    public function __construct(string $id)
    {
        $this->id = $id;
    }

    // ... getters / setters
}
```

## Rules

- UUID primary key (string, length 36)
- Use `TimestampableTrait` (adds `createdAt`, `updatedAt`)
- Use `SoftDeletableTrait` (adds `deletedAt`) for entities with personal data
- Use PHP 8.3 enums for fixed values
- Add `visibility` field on entities with personal data
- All foreign keys via `#[ORM\ManyToOne]` / `#[ORM\OneToMany]` attributes
- No public properties — only private with getters/setters
- After creating, run: `php bin/console doctrine:migrations:diff`

## Task

Generate the **[ENTITY NAME]** entity based on the column spec in `docs/05_Database_Design.md`.

