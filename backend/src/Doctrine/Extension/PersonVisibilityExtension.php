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

        // Super Admins see everything
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        $user = $this->security->getUser();

        if ($user === null || !$user instanceof User) {
            // Unauthenticated: only public persons
            $qb->andWhere("$alias.visibility = :vis")
               ->setParameter('vis', Visibility::Public->value);
            return;
        }

        // Collect branch IDs accessible by this user (via membership or branch admin role)
        $memberBranchIds     = $this->membershipRepo->getBranchIdsForUser($user->getId());
        $adminBranchIds      = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
        $accessibleBranchIds = array_values(array_unique(array_merge($memberBranchIds, $adminBranchIds)));

        // Public/Family: always visible to authenticated users
        // Branch: visible if person is in a shared branch OR a branch the user belongs to
        // Private: never visible to non-super-admins

        if (empty($accessibleBranchIds)) {
            // User has no explicit branch access → branch-visible persons only if in a shared branch
            $qb->andWhere(
                $qb->expr()->orX(
                    "$alias.visibility IN (:public_family_vis)",
                    $qb->expr()->andX(
                        "$alias.visibility = :branch_vis",
                        "EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch pb_chk JOIN pb_chk.branch b_chk WHERE pb_chk.person = $alias AND b_chk.deletedAt IS NULL AND b_chk.isShared = true)"
                    )
                )
            )
            ->setParameter('public_family_vis', [Visibility::Public->value, Visibility::Family->value])
            ->setParameter('branch_vis', Visibility::Branch->value);
        } else {
            // User has branch access → branch-visible if in shared OR in user's accessible branches
            $qb->andWhere(
                $qb->expr()->orX(
                    "$alias.visibility IN (:public_family_vis)",
                    $qb->expr()->andX(
                        "$alias.visibility = :branch_vis",
                        "EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch pb_chk JOIN pb_chk.branch b_chk WHERE pb_chk.person = $alias AND b_chk.deletedAt IS NULL AND (b_chk.isShared = true OR b_chk.id IN (:accessible_branches)))"
                    )
                )
            )
            ->setParameter('public_family_vis', [Visibility::Public->value, Visibility::Family->value])
            ->setParameter('branch_vis', Visibility::Branch->value)
            ->setParameter('accessible_branches', $accessibleBranchIds);
        }
    }
}
