-- MySQL initialization script for Family Heritage Platform
-- This runs once when the MySQL container is first created

CREATE DATABASE IF NOT EXISTS family_heritage
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS family_heritage_test
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE family_heritage;

