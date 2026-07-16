<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 2 – Approval Workflow Migration
 * Creates: approval_requests
 */
final class Version20260716000003 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 2 Core Genealogy: approval_requests table for Member edit workflow';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE approval_requests (
            id VARCHAR(36) NOT NULL,
            requested_by VARCHAR(36) NOT NULL,
            reviewed_by VARCHAR(36) DEFAULT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id VARCHAR(36) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT \'pending\',
            changes_json JSON NOT NULL,
            notes LONGTEXT DEFAULT NULL,
            reviewed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            INDEX IDX_approval_requested_by (requested_by),
            INDEX IDX_approval_reviewed_by (reviewed_by),
            INDEX IDX_approval_status (status),
            INDEX IDX_approval_entity (entity_type, entity_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE approval_requests
            ADD CONSTRAINT FK_approval_requested_by FOREIGN KEY (requested_by) REFERENCES users (id)');
        $this->addSql('ALTER TABLE approval_requests
            ADD CONSTRAINT FK_approval_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE approval_requests DROP FOREIGN KEY FK_approval_requested_by');
        $this->addSql('ALTER TABLE approval_requests DROP FOREIGN KEY FK_approval_reviewed_by');
        $this->addSql('DROP TABLE approval_requests');
    }
}

