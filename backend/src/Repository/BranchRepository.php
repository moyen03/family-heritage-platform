<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Branch;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Branch>
 */
class BranchRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Branch::class);
    }

    /**
     * @return Branch[]
     */
    public function findByAdmin(User $user): array
    {
        return $this->createQueryBuilder('b')
            ->join('b.admins', 'ba')
            ->where('ba.user = :user')
            ->andWhere('b.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Branch[]
     */
    public function findAllActive(): array
    {
        return $this->createQueryBuilder('b')
            ->where('b.deletedAt IS NULL')
            ->orderBy('b.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}

