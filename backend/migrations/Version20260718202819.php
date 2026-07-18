<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260718202819 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE refresh_tokens');
        $this->addSql('DROP INDEX IDX_addresses_type ON addresses');
        $this->addSql('DROP INDEX IDX_addresses_country ON addresses');
        $this->addSql('ALTER TABLE addresses RENAME INDEX idx_d4e6f81217bbb47 TO IDX_6FCA7516217BBB47');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE refresh_tokens (id INT AUTO_INCREMENT NOT NULL, refresh_token VARCHAR(128) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, username VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL COLLATE `utf8mb4_unicode_ci`, valid DATETIME NOT NULL, UNIQUE INDEX UNIQ_refresh_token (refresh_token), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = \'\' ');
        $this->addSql('CREATE INDEX IDX_addresses_type ON addresses (address_type)');
        $this->addSql('CREATE INDEX IDX_addresses_country ON addresses (country)');
        $this->addSql('ALTER TABLE addresses RENAME INDEX idx_6fca7516217bbb47 TO IDX_D4E6F81217BBB47');
    }
}
