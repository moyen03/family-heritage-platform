<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Enum\MediaType;
use App\Enum\PrivacyLevel;
use App\Repository\MediaRepository;
use App\Trait\TimestampableTrait;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;
use Vich\UploaderBundle\Mapping\Annotation as Vich;

#[ORM\Entity(repositoryClass: MediaRepository::class)]
#[ORM\Table(name: 'media')]
#[ORM\HasLifecycleCallbacks]
#[Vich\Uploadable]
#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/media',
            normalizationContext: ['groups' => ['media:read']],
            security: "is_granted('ROLE_VIEWER')",
            paginationEnabled: false,
        ),
        new Get(
            uriTemplate: '/media/{id}',
            normalizationContext: ['groups' => ['media:read', 'media:detail']],
            security: "is_granted('ROLE_VIEWER')",
        ),
        new Post(
            uriTemplate: '/media',
            inputFormats: ['multipart' => ['multipart/form-data']],
            normalizationContext: ['groups' => ['media:read']],
            denormalizationContext: ['groups' => ['media:write']],
            security: "is_granted('ROLE_MEMBER')",
            processor: \App\State\MediaStateProcessor::class,
        ),
        new Delete(
            uriTemplate: '/media/{id}',
            security: "is_granted('ROLE_ADMIN') or (is_granted('ROLE_MEMBER') and object.getUploadedBy() == user)",
        ),
    ],
    normalizationContext: ['groups' => ['media:read']],
    denormalizationContext: ['groups' => ['media:write']],
)]
class Media
{
    use TimestampableTrait;

    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['media:read', 'mediatag:read'])]
    private string $id;

    #[ORM\Column(type: 'string', enumType: MediaType::class)]
    #[Groups(['media:read', 'media:write'])]
    private MediaType $mediaType = MediaType::Photo;

    /**
     * @var File|null
     */
    #[Vich\UploadableField(mapping: 'media_files', fileNameProperty: 'storedFilename', size: 'fileSize', mimeType: 'mimeType', originalName: 'originalFilename')]
    #[Groups(['media:write'])]
    private ?File $file = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['media:read'])]
    private ?string $originalFilename = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['media:read'])]
    private ?string $storedFilename = null;

    #[ORM\Column(type: 'string', length: 100, nullable: true)]
    #[Groups(['media:read'])]
    private ?string $mimeType = null;

    #[ORM\Column(type: 'bigint', nullable: true)]
    #[Groups(['media:read'])]
    private ?int $fileSize = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['media:read', 'media:write'])]
    #[Assert\Length(max: 255)]
    private ?string $title = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['media:read', 'media:write', 'media:detail'])]
    private ?string $description = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Groups(['media:read', 'media:write'])]
    private ?\DateTimeInterface $dateTaken = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['media:read', 'media:write'])]
    #[Assert\Length(max: 255)]
    private ?string $placeTaken = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    #[Groups(['media:read', 'media:write'])]
    #[Assert\Length(max: 255)]
    private ?string $source = null;

    #[ORM\Column(type: 'string', enumType: PrivacyLevel::class)]
    #[Groups(['media:read', 'media:write'])]
    private PrivacyLevel $privacyLevel = PrivacyLevel::Family;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['media:read'])]
    private ?User $uploadedBy = null;

    /** @var Collection<int, MediaTag> */
    #[ORM\OneToMany(targetEntity: MediaTag::class, mappedBy: 'media', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['media:detail'])]
    private Collection $tags;

    public function __construct()
    {
        $this->id   = Uuid::uuid4()->toString();
        $this->tags = new ArrayCollection();
    }

    public function getId(): string { return $this->id; }

    public function getMediaType(): MediaType { return $this->mediaType; }
    public function setMediaType(MediaType $mediaType): self { $this->mediaType = $mediaType; return $this; }

    public function getFile(): ?File { return $this->file; }
    public function setFile(?File $file): self
    {
        $this->file = $file;
        if ($file !== null) {
            $this->updatedAt = new \DateTimeImmutable();
        }
        return $this;
    }

    public function getOriginalFilename(): ?string { return $this->originalFilename; }
    public function setOriginalFilename(?string $originalFilename): self { $this->originalFilename = $originalFilename; return $this; }

    public function getStoredFilename(): ?string { return $this->storedFilename; }
    public function setStoredFilename(?string $storedFilename): self { $this->storedFilename = $storedFilename; return $this; }

    public function getMimeType(): ?string { return $this->mimeType; }
    public function setMimeType(?string $mimeType): self { $this->mimeType = $mimeType; return $this; }

    public function getFileSize(): ?int { return $this->fileSize; }
    public function setFileSize(?int $fileSize): self { $this->fileSize = $fileSize; return $this; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(?string $title): self { $this->title = $title; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): self { $this->description = $description; return $this; }

    public function getDateTaken(): ?\DateTimeInterface { return $this->dateTaken; }
    public function setDateTaken(?\DateTimeInterface $dateTaken): self { $this->dateTaken = $dateTaken; return $this; }

    public function getPlaceTaken(): ?string { return $this->placeTaken; }
    public function setPlaceTaken(?string $placeTaken): self { $this->placeTaken = $placeTaken; return $this; }

    public function getSource(): ?string { return $this->source; }
    public function setSource(?string $source): self { $this->source = $source; return $this; }

    public function getPrivacyLevel(): PrivacyLevel { return $this->privacyLevel; }
    public function setPrivacyLevel(PrivacyLevel $privacyLevel): self { $this->privacyLevel = $privacyLevel; return $this; }

    public function getUploadedBy(): ?User { return $this->uploadedBy; }
    public function setUploadedBy(?User $uploadedBy): self { $this->uploadedBy = $uploadedBy; return $this; }

    /** @return Collection<int, MediaTag> */
    public function getTags(): Collection { return $this->tags; }
}

