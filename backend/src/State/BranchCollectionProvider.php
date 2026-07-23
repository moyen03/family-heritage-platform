<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Branch;
use App\Entity\User;
use App\Repository\BranchRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Custom collection provider for GET /branches.
 *
 * - Super Admin  → all active branches
 * - Branch Admin / Member / Viewer → only branches they belong to
 *
 * Also marks isCurrentUserAdmin on every Branch so the frontend can
 * show the Invite button only on branches the user actually administers.
 *
 * @implements ProviderInterface<Branch>
 */
class BranchCollectionProvider implements ProviderInterface
{
    public function __construct(
        private readonly BranchRepository $branchRepository,
        private readonly Security $security,
    ) {
    }

    /**
     * @return Branch[]
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        /** @var User|null $user */
        $user = $this->security->getUser();

        if ($user === null) {
            return [];
        }

        $isSuperAdmin = $this->security->isGranted('ROLE_SUPER_ADMIN');

        // Fetch the correct set of branches
        if ($isSuperAdmin) {
            $branches = $this->branchRepository->findAllActive();
        } else {
            $branches = $this->branchRepository->findAccessibleForUser($user);
        }

        // Determine which branch IDs this user administers
        if ($isSuperAdmin) {
            $adminBranchIds = null; // null = all
        } else {
            $adminBranchIds = $this->branchRepository->findAdminBranchIdsForUser($user);
        }

        // Set the virtual flag on each branch
        foreach ($branches as $branch) {
            $isAdmin = $isSuperAdmin || ($adminBranchIds !== null && in_array($branch->getId(), $adminBranchIds, true));
            $branch->setIsCurrentUserAdmin($isAdmin);
        }

        return $branches;
    }
}

