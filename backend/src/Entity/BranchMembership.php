<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\BranchMemberRole;
use App\Repository\BranchMembershipRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Links a User to a Branch as a viewer or member.
 * Super Admins and Branch Admins (BranchAdmin entity) are managed separately.
 */
#[ORM\Entity(repositoryClass: BranchMembershipRepository::class)]
#[ORM\Table(name: 'branch_memberships')]
class BranchMembership
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Branch::class, inversedBy: 'memberships')]
    #[ORM\JoinColumn(name: 'branch_id', nullable: false, onDelete: 'CASCADE')]
    private Branch $branch;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: 'string', enumType: BranchMemberRole::class)]
    private BranchMemberRole $role = BranchMemberRole::Member;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $joinedAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'invited_by', nullable: false)]
    private User $invitedBy;

    public function __construct(Branch $branch, User $user, User $invitedBy, BranchMemberRole $role = BranchMemberRole::Member)
    {
        $this->branch   = $branch;
        $this->user     = $user;
        $this->invitedBy = $invitedBy;
        $this->role     = $role;
        $this->joinedAt = new \DateTimeImmutable();
    }

    public function getBranch(): Branch
    {
        return $this->branch;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getRole(): BranchMemberRole
    {
        return $this->role;
    }

    public function setRole(BranchMemberRole $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function getJoinedAt(): \DateTimeImmutable
    {
        return $this->joinedAt;
    }

    public function getInvitedBy(): User
    {
        return $this->invitedBy;
    }
}
