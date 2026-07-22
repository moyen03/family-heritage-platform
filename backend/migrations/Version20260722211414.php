<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260722211414 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE branch_invitations (id VARCHAR(36) NOT NULL, email VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, token VARCHAR(64) NOT NULL, status VARCHAR(20) NOT NULL, expires_at DATETIME NOT NULL, accepted_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, branch_id VARCHAR(36) NOT NULL, invited_by_id VARCHAR(36) NOT NULL, UNIQUE INDEX UNIQ_AFEBB4545F37A13B (token), INDEX IDX_AFEBB454DCD6CC49 (branch_id), INDEX IDX_AFEBB454A7B4A7E3 (invited_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE branch_invitations ADD CONSTRAINT FK_AFEBB454DCD6CC49 FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE branch_invitations ADD CONSTRAINT FK_AFEBB454A7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE branch_invitations DROP FOREIGN KEY FK_AFEBB454DCD6CC49');
        $this->addSql('ALTER TABLE branch_invitations DROP FOREIGN KEY FK_AFEBB454A7B4A7E3');
        $this->addSql('DROP TABLE branch_invitations');
    }
}
