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
use App\Enum\DatePrecision;
use App\Repository\MarriageRepository;
use App\State\MarriageStateProcessor;
use App\State\MarriageStateProvider;
use App\Trait\SoftDeletableTrait;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/marriages',
            security: "is_granted('ROLE_USER')",
        ),
        new GetCollection(
            uriTemplate: '/persons/{personId}/marriages',
            uriVariables: [
                'personId' => new Link(fromClass: Person::class, identifiers: ['id']),
            ],
            security: "is_granted('ROLE_USER')",
            provider: MarriageStateProvider::class,
        ),
        new Post(
            uriTemplate: '/marriages',
            security: "is_granted('ROLE_MEMBER')",
            processor: MarriageStateProcessor::class,
        ),
        new Get(
            uriTemplate: '/marriages/{id}',
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            uriTemplate: '/marriages/{id}',
            security: "is_granted('ROLE_MEMBER')",
            securityMessage: 'You do not have permission to edit this marriage.',
            processor: MarriageStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/marriages/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
            securityMessage: 'Only Branch Admins or Super Admins can delete marriages.',
            processor: MarriageStateProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['marriage:read']],
    denormalizationContext: ['groups' => ['marriage:write']],
    order: ['marriageDate' => 'ASC'],
)]
#[ORM\Entity(repositoryClass: MarriageRepository::class)]
#[ORM\Table(name: 'marriages')]
#[ORM\HasLifecycleCallbacks]
class Marriage
{
    use TimestampableTrait;
    use SoftDeletableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['marriage:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(name: 'spouse1_id', nullable: false)]
    #[Groups(['marriage:read', 'marriage:write'])]
    #[Assert\NotNull]
    private Person $spouse1;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(name: 'spouse2_id', nullable: false)]
    #[Groups(['marriage:read', 'marriage:write'])]
    #[Assert\NotNull]
    private Person $spouse2;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['marriage:read', 'marriage:write'])]
    private ?\DateTimeInterface $marriageDate = null;

    #[ORM\Column(type: 'string', enumType: DatePrecision::class)]
    #[Groups(['marriage:read', 'marriage:write'])]
    private DatePrecision $marriageDatePrecision = DatePrecision::Unknown;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['marriage:read', 'marriage:write'])]
    #[Assert\Length(max: 255)]
    private ?string $marriagePlace = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['marriage:read', 'marriage:write'])]
    private ?\DateTimeInterface $divorceDate = null;

    #[ORM\Column(type: 'string', enumType: DatePrecision::class)]
    #[Groups(['marriage:read', 'marriage:write'])]
    private DatePrecision $divorceDatePrecision = DatePrecision::Unknown;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['marriage:read', 'marriage:write'])]
    private bool $isDivorced = false;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['marriage:read', 'marriage:write'])]
    private ?string $notes = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', nullable: false)]
    #[Groups(['marriage:read'])]
    private User $createdBy;

    public function __construct(string $id = '')
    {
        $this->id = $id ?: Uuid::uuid4()->toString();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getSpouse1(): Person
    {
        return $this->spouse1;
    }

    public function setSpouse1(Person $spouse1): static
    {
        $this->spouse1 = $spouse1;

        return $this;
    }

    public function getSpouse2(): Person
    {
        return $this->spouse2;
    }

    public function setSpouse2(Person $spouse2): static
    {
        $this->spouse2 = $spouse2;

        return $this;
    }

    public function getMarriageDate(): ?\DateTimeInterface
    {
        return $this->marriageDate;
    }

    public function setMarriageDate(?\DateTimeInterface $marriageDate): static
    {
        $this->marriageDate = $marriageDate;

        return $this;
    }

    public function getMarriageDatePrecision(): DatePrecision
    {
        return $this->marriageDatePrecision;
    }

    public function setMarriageDatePrecision(DatePrecision $marriageDatePrecision): static
    {
        $this->marriageDatePrecision = $marriageDatePrecision;

        return $this;
    }

    public function getMarriagePlace(): ?string
    {
        return $this->marriagePlace;
    }

    public function setMarriagePlace(?string $marriagePlace): static
    {
        $this->marriagePlace = $marriagePlace;

        return $this;
    }

    public function getDivorceDate(): ?\DateTimeInterface
    {
        return $this->divorceDate;
    }

    public function setDivorceDate(?\DateTimeInterface $divorceDate): static
    {
        $this->divorceDate = $divorceDate;
        if ($divorceDate !== null) {
            $this->isDivorced = true;
        }

        return $this;
    }

    public function getDivorceDatePrecision(): DatePrecision
    {
        return $this->divorceDatePrecision;
    }

    public function setDivorceDatePrecision(DatePrecision $divorceDatePrecision): static
    {
        $this->divorceDatePrecision = $divorceDatePrecision;

        return $this;
    }

    public function isDivorced(): bool
    {
        return $this->isDivorced;
    }

    public function setIsDivorced(bool $isDivorced): static
    {
        $this->isDivorced = $isDivorced;

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

    #[Groups(['marriage:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }

    #[Groups(['marriage:read'])]
    public function getUpdatedAtIso(): string
    {
        return $this->updatedAt->format(\DateTimeInterface::ATOM);
    }
}
