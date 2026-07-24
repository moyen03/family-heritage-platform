<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\Branch;
use App\Entity\PersonBranch;
use App\Entity\User;
use App\Enum\UserRole;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchMembershipRepository;
use App\Repository\BranchRepository;
use App\Repository\PersonRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/branches/{branchId}/persons')]
class BranchPersonController extends AbstractController
{
    public function __construct(
        private readonly BranchRepository $branchRepository,
        private readonly PersonRepository $personRepository,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
        private readonly BranchAdminRepository $branchAdminRepo,
        private readonly BranchMembershipRepository $membershipRepo,
    ) {
    }

    /**
     * Returns true if the user is super admin OR is admin of the given branch
     * (via branch_admins table OR branch_memberships with branch_admin role).
     */
    private function isAdminOfBranch(Branch $branch, User $user): bool
    {
        if ($user->getRole() === UserRole::SuperAdmin) {
            return true;
        }

        $branchId = $branch->getId();

        $adminBranches = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
        if (in_array($branchId, $adminBranches, true)) {
            return true;
        }

        $memberAdminBranches = $this->membershipRepo->getBranchAdminIdsForUser($user->getId());
        return in_array($branchId, $memberAdminBranches, true);
    }

    /** List all persons in a branch */
    #[Route('', name: 'api_branch_persons_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(string $branchId): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        $members = [];
        foreach ($branch->getPersonBranches() as $pb) {
            $p = $pb->getPerson();
            $members[] = [
                'id'        => $p->getId(),
                'fullName'  => $p->getFullName(),
                'firstName' => $p->getFirstName(),
                'lastName'  => $p->getLastName(),
                'gender'    => $p->getGender()->value,
                'isLiving'  => $p->isLiving(),
                'birthDate' => $p->getBirthDate()?->format('Y-m-d'),
                'isPrimary' => $pb->isPrimary(),
            ];
        }

        return $this->json(['members' => $members, 'count' => count($members)]);
    }

    /** Assign a person to a branch */
    #[Route('', name: 'api_branch_persons_assign', methods: ['POST'])]
    #[IsGranted('ROLE_BRANCH_ADMIN')]
    public function assign(string $branchId, Request $request): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        /** @var User $user */
        $user = $this->security->getUser();
        if (!$this->isAdminOfBranch($branch, $user)) {
            return $this->json(['error' => 'You are not an admin of this branch'], 403);
        }

        $body = json_decode($request->getContent(), true);
        $personId = $body['personId'] ?? null;
        if (!$personId) {
            return $this->json(['error' => 'personId is required'], 400);
        }

        $person = $this->personRepository->find($personId);
        if (!$person) {
            return $this->json(['error' => 'Person not found'], 404);
        }

        // Check not already assigned
        foreach ($branch->getPersonBranches() as $pb) {
            if ($pb->getPerson()->getId() === $person->getId()) {
                return $this->json(['error' => 'Person already in this branch'], 409);
            }
        }

        $isPrimary = (bool) ($body['isPrimary'] ?? false);

        // If marking as primary, clear existing primary for this person
        if ($isPrimary) {
            foreach ($person->getPersonBranches() as $existingPb) {
                if ($existingPb->isPrimary()) {
                    $existingPb->setIsPrimary(false);
                }
            }
        }

        $pb = new PersonBranch($person, $branch, $isPrimary);
        $this->em->persist($pb);
        $this->em->flush();

        return $this->json([
            'message'   => 'Person assigned to branch',
            'personId'  => $person->getId(),
            'branchId'  => $branch->getId(),
            'isPrimary' => $isPrimary,
        ], 201);
    }

    /** Remove a person from a branch */
    #[Route('/{personId}', name: 'api_branch_persons_remove', methods: ['DELETE'])]
    #[IsGranted('ROLE_BRANCH_ADMIN')]
    public function remove(string $branchId, string $personId): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        /** @var User $user */
        $user = $this->security->getUser();
        if (!$this->isAdminOfBranch($branch, $user)) {
            return $this->json(['error' => 'You are not an admin of this branch'], 403);
        }

        $person = $this->personRepository->find($personId);
        if (!$person) {
            return $this->json(['error' => 'Person not found'], 404);
        }

        foreach ($branch->getPersonBranches() as $pb) {
            if ($pb->getPerson()->getId() === $person->getId()) {
                $this->em->remove($pb);
                $this->em->flush();

                return $this->json(['message' => 'Person removed from branch']);
            }
        }

        return $this->json(['error' => 'Person is not in this branch'], 404);
    }
}
