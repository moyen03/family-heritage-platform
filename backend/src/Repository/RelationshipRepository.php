<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Person;
use App\Entity\Relationship;
use App\Enum\RelationshipType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Relationship>
 */
class RelationshipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Relationship::class);
    }

    /**
     * Get all relationships for a person (both directions).
     *
     * @return Relationship[]
     */
    public function findForPerson(Person $person): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.person1 = :person OR r.person2 = :person')
            ->setParameter('person', $person)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get parents of a person.
     *
     * @return Relationship[]
     */
    public function findParents(Person $person): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.person2 = :person')
            ->andWhere('r.type IN (:types)')
            ->setParameter('person', $person)
            ->setParameter('types', [
                RelationshipType::Parent,
                RelationshipType::AdoptedParent,
                RelationshipType::StepParent,
                RelationshipType::Guardian,
                RelationshipType::FosterParent,
            ])
            ->getQuery()
            ->getResult();
    }

    /**
     * Get children of a person.
     *
     * Model: (person1=Parent, person2=Child, type=parent)
     * So to find children of X: look for person1=X with a parent-type.
     * person2 of each returned relationship is the child.
     *
     * @return Relationship[]
     */
    public function findChildren(Person $person): array
    {
        return $this->createQueryBuilder('r')
            ->where('r.person1 = :person')
            ->andWhere('r.type IN (:types)')
            ->setParameter('person', $person)
            ->setParameter('types', [
                RelationshipType::Parent,
                RelationshipType::AdoptedParent,
                RelationshipType::StepParent,
                RelationshipType::Guardian,
                RelationshipType::FosterParent,
            ])
            ->getQuery()
            ->getResult();
    }

    /**
     * Check if a relationship already exists.
     */
    public function relationshipExists(Person $person1, Person $person2, RelationshipType $type): bool
    {
        $count = $this->createQueryBuilder('r')
            ->select('COUNT(r.id)')
            ->where('r.person1 = :p1 AND r.person2 = :p2 AND r.type = :type')
            ->setParameter('p1', $person1)
            ->setParameter('p2', $person2)
            ->setParameter('type', $type)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $count > 0;
    }
}
