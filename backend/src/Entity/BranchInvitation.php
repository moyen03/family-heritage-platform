<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\BranchInvitationRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;

#[ORM\Entity(repositoryClass: BranchInvitationRepository::class)]
#[ORM\Table(name: 'branch_invitations')]
#[ORM\HasLifecycleCallbacks]
class BranchInvitation
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Branch::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Branch $branch;

    #[ORM\Column(type: 'string', length: 255)]
    private string $email;

    #[ORM\Column(type: 'string', length: 20)]
    private string $role = 'viewer';

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private string $token;

    #[ORM\Column(type: 'string', length: 20)]
    private string $status = 'pending'; // pending, accepted, expired

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $invitedBy;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $acceptedAt = null;

    public function __construct(string $id = '')
    {
        $this->id        = $id ?: Uuid::uuid4()->toString();
        $this->token     = bin2hex(random_bytes(32));
        $this->expiresAt = new \DateTimeImmutable('+72 hours');
    }

    public function getId(): string { return $this->id; }

    public function getBranch(): Branch { return $this->branch; }
    public function setBranch(Branch $branch): static { $this->branch = $branch; return $this; }

    public function getEmail(): string { return $this->email; }
    public function setEmail(string $email): static { $this->email = $email; return $this; }

    public function getRole(): string { return $this->role; }
    public function setRole(string $role): static { $this->role = $role; return $this; }

    public function getToken(): string { return $this->token; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getInvitedBy(): User { return $this->invitedBy; }
    public function setInvitedBy(User $user): static { $this->invitedBy = $user; return $this; }

    public function getExpiresAt(): \DateTimeImmutable { return $this->expiresAt; }

    public function getAcceptedAt(): ?\DateTimeImmutable { return $this->acceptedAt; }
    public function setAcceptedAt(?\DateTimeImmutable $dt): static { $this->acceptedAt = $dt; return $this; }

    public function isExpired(): bool
    {
        return $this->expiresAt < new \DateTimeImmutable() || $this->status === 'expired';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && !$this->isExpired();
    }
}

