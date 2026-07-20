<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\BranchMembership;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BranchMembership>
 */
class BranchMembershipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BranchMembership::class);
    }

    /**
     * Returns the IDs of all branches this user is a member of.
     *
     * @return string[]
     */
    public function getBranchIdsForUser(string $userId): array
    {
        $rows = $this->createQueryBuilder('bm')
            ->select('IDENTITY(bm.branch) AS branchId')
            ->where('IDENTITY(bm.user) = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->getScalarResult();

        return array_column($rows, 'branchId');
    }
}
