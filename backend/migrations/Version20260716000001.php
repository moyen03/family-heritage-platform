<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 2 – Person Names Migration
 * Creates: person_names
 */
final class Version20260716000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 2 Core Genealogy: person_names table for multiple names per person';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE person_names (
            id VARCHAR(36) NOT NULL,
            person_id VARCHAR(36) NOT NULL,
            name_type VARCHAR(50) NOT NULL DEFAULT \'birth\',
            name VARCHAR(255) NOT NULL,
            from_date DATE DEFAULT NULL,
            to_date DATE DEFAULT NULL,
            notes LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_person_names_person (person_id),
            INDEX IDX_person_names_type (name_type),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE person_names
            ADD CONSTRAINT FK_person_names_person
            FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE person_names DROP FOREIGN KEY FK_person_names_person');
        $this->addSql('DROP TABLE person_names');
    }
}

