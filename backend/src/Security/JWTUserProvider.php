<?php

declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Security\User\PayloadAwareUserProviderInterface;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * A user provider that is aware of the JWT payload so that branch-specific
 * roles stored in the token (e.g. ROLE_BRANCH_ADMIN) are propagated into
 * the Symfony security token and evaluated by #[IsGranted()] checks.
 */
final class JWTUserProvider implements PayloadAwareUserProviderInterface
{
    public function __construct(private readonly UserRepository $userRepository) {}

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $user = $this->userRepository->findOneBy(['email' => $identifier]);
        if (!$user instanceof User) {
            throw new UserNotFoundException(sprintf('User "%s" not found.', $identifier));
        }

        return $user;
    }

    /**
     * Called by the Lexik JWT authenticator when the provider is payload-aware.
     * Merges any extra roles from the JWT payload (e.g. ROLE_BRANCH_ADMIN) into
     * the User entity so Symfony's isGranted() respects them.
     */
    public function loadUserByIdentifierAndPayload(string $identifier, array $payload): UserInterface
    {
        /** @var User $user */
        $user = $this->loadUserByIdentifier($identifier);

        $jwtRoles = $payload['roles'] ?? [];

        // Only inject roles that are not already returned by the entity's getRoles()
        $extraRoles = array_values(array_diff($jwtRoles, $user->getRoles()));
        if (!empty($extraRoles)) {
            $user->addExtraRoles($extraRoles);
        }

        return $user;
    }

    public function refreshUser(UserInterface $user): UserInterface
    {
        return $this->loadUserByIdentifier($user->getUserIdentifier());
    }

    public function supportsClass(string $class): bool
    {
        return $class === User::class || is_subclass_of($class, User::class);
    }
}

