<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Person;
use App\Entity\PersonName;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * @implements ProcessorInterface<PersonName, PersonName|null>
 */
final class PersonNameStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?PersonName
    {
        if (!$data instanceof PersonName) {
            return null;
        }

        if ($operation instanceof Delete) {
            $this->entityManager->remove($data);
            $this->entityManager->flush();
            return null;
        }

        // Inject the parent Person from the URI variable (personId)
        if (isset($uriVariables['personId'])) {
            $person = $this->entityManager->find(Person::class, $uriVariables['personId']);
            if ($person === null) {
                throw new NotFoundHttpException(sprintf('Person "%s" not found.', $uriVariables['personId']));
            }
            $data->setPerson($person);
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}
