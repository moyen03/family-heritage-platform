<?php

declare(strict_types=1);

/**
 * PHPStan Doctrine Object Manager Loader
 *
 * Creates a Doctrine EntityManager backed by SQLite in-memory so PHPStan
 * can introspect entity metadata without needing a real database connection.
 */

use Doctrine\DBAL\DriverManager;
use Doctrine\ORM\EntityManager;
use Doctrine\ORM\ORMSetup;

require_once __DIR__ . '/vendor/autoload.php';

$config = ORMSetup::createAttributeMetadataConfiguration(
    paths: [__DIR__ . '/src/Entity'],
    isDevMode: true,
);

$connection = DriverManager::getConnection([
    'driver' => 'pdo_sqlite',
    'memory' => true,
], $config);

return new EntityManager($connection, $config);
