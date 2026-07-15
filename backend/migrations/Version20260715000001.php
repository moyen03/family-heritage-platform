<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 1 Foundation Migration
 * Creates: users, branches, branch_admins, persons, person_branches, relationships
 */
final class Version20260715000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 1 Foundation: users, branches, persons, relationships';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE users (
            id VARCHAR(36) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            email_verified_at DATETIME DEFAULT NULL,
            last_login_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            deleted_at DATETIME DEFAULT NULL,
            UNIQUE INDEX UNIQ_email (email),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE branches (
            id VARCHAR(36) NOT NULL,
            created_by VARCHAR(36) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            deleted_at DATETIME DEFAULT NULL,
            INDEX IDX_created_by (created_by),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE branch_admins (
            branch_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            granted_by VARCHAR(36) NOT NULL,
            granted_at DATETIME NOT NULL,
            INDEX IDX_branch (branch_id),
            INDEX IDX_user (user_id),
            PRIMARY KEY(branch_id, user_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE persons (
            id VARCHAR(36) NOT NULL,
            created_by VARCHAR(36) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            middle_name VARCHAR(100) DEFAULT NULL,
            last_name VARCHAR(100) NOT NULL,
            maiden_name VARCHAR(100) DEFAULT NULL,
            gender VARCHAR(50) NOT NULL DEFAULT \'unknown\',
            birth_date DATE DEFAULT NULL,
            birth_date_precision VARCHAR(50) NOT NULL DEFAULT \'unknown\',
            birth_place VARCHAR(255) DEFAULT NULL,
            death_date DATE DEFAULT NULL,
            death_date_precision VARCHAR(50) NOT NULL DEFAULT \'unknown\',
            death_place VARCHAR(255) DEFAULT NULL,
            is_living TINYINT(1) NOT NULL DEFAULT 1,
            biography LONGTEXT DEFAULT NULL,
            visibility VARCHAR(50) NOT NULL DEFAULT \'family\',
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            deleted_at DATETIME DEFAULT NULL,
            INDEX IDX_last_name (last_name),
            INDEX IDX_created_by (created_by),
            INDEX IDX_deleted_at (deleted_at),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE person_branches (
            person_id VARCHAR(36) NOT NULL,
            branch_id VARCHAR(36) NOT NULL,
            is_primary TINYINT(1) NOT NULL DEFAULT 0,
            INDEX IDX_person (person_id),
            INDEX IDX_branch (branch_id),
            PRIMARY KEY(person_id, branch_id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE relationships (
            id VARCHAR(36) NOT NULL,
            person1_id VARCHAR(36) NOT NULL,
            person2_id VARCHAR(36) NOT NULL,
            created_by VARCHAR(36) NOT NULL,
            type VARCHAR(50) NOT NULL,
            notes LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            UNIQUE INDEX UNIQ_unique_relationship (person1_id, person2_id, type),
            INDEX IDX_person1 (person1_id),
            INDEX IDX_person2 (person2_id),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('CREATE TABLE refresh_tokens (
            id INT AUTO_INCREMENT NOT NULL,
            refresh_token VARCHAR(128) NOT NULL,
            username VARCHAR(255) NOT NULL,
            valid DATETIME NOT NULL,
            UNIQUE INDEX UNIQ_refresh_token (refresh_token),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        // Foreign keys
        $this->addSql('ALTER TABLE branches ADD CONSTRAINT FK_branches_created_by FOREIGN KEY (created_by) REFERENCES users (id)');
        $this->addSql('ALTER TABLE branch_admins ADD CONSTRAINT FK_ba_branch FOREIGN KEY (branch_id) REFERENCES branches (id)');
        $this->addSql('ALTER TABLE branch_admins ADD CONSTRAINT FK_ba_user FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE branch_admins ADD CONSTRAINT FK_ba_granted_by FOREIGN KEY (granted_by) REFERENCES users (id)');
        $this->addSql('ALTER TABLE persons ADD CONSTRAINT FK_persons_created_by FOREIGN KEY (created_by) REFERENCES users (id)');
        $this->addSql('ALTER TABLE person_branches ADD CONSTRAINT FK_pb_person FOREIGN KEY (person_id) REFERENCES persons (id)');
        $this->addSql('ALTER TABLE person_branches ADD CONSTRAINT FK_pb_branch FOREIGN KEY (branch_id) REFERENCES branches (id)');
        $this->addSql('ALTER TABLE relationships ADD CONSTRAINT FK_rel_person1 FOREIGN KEY (person1_id) REFERENCES persons (id)');
        $this->addSql('ALTER TABLE relationships ADD CONSTRAINT FK_rel_person2 FOREIGN KEY (person2_id) REFERENCES persons (id)');
        $this->addSql('ALTER TABLE relationships ADD CONSTRAINT FK_rel_created_by FOREIGN KEY (created_by) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE branch_admins DROP FOREIGN KEY FK_ba_branch');
        $this->addSql('ALTER TABLE branch_admins DROP FOREIGN KEY FK_ba_user');
        $this->addSql('ALTER TABLE branch_admins DROP FOREIGN KEY FK_ba_granted_by');
        $this->addSql('ALTER TABLE branches DROP FOREIGN KEY FK_branches_created_by');
        $this->addSql('ALTER TABLE person_branches DROP FOREIGN KEY FK_pb_person');
        $this->addSql('ALTER TABLE person_branches DROP FOREIGN KEY FK_pb_branch');
        $this->addSql('ALTER TABLE relationships DROP FOREIGN KEY FK_rel_person1');
        $this->addSql('ALTER TABLE relationships DROP FOREIGN KEY FK_rel_person2');
        $this->addSql('ALTER TABLE relationships DROP FOREIGN KEY FK_rel_created_by');
        $this->addSql('ALTER TABLE persons DROP FOREIGN KEY FK_persons_created_by');
        $this->addSql('DROP TABLE refresh_tokens');
        $this->addSql('DROP TABLE relationships');
        $this->addSql('DROP TABLE person_branches');
        $this->addSql('DROP TABLE persons');
        $this->addSql('DROP TABLE branch_admins');
        $this->addSql('DROP TABLE branches');
        $this->addSql('DROP TABLE users');
    }
}

