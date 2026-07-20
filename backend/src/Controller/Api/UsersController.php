<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
class UsersController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {
    }

    /** List all users (Super Admin only) */
    #[Route('', name: 'api_users_list', methods: ['GET'])]
    #[IsGranted('ROLE_SUPER_ADMIN')]
    public function list(Request $request): JsonResponse
    {
        $search = $request->query->getString('search', '');
        $users  = $this->userRepository->findActiveUsers($search);

        $result = array_map(fn ($u) => [
            'id'        => $u->getId(),
            'fullName'  => $u->getFullName(),
            'firstName' => $u->getFirstName(),
            'lastName'  => $u->getLastName(),
            'email'     => $u->getEmail(),
            'role'      => $u->getRole()->value,
            'isActive'  => $u->isActive(),
        ], $users);

        return $this->json(['members' => $result, 'count' => count($result)]);
    }
}
