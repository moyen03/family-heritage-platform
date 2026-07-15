<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\DatePrecision;
use App\Enum\Gender;
use App\Enum\Visibility;
use App\Repository\PersonRepository;
use App\Trait\SoftDeletableTrait;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PersonRepository::class)]
#[ORM\Table(name: 'persons')]
#[ORM\HasLifecycleCallbacks]
class Person
{
    use TimestampableTrait;
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\Column(type: 'string', length: 100)]
    private string $firstName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $middleName = null;

    #[ORM\Column(type: 'string', length: 100)]
    private string $lastName;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    private ?string $maidenName = null;

    #[ORM\Column(type: 'string', enumType: Gender::class)]
    private Gender $gender = Gender::Unknown;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $birthDate = null;

    #[ORM\Column(type: 'string', enumType: DatePrecision::class)]
    private DatePrecision $birthDatePrecision = DatePrecision::Unknown;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $birthPlace = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $deathDate = null;

    #[ORM\Column(type: 'string', enumType: DatePrecision::class)]
    private DatePrecision $deathDatePrecision = DatePrecision::Unknown;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $deathPlace = null;

    #[ORM\Column(type: 'boolean')]
    private bool $isLiving = true;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $biography = null;

    #[ORM\Column(type: 'string', enumType: Visibility::class)]
    private Visibility $visibility = Visibility::Family;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    private User $createdBy;

    /** @var Collection<int, PersonBranch> */
    #[ORM\OneToMany(targetEntity: PersonBranch::class, mappedBy: 'person', cascade: ['persist', 'remove'])]
    private Collection $personBranches;

    /** @var Collection<int, Relationship> */
    #[ORM\OneToMany(targetEntity: Relationship::class, mappedBy: 'person1', cascade: ['persist'])]
    private Collection $relationships;

    public function __construct(string $id)
    {
        $this->id = $id;
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
}

