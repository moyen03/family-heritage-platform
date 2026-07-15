-- ============================================================
-- Family Heritage Platform – Initial Database Schema
-- Phase 1: Foundation Tables
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id`                   CHAR(36)        NOT NULL,
    `email`                VARCHAR(255)    NOT NULL,
    `password_hash`        VARCHAR(255)    NOT NULL,
    `role`                 ENUM('super_admin','branch_admin','member','viewer') NOT NULL DEFAULT 'member',
    `first_name`           VARCHAR(100)    NOT NULL,
    `last_name`            VARCHAR(100)    NOT NULL,
    `is_active`            TINYINT(1)      NOT NULL DEFAULT 1,
    `email_verified_at`    DATETIME        NULL,
    `last_login_at`        DATETIME        NULL,
    `created_at`           DATETIME        NOT NULL,
    `updated_at`           DATETIME        NOT NULL,
    `deleted_at`           DATETIME        NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UNIQ_email` (`email`),
    KEY `IDX_role` (`role`),
    KEY `IDX_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS `branches` (
    `id`             CHAR(36)        NOT NULL,
    `name`           VARCHAR(255)    NOT NULL,
    `description`    TEXT            NULL,
    `created_by`     CHAR(36)        NOT NULL,
    `created_at`     DATETIME        NOT NULL,
    `updated_at`     DATETIME        NOT NULL,
    `deleted_at`     DATETIME        NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_created_by` (`created_by`),
    CONSTRAINT `FK_branches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `branch_admins` (
    `branch_id`     CHAR(36)    NOT NULL,
    `user_id`       CHAR(36)    NOT NULL,
    `granted_at`    DATETIME    NOT NULL,
    `granted_by`    CHAR(36)    NOT NULL,
    PRIMARY KEY (`branch_id`, `user_id`),
    CONSTRAINT `FK_branch_admins_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
    CONSTRAINT `FK_branch_admins_user`   FOREIGN KEY (`user_id`)   REFERENCES `users` (`id`),
    CONSTRAINT `FK_branch_admins_granter` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PERSONS
-- ============================================================

CREATE TABLE IF NOT EXISTS `persons` (
    `id`                    CHAR(36)        NOT NULL,
    `first_name`            VARCHAR(100)    NOT NULL,
    `middle_name`           VARCHAR(100)    NULL,
    `last_name`             VARCHAR(100)    NOT NULL,
    `maiden_name`           VARCHAR(100)    NULL,
    `gender`                ENUM('male','female','other','unknown') NOT NULL DEFAULT 'unknown',
    `birth_date`            DATE            NULL,
    `birth_date_precision`  ENUM('exact','year','approximate','unknown') NOT NULL DEFAULT 'unknown',
    `birth_place`           VARCHAR(255)    NULL,
    `death_date`            DATE            NULL,
    `death_date_precision`  ENUM('exact','year','approximate','unknown') NOT NULL DEFAULT 'unknown',
    `death_place`           VARCHAR(255)    NULL,
    `is_living`             TINYINT(1)      NOT NULL DEFAULT 1,
    `biography`             TEXT            NULL,
    `visibility`            ENUM('public','family','branch','private') NOT NULL DEFAULT 'family',
    `created_by`            CHAR(36)        NOT NULL,
    `created_at`            DATETIME        NOT NULL,
    `updated_at`            DATETIME        NOT NULL,
    `deleted_at`            DATETIME        NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_last_name` (`last_name`),
    KEY `IDX_is_living` (`is_living`),
    KEY `IDX_deleted_at` (`deleted_at`),
    FULLTEXT KEY `FT_name` (`first_name`, `last_name`, `maiden_name`),
    CONSTRAINT `FK_persons_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `person_branches` (
    `person_id`     CHAR(36)    NOT NULL,
    `branch_id`     CHAR(36)    NOT NULL,
    `is_primary`    TINYINT(1)  NOT NULL DEFAULT 0,
    PRIMARY KEY (`person_id`, `branch_id`),
    CONSTRAINT `FK_person_branches_person` FOREIGN KEY (`person_id`) REFERENCES `persons` (`id`),
    CONSTRAINT `FK_person_branches_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RELATIONSHIPS (graph model)
-- ============================================================

CREATE TABLE IF NOT EXISTS `relationships` (
    `id`          CHAR(36)    NOT NULL,
    `person1_id`  CHAR(36)    NOT NULL,
    `person2_id`  CHAR(36)    NOT NULL,
    `type`        ENUM('parent','child','sibling','half_sibling','step_parent','step_child','adopted_parent','adopted_child','guardian','foster_parent') NOT NULL,
    `notes`       TEXT        NULL,
    `created_by`  CHAR(36)    NOT NULL,
    `created_at`  DATETIME    NOT NULL,
    `updated_at`  DATETIME    NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UNIQ_relationship` (`person1_id`, `person2_id`, `type`),
    KEY `IDX_person1` (`person1_id`),
    KEY `IDX_person2` (`person2_id`),
    CONSTRAINT `FK_rel_person1`     FOREIGN KEY (`person1_id`) REFERENCES `persons` (`id`),
    CONSTRAINT `FK_rel_person2`     FOREIGN KEY (`person2_id`) REFERENCES `persons` (`id`),
    CONSTRAINT `FK_rel_created_by`  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `marriages` (
    `id`                      CHAR(36)    NOT NULL,
    `spouse1_id`              CHAR(36)    NOT NULL,
    `spouse2_id`              CHAR(36)    NOT NULL,
    `marriage_date`           DATE        NULL,
    `marriage_date_precision` ENUM('exact','year','approximate','unknown') NOT NULL DEFAULT 'unknown',
    `marriage_place`          VARCHAR(255) NULL,
    `divorce_date`            DATE        NULL,
    `divorce_date_precision`  ENUM('exact','year','approximate','unknown') NOT NULL DEFAULT 'unknown',
    `is_divorced`             TINYINT(1)  NOT NULL DEFAULT 0,
    `notes`                   TEXT        NULL,
    `created_at`              DATETIME    NOT NULL,
    `updated_at`              DATETIME    NOT NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_spouse1` (`spouse1_id`),
    KEY `IDX_spouse2` (`spouse2_id`),
    CONSTRAINT `FK_marriages_spouse1` FOREIGN KEY (`spouse1_id`) REFERENCES `persons` (`id`),
    CONSTRAINT `FK_marriages_spouse2` FOREIGN KEY (`spouse2_id`) REFERENCES `persons` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id`           CHAR(36)        NOT NULL,
    `user_id`      CHAR(36)        NULL,
    `action`       ENUM('created','updated','deleted','restored','approved','rejected') NOT NULL,
    `entity_type`  VARCHAR(100)    NOT NULL,
    `entity_id`    CHAR(36)        NOT NULL,
    `old_values`   JSON            NULL,
    `new_values`   JSON            NULL,
    `ip_address`   VARCHAR(45)     NULL,
    `user_agent`   TEXT            NULL,
    `created_at`   DATETIME        NOT NULL,
    PRIMARY KEY (`id`),
    KEY `IDX_entity` (`entity_type`, `entity_id`),
    KEY `IDX_user` (`user_id`),
    KEY `IDX_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- JWT REFRESH TOKENS (gesdinet/jwt-refresh-token-bundle)
-- ============================================================

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `id`            INT             NOT NULL AUTO_INCREMENT,
    `refresh_token` VARCHAR(128)    NOT NULL,
    `username`      VARCHAR(255)    NOT NULL,
    `valid`         DATETIME        NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UNIQ_refresh_token` (`refresh_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

