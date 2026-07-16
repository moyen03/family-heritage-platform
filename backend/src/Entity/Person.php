<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\DatePrecision;
use App\Enum\Gender;
use App\Enum\Visibility;
use App\Repository\PersonRepository;
use App\State\PersonStateProcessor;
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
            uriTemplate: '/persons',
            security: "is_granted('ROLE_USER')",
        ),
        new Post(
            uriTemplate: '/persons',
            security: "is_granted('ROLE_MEMBER')",
            processor: PersonStateProcessor::class,
        ),
        new Get(
            uriTemplate: '/persons/{id}',
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            uriTemplate: '/persons/{id}',
            security: "is_granted('ROLE_MEMBER') and (object.getCreatedBy() == user or is_granted('ROLE_BRANCH_ADMIN'))",
            securityMessage: 'You do not have permission to edit this person.',
            processor: PersonStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/persons/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
            securityMessage: 'Only Branch Admins or Super Admins can delete persons.',
            processor: PersonStateProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['person:read']],
    denormalizationContext: ['groups' => ['person:write']],
    order: ['lastName' => 'ASC', 'firstName' => 'ASC'],
)]
#[ORM\Entity(repositoryClass: PersonRepository::class)]
#[ORM\Table(name: 'persons')]
#[ORM\HasLifecycleCallbacks]
class Person
{
    use TimestampableTrait;
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['person:read'])]
    private string $id;

    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['person:read', 'person:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    #[Assert\Length(max: 100)]
    private ?string $middleName = null;

    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['person:read', 'person:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private string $lastName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    #[Assert\Length(max: 100)]
    private ?string $maidenName = null;

    #[ORM\Column(type: 'string', enumType: Gender::class)]
    #[Groups(['person:read', 'person:write'])]
    private Gender $gender = Gender::Unknown;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    private ?\DateTimeInterface $birthDate = null;

    #[ORM\Column(type: 'string', enumType: DatePrecision::class)]
    #[Groups(['person:read', 'person:write'])]
    private DatePrecision $birthDatePrecision = DatePrecision::Unknown;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    #[Assert\Length(max: 255)]
    private ?string $birthPlace = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    private ?\DateTimeInterface $deathDate = null;

    #[ORM\Column(type: 'string', enumType: DatePrecision::class)]
    #[Groups(['person:read', 'person:write'])]
    private DatePrecision $deathDatePrecision = DatePrecision::Unknown;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    #[Assert\Length(max: 255)]
    private ?string $deathPlace = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['person:read', 'person:write'])]
    private bool $isLiving = true;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['person:read', 'person:write'])]
    private ?string $biography = null;

    #[ORM\Column(type: 'string', enumType: Visibility::class)]
    #[Groups(['person:read', 'person:write'])]
    private Visibility $visibility = Visibility::Family;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    #[Groups(['person:read'])]
    private User $createdBy;

    /** @var Collection<int, PersonName> */
    #[ORM\OneToMany(targetEntity: PersonName::class, mappedBy: 'person', cascade: ['persist', 'remove'])]
    #[Groups(['person:read'])]
    private Collection $personNames;

    /** @var Collection<int, PersonBranch> */
    #[ORM\OneToMany(targetEntity: PersonBranch::class, mappedBy: 'person', cascade: ['persist', 'remove'])]
    #[Groups(['person:read'])]
    private Collection $personBranches;

    /** @var Collection<int, Relationship> */
    #[ORM\OneToMany(targetEntity: Relationship::class, mappedBy: 'person1', cascade: ['persist'])]
    private Collection $relationships;

    public function __construct(string $id = '')
    {
        $this->id = $id ?: Uuid::uuid4()->toString();
        $this->personNames = new ArrayCollection();
        $this->personBranches = new ArrayCollection();
        $this->relationships = new ArrayCollection();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getMiddleName(): ?string
    {
        return $this->middleName;
    }

    public function setMiddleName(?string $middleName): static
    {
        $this->middleName = $middleName;
        return $this;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;
        return $this;
    }

    public function getMaidenName(): ?string
    {
        return $this->maidenName;
    }

    public function setMaidenName(?string $maidenName): static
    {
        $this->maidenName = $maidenName;
        return $this;
    }

    #[Groups(['person:read'])]
    public function getFullName(): string
    {
        $parts = array_filter([$this->firstName, $this->middleName, $this->lastName]);
        return implode(' ', $parts);
    }

    public function getGender(): Gender
    {
        return $this->gender;
    }

    public function setGender(Gender $gender): static
    {
        $this->gender = $gender;
        return $this;
    }

    public function getBirthDate(): ?\DateTimeInterface
    {
        return $this->birthDate;
    }

    public function setBirthDate(?\DateTimeInterface $birthDate): static
    {
        $this->birthDate = $birthDate;
        return $this;
    }

    public function getBirthDatePrecision(): DatePrecision
    {
        return $this->birthDatePrecision;
    }

    public function setBirthDatePrecision(DatePrecision $birthDatePrecision): static
    {
        $this->birthDatePrecision = $birthDatePrecision;
        return $this;
    }

    public function getBirthPlace(): ?string
    {
        return $this->birthPlace;
    }

    public function setBirthPlace(?string $birthPlace): static
    {
        $this->birthPlace = $birthPlace;
        return $this;
    }

    public function getDeathDate(): ?\DateTimeInterface
    {
        return $this->deathDate;
    }

    public function setDeathDate(?\DateTimeInterface $deathDate): static
    {
        $this->deathDate = $deathDate;
        if ($deathDate !== null) {
            $this->isLiving = false;
        }
        return $this;
    }

    public function getDeathDatePrecision(): DatePrecision
    {
        return $this->deathDatePrecision;
    }

    public function setDeathDatePrecision(DatePrecision $deathDatePrecision): static
    {
        $this->deathDatePrecision = $deathDatePrecision;
        return $this;
    }

    public function getDeathPlace(): ?string
    {
        return $this->deathPlace;
    }

    public function setDeathPlace(?string $deathPlace): static
    {
        $this->deathPlace = $deathPlace;
        return $this;
    }

    public function isLiving(): bool
    {
        return $this->isLiving;
    }

    public function setIsLiving(bool $isLiving): static
    {
        $this->isLiving = $isLiving;
        return $this;
    }

    public function getBiography(): ?string
    {
        return $this->biography;
    }

    public function setBiography(?string $biography): static
    {
        $this->biography = $biography;
        return $this;
    }

    public function getVisibility(): Visibility
    {
        return $this->visibility;
    }

    public function setVisibility(Visibility $visibility): static
    {
        $this->visibility = $visibility;
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

    /** @return Collection<int, PersonName> */
    public function getPersonNames(): Collection
    {
        return $this->personNames;
    }

    public function addPersonName(PersonName $personName): static
    {
        if (!$this->personNames->contains($personName)) {
            $this->personNames->add($personName);
            $personName->setPerson($this);
        }
        return $this;
    }

    public function removePersonName(PersonName $personName): static
    {
        $this->personNames->removeElement($personName);
        return $this;
    }

    /** @return Collection<int, PersonBranch> */
    public function getPersonBranches(): Collection
    {
        return $this->personBranches;
    }

    /** @return Collection<int, Relationship> */
    public function getRelationships(): Collection
    {
        return $this->relationships;
    }

    #[Groups(['person:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }

    #[Groups(['person:read'])]
    public function getUpdatedAtIso(): string
    {
        return $this->updatedAt->format(\DateTimeInterface::ATOM);
    }
}
