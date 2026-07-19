<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260720000001 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add profile_picture_path to persons table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE persons ADD profile_picture_path VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE persons DROP COLUMN profile_picture_path');
    }
}

