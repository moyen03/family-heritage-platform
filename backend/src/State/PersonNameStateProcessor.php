<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\PersonName;
use Doctrine\ORM\EntityManagerInterface;

/**
 * @implements ProcessorInterface<PersonName, PersonName|null>
 */
final class PersonNameStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?PersonName
    {
        assert($data instanceof PersonName);

        if ($operation instanceof Delete) {
            $this->entityManager->remove($data);
            $this->entityManager->flush();
            return null;
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}

