<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Marriage;
use App\Entity\Person;
use App\Repository\MarriageRepository;
use App\Repository\PersonRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Provides all marriages for a given person (as either spouse).
 * Powers: GET /persons/{personId}/marriages
 *
 * @implements ProviderInterface<Marriage>
 */
final class MarriageStateProvider implements ProviderInterface
{
    public function __construct(
        private readonly PersonRepository $personRepository,
        private readonly MarriageRepository $marriageRepository,
    ) {
    }

    /**
     * @return Marriage[]
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        $personId = $uriVariables['personId'] ?? null;

        if (!is_string($personId)) {
            throw new NotFoundHttpException('Person not found.');
        }

        /** @var Person|null $person */
        $person = $this->personRepository->find($personId);

        if ($person === null) {
            throw new NotFoundHttpException(sprintf('Person "%s" not found.', $personId));
        }

        return $this->marriageRepository->findForPerson($person);
    }
}
