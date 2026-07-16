<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\ApprovalRequest;
use App\Enum\ApprovalStatus;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for ApprovalStatus enum and ApprovalRequest entity logic.
 */
class ApprovalWorkflowTest extends TestCase
{
    // ── ApprovalStatus enum ───────────────────────────────────────────────────

    public function testApprovalStatusCasesExist(): void
    {
        $this->assertSame('pending', ApprovalStatus::Pending->value);
        $this->assertSame('approved', ApprovalStatus::Approved->value);
        $this->assertSame('rejected', ApprovalStatus::Rejected->value);
        $this->assertSame('revision_requested', ApprovalStatus::RevisionRequested->value);
    }

    public function testApprovedAndRejectedAreTerminal(): void
    {
        $this->assertTrue(ApprovalStatus::Approved->isTerminal());
        $this->assertTrue(ApprovalStatus::Rejected->isTerminal());
        $this->assertFalse(ApprovalStatus::Pending->isTerminal());
        $this->assertFalse(ApprovalStatus::RevisionRequested->isTerminal());
    }

    public function testAllStatusesHaveLabels(): void
    {
        foreach (ApprovalStatus::cases() as $status) {
            $this->assertNotEmpty($status->label());
        }
    }

    // ── ApprovalRequest entity ────────────────────────────────────────────────

    public function testDefaultStatusIsPending(): void
    {
        $request = new ApprovalRequest();

        $this->assertSame(ApprovalStatus::Pending, $request->getStatus());
        $this->assertTrue($request->isPending());
    }

    public function testUuidIsGeneratedOnConstruction(): void
    {
        $r1 = new ApprovalRequest();
        $r2 = new ApprovalRequest();

        $this->assertNotEmpty($r1->getId());
        $this->assertNotSame($r1->getId(), $r2->getId());
    }

    public function testExplicitIdIsUsed(): void
    {
        $id = '550e8400-e29b-41d4-a716-446655440000';
        $request = new ApprovalRequest($id);

        $this->assertSame($id, $request->getId());
    }

    public function testChangesJsonCanBeSetAndRetrieved(): void
    {
        $request = new ApprovalRequest();
        $changes = ['firstName' => 'Ahmed', 'lastName' => 'Hassan'];
        $request->setChangesJson($changes);

        $this->assertSame($changes, $request->getChangesJson());
    }

    public function testDefaultChangesJsonIsEmpty(): void
    {
        $request = new ApprovalRequest();

        $this->assertSame([], $request->getChangesJson());
    }

    public function testIsPendingReturnsFalseWhenApproved(): void
    {
        $request = new ApprovalRequest();
        $request->setStatus(ApprovalStatus::Approved);

        $this->assertFalse($request->isPending());
    }

    public function testReviewedAtCanBeSet(): void
    {
        $request = new ApprovalRequest();
        $now = new \DateTimeImmutable();
        $request->setReviewedAt($now);

        $this->assertSame($now, $request->getReviewedAt());
    }

    public function testEntityTypeAndIdCanBeSet(): void
    {
        $request = new ApprovalRequest();
        $request->setEntityType('Person');
        $request->setEntityId('some-uuid');

        $this->assertSame('Person', $request->getEntityType());
        $this->assertSame('some-uuid', $request->getEntityId());
    }
}
