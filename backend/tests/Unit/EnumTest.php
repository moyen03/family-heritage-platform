<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Enum\DatePrecision;
use App\Enum\Gender;
use App\Enum\NameType;
use App\Enum\RelationshipType;
use App\Enum\UserRole;
use App\Enum\Visibility;
use PHPUnit\Framework\TestCase;

/**
 * Basic smoke tests for all Enum classes.
 * Ensures every enum value is defined and its label/helper methods work.
 */
class EnumTest extends TestCase
{
    public function testGenderCasesExist(): void
    {
        $this->assertSame('male', Gender::Male->value);
        $this->assertSame('female', Gender::Female->value);
        $this->assertSame('other', Gender::Other->value);
        $this->assertSame('unknown', Gender::Unknown->value);
    }

    public function testDatePrecisionCasesExist(): void
    {
        $this->assertSame('exact', DatePrecision::Exact->value);
        $this->assertSame('year', DatePrecision::Year->value);
        $this->assertSame('approximate', DatePrecision::Approximate->value);
        $this->assertSame('unknown', DatePrecision::Unknown->value);
    }

    public function testVisibilityCasesExist(): void
    {
        $this->assertSame('public', Visibility::Public->value);
        $this->assertSame('family', Visibility::Family->value);
        $this->assertSame('branch', Visibility::Branch->value);
        $this->assertSame('private', Visibility::Private->value);
    }

    public function testNameTypeCasesExist(): void
    {
        $this->assertSame('birth', NameType::Birth->value);
        $this->assertSame('nickname', NameType::Nickname->value);
        $this->assertSame('title', NameType::Title->value);
        $this->assertSame('alias', NameType::Alias->value);
        $this->assertSame('married', NameType::Married->value);
    }

    public function testNameTypeLabelReturnsString(): void
    {
        foreach (NameType::cases() as $case) {
            $this->assertNotEmpty($case->label());
        }
    }

    public function testUserRoleCasesExist(): void
    {
        $this->assertSame('super_admin', UserRole::SuperAdmin->value);
        $this->assertSame('branch_admin', UserRole::BranchAdmin->value);
        $this->assertSame('member', UserRole::Member->value);
        $this->assertSame('viewer', UserRole::Viewer->value);
    }

    public function testUserRoleSymfonyRoleMapping(): void
    {
        $this->assertSame('ROLE_SUPER_ADMIN', UserRole::SuperAdmin->symfonyRole());
        $this->assertSame('ROLE_BRANCH_ADMIN', UserRole::BranchAdmin->symfonyRole());
        $this->assertSame('ROLE_MEMBER', UserRole::Member->symfonyRole());
        $this->assertSame('ROLE_VIEWER', UserRole::Viewer->symfonyRole());
    }

    public function testRelationshipTypeHasInverse(): void
    {
        $this->assertSame(RelationshipType::Child, RelationshipType::Parent->inverse());
        $this->assertSame(RelationshipType::Parent, RelationshipType::Child->inverse());
        $this->assertSame(RelationshipType::Sibling, RelationshipType::Sibling->inverse());
    }
}
