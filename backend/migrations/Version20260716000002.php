<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 2 – Marriage Migration
 * Creates: marriages
 */
final class Version20260716000002 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 2 Core Genealogy: marriages table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE marriages (
            id VARCHAR(36) NOT NULL,
            spouse1_id VARCHAR(36) NOT NULL,
            spouse2_id VARCHAR(36) NOT NULL,
            created_by VARCHAR(36) NOT NULL,
            marriage_date DATE DEFAULT NULL,
            marriage_date_precision VARCHAR(255) NOT NULL DEFAULT \'unknown\',
            marriage_place VARCHAR(255) DEFAULT NULL,
            divorce_date DATE DEFAULT NULL,
            divorce_date_precision VARCHAR(255) NOT NULL DEFAULT \'unknown\',
            is_divorced TINYINT NOT NULL DEFAULT 0,
            notes LONGTEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            deleted_at DATETIME DEFAULT NULL,
            INDEX IDX_marriages_spouse1 (spouse1_id),
            INDEX IDX_marriages_spouse2 (spouse2_id),
            INDEX IDX_marriages_created_by (created_by),
            INDEX IDX_marriages_deleted_at (deleted_at),
            PRIMARY KEY(id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

        $this->addSql('ALTER TABLE marriages
            ADD CONSTRAINT FK_marriages_spouse1 FOREIGN KEY (spouse1_id) REFERENCES persons (id)');
        $this->addSql('ALTER TABLE marriages
            ADD CONSTRAINT FK_marriages_spouse2 FOREIGN KEY (spouse2_id) REFERENCES persons (id)');
        $this->addSql('ALTER TABLE marriages
            ADD CONSTRAINT FK_marriages_created_by FOREIGN KEY (created_by) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE marriages DROP FOREIGN KEY FK_marriages_spouse1');
        $this->addSql('ALTER TABLE marriages DROP FOREIGN KEY FK_marriages_spouse2');
        $this->addSql('ALTER TABLE marriages DROP FOREIGN KEY FK_marriages_created_by');
        $this->addSql('DROP TABLE marriages');
    }
}

