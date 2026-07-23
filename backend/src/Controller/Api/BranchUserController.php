<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\BranchAdmin;
use App\Entity\BranchMembership;
use App\Enum\BranchMemberRole;
use App\Repository\BranchRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/branches/{branchId}/users')]
class BranchUserController extends AbstractController
{
    public function __construct(
        private readonly BranchRepository $branchRepository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {
    }

    /** List all user members of a branch */
    #[Route('', name: 'api_branch_users_list', methods: ['GET'])]
    #[IsGranted('ROLE_SUPER_ADMIN')]
    public function list(string $branchId): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        $members = [];
        foreach ($branch->getMemberships() as $m) {
            $u = $m->getUser();
            $members[] = [
                'id'        => $u->getId(),
                'fullName'  => $u->getFullName(),
                'firstName' => $u->getFirstName(),
                'lastName'  => $u->getLastName(),
                'email'     => $u->getEmail(),
                'role'      => $m->getRole()->value,
                'joinedAt'  => $m->getJoinedAt()->format(\DateTimeInterface::ATOM),
                'invitedBy' => $m->getInvitedBy()->getFullName(),
            ];
        }

        return $this->json(['members' => $members, 'count' => count($members)]);
    }

    /** Add a user to a branch */
    #[Route('', name: 'api_branch_users_add', methods: ['POST'])]
    #[IsGranted('ROLE_SUPER_ADMIN')]
    public function add(string $branchId, Request $request): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        $body   = json_decode($request->getContent(), true) ?? [];
        $userId = $body['userId'] ?? null;
        if (!$userId) {
            return $this->json(['error' => 'userId is required'], 400);
        }

        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Check not already a member
        if ($branch->hasMembership($user)) {
            return $this->json(['error' => 'User is already a member of this branch'], 409);
        }

        $allowedRoles = array_map(fn ($c) => $c->value, BranchMemberRole::cases());
        $roleValue    = $body['role'] ?? BranchMemberRole::Member->value;
        $role         = BranchMemberRole::tryFrom($roleValue) ?? BranchMemberRole::Member;

        if (!in_array($roleValue, $allowedRoles, true)) {
            return $this->json(['error' => 'Invalid role. Allowed: ' . implode(', ', $allowedRoles)], 400);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->security->getUser();

        $membership = new BranchMembership($branch, $user, $currentUser, $role);
        $this->em->persist($membership);

        // Sync branch_admins table
        if ($role === BranchMemberRole::BranchAdmin) {
            $branchAdmin = new BranchAdmin($branch, $user, $currentUser);
            $this->em->persist($branchAdmin);
        }

        $this->em->flush();

        return $this->json([
            'message'  => 'User added to branch',
            'userId'   => $user->getId(),
            'branchId' => $branch->getId(),
            'role'     => $role->value,
        ], 201);
    }

    /** Remove a user from a branch */
    #[Route('/{userId}', name: 'api_branch_users_remove', methods: ['DELETE'])]
    #[IsGranted('ROLE_SUPER_ADMIN')]
    public function remove(string $branchId, string $userId): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        foreach ($branch->getMemberships() as $m) {
            if ($m->getUser()->getId() === $user->getId()) {
                $this->em->remove($m);

                // Also remove from branch_admins if present
                $branchAdmin = $this->em->getRepository(BranchAdmin::class)
                    ->findOneBy(['branch' => $branch, 'user' => $user]);
                if ($branchAdmin) {
                    $this->em->remove($branchAdmin);
                }

                $this->em->flush();
                return $this->json(['message' => 'User removed from branch']);
            }
        }

        return $this->json(['error' => 'User is not a member of this branch'], 404);
    }

    /** Update a user's role in a branch */
    #[Route('/{userId}', name: 'api_branch_users_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_SUPER_ADMIN')]
    public function update(string $branchId, string $userId, Request $request): JsonResponse
    {
        $branch = $this->branchRepository->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        $body      = json_decode($request->getContent(), true) ?? [];
        $roleValue = $body['role'] ?? null;
        $role      = $roleValue ? BranchMemberRole::tryFrom($roleValue) : null;

        $allowedRoles = array_map(fn ($c) => $c->value, BranchMemberRole::cases());
        if ($role === null || !in_array($roleValue, $allowedRoles, true)) {
            return $this->json(['error' => 'Invalid or missing role. Allowed: ' . implode(', ', $allowedRoles)], 400);
        }

        /** @var \App\Entity\User $currentUser */
        $currentUser = $this->security->getUser();

        foreach ($branch->getMemberships() as $m) {
            if ($m->getUser()->getId() === $user->getId()) {
                $previousRole = $m->getRole();
                $m->setRole($role);

                // Sync branch_admins table
                $existingBranchAdmin = $this->em->getRepository(BranchAdmin::class)
                    ->findOneBy(['branch' => $branch, 'user' => $user]);

                if ($role === BranchMemberRole::BranchAdmin && !$existingBranchAdmin) {
                    $this->em->persist(new BranchAdmin($branch, $user, $currentUser));
                } elseif ($role !== BranchMemberRole::BranchAdmin && $existingBranchAdmin) {
                    $this->em->remove($existingBranchAdmin);
                }

                $this->em->flush();
                return $this->json([
                    'message' => 'Role updated',
                    'userId'  => $user->getId(),
                    'role'    => $role->value,
                ]);
            }
        }

        return $this->json(['error' => 'User is not a member of this branch'], 404);
    }
}
