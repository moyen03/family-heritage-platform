<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Branch;
use App\Entity\User;
use App\Repository\BranchRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Custom item provider for GET /branches/{id}.
 *
 * Enforces that non-super-admins can only fetch branches they belong to,
 * and sets isCurrentUserAdmin so the frontend can show the Invite button.
 *
 * @implements ProviderInterface<Branch>
 */
class BranchItemProvider implements ProviderInterface
{
    public function __construct(
        private readonly BranchRepository $branchRepository,
        private readonly Security $security,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): Branch
    {
        $id = $uriVariables['id'] ?? null;

        /** @var Branch|null $branch */
        $branch = $this->branchRepository->find($id);

        if ($branch === null || $branch->getDeletedAt() !== null) {
            throw new NotFoundHttpException('Branch not found.');
        }

        /** @var User|null $user */
        $user = $this->security->getUser();

        if ($user === null) {
            throw new AccessDeniedHttpException();
        }

        $isSuperAdmin = $this->security->isGranted('ROLE_SUPER_ADMIN');

        if (!$isSuperAdmin) {
            // Non-super-admins can only access branches they belong to
            $accessible = $this->branchRepository->findAccessibleForUser($user);
            $accessibleIds = array_map(fn (Branch $b) => $b->getId(), $accessible);
            if (!in_array($branch->getId(), $accessibleIds, true)) {
                throw new AccessDeniedHttpException('You do not have access to this branch.');
            }
        }

        // Mark whether the current user is admin of this specific branch
        if ($isSuperAdmin) {
            $branch->setIsCurrentUserAdmin(true);
        } else {
            $adminIds = $this->branchRepository->findAdminBranchIdsForUser($user);
            $branch->setIsCurrentUserAdmin(in_array($branch->getId(), $adminIds, true));
        }

        return $branch;
    }
}
