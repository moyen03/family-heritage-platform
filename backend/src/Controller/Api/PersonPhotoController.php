<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Repository\PersonRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class PersonPhotoController extends AbstractController
{
    public function __construct(
        private PersonRepository $personRepository,
        private EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/persons/{id}/photo', name: 'api_person_photo_upload', methods: ['POST'])]
    #[IsGranted('ROLE_MEMBER')]
    public function upload(string $id, Request $request): JsonResponse
    {
        $person = $this->personRepository->find($id);
        if (!$person) {
            return $this->json(['error' => 'Person not found'], 404);
        }

        $file = $request->files->get('photo');
        if (!$file) {
            return $this->json(['error' => 'No photo file provided. Use field name "photo".'], 400);
        }

        // Validate mime type
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
            return $this->json(['error' => 'Only JPEG, PNG, GIF, or WebP images are allowed.'], 400);
        }

        // Validate size (max 5 MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            return $this->json(['error' => 'Image must be smaller than 5 MB.'], 400);
        }

        $projectDir = $this->getParameter('kernel.project_dir');
        assert(is_string($projectDir));

        // Delete old file if exists
        $oldPath = $person->getProfilePicturePath();
        if ($oldPath) {
            $fullOldPath = $projectDir . '/public' . $oldPath;
            if (file_exists($fullOldPath)) {
                @unlink($fullOldPath);
            }
        }

        // Ensure upload directory exists
        $uploadDir = $projectDir . '/public/uploads/persons';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0o755, true);
        }

        // Generate unique filename
        $ext = $file->guessExtension() ?? 'jpg';
        $filename = uniqid('person_', true) . '.' . $ext;

        $file->move($uploadDir, $filename);

        $urlPath = '/uploads/persons/' . $filename;
        $person->setProfilePicturePath($urlPath);
        $this->em->flush();

        return $this->json([
            'profilePictureUrl' => $urlPath,
        ]);
    }

    #[Route('/api/persons/{id}/photo', name: 'api_person_photo_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_MEMBER')]
    public function delete(string $id): JsonResponse
    {
        $person = $this->personRepository->find($id);
        if (!$person) {
            return $this->json(['error' => 'Person not found'], 404);
        }

        $projectDir = $this->getParameter('kernel.project_dir');
        assert(is_string($projectDir));

        $oldPath = $person->getProfilePicturePath();
        if ($oldPath) {
            $fullPath = $projectDir . '/public' . $oldPath;
            if (file_exists($fullPath)) {
                @unlink($fullPath);
            }
            $person->setProfilePicturePath(null);
            $this->em->flush();
        }

        return $this->json(['message' => 'Profile picture removed.']);
    }
}
