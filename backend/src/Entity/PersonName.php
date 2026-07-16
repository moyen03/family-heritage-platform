<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\NameType;
use App\Repository\PersonNameRepository;
use App\State\PersonNameStateProcessor;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/persons/{personId}/names',
            uriVariables: [
                'personId' => new Link(fromClass: Person::class, toProperty: 'person'),
            ],
            security: "is_granted('ROLE_USER')",
        ),
        new Post(
            uriTemplate: '/persons/{personId}/names',
            uriVariables: [
                'personId' => new Link(fromClass: Person::class, toProperty: 'person'),
            ],
            security: "is_granted('ROLE_MEMBER')",
            processor: PersonNameStateProcessor::class,
        ),
        new Get(
            uriTemplate: '/person-names/{id}',
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            uriTemplate: '/person-names/{id}',
            security: "is_granted('ROLE_MEMBER')",
            securityMessage: 'You do not have permission to edit this name.',
            processor: PersonNameStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/person-names/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
            securityMessage: 'Only Branch Admins or Super Admins can delete person names.',
            processor: PersonNameStateProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['person_name:read']],
    denormalizationContext: ['groups' => ['person_name:write']],
    order: ['nameType' => 'ASC', 'fromDate' => 'ASC'],
)]
#[ORM\Entity(repositoryClass: PersonNameRepository::class)]
#[ORM\Table(name: 'person_names')]
#[ORM\HasLifecycleCallbacks]
class PersonName
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['person_name:read', 'person:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Person::class, inversedBy: 'personNames')]
    #[ORM\JoinColumn(name: 'person_id', nullable: false, onDelete: 'CASCADE')]
    #[Groups(['person_name:read'])]
    private Person $person;

    #[ORM\Column(type: 'string', enumType: NameType::class)]
    #[Groups(['person_name:read', 'person_name:write', 'person:read'])]
    #[Assert\NotNull]
    private NameType $nameType = NameType::Birth;

    #[ORM\Column(type: 'string', length: 255)]
    #[Groups(['person_name:read', 'person_name:write', 'person:read'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private string $name;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['person_name:read', 'person_name:write', 'person:read'])]
    private ?\DateTimeInterface $fromDate = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['person_name:read', 'person_name:write', 'person:read'])]
    private ?\DateTimeInterface $toDate = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['person_name:read', 'person_name:write', 'person:read'])]
    private ?string $notes = null;

    public function __construct(string $id = '')
    {
        $this->id = $id ?: Uuid::uuid4()->toString();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getPerson(): Person
    {
        return $this->person;
    }

    public function setPerson(Person $person): static
    {
        $this->person = $person;
        return $this;
    }

    public function getNameType(): NameType
    {
        return $this->nameType;
    }

    public function setNameType(NameType $nameType): static
    {
        $this->nameType = $nameType;
        return $this;
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

    public function getFromDate(): ?\DateTimeInterface
    {
        return $this->fromDate;
    }

    public function setFromDate(?\DateTimeInterface $fromDate): static
    {
        $this->fromDate = $fromDate;
        return $this;
    }

    public function getToDate(): ?\DateTimeInterface
    {
        return $this->toDate;
    }

    public function setToDate(?\DateTimeInterface $toDate): static
    {
        $this->toDate = $toDate;
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

    #[Groups(['person_name:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }

    #[Groups(['person_name:read'])]
    public function getUpdatedAtIso(): string
    {
        return $this->updatedAt->format(\DateTimeInterface::ATOM);
    }
}
