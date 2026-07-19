<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Enum\AddressType;
use App\Repository\AddressRepository;
use App\Trait\TimestampableTrait;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/addresses',
            security: "is_granted('ROLE_USER')",
            paginationEnabled: false,
        ),
        new Post(
            uriTemplate: '/addresses',
            security: "is_granted('ROLE_MEMBER')",
        ),
        new Get(
            uriTemplate: '/addresses/{id}',
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            uriTemplate: '/addresses/{id}',
            security: "is_granted('ROLE_MEMBER')",
        ),
        new Delete(
            uriTemplate: '/addresses/{id}',
            security: "is_granted('ROLE_BRANCH_ADMIN')",
        ),
    ],
    normalizationContext: ['groups' => ['address:read']],
    denormalizationContext: ['groups' => ['address:write']],
    order: ['country' => 'ASC', 'city' => 'ASC'],
)]
#[ApiFilter(SearchFilter::class, properties: ['person' => 'exact', 'person.id' => 'exact', 'addressType' => 'exact', 'country' => 'partial'])]
#[ORM\Entity(repositoryClass: AddressRepository::class)]
#[ORM\Table(name: 'addresses')]
#[ORM\HasLifecycleCallbacks]
class Address
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['address:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Person::class, inversedBy: 'addresses')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\NotNull]
    private Person $person;

    #[ORM\Column(type: 'string', enumType: AddressType::class)]
    #[Groups(['address:read', 'address:write'])]
    private AddressType $addressType = AddressType::Current;

    #[ORM\Column(type: 'string', length: 100)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private string $country;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\Length(max: 100)]
    private ?string $stateProvince = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\Length(max: 100)]
    private ?string $district = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\Length(max: 100)]
    private ?string $city = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\Length(max: 100)]
    private ?string $village = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\Length(max: 255)]
    private ?string $street = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    #[Assert\Length(max: 20)]
    private ?string $postalCode = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 8, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    private ?string $latitude = null;

    #[ORM\Column(type: 'decimal', precision: 11, scale: 8, nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    private ?string $longitude = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    private ?\DateTimeInterface $fromDate = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    private ?\DateTimeInterface $toDate = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['address:read', 'address:write'])]
    private ?string $notes = null;

    public function __construct()
    {
        $this->id = Uuid::uuid4()->toString();
    }

    public function getId(): string { return $this->id; }

    public function getPerson(): Person { return $this->person; }
    public function setPerson(Person $person): static { $this->person = $person; return $this; }

    public function getAddressType(): AddressType { return $this->addressType; }
    public function setAddressType(AddressType $addressType): static { $this->addressType = $addressType; return $this; }

    public function getCountry(): string { return $this->country; }
    public function setCountry(string $country): static { $this->country = $country; return $this; }

    public function getStateProvince(): ?string { return $this->stateProvince; }
    public function setStateProvince(?string $stateProvince): static { $this->stateProvince = $stateProvince; return $this; }

    public function getDistrict(): ?string { return $this->district; }
    public function setDistrict(?string $district): static { $this->district = $district; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): static { $this->city = $city; return $this; }

    public function getVillage(): ?string { return $this->village; }
    public function setVillage(?string $village): static { $this->village = $village; return $this; }

    public function getStreet(): ?string { return $this->street; }
    public function setStreet(?string $street): static { $this->street = $street; return $this; }

    public function getPostalCode(): ?string { return $this->postalCode; }
    public function setPostalCode(?string $postalCode): static { $this->postalCode = $postalCode; return $this; }

    public function getLatitude(): ?string { return $this->latitude; }
    public function setLatitude(?string $latitude): static { $this->latitude = $latitude; return $this; }

    public function getLongitude(): ?string { return $this->longitude; }
    public function setLongitude(?string $longitude): static { $this->longitude = $longitude; return $this; }

    public function getFromDate(): ?\DateTimeInterface { return $this->fromDate; }
    public function setFromDate(?\DateTimeInterface $fromDate): static { $this->fromDate = $fromDate; return $this; }

    public function getToDate(): ?\DateTimeInterface { return $this->toDate; }
    public function setToDate(?\DateTimeInterface $toDate): static { $this->toDate = $toDate; return $this; }

    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): static { $this->notes = $notes; return $this; }

    #[Groups(['address:read'])]
    public function getDisplayLabel(): string
    {
        $parts = array_filter([
            $this->village ?? $this->city,
            $this->stateProvince ?? $this->district,
            $this->country,
        ]);
        return implode(', ', $parts) ?: $this->country;
    }

    #[Groups(['address:read'])]
    public function getCreatedAtIso(): string
    {
        return $this->createdAt->format(\DateTimeInterface::ATOM);
    }

    #[Groups(['address:read'])]
    public function getUpdatedAtIso(): string
    {
        return $this->updatedAt->format(\DateTimeInterface::ATOM);
    }
}

