<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Marriage;
use App\Entity\Person;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Marriage>
 */
class MarriageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Marriage::class);
    }

    /**
     * Get all marriages for a person (as either spouse).
     *
     * @return Marriage[]
     */
    public function findForPerson(Person $person): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.spouse1 = :person OR m.spouse2 = :person')
            ->setParameter('person', $person)
            ->orderBy('m.marriageDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Check if an active (non-divorced) marriage already exists between two persons.
     */
    public function activeMarriageExists(Person $spouse1, Person $spouse2): bool
    {
        $count = $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where(
                '(m.spouse1 = :s1 AND m.spouse2 = :s2) OR (m.spouse1 = :s2 AND m.spouse2 = :s1)'
            )
            ->andWhere('m.isDivorced = false')
            ->setParameter('s1', $spouse1)
            ->setParameter('s2', $spouse2)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $count > 0;
    }
}
