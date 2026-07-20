<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Media;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<Media, Media>
 */
class MediaStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Media
    {
        /** @var Media $data */
        if ($data->getUploadedBy() === null) {
            $user = $this->security->getUser();
            if ($user instanceof \App\Entity\User) {
                $data->setUploadedBy($user);
            }
        }

        $this->em->persist($data);
        $this->em->flush();

        return $data;
    }
}
