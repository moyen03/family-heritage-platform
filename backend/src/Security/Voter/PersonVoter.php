<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Person;
use App\Entity\User;
use App\Enum\UserRole;
use App\Enum\Visibility;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * @extends Voter<string, Person>
 */
final class PersonVoter extends Voter
{
    public const VIEW   = 'PERSON_VIEW';
    public const EDIT   = 'PERSON_EDIT';
    public const DELETE = 'PERSON_DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof Person;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        assert($subject instanceof Person);

        return match ($attribute) {
            self::VIEW   => $this->canView($subject, $user),
            self::EDIT   => $this->canEdit($subject, $user),
            self::DELETE => $this->canDelete($user),
            default      => false,
        };
    }

    private function canView(Person $person, User $user): bool
    {
        // Super Admins can see everything
        if ($user->getRole() === UserRole::SuperAdmin) {
            return true;
        }

        return match ($person->getVisibility()) {
            Visibility::Public  => true,
            Visibility::Family  => true,  // all authenticated family members
            Visibility::Branch  => true,  // simplify: all members for now (branch check Phase 5)
            Visibility::Private => $user->getRole() === UserRole::SuperAdmin,
        };
    }

    private function canEdit(Person $person, User $user): bool
    {
        if ($user->getRole() === UserRole::SuperAdmin) {
            return true;
        }

        if ($user->getRole() === UserRole::BranchAdmin) {
            return true;
        }

        // Members can only edit persons they created
        return $person->getCreatedBy()->getId() === $user->getId();
    }

    private function canDelete(User $user): bool
    {
        return in_array($user->getRole(), [UserRole::SuperAdmin, UserRole::BranchAdmin], true);
    }
}
