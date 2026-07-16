<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 2 – Audit Log Migration
 * Creates: audit_logs
 */
final class Version20260716000004 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 2 Core Genealogy: audit_logs table for automatic change tracking';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE audit_logs (
            id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) DEFAULT NULL,
            action VARCHAR(50) NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id VARCHAR(36) NOT NULL,
            old_values JSON DEFAULT NULL,
            new_values JSON DEFAULT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            user_agent LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            INDEX IDX_audit_user (user_id),
            INDEX IDX_audit_action (action),
            INDEX IDX_audit_entity (entity_type, entity_id),
            INDEX IDX_audit_created_at (created_at),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE audit_logs');
    }
}

