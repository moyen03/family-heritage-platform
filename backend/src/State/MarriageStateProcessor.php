<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Marriage;
use App\Entity\User;
use App\Repository\MarriageRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * @implements ProcessorInterface<Marriage, Marriage|null>
 */
final class MarriageStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MarriageRepository $marriageRepository,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Marriage
    {
        if (!$data instanceof Marriage) {
            return null;
        }

        if ($operation instanceof Delete) {
            $data->softDelete();
            $this->entityManager->flush();

            return null;
        }

        if ($operation instanceof Post) {
            /** @var User $user */
            $user = $this->security->getUser();
            $data->setCreatedBy($user);

            $this->validateMarriage($data);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }

    private function validateMarriage(Marriage $marriage): void
    {
        if ($marriage->getSpouse1()->getId() === $marriage->getSpouse2()->getId()) {
            throw new BadRequestHttpException('A person cannot be married to themselves.');
        }

        if ($this->marriageRepository->activeMarriageExists(
            $marriage->getSpouse1(),
            $marriage->getSpouse2(),
        )) {
            throw new ConflictHttpException(
                'An active marriage between these two persons already exists.'
            );
        }
    }
}
