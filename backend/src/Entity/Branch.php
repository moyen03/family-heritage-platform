<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\BranchRepository;
use App\Trait\SoftDeletableTrait;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BranchRepository::class)]
#[ORM\Table(name: 'branches')]
#[ORM\HasLifecycleCallbacks]
class Branch
{
    use TimestampableTrait;
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 255)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    private User $createdBy;

    /** @var Collection<int, BranchAdmin> */
    #[ORM\OneToMany(targetEntity: BranchAdmin::class, mappedBy: 'branch', cascade: ['persist', 'remove'])]
    private Collection $admins;

    /** @var Collection<int, PersonBranch> */
    #[ORM\OneToMany(targetEntity: PersonBranch::class, mappedBy: 'branch', cascade: ['persist', 'remove'])]
    private Collection $personBranches;

    public function __construct(string $id)
    {
        $this->id = $id;
        $this->admins = new ArrayCollection();
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
}

