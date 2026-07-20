<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260720132402 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE branch_memberships CHANGE role role VARCHAR(255) NOT NULL, CHANGE joined_at joined_at DATETIME NOT NULL');
        $this->addSql('ALTER TABLE branch_memberships RENAME INDEX idx_branch_membership_user TO IDX_A96E38CA76ED395');
        $this->addSql('ALTER TABLE branch_memberships RENAME INDEX idx_branch_membership_invited_by TO IDX_A96E38C421FF255');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE branch_memberships CHANGE role role VARCHAR(20) DEFAULT \'member\' NOT NULL, CHANGE joined_at joined_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE branch_memberships RENAME INDEX idx_a96e38ca76ed395 TO IDX_BRANCH_MEMBERSHIP_USER');
        $this->addSql('ALTER TABLE branch_memberships RENAME INDEX idx_a96e38c421ff255 TO IDX_BRANCH_MEMBERSHIP_INVITED_BY');
    }
}
