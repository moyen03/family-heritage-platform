<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\DTO\RelationshipPathStep;
use App\Entity\Person;
use App\Entity\Relationship;
use App\Enum\RelationshipType;
use App\Repository\RelationshipRepository;
use App\Service\FamilyTreeService;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for FamilyTreeService::findPath() — BFS shortest-path finder.
 */
class RelationshipPathFinderTest extends TestCase
{
    private RelationshipRepository $repo;
    private FamilyTreeService $service;

    protected function setUp(): void
    {
        $this->repo = $this->createStub(RelationshipRepository::class);
        $this->service = new FamilyTreeService($this->repo);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private function makePerson(string $id, string $firstName = 'Person'): Person
    {
        $p = new Person($id);
        $p->setFirstName($firstName);
        $p->setLastName('Test');

        return $p;
    }

    private function makeRelationship(Person $p1, Person $p2, RelationshipType $type): Relationship
    {
        $rel = new Relationship();
        $rel->setPerson1($p1);
        $rel->setPerson2($p2);
        $rel->setType($type);

        return $rel;
    }

    // ── tests ──────────────────────────────────────────────────────────────────

    public function testSamePersonReturnsPathOfOne(): void
    {
        $person = $this->makePerson('a');

        $path = $this->service->findPath($person, $person);

        $this->assertNotNull($path);
        $this->assertCount(1, $path);
        $this->assertSame($person->getId(), $path[0]->person->getId());
        $this->assertNull($path[0]->via);
    }

    public function testDirectRelationshipReturnsPathOfTwo(): void
    {
        $parent = $this->makePerson('parent', 'Parent');
        $child = $this->makePerson('child', 'Child');

        // (parent, child, parent): parent is person1, child is person2
        $rel = $this->makeRelationship($parent, $child, RelationshipType::Parent);

        $this->repo->method('findForPerson')->willReturnCallback(
            function (Person $p) use ($parent, $child, $rel): array {
                if ($p->getId() === $parent->getId() || $p->getId() === $child->getId()) {
                    return [$rel];
                }

                return [];
            }
        );

        $path = $this->service->findPath($parent, $child);

        $this->assertNotNull($path);
        $this->assertCount(2, $path);
        $this->assertSame($parent->getId(), $path[0]->person->getId());
        $this->assertNull($path[0]->via);
        $this->assertSame($child->getId(), $path[1]->person->getId());
        $this->assertSame('parent', $path[1]->via); // from parent's perspective
    }

    public function testDistanceIsOneForDirectRelationship(): void
    {
        $a = $this->makePerson('a');
        $b = $this->makePerson('b');
        $rel = $this->makeRelationship($a, $b, RelationshipType::Sibling);

        $this->repo->method('findForPerson')->willReturn([$rel]);

        $path = $this->service->findPath($a, $b);

        $this->assertNotNull($path);
        $this->assertSame(1, count($path) - 1); // distance = steps = count - 1
    }

    public function testPathThroughIntermediaryHasDistanceTwo(): void
    {
        $grandparent = $this->makePerson('gp');
        $parent = $this->makePerson('parent');
        $child = $this->makePerson('child');

        $rel1 = $this->makeRelationship($grandparent, $parent, RelationshipType::Parent);
        $rel2 = $this->makeRelationship($parent, $child, RelationshipType::Parent);

        $this->repo->method('findForPerson')->willReturnCallback(
            function (Person $p) use ($grandparent, $parent, $child, $rel1, $rel2): array {
                return match ($p->getId()) {
                    $grandparent->getId() => [$rel1],
                    $parent->getId() => [$rel1, $rel2],
                    $child->getId() => [$rel2],
                    default => [],
                };
            }
        );

        $path = $this->service->findPath($grandparent, $child);

        $this->assertNotNull($path);
        $this->assertCount(3, $path);
        $this->assertSame(2, count($path) - 1);
        $this->assertSame($grandparent->getId(), $path[0]->person->getId());
        $this->assertSame($parent->getId(), $path[1]->person->getId());
        $this->assertSame($child->getId(), $path[2]->person->getId());
    }

    public function testNoConnectionReturnsNull(): void
    {
        $a = $this->makePerson('a');
        $b = $this->makePerson('b');

        // No relationships at all
        $this->repo->method('findForPerson')->willReturn([]);

        $path = $this->service->findPath($a, $b);

        $this->assertNull($path);
    }

    public function testInverseRelationshipLabelIsCorrect(): void
    {
        // If rel is (parent, child, parent), then from child's perspective via = "child"
        $parent = $this->makePerson('parent');
        $child = $this->makePerson('child');

        $rel = $this->makeRelationship($parent, $child, RelationshipType::Parent);

        $this->repo->method('findForPerson')->willReturn([$rel]);

        // Search from child TO parent
        $path = $this->service->findPath($child, $parent);

        $this->assertNotNull($path);
        $this->assertCount(2, $path);
        // child is person2 in the relationship, so from child's perspective the rel inverse is "child"
        $this->assertSame('child', $path[1]->via);
    }

    public function testCyclicDataDoesNotLoopForever(): void
    {
        $a = $this->makePerson('a');
        $b = $this->makePerson('b');
        $c = $this->makePerson('c-unrelated');

        $relAB = $this->makeRelationship($a, $b, RelationshipType::Sibling);

        // a↔b exist, c is isolated — findPath(a, c) should return null, not loop
        $this->repo->method('findForPerson')->willReturnCallback(
            function (Person $p) use ($a, $b, $relAB): array {
                if ($p->getId() === $a->getId() || $p->getId() === $b->getId()) {
                    return [$relAB];
                }

                return [];
            }
        );

        $path = $this->service->findPath($a, $c, 5);

        $this->assertNull($path);
    }

    public function testPathStepsImplementCorrectDto(): void
    {
        $a = $this->makePerson('a');
        $b = $this->makePerson('b');
        $rel = $this->makeRelationship($a, $b, RelationshipType::Sibling);

        $this->repo->method('findForPerson')->willReturn([$rel]);

        $path = $this->service->findPath($a, $b);

        $this->assertNotNull($path);
        $this->assertContainsOnlyInstancesOf(RelationshipPathStep::class, $path);
    }
}
