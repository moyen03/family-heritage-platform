<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\BranchInvitation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<BranchInvitation> */
class BranchInvitationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BranchInvitation::class);
    }

    public function findByToken(string $token): ?BranchInvitation
    {
        return $this->findOneBy(['token' => $token]);
    }
}
