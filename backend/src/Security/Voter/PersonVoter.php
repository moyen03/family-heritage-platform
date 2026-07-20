<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Person;
use App\Entity\User;
use App\Enum\UserRole;
use App\Enum\Visibility;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchMembershipRepository;
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

    public function __construct(
        private readonly BranchMembershipRepository $membershipRepo,
        private readonly BranchAdminRepository $branchAdminRepo,
    ) {
    }

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

        if (!$subject instanceof Person) {
            return false;
        }

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
            Visibility::Family  => true,
            Visibility::Branch  => $this->canViewBranchPerson($person, $user),
            Visibility::Private => false,
        };
    }

    /**
     * Branch visibility: person must be in a shared branch,
     * OR the user must belong to at least one of the person's branches.
     */
    private function canViewBranchPerson(Person $person, User $user): bool
    {
        $personBranchIds = [];
        foreach ($person->getPersonBranches() as $pb) {
            $branch = $pb->getBranch();
            // A shared branch is visible to everyone
            if ($branch->getIsShared() && $branch->getDeletedAt() === null) {
                return true;
            }
            if ($branch->getDeletedAt() === null) {
                $personBranchIds[] = $branch->getId();
            }
        }

        if (empty($personBranchIds)) {
            return false;
        }

        $memberBranchIds = $this->membershipRepo->getBranchIdsForUser($user->getId());
        $adminBranchIds  = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
        $accessibleIds   = array_unique(array_merge($memberBranchIds, $adminBranchIds));

        return !empty(array_intersect($personBranchIds, $accessibleIds));
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
