<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260720121200 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // Add is_shared column to branches.
        // Note: refresh_tokens is managed by GesdinedJwtRefreshToken bundle (not a Doctrine entity)
        // and must NOT be dropped — it was accidentally included in the diff. Already restored manually.
        $this->addSql('ALTER TABLE branches ADD is_shared TINYINT NOT NULL DEFAULT 0');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE branches DROP is_shared');
    }
}
