<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Marriage;
use App\Enum\DatePrecision;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Marriage entity business logic.
 */
class MarriageTest extends TestCase
{
    public function testDefaultValuesOnConstruction(): void
    {
        $marriage = new Marriage();

        $this->assertFalse($marriage->isDivorced());
        $this->assertNull($marriage->getMarriageDate());
        $this->assertNull($marriage->getDivorceDate());
        $this->assertNull($marriage->getMarriagePlace());
        $this->assertNull($marriage->getNotes());
        $this->assertSame(DatePrecision::Unknown, $marriage->getMarriageDatePrecision());
        $this->assertSame(DatePrecision::Unknown, $marriage->getDivorceDatePrecision());
    }

    public function testIdIsGeneratedOnConstruction(): void
    {
        $m1 = new Marriage();
        $m2 = new Marriage();

        $this->assertNotEmpty($m1->getId());
        $this->assertNotEmpty($m2->getId());
        $this->assertNotSame($m1->getId(), $m2->getId());
    }

    public function testSettingDivorceDateAutomaticallySetsIsDivorced(): void
    {
        $marriage = new Marriage();
        $this->assertFalse($marriage->isDivorced());

        $marriage->setDivorceDate(new \DateTimeImmutable('2020-01-01'));

        $this->assertTrue($marriage->isDivorced());
        $this->assertInstanceOf(\DateTimeInterface::class, $marriage->getDivorceDate());
    }

    public function testSettingDivorceDateToNullDoesNotClearIsDivorced(): void
    {
        $marriage = new Marriage();
        $marriage->setDivorceDate(new \DateTimeImmutable('2020-01-01'));
        $marriage->setDivorceDate(null);

        // Once divorced, the flag stays (date can be unknown but status remains)
        $this->assertTrue($marriage->isDivorced());
        $this->assertNull($marriage->getDivorceDate());
    }

    public function testMarriagePlaceAndNotesCanBeSet(): void
    {
        $marriage = new Marriage();
        $marriage->setMarriagePlace('Paris, France');
        $marriage->setNotes('Church ceremony');

        $this->assertSame('Paris, France', $marriage->getMarriagePlace());
        $this->assertSame('Church ceremony', $marriage->getNotes());
    }

    public function testMarriageDatePrecision(): void
    {
        $marriage = new Marriage();
        $marriage->setMarriageDatePrecision(DatePrecision::Year);

        $this->assertSame(DatePrecision::Year, $marriage->getMarriageDatePrecision());
    }

    public function testExplicitIdIsUsedWhenProvided(): void
    {
        $id = '550e8400-e29b-41d4-a716-446655440000';
        $marriage = new Marriage($id);

        $this->assertSame($id, $marriage->getId());
    }
}
