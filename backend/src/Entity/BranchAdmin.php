<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\BranchAdminRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BranchAdminRepository::class)]
#[ORM\Table(name: 'branch_admins')]
class BranchAdmin
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Branch::class, inversedBy: 'admins')]
    #[ORM\JoinColumn(name: 'branch_id', nullable: false)]
    private Branch $branch;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', nullable: false)]
    private User $user;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $grantedAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'granted_by', nullable: false)]
    private User $grantedBy;

    public function __construct(Branch $branch, User $user, User $grantedBy)
    {
        $this->branch = $branch;
        $this->user = $user;
        $this->grantedBy = $grantedBy;
        $this->grantedAt = new \DateTimeImmutable();
    }

    public function getBranch(): Branch
    {
        return $this->branch;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getGrantedAt(): \DateTimeImmutable
    {
        return $this->grantedAt;
    }

    public function getGrantedBy(): User
    {
        return $this->grantedBy;
    }
}
