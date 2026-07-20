<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 6b: Branch Membership — links users to specific branches.
 * Enables proper enforcement of "branch" visibility level.
 */
final class Version20260720130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create branch_memberships table for user-branch access control';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE branch_memberships (
                branch_id VARCHAR(36) NOT NULL,
                user_id   VARCHAR(36) NOT NULL,
                role      VARCHAR(20) NOT NULL DEFAULT 'member',
                joined_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)',
                invited_by VARCHAR(36) NOT NULL,
                PRIMARY KEY (branch_id, user_id),
                INDEX IDX_BRANCH_MEMBERSHIP_USER (user_id),
                INDEX IDX_BRANCH_MEMBERSHIP_INVITED_BY (invited_by),
                CONSTRAINT FK_BRANCH_MEMBERSHIP_BRANCH
                    FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE,
                CONSTRAINT FK_BRANCH_MEMBERSHIP_USER
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                CONSTRAINT FK_BRANCH_MEMBERSHIP_INVITED_BY
                    FOREIGN KEY (invited_by) REFERENCES users (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE branch_memberships');
    }
}

