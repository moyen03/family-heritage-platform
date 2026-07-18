<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Phase 5 – Addresses and Maps: create the addresses table.
 */
final class Version20260718200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Phase 5: Create addresses table for person address history and geo-coordinates';
    }

    public function up(Schema $schema): void
    {
        $this->addSql(<<<'SQL'
            CREATE TABLE addresses (
                id              VARCHAR(36)      NOT NULL,
                person_id       VARCHAR(36)      NOT NULL,
                address_type    VARCHAR(255)     NOT NULL,
                country         VARCHAR(100)     NOT NULL,
                state_province  VARCHAR(100)     DEFAULT NULL,
                district        VARCHAR(100)     DEFAULT NULL,
                city            VARCHAR(100)     DEFAULT NULL,
                village         VARCHAR(100)     DEFAULT NULL,
                street          VARCHAR(255)     DEFAULT NULL,
                postal_code     VARCHAR(20)      DEFAULT NULL,
                latitude        DECIMAL(10, 8)   DEFAULT NULL,
                longitude       DECIMAL(11, 8)   DEFAULT NULL,
                from_date       DATE             DEFAULT NULL,
                to_date         DATE             DEFAULT NULL,
                notes           LONGTEXT         DEFAULT NULL,
                created_at      DATETIME         NOT NULL,
                updated_at      DATETIME         NOT NULL,
                INDEX IDX_D4E6F81217BBB47 (person_id),
                INDEX IDX_addresses_country (country),
                INDEX IDX_addresses_type (address_type),
                PRIMARY KEY (id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB
        SQL);

        $this->addSql(
            'ALTER TABLE addresses ADD CONSTRAINT FK_addresses_person FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE'
        );
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE addresses DROP FOREIGN KEY FK_addresses_person');
        $this->addSql('DROP TABLE addresses');
    }
}

