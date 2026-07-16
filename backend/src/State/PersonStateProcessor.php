<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Person;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<Person, Person|null>
 */
final class PersonStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Person
    {
        assert($data instanceof Person);

        if ($operation instanceof Delete) {
            $data->softDelete();
            $this->entityManager->flush();
            return null;
        }

        if ($operation instanceof Post) {

            /** @var User $user */
            $user = $this->security->getUser();
            $data->setCreatedBy($user);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}
