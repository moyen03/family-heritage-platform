<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\ApprovalStatus;
use App\Repository\ApprovalRequestRepository;
use App\State\ApprovalRequestStateProcessor;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/approval-requests',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
        ),
        new Post(
            uriTemplate: '/approval-requests',
            security: "is_granted('ROLE_MEMBER')",
            processor: ApprovalRequestStateProcessor::class,
        ),
        new Get(
            uriTemplate: '/approval-requests/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN') or (is_granted('ROLE_MEMBER') and object.getRequestedBy() == user)",
        ),
        new Patch(
            uriTemplate: '/approval-requests/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
            securityMessage: 'Only Branch Admins or Super Admins can review approval requests.',
            processor: ApprovalRequestStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/approval-requests/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN') or (is_granted('ROLE_MEMBER') and object.getRequestedBy() == user and object.getStatus().value == 'pending')",
            securityMessage: 'You can only cancel your own pending requests.',
            processor: ApprovalRequestStateProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['approval:read']],
    denormalizationContext: ['groups' => ['approval:write']],
    order: ['createdAt' => 'DESC'],
)]
#[ORM\Entity(repositoryClass: ApprovalRequestRepository::class)]
#[ORM\Table(name: 'approval_requests')]
#[ORM\HasLifecycleCallbacks]
class ApprovalRequest
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['approval:read'])]
    private string $id;

    /** Entity class short name, e.g. "Person", "Marriage". */
    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['approval:read', 'approval:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private string $entityType;

    /** UUID of the entity being edited. */
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['approval:read', 'approval:write'])]
    #[Assert\NotBlank]
    private string $entityId;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'requested_by', nullable: false)]
    #[Groups(['approval:read'])]
    private User $requestedBy;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'reviewed_by', nullable: true)]
    #[Groups(['approval:read'])]
    private ?User $reviewedBy = null;

    #[ORM\Column(type: 'string', enumType: ApprovalStatus::class)]
    #[Groups(['approval:read', 'approval:write'])]
    private ApprovalStatus $status = ApprovalStatus::Pending;

    /**
     * Proposed field changes: ["fieldName" => "newValue", …]
     *
     * @var array<string, mixed>
     */
    #[ORM\Column(type: 'json')]
    #[Groups(['approval:read', 'approval:write'])]
    private array $changesJson = [];

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['approval:read', 'approval:write'])]
    private ?string $notes = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['approval:read'])]
    private ?\DateTimeImmutable $reviewedAt = null;

    public function __construct(string $id = '')
    {
        $this->id = $id ?: Uuid::uuid4()->toString();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getEntityType(): string
    {
        return $this->entityType;
    }

    public function setEntityType(string $entityType): static
    {
        $this->entityType = $entityType;

        return $this;
    }

    public function getEntityId(): string
    {
        return $this->entityId;
    }

    public function setEntityId(string $entityId): static
    {
        $this->entityId = $entityId;

        return $this;
    }

    public function getRequestedBy(): User
    {
        return $this->requestedBy;
    }

    public function setRequestedBy(User $requestedBy): static
    {
        $this->requestedBy = $requestedBy;

        return $this;
    }

    public function getReviewedBy(): ?User
    {
        return $this->reviewedBy;
    }

    public function setReviewedBy(?User $reviewedBy): static
    {
        $this->reviewedBy = $reviewedBy;

        return $this;
    }

    public function getStatus(): ApprovalStatus
    {
        return $this->status;
    }

    public function setStatus(ApprovalStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    /** @return array<string, mixed> */
    public function getChangesJson(): array
    {
        return $this->changesJson;
    }

    /** @param array<string, mixed> $changesJson */
    public function setChangesJson(array $changesJson): static
    {
        $this->changesJson = $changesJson;

        return $this;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getReviewedAt(): ?\DateTimeImmutable
    {
        return $this->reviewedAt;
    }

    public function setReviewedAt(?\DateTimeImmutable $reviewedAt): static
    {
        $this->reviewedAt = $reviewedAt;

        return $this;
    }

    public function isPending(): bool
    {
        return $this->status === ApprovalStatus::Pending;
    }

    #[Groups(['approval:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }

    #[Groups(['approval:read'])]
    public function getUpdatedAtIso(): string
    {
        return $this->updatedAt->format(\DateTimeInterface::ATOM);
    }
}
