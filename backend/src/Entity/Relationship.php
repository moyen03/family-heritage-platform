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
use App\Enum\RelationshipType;
use App\Repository\RelationshipRepository;
use App\State\RelationshipStateProcessor;
use App\State\RelationshipStateProvider;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/relationships',
            security: "is_granted('ROLE_USER')",
        ),
        new GetCollection(
            uriTemplate: '/persons/{personId}/relationships',
            uriVariables: [
                'personId' => new Link(fromClass: Person::class, identifiers: ['id']),
            ],
            security: "is_granted('ROLE_USER')",
            provider: RelationshipStateProvider::class,
        ),
        new Post(
            uriTemplate: '/relationships',
            security: "is_granted('ROLE_MEMBER')",
            processor: RelationshipStateProcessor::class,
        ),
        new Get(
            uriTemplate: '/relationships/{id}',
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            uriTemplate: '/relationships/{id}',
            security: "is_granted('ROLE_MEMBER')",
            securityMessage: 'You do not have permission to edit this relationship.',
            processor: RelationshipStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/relationships/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
            securityMessage: 'Only Branch Admins or Super Admins can delete relationships.',
            processor: RelationshipStateProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['relationship:read']],
    denormalizationContext: ['groups' => ['relationship:write']],
    order: ['type' => 'ASC'],
)]
#[ORM\Entity(repositoryClass: RelationshipRepository::class)]
#[ORM\Table(name: 'relationships')]
#[ORM\UniqueConstraint(name: 'unique_relationship', columns: ['person1_id', 'person2_id', 'type'])]
#[ORM\HasLifecycleCallbacks]
class Relationship
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['relationship:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Person::class, inversedBy: 'relationships')]
    #[ORM\JoinColumn(name: 'person1_id', nullable: false)]
    #[Groups(['relationship:read', 'relationship:write'])]
    #[Assert\NotNull]
    private Person $person1;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(name: 'person2_id', nullable: false)]
    #[Groups(['relationship:read', 'relationship:write'])]
    #[Assert\NotNull]
    private Person $person2;

    #[ORM\Column(type: 'string', enumType: RelationshipType::class)]
    #[Groups(['relationship:read', 'relationship:write'])]
    #[Assert\NotNull]
    private RelationshipType $type;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['relationship:read', 'relationship:write'])]
    private ?string $notes = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    #[Groups(['relationship:read'])]
    private User $createdBy;

    /** Marks auto-generated inverse — not persisted, used only during creation. */
    private bool $isInverse = false;

    public function __construct(string $id = '')
    {
        $this->id = $id ?: Uuid::uuid4()->toString();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getPerson1(): Person
    {
        return $this->person1;
    }

    public function setPerson1(Person $person1): static
    {
        $this->person1 = $person1;

        return $this;
    }

    public function getPerson2(): Person
    {
        return $this->person2;
    }

    public function setPerson2(Person $person2): static
    {
        $this->person2 = $person2;

        return $this;
    }

    public function getType(): RelationshipType
    {
        return $this->type;
    }

    public function setType(RelationshipType $type): static
    {
        $this->type = $type;

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

    public function getCreatedBy(): User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function isInverse(): bool
    {
        return $this->isInverse;
    }

    public function setIsInverse(bool $isInverse): static
    {
        $this->isInverse = $isInverse;

        return $this;
    }

    /** Build the mirror of this relationship (swapped persons, inverse type). */
    public function createInverse(): self
    {
        $inverse = new self();
        $inverse->setPerson1($this->person2);
        $inverse->setPerson2($this->person1);
        $inverse->setType($this->type->inverse());
        $inverse->setNotes($this->notes);
        $inverse->setCreatedBy($this->createdBy);
        $inverse->setIsInverse(true);

        return $inverse;
    }

    #[Groups(['relationship:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }

    #[Groups(['relationship:read'])]
    public function getUpdatedAtIso(): string
    {
        return $this->updatedAt->format(\DateTimeInterface::ATOM);
    }
}
