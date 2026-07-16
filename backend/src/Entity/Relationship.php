<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\RelationshipType;
use App\Repository\RelationshipRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RelationshipRepository::class)]
#[ORM\Table(name: 'relationships')]
#[ORM\UniqueConstraint(name: 'unique_relationship', columns: ['person1_id', 'person2_id', 'type'])]
#[ORM\HasLifecycleCallbacks]
class Relationship
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Person::class, inversedBy: 'relationships')]
    #[ORM\JoinColumn(name: 'person1_id', nullable: false)]
    private Person $person1;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(name: 'person2_id', nullable: false)]
    private Person $person2;

    #[ORM\Column(type: 'string', enumType: RelationshipType::class)]
    private RelationshipType $type;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    private User $createdBy;

    public function __construct(string $id)
    {
        $this->id = $id;
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
}
