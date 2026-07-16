<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\DTO\PersonTreeNode;
use App\Entity\Person;
use App\Entity\Relationship;
use App\Enum\RelationshipType;
use App\Repository\RelationshipRepository;
use App\Service\FamilyTreeService;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for FamilyTreeService BFS traversal.
 * Uses mocked RelationshipRepository — no DB needed.
 */
class FamilyTreeServiceTest extends TestCase
{
    private RelationshipRepository $repo;
    private FamilyTreeService $service;

    protected function setUp(): void
    {
        $this->repo = $this->createStub(RelationshipRepository::class);
        $this->service = new FamilyTreeService($this->repo);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private function makePerson(string $id, string $firstName = 'Test'): Person
    {
        $p = new Person($id);
        $p->setFirstName($firstName);
        $p->setLastName('Person');

        return $p;
    }

    private function makeRelationship(Person $person1, Person $person2, RelationshipType $type): Relationship
    {
        $rel = new Relationship();
        $rel->setPerson1($person1);
        $rel->setPerson2($person2);
        $rel->setType($type);

        return $rel;
    }

    // ── ancestor tests ─────────────────────────────────────────────────────────

    public function testGetAncestorsWithNoParentsReturnsEmpty(): void
    {
        $person = $this->makePerson('child-1');

        $this->repo->method('findParents')->willReturn([]);

        $result = $this->service->getAncestors($person);

        $this->assertSame([], $result);
    }

    public function testGetAncestorsReturnsParentsAtGenerationOne(): void
    {
        $child = $this->makePerson('child-1', 'Child');
        $father = $this->makePerson('father-1', 'Father');
        $mother = $this->makePerson('mother-1', 'Mother');

        $relFather = $this->makeRelationship($father, $child, RelationshipType::Parent);
        $relMother = $this->makeRelationship($mother, $child, RelationshipType::Parent);

        $this->repo->method('findParents')->willReturnCallback(function (Person $p) use ($child, $relFather, $relMother): array {
            return $p->getId() === $child->getId() ? [$relFather, $relMother] : [];
        });

        $result = $this->service->getAncestors($child, 1);

        $this->assertCount(2, $result);
        $this->assertContainsOnlyInstancesOf(PersonTreeNode::class, $result);
        $this->assertSame(1, $result[0]->generation);
        $this->assertSame(1, $result[1]->generation);
    }

    public function testGetAncestorsReturnsGrandparentsAtGenerationTwo(): void
    {
        $child = $this->makePerson('child-1');
        $father = $this->makePerson('father-1');
        $grandfather = $this->makePerson('gf-1');

        $relFather = $this->makeRelationship($father, $child, RelationshipType::Parent);
        $relGrandfather = $this->makeRelationship($grandfather, $father, RelationshipType::Parent);

        $this->repo->method('findParents')->willReturnCallback(
            function (Person $p) use ($child, $father, $relFather, $relGrandfather): array {
                if ($p->getId() === $child->getId()) {
                    return [$relFather];
                }
                if ($p->getId() === $father->getId()) {
                    return [$relGrandfather];
                }

                return [];
            }
        );

        $result = $this->service->getAncestors($child, 2);

        $this->assertCount(2, $result);
        $this->assertSame(1, $result[0]->generation); // father
        $this->assertSame(2, $result[1]->generation); // grandfather
    }

    public function testGetAncestorsRespectsMaxDepth(): void
    {
        $child = $this->makePerson('child-1');
        $parent = $this->makePerson('parent-1');
        $grandparent = $this->makePerson('gp-1');

        $relParent = $this->makeRelationship($parent, $child, RelationshipType::Parent);
        $relGrandparent = $this->makeRelationship($grandparent, $parent, RelationshipType::Parent);

        $this->repo->method('findParents')->willReturnCallback(
            function (Person $p) use ($child, $parent, $relParent, $relGrandparent): array {
                if ($p->getId() === $child->getId()) {
                    return [$relParent];
                }
                if ($p->getId() === $parent->getId()) {
                    return [$relGrandparent];
                }

                return [];
            }
        );

        $result = $this->service->getAncestors($child, 1); // max depth 1

        $this->assertCount(1, $result);
        $this->assertSame(1, $result[0]->generation);
    }

    public function testGetAncestorsPreventsInfiniteLoopOnCyclicData(): void
    {
        // Corrupt data: A's parent is B, B's parent is A
        $personA = $this->makePerson('a');
        $personB = $this->makePerson('b');

        $relAB = $this->makeRelationship($personB, $personA, RelationshipType::Parent);
        $relBA = $this->makeRelationship($personA, $personB, RelationshipType::Parent);

        $this->repo->method('findParents')->willReturnCallback(
            function (Person $p) use ($personA, $personB, $relAB, $relBA): array {
                if ($p->getId() === $personA->getId()) {
                    return [$relAB];
                }
                if ($p->getId() === $personB->getId()) {
                    return [$relBA];
                }

                return [];
            }
        );

        $result = $this->service->getAncestors($personA, 10);

        // Should not loop forever; only B is added once
        $this->assertCount(1, $result);
    }

    // ── descendant tests ───────────────────────────────────────────────────────

    public function testGetDescendantsWithNoChildrenReturnsEmpty(): void
    {
        $person = $this->makePerson('root-1');

        $this->repo->method('findChildren')->willReturn([]);

        $result = $this->service->getDescendants($person);

        $this->assertSame([], $result);
    }

    public function testGetDescendantsReturnsChildrenAtGenerationOne(): void
    {
        $parent = $this->makePerson('parent-1');
        $child1 = $this->makePerson('child-1');
        $child2 = $this->makePerson('child-2');

        // Model: (person1=parent, person2=child, type=parent)
        $rel1 = $this->makeRelationship($parent, $child1, RelationshipType::Parent);
        $rel2 = $this->makeRelationship($parent, $child2, RelationshipType::Parent);

        $this->repo->method('findChildren')->willReturnCallback(
            function (Person $p) use ($parent, $rel1, $rel2): array {
                return $p->getId() === $parent->getId() ? [$rel1, $rel2] : [];
            }
        );

        $result = $this->service->getDescendants($parent, 1);

        $this->assertCount(2, $result);
        $this->assertSame(1, $result[0]->generation);
    }

    public function testGetDescendantsReturnsGrandchildrenAtGenerationTwo(): void
    {
        $grandparent = $this->makePerson('gp');
        $parent = $this->makePerson('parent');
        $child = $this->makePerson('child');

        $relParent = $this->makeRelationship($grandparent, $parent, RelationshipType::Parent);
        $relChild = $this->makeRelationship($parent, $child, RelationshipType::Parent);

        $this->repo->method('findChildren')->willReturnCallback(
            function (Person $p) use ($grandparent, $parent, $relParent, $relChild): array {
                if ($p->getId() === $grandparent->getId()) {
                    return [$relParent];
                }
                if ($p->getId() === $parent->getId()) {
                    return [$relChild];
                }

                return [];
            }
        );

        $result = $this->service->getDescendants($grandparent, 2);

        $this->assertCount(2, $result);
        $this->assertSame(1, $result[0]->generation);
        $this->assertSame(2, $result[1]->generation);
    }

    public function testGetDescendantsRespectsMaxDepth(): void
    {
        $root = $this->makePerson('root');
        $child = $this->makePerson('child');
        $grandchild = $this->makePerson('grandchild');

        $relChild = $this->makeRelationship($root, $child, RelationshipType::Parent);
        $relGrandchild = $this->makeRelationship($child, $grandchild, RelationshipType::Parent);

        $this->repo->method('findChildren')->willReturnCallback(
            function (Person $p) use ($root, $child, $relChild, $relGrandchild): array {
                if ($p->getId() === $root->getId()) {
                    return [$relChild];
                }
                if ($p->getId() === $child->getId()) {
                    return [$relGrandchild];
                }

                return [];
            }
        );

        $result = $this->service->getDescendants($root, 1);

        $this->assertCount(1, $result);
    }
}
