<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Person;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Person>
 */
class PersonRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Person::class);
    }

    /**
     * @return Person[]
     */
    public function findAllActive(): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.deletedAt IS NULL')
            ->orderBy('p.lastName', 'ASC')
            ->addOrderBy('p.firstName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Search persons by name.
     *
     * @return Person[]
     */
    public function searchByName(string $query): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.deletedAt IS NULL')
            ->andWhere(
                'LOWER(p.firstName) LIKE :query OR LOWER(p.lastName) LIKE :query OR LOWER(p.maidenName) LIKE :query'
            )
            ->setParameter('query', '%' . strtolower($query) . '%')
            ->orderBy('p.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find persons belonging to a specific branch.
     *
     * @return Person[]
     */
    public function findByBranch(string $branchId): array
    {
        return $this->createQueryBuilder('p')
            ->join('p.personBranches', 'pb')
            ->where('pb.branch = :branchId')
            ->andWhere('p.deletedAt IS NULL')
            ->setParameter('branchId', $branchId)
            ->orderBy('p.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
