<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260718122116 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE media (id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, media_type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, original_filename VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, stored_filename VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, mime_type VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, file_size BIGINT DEFAULT NULL, title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, description LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, date_taken DATE DEFAULT NULL, place_taken VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, source VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, privacy_level VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, uploaded_by_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, INDEX IDX_6A2CA10CA2B28FE8 (uploaded_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');
        $this->addSql('CREATE TABLE media_tag (id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, tagged_at DATETIME NOT NULL, media_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, person_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, tagged_by_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, INDEX IDX_48D8C57EEA9FDD75 (media_id), INDEX IDX_48D8C57E217BBB47 (person_id), INDEX IDX_48D8C57EB0156D6A (tagged_by_id), UNIQUE INDEX unique_media_person (media_id, person_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB');
        $this->addSql('ALTER TABLE media ADD CONSTRAINT FK_6A2CA10CA2B28FE8 FOREIGN KEY (uploaded_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE media_tag ADD CONSTRAINT FK_48D8C57EEA9FDD75 FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE media_tag ADD CONSTRAINT FK_48D8C57E217BBB47 FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE media_tag ADD CONSTRAINT FK_48D8C57EB0156D6A FOREIGN KEY (tagged_by_id) REFERENCES users (id)');
        // NOTE: refresh_tokens is managed by gesdinet/jwt-refresh-token-bundle — do NOT drop it
        $this->addSql('DROP INDEX IDX_approval_entity ON approval_requests');
        $this->addSql('DROP INDEX IDX_approval_status ON approval_requests');
        $this->addSql('ALTER TABLE approval_requests CHANGE status status VARCHAR(255) NOT NULL, CHANGE reviewed_at reviewed_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE approval_requests RENAME INDEX idx_approval_requested_by TO IDX_E4AE724B18C491A5');
        $this->addSql('ALTER TABLE approval_requests RENAME INDEX idx_approval_reviewed_by TO IDX_E4AE724B85D7FB47');
        $this->addSql('DROP INDEX IDX_audit_created_at ON audit_logs');
        $this->addSql('DROP INDEX IDX_audit_entity ON audit_logs');
        $this->addSql('DROP INDEX IDX_audit_action ON audit_logs');
        $this->addSql('DROP INDEX IDX_audit_user ON audit_logs');
        $this->addSql('ALTER TABLE audit_logs CHANGE action action VARCHAR(255) NOT NULL, CHANGE created_at created_at DATETIME NOT NULL');
        $this->addSql('ALTER TABLE branch_admins RENAME INDEX idx_branch TO IDX_5781605ADCD6CC49');
        $this->addSql('ALTER TABLE branch_admins RENAME INDEX idx_user TO IDX_5781605AA76ED395');
        $this->addSql('ALTER TABLE branch_admins RENAME INDEX fk_ba_granted_by TO IDX_5781605AA5FB753F');
        $this->addSql('ALTER TABLE branches RENAME INDEX idx_created_by TO IDX_D760D16FDE12AB56');
        $this->addSql('DROP INDEX IDX_marriages_deleted_at ON marriages');
        $this->addSql('ALTER TABLE marriages CHANGE marriage_date_precision marriage_date_precision VARCHAR(255) NOT NULL, CHANGE divorce_date_precision divorce_date_precision VARCHAR(255) NOT NULL, CHANGE is_divorced is_divorced TINYINT NOT NULL');
        $this->addSql('ALTER TABLE marriages RENAME INDEX idx_marriages_spouse1 TO IDX_E1DF582BB43FDC17');
        $this->addSql('ALTER TABLE marriages RENAME INDEX idx_marriages_spouse2 TO IDX_E1DF582BA68A73F9');
        $this->addSql('ALTER TABLE marriages RENAME INDEX idx_marriages_created_by TO IDX_E1DF582BDE12AB56');
        $this->addSql('ALTER TABLE person_branches CHANGE is_primary is_primary TINYINT NOT NULL');
        $this->addSql('ALTER TABLE person_branches RENAME INDEX idx_person TO IDX_43267458217BBB47');
        $this->addSql('ALTER TABLE person_branches RENAME INDEX idx_branch TO IDX_43267458DCD6CC49');
        $this->addSql('DROP INDEX IDX_person_names_type ON person_names');
        $this->addSql('ALTER TABLE person_names CHANGE name_type name_type VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE person_names RENAME INDEX idx_person_names_person TO IDX_5E055684217BBB47');
        $this->addSql('DROP INDEX IDX_deleted_at ON persons');
        $this->addSql('DROP INDEX IDX_last_name ON persons');
        $this->addSql('ALTER TABLE persons CHANGE gender gender VARCHAR(255) NOT NULL, CHANGE birth_date_precision birth_date_precision VARCHAR(255) NOT NULL, CHANGE death_date_precision death_date_precision VARCHAR(255) NOT NULL, CHANGE is_living is_living TINYINT NOT NULL, CHANGE visibility visibility VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE persons RENAME INDEX idx_created_by TO IDX_A25CC7D3DE12AB56');
        $this->addSql('ALTER TABLE relationships CHANGE type type VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE relationships RENAME INDEX idx_person1 TO IDX_CDF868A73EF5821B');
        $this->addSql('ALTER TABLE relationships RENAME INDEX idx_person2 TO IDX_CDF868A72C402DF5');
        $this->addSql('ALTER TABLE relationships RENAME INDEX fk_rel_created_by TO IDX_CDF868A7DE12AB56');
        $this->addSql('ALTER TABLE relationships RENAME INDEX uniq_unique_relationship TO unique_relationship');
        $this->addSql('ALTER TABLE users CHANGE is_active is_active TINYINT NOT NULL');
        $this->addSql('ALTER TABLE users RENAME INDEX uniq_email TO UNIQ_1483A5E9E7927C74');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        // NOTE: refresh_tokens is managed by gesdinet/jwt-refresh-token-bundle — do NOT recreate/drop it here
        $this->addSql('ALTER TABLE media DROP FOREIGN KEY FK_6A2CA10CA2B28FE8');
        $this->addSql('ALTER TABLE media_tag DROP FOREIGN KEY FK_48D8C57EEA9FDD75');
        $this->addSql('ALTER TABLE media_tag DROP FOREIGN KEY FK_48D8C57E217BBB47');
        $this->addSql('ALTER TABLE media_tag DROP FOREIGN KEY FK_48D8C57EB0156D6A');
        $this->addSql('DROP TABLE media');
        $this->addSql('DROP TABLE media_tag');
        $this->addSql('ALTER TABLE approval_requests CHANGE status status VARCHAR(50) DEFAULT \'pending\' NOT NULL, CHANGE reviewed_at reviewed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE INDEX IDX_approval_entity ON approval_requests (entity_type, entity_id)');
        $this->addSql('CREATE INDEX IDX_approval_status ON approval_requests (status)');
        $this->addSql('ALTER TABLE approval_requests RENAME INDEX idx_e4ae724b85d7fb47 TO IDX_approval_reviewed_by');
        $this->addSql('ALTER TABLE approval_requests RENAME INDEX idx_e4ae724b18c491a5 TO IDX_approval_requested_by');
        $this->addSql('ALTER TABLE audit_logs CHANGE action action VARCHAR(50) NOT NULL, CHANGE created_at created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE INDEX IDX_audit_created_at ON audit_logs (created_at)');
        $this->addSql('CREATE INDEX IDX_audit_entity ON audit_logs (entity_type, entity_id)');
        $this->addSql('CREATE INDEX IDX_audit_action ON audit_logs (action)');
        $this->addSql('CREATE INDEX IDX_audit_user ON audit_logs (user_id)');
        $this->addSql('ALTER TABLE branch_admins RENAME INDEX idx_5781605aa5fb753f TO FK_ba_granted_by');
        $this->addSql('ALTER TABLE branch_admins RENAME INDEX idx_5781605aa76ed395 TO IDX_user');
        $this->addSql('ALTER TABLE branch_admins RENAME INDEX idx_5781605adcd6cc49 TO IDX_branch');
        $this->addSql('ALTER TABLE branches RENAME INDEX idx_d760d16fde12ab56 TO IDX_created_by');
        $this->addSql('ALTER TABLE marriages CHANGE marriage_date_precision marriage_date_precision VARCHAR(255) DEFAULT \'unknown\' NOT NULL, CHANGE divorce_date_precision divorce_date_precision VARCHAR(255) DEFAULT \'unknown\' NOT NULL, CHANGE is_divorced is_divorced TINYINT DEFAULT 0 NOT NULL');
        $this->addSql('CREATE INDEX IDX_marriages_deleted_at ON marriages (deleted_at)');
        $this->addSql('ALTER TABLE marriages RENAME INDEX idx_e1df582ba68a73f9 TO IDX_marriages_spouse2');
        $this->addSql('ALTER TABLE marriages RENAME INDEX idx_e1df582bde12ab56 TO IDX_marriages_created_by');
        $this->addSql('ALTER TABLE marriages RENAME INDEX idx_e1df582bb43fdc17 TO IDX_marriages_spouse1');
        $this->addSql('ALTER TABLE person_branches CHANGE is_primary is_primary TINYINT DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE person_branches RENAME INDEX idx_43267458217bbb47 TO IDX_person');
        $this->addSql('ALTER TABLE person_branches RENAME INDEX idx_43267458dcd6cc49 TO IDX_branch');
        $this->addSql('ALTER TABLE person_names CHANGE name_type name_type VARCHAR(50) DEFAULT \'birth\' NOT NULL');
        $this->addSql('CREATE INDEX IDX_person_names_type ON person_names (name_type)');
        $this->addSql('ALTER TABLE person_names RENAME INDEX idx_5e055684217bbb47 TO IDX_person_names_person');
        $this->addSql('ALTER TABLE persons CHANGE gender gender VARCHAR(50) DEFAULT \'unknown\' NOT NULL, CHANGE birth_date_precision birth_date_precision VARCHAR(50) DEFAULT \'unknown\' NOT NULL, CHANGE death_date_precision death_date_precision VARCHAR(50) DEFAULT \'unknown\' NOT NULL, CHANGE is_living is_living TINYINT DEFAULT 1 NOT NULL, CHANGE visibility visibility VARCHAR(50) DEFAULT \'family\' NOT NULL');
        $this->addSql('CREATE INDEX IDX_deleted_at ON persons (deleted_at)');
        $this->addSql('CREATE INDEX IDX_last_name ON persons (last_name)');
        $this->addSql('ALTER TABLE persons RENAME INDEX idx_a25cc7d3de12ab56 TO IDX_created_by');
        $this->addSql('ALTER TABLE relationships CHANGE type type VARCHAR(50) NOT NULL');
        $this->addSql('ALTER TABLE relationships RENAME INDEX idx_cdf868a7de12ab56 TO FK_rel_created_by');
        $this->addSql('ALTER TABLE relationships RENAME INDEX idx_cdf868a72c402df5 TO IDX_person2');
        $this->addSql('ALTER TABLE relationships RENAME INDEX idx_cdf868a73ef5821b TO IDX_person1');
        $this->addSql('ALTER TABLE relationships RENAME INDEX unique_relationship TO UNIQ_unique_relationship');
        $this->addSql('ALTER TABLE users CHANGE is_active is_active TINYINT DEFAULT 1 NOT NULL');
        $this->addSql('ALTER TABLE users RENAME INDEX uniq_1483a5e9e7927c74 TO UNIQ_email');
    }
}
