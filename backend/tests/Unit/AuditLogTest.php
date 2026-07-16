<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\AuditLog;
use App\Enum\AuditAction;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for AuditAction enum and AuditLog entity.
 */
class AuditLogTest extends TestCase
{
    public function testAuditActionCasesExist(): void
    {
        $this->assertSame('created', AuditAction::Created->value);
        $this->assertSame('updated', AuditAction::Updated->value);
        $this->assertSame('deleted', AuditAction::Deleted->value);
        $this->assertSame('restored', AuditAction::Restored->value);
        $this->assertSame('approved', AuditAction::Approved->value);
        $this->assertSame('rejected', AuditAction::Rejected->value);
    }

    public function testAuditLogConstructorSetsAllFields(): void
    {
        $id = 'test-uuid-1234';
        $log = new AuditLog(
            id: $id,
            action: AuditAction::Created,
            entityType: 'Person',
            entityId: 'person-uuid',
            userId: 'user-uuid',
            oldValues: null,
            newValues: ['firstName' => 'Ahmed'],
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
        );

        $this->assertSame($id, $log->getId());
        $this->assertSame(AuditAction::Created, $log->getAction());
        $this->assertSame('Person', $log->getEntityType());
        $this->assertSame('person-uuid', $log->getEntityId());
        $this->assertSame('user-uuid', $log->getUserId());
        $this->assertNull($log->getOldValues());
        $this->assertSame(['firstName' => 'Ahmed'], $log->getNewValues());
        $this->assertSame('127.0.0.1', $log->getIpAddress());
        $this->assertSame('Mozilla/5.0', $log->getUserAgent());
    }

    public function testAuditLogCreatedAtIsSetOnConstruction(): void
    {
        $before = new \DateTimeImmutable();
        $log = new AuditLog('id', AuditAction::Deleted, 'Relationship', 'rel-uuid');
        $after = new \DateTimeImmutable();

        $this->assertGreaterThanOrEqual($before->getTimestamp(), $log->getCreatedAt()->getTimestamp());
        $this->assertLessThanOrEqual($after->getTimestamp(), $log->getCreatedAt()->getTimestamp());
    }

    public function testCreatedAtIsoFormatsCorrectly(): void
    {
        $log = new AuditLog('id', AuditAction::Updated, 'Person', 'pid');
        $iso = $log->getCreatedAtIso();

        // Should parse as a valid ISO 8601 datetime
        $this->assertNotFalse(\DateTimeImmutable::createFromFormat(\DateTimeInterface::ATOM, $iso));
    }

    public function testNullableFieldsDefaultToNull(): void
    {
        $log = new AuditLog('id', AuditAction::Created, 'Marriage', 'marriage-uuid');

        $this->assertNull($log->getUserId());
        $this->assertNull($log->getOldValues());
        $this->assertNull($log->getNewValues());
        $this->assertNull($log->getIpAddress());
        $this->assertNull($log->getUserAgent());
    }

    public function testAllSixActionsCovered(): void
    {
        $this->assertCount(6, AuditAction::cases());
    }
}
