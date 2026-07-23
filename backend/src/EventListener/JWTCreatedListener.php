<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\User;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchMembershipRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Enriches the JWT payload with branch-level roles.
 *
 * A user whose global UserRole is Viewer or Member may still be a
 * branch_admin in specific branches (via branch_memberships or branch_admins).
 * This listener adds ROLE_BRANCH_ADMIN to the token so that
 * #[IsGranted('ROLE_BRANCH_ADMIN')] gates (e.g. the invite endpoint) work
 * correctly for them.
 */
final class JWTCreatedListener implements EventSubscriberInterface
{
    public function __construct(
        private readonly BranchAdminRepository $branchAdminRepo,
        private readonly BranchMembershipRepository $membershipRepo,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            'lexik_jwt_authentication.on_jwt_created' => 'onJWTCreated',
        ];
    }

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();
        $roles   = $payload['roles'] ?? [];

        if (in_array('ROLE_BRANCH_ADMIN', $roles, true)) {
            return; // already present (e.g. global BranchAdmin role)
        }

        $userId = $user->getId();

        $hasAdminEntry       = !empty($this->branchAdminRepo->getBranchIdsForUser($userId));
        $hasMembershipAdmin  = !empty($this->membershipRepo->getBranchAdminIdsForUser($userId));

        if ($hasAdminEntry || $hasMembershipAdmin) {
            $roles[]         = 'ROLE_BRANCH_ADMIN';
            $payload['roles'] = array_values($roles);
            $event->setData($payload);
        }
    }
}

