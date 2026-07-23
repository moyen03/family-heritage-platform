<?php

declare(strict_types=1);

namespace App\Doctrine\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Person;
use App\Entity\User;
use App\Enum\Visibility;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchMembershipRepository;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final class PersonVisibilityExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private readonly Security $security,
        private readonly BranchMembershipRepository $membershipRepo,
        private readonly BranchAdminRepository $branchAdminRepo,
    ) {
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        Operation $operation = null,
        array $context = [],
    ): void {
        if ($resourceClass !== Person::class) {
            return;
        }
        $this->addFilters($queryBuilder);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        Operation $operation = null,
        array $context = [],
    ): void {
        if ($resourceClass !== Person::class) {
            return;
        }
        $this->addFilters($queryBuilder);
    }

    private function addFilters(QueryBuilder $qb): void
    {
        $alias = $qb->getRootAliases()[0];

        // Always exclude soft-deleted persons
        $qb->andWhere("$alias.deletedAt IS NULL");

        // Super Admins see everything across all branches
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        $user = $this->security->getUser();

        if ($user === null || !$user instanceof User) {
            // Unauthenticated: only public persons in shared branches
            $qb->andWhere("$alias.visibility = :vis")
               ->andWhere("EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch pb_pub JOIN pb_pub.branch b_pub WHERE pb_pub.person = $alias AND b_pub.deletedAt IS NULL AND b_pub.isShared = true)")
               ->setParameter('vis', Visibility::Public->value);
            return;
        }

        // --- Two-layer filter for all authenticated non-super-admin users ---
        //
        // Layer 1 – Privacy: never expose private persons (Super Admin only).
        // Layer 2 – Branch scope: restrict to persons in the user's own branch(es)
        //           OR a shared (common ancestor) branch. This applies equally to
        //           Branch Admins, Members, and Viewers so that each branch sees
        //           only its own family data plus shared ancestors.

        // Layer 1: exclude private
        $qb->andWhere("$alias.visibility != :private_vis")
           ->setParameter('private_vis', Visibility::Private->value);

        // Collect branch IDs accessible by this user (via membership or branch admin role)
        $memberBranchIds     = $this->membershipRepo->getBranchIdsForUser($user->getId());
        $adminBranchIds      = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
        $accessibleBranchIds = array_values(array_unique(array_merge($memberBranchIds, $adminBranchIds)));

        // Layer 2: branch scope
        if (empty($accessibleBranchIds)) {
            // No branch membership yet → only shared/common ancestor persons visible
            $qb->andWhere(
                "EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch pb_chk JOIN pb_chk.branch b_chk WHERE pb_chk.person = $alias AND b_chk.deletedAt IS NULL AND b_chk.isShared = true)"
            );
        } else {
            // Has branch access → persons in shared branches OR in accessible branches
            $qb->andWhere(
                "EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch pb_chk JOIN pb_chk.branch b_chk WHERE pb_chk.person = $alias AND b_chk.deletedAt IS NULL AND (b_chk.isShared = true OR b_chk.id IN (:accessible_branches)))"
            )
            ->setParameter('accessible_branches', $accessibleBranchIds);
        }
    }
}
