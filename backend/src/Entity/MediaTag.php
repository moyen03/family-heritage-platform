<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Post;
use App\Repository\MediaTagRepository;
use Doctrine\ORM\Mapping as ORM;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: MediaTagRepository::class)]
#[ORM\Table(name: 'media_tag')]
#[ORM\UniqueConstraint(name: 'unique_media_person', columns: ['media_id', 'person_id'])]
#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/media/{mediaId}/tags',
            uriVariables: [
                'mediaId' => new Link(fromClass: Media::class, identifiers: ['id'], toProperty: 'media'),
            ],
            normalizationContext: ['groups' => ['mediatag:read']],
            security: "is_granted('ROLE_VIEWER')",
        ),
        new Post(
            uriTemplate: '/media/{mediaId}/tags',
            uriVariables: [
                'mediaId' => new Link(fromClass: Media::class, identifiers: ['id'], toProperty: 'media'),
            ],
            normalizationContext: ['groups' => ['mediatag:read']],
            denormalizationContext: ['groups' => ['mediatag:write']],
            security: "is_granted('ROLE_MEMBER')",
        ),
        new Delete(
            uriTemplate: '/media/{mediaId}/tags/{id}',
            uriVariables: [
                'mediaId' => new Link(fromClass: Media::class, identifiers: ['id'], toProperty: 'media'),
                'id'      => new Link(fromClass: MediaTag::class, identifiers: ['id']),
            ],
            security: "is_granted('ROLE_ADMIN') or is_granted('ROLE_MEMBER')",
        ),
    ],
)]
class MediaTag
{
    #[ORM\Id]
    #[ORM\Column(type: 'string', length: 36)]
    #[Groups(['mediatag:read'])]
    private string $id;

    #[ORM\ManyToOne(targetEntity: Media::class, inversedBy: 'tags')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Media $media;

    #[ORM\ManyToOne(targetEntity: Person::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['mediatag:read', 'mediatag:write'])]
    private Person $person;

    #[ORM\Column(type: 'datetime_immutable')]
    #[Groups(['mediatag:read'])]
    private \DateTimeImmutable $taggedAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['mediatag:read'])]
    private ?User $taggedBy = null;

    public function __construct()
    {
        $this->id       = Uuid::uuid4()->toString();
        $this->taggedAt = new \DateTimeImmutable();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getMedia(): Media
    {
        return $this->media;
    }
    public function setMedia(Media $media): self
    {
        $this->media = $media;
        return $this;
    }

    public function getPerson(): Person
    {
        return $this->person;
    }
    public function setPerson(Person $person): self
    {
        $this->person = $person;
        return $this;
    }

    public function getTaggedAt(): \DateTimeImmutable
    {
        return $this->taggedAt;
    }

    public function getTaggedBy(): ?User
    {
        return $this->taggedBy;
    }
    public function setTaggedBy(?User $taggedBy): self
    {
        $this->taggedBy = $taggedBy;
        return $this;
    }
}
