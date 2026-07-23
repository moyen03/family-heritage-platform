<?php

declare(strict_types=1);

namespace App\Doctrine\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Address;
use App\Entity\Marriage;
use App\Entity\Media;
use App\Entity\Relationship;
use App\Entity\User;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchMembershipRepository;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Scopes Relationship, Marriage, Address, and Media collections/items
 * to the current user's accessible branches + shared (common-ancestor) branches.
 *
 * Mirrors the two-layer approach in PersonVisibilityExtension:
 *  - Super Admin  → no restriction
 *  - Unauthenticated → blocked entirely
 *  - Everyone else  → restricted to their branch(es) + shared branches
 */
final class BranchScopingExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    private const SUPPORTED = [
        Relationship::class,
        Marriage::class,
        Address::class,
        Media::class,
    ];

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
        ?Operation $operation = null,
        array $context = [],
    ): void {
        if (!in_array($resourceClass, self::SUPPORTED, true)) {
            return;
        }
        $this->addFilters($queryBuilder, $resourceClass);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        if (!in_array($resourceClass, self::SUPPORTED, true)) {
            return;
        }
        $this->addFilters($queryBuilder, $resourceClass);
    }

    private function addFilters(QueryBuilder $qb, string $resourceClass): void
    {
        // Super Admins are unrestricted
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        $user = $this->security->getUser();
        if (!$user instanceof User) {
            // Unauthenticated: block everything
            $qb->andWhere('1 = 0');
            return;
        }

        // Collect branch IDs this user can access (membership + admin roles)
        $memberBranchIds     = $this->membershipRepo->getBranchIdsForUser($user->getId());
        $adminBranchIds      = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
        $accessibleBranchIds = array_values(array_unique(array_merge($memberBranchIds, $adminBranchIds)));

        $alias = $qb->getRootAliases()[0];

        // Build a DQL fragment that checks whether a given person reference is in a
        // shared branch OR one of the user's accessible branches.
        // Each call MUST receive a unique $tag so DQL alias names don't conflict
        // when the closure is called multiple times within the same query.
        if (empty($accessibleBranchIds)) {
            $inScope = fn(string $personRef, string $tag) =>
                "EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch bse_pb_{$tag} JOIN bse_pb_{$tag}.branch bse_b_{$tag} WHERE bse_pb_{$tag}.person = {$personRef} AND bse_b_{$tag}.deletedAt IS NULL AND bse_b_{$tag}.isShared = true)";
        } else {
            $qb->setParameter('bse_branch_ids', $accessibleBranchIds);
            $inScope = fn(string $personRef, string $tag) =>
                "EXISTS (SELECT 1 FROM App\\Entity\\PersonBranch bse_pb_{$tag} JOIN bse_pb_{$tag}.branch bse_b_{$tag} WHERE bse_pb_{$tag}.person = {$personRef} AND bse_b_{$tag}.deletedAt IS NULL AND (bse_b_{$tag}.isShared = true OR bse_b_{$tag}.id IN (:bse_branch_ids)))";
        }

        match ($resourceClass) {
            // Relationship: both person1 AND person2 must be in scope
            Relationship::class => $qb->andWhere(
                $qb->expr()->andX(
                    ($inScope)("{$alias}.person1", 'r1'),
                    ($inScope)("{$alias}.person2", 'r2'),
                )
            ),

            // Marriage: both spouse1 AND spouse2 must be in scope
            Marriage::class => $qb->andWhere(
                $qb->expr()->andX(
                    ($inScope)("{$alias}.spouse1", 'm1'),
                    ($inScope)("{$alias}.spouse2", 'm2'),
                )
            ),

            // Address: the linked person must be in scope
            Address::class => $qb->andWhere(($inScope)("{$alias}.person", 'addr')),

            // Media: visible if uploaded by the current user OR at least one tagged
            //        person is in scope. Media with no tags is only visible to its uploader.
            Media::class => $qb->andWhere(
                $qb->expr()->orX(
                    // Uploader always sees their own media
                    "IDENTITY({$alias}.uploadedBy) = :bse_uid",
                    // Tagged to at least one person in scope (nested EXISTS)
                    "EXISTS (
                        SELECT 1 FROM App\\Entity\\MediaTag bse_mt
                        WHERE bse_mt.media = {$alias}
                        AND " . ($inScope)('bse_mt.person', 'mtp') . "
                    )",
                )
            )->setParameter('bse_uid', $user->getId()),

            default => null,
        };
    }
}
