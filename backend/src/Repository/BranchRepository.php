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
     * Branches the user can access: either they are a branch admin or have any membership row.
     *
     * @return Branch[]
     */
    public function findAccessibleForUser(User $user): array
    {
        // Branches where user is in branch_admins table
        $adminBranchIds = $this->createQueryBuilder('b')
            ->select('b.id')
            ->join('b.admins', 'ba')
            ->where('ba.user = :user')
            ->andWhere('b.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleColumnResult();

        // Branches where user has any branch_memberships row
        $memberBranchIds = $this->createQueryBuilder('b')
            ->select('b.id')
            ->join('b.memberships', 'bm')
            ->where('bm.user = :user')
            ->andWhere('b.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleColumnResult();

        $ids = array_unique(array_merge($adminBranchIds, $memberBranchIds));

        if (empty($ids)) {
            return [];
        }

        return $this->createQueryBuilder('b')
            ->where('b.id IN (:ids)')
            ->andWhere('b.deletedAt IS NULL')
            ->orderBy('b.name', 'ASC')
            ->setParameter('ids', $ids)
            ->getQuery()
            ->getResult();
    }

    /**
     * Branch IDs where user is an admin (via branch_admins table).
     *
     * @return string[]
     */
    public function findAdminBranchIdsForUser(User $user): array
    {
        return $this->createQueryBuilder('b')
            ->select('b.id')
            ->join('b.admins', 'ba')
            ->where('ba.user = :user')
            ->andWhere('b.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleColumnResult();
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
