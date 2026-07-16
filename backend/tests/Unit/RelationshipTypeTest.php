<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Enum\RelationshipType;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the RelationshipType graph model — every inverse must be consistent.
 */
class RelationshipTypeTest extends TestCase
{
    public function testParentChildInverseIsSymmetric(): void
    {
        $this->assertSame(RelationshipType::Child, RelationshipType::Parent->inverse());
        $this->assertSame(RelationshipType::Parent, RelationshipType::Child->inverse());
    }

    public function testStepRelationshipsAreSymmetric(): void
    {
        $this->assertSame(RelationshipType::StepChild, RelationshipType::StepParent->inverse());
        $this->assertSame(RelationshipType::StepParent, RelationshipType::StepChild->inverse());
    }

    public function testAdoptedRelationshipsAreSymmetric(): void
    {
        $this->assertSame(RelationshipType::AdoptedChild, RelationshipType::AdoptedParent->inverse());
        $this->assertSame(RelationshipType::AdoptedParent, RelationshipType::AdoptedChild->inverse());
    }

    public function testSiblingInverseIsSelf(): void
    {
        $this->assertSame(RelationshipType::Sibling, RelationshipType::Sibling->inverse());
        $this->assertSame(RelationshipType::HalfSibling, RelationshipType::HalfSibling->inverse());
    }

    public function testGuardianAndFosterParentInverseIsSelf(): void
    {
        $this->assertSame(RelationshipType::Guardian, RelationshipType::Guardian->inverse());
        $this->assertSame(RelationshipType::FosterParent, RelationshipType::FosterParent->inverse());
    }

    public function testDoubleInverseAlwaysReturnsSameType(): void
    {
        foreach (RelationshipType::cases() as $type) {
            $this->assertSame(
                $type,
                $type->inverse()->inverse(),
                sprintf('Double inverse of %s should return itself', $type->value)
            );
        }
    }

    public function testAllCasesHaveInverse(): void
    {
        foreach (RelationshipType::cases() as $type) {
            $inverse = $type->inverse();
            $this->assertInstanceOf(RelationshipType::class, $inverse);
        }
    }
}
