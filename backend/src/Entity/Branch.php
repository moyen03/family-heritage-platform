<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\BranchRepository;
use App\Trait\SoftDeletableTrait;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/branches',
            security: "is_granted('ROLE_USER')",
            paginationEnabled: false,
        ),
        new Post(
            uriTemplate: '/branches',
            security: "is_granted('ROLE_SUPER_ADMIN')",
            processor: \App\State\BranchStateProcessor::class,
        ),
        new Get(
            uriTemplate: '/branches/{id}',
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            uriTemplate: '/branches/{id}',
            security: "is_granted('ROLE_SUPER_ADMIN')",
            processor: \App\State\BranchStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/branches/{id}',
            security: "is_granted('ROLE_SUPER_ADMIN')",
        ),
    ],
    normalizationContext: ['groups' => ['branch:read'], 'skip_null_values' => false],
    denormalizationContext: ['groups' => ['branch:write']],
    order: ['name' => 'ASC'],
)]
#[ORM\Entity(repositoryClass: BranchRepository::class)]
#[ORM\Table(name: 'branches')]
#[ORM\HasLifecycleCallbacks]
class Branch
{
    use TimestampableTrait;
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['branch:read', 'person:read'])]
    private string $id;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['branch:read', 'branch:write', 'person:read'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['branch:read', 'branch:write'])]
    private ?string $description = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['branch:read', 'branch:write'])]
    private bool $isShared = false;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    private User $createdBy;

    /** @var Collection<int, BranchAdmin> */
    #[ORM\OneToMany(targetEntity: BranchAdmin::class, mappedBy: 'branch', cascade: ['persist', 'remove'])]
    private Collection $admins;

    /** @var Collection<int, PersonBranch> */
    #[ORM\OneToMany(targetEntity: PersonBranch::class, mappedBy: 'branch', cascade: ['persist', 'remove'])]
    private Collection $personBranches;

    public function __construct(string $id = '')
    {
        $this->id             = $id ?: Uuid::uuid4()->toString();
        $this->admins         = new ArrayCollection();
        $this->personBranches = new ArrayCollection();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function isShared(): bool
    {
        return $this->isShared;
    }

    public function setIsShared(bool $isShared): static
    {
        $this->isShared = $isShared;

        return $this;
    }

    public function getCreatedBy(): User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    /** @return Collection<int, BranchAdmin> */
    public function getAdmins(): Collection
    {
        return $this->admins;
    }

    public function isAdminUser(User $user): bool
    {
        foreach ($this->admins as $admin) {
            if ($admin->getUser()->getId() === $user->getId()) {
                return true;
            }
        }

        return false;
    }

    /** @return Collection<int, PersonBranch> */
    public function getPersonBranches(): Collection
    {
        return $this->personBranches;
    }

    #[Groups(['branch:read'])]
    public function getMemberCount(): int
    {
        return $this->personBranches->count();
    }
}
