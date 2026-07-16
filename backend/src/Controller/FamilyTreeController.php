<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Person;
use App\Service\FamilyTreeService;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

#[Route('/api/persons/{id}')]
#[IsGranted('ROLE_USER')]
final class FamilyTreeController extends AbstractController
{
    public function __construct(
        private readonly FamilyTreeService $familyTreeService,
        private readonly NormalizerInterface $normalizer,
    ) {
    }

    /**
     * GET /api/persons/{id}/ancestors?depth=10
     *
     * Returns all ancestors of the given person, ordered by generation.
     * Generation 1 = parents, 2 = grandparents, 3 = great-grandparents, …
     */
    #[Route('/ancestors', methods: ['GET'])]
    public function ancestors(
        #[MapEntity(id: 'id')]
        Person $person,
        Request $request,
    ): JsonResponse {
        $depth = $this->parseDepth($request);
        $nodes = $this->familyTreeService->getAncestors($person, $depth);

        return $this->buildResponse('ancestors', $person, $nodes, $depth);
    }

    /**
     * GET /api/persons/{id}/descendants?depth=10
     *
     * Returns all descendants of the given person, ordered by generation.
     * Generation 1 = children, 2 = grandchildren, 3 = great-grandchildren, …
     */
    #[Route('/descendants', methods: ['GET'])]
    public function descendants(
        #[MapEntity(id: 'id')]
        Person $person,
        Request $request,
    ): JsonResponse {
        $depth = $this->parseDepth($request);
        $nodes = $this->familyTreeService->getDescendants($person, $depth);

        return $this->buildResponse('descendants', $person, $nodes, $depth);
    }

    // -------------------------------------------------------------------------

    private function parseDepth(Request $request): int
    {
        $depth = (int) $request->query->get('depth', FamilyTreeService::DEFAULT_MAX_DEPTH);

        return max(1, min($depth, 20)); // clamp between 1 and 20
    }

    /**
     * @param array<int, \App\DTO\PersonTreeNode> $nodes
     */
    private function buildResponse(string $type, Person $person, array $nodes, int $depth): JsonResponse
    {
        $maxGeneration = empty($nodes) ? 0 : max(array_map(
            static fn ($n) => $n->generation,
            $nodes
        ));

        /** @var array<int, mixed> $items */
        $items = $this->normalizer->normalize($nodes, 'json', ['groups' => ['tree:read', 'person:read']]);

        return $this->json([
            'type' => $type,
            'rootPerson' => [
                'id' => $person->getId(),
                'fullName' => $person->getFullName(),
            ],
            'maxDepthRequested' => $depth,
            'depthReached' => $maxGeneration,
            'count' => count($nodes),
            'members' => $items,
        ]);
    }
}
