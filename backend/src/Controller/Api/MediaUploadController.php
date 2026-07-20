<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\Media;
use App\Entity\User;
use App\Enum\MediaType;
use App\Enum\PrivacyLevel;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class MediaUploadController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {
    }

    #[Route('/api/media/upload', name: 'api_media_upload', methods: ['POST'])]
    #[IsGranted('ROLE_MEMBER')]
    public function upload(Request $request): JsonResponse
    {
        $file = $request->files->get('file');
        if (!$file) {
            return $this->json(['error' => 'No file provided. Use field name "file".'], 400);
        }

        // Capture metadata before moving the file
        $originalName = $file->getClientOriginalName();
        $mimeType     = $file->getMimeType() ?? 'application/octet-stream';
        $fileSize     = $file->getSize();
        $ext          = $file->guessExtension()
            ?? pathinfo($originalName, PATHINFO_EXTENSION);

        if ($fileSize > 50 * 1024 * 1024) {
            return $this->json(['error' => 'File too large (max 50 MB).'], 400);
        }

        // Ensure upload directory exists
        $projectDir = $this->getParameter('kernel.project_dir');
        assert(is_string($projectDir));
        $uploadDir = $projectDir . '/public/uploads/media';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0o755, true);
        }

        $storedName = uniqid('media_', true) . '.' . $ext;
        $file->move($uploadDir, $storedName);

        // Build entity
        $media = new Media();
        $media->setOriginalFilename($originalName);
        $media->setStoredFilename($storedName);
        $media->setMimeType($mimeType);
        $media->setFileSize($fileSize);

        // Media type
        $mediaTypeStr = $request->request->get('mediaType', 'photo');
        try {
            $media->setMediaType(MediaType::from((string) $mediaTypeStr));
        } catch (\ValueError) {
            $media->setMediaType(MediaType::Photo);
        }

        // Privacy level
        $privacyStr = $request->request->get('privacyLevel', 'family');
        try {
            $media->setPrivacyLevel(PrivacyLevel::from((string) $privacyStr));
        } catch (\ValueError) {
            $media->setPrivacyLevel(PrivacyLevel::Family);
        }

        // Optional metadata
        if ($title = $request->request->get('title')) {
            $media->setTitle((string) $title);
        }
        if ($desc = $request->request->get('description')) {
            $media->setDescription((string) $desc);
        }
        if ($dateTaken = $request->request->get('dateTaken')) {
            try {
                $media->setDateTaken(new \DateTime((string) $dateTaken));
            } catch (\Exception) {
                // ignore invalid date
            }
        }
        if ($place = $request->request->get('placeTaken')) {
            $media->setPlaceTaken((string) $place);
        }
        if ($source = $request->request->get('source')) {
            $media->setSource((string) $source);
        }

        // Assign uploader
        $user = $this->security->getUser();
        if ($user instanceof User) {
            $media->setUploadedBy($user);
        }

        $this->em->persist($media);
        $this->em->flush();

        return $this->json([
            'id'               => $media->getId(),
            'mediaType'        => $media->getMediaType()->value,
            'originalFilename' => $originalName,
            'storedFilename'   => $storedName,
            'mimeType'         => $mimeType,
            'fileSize'         => $fileSize,
            'privacyLevel'     => $media->getPrivacyLevel()->value,
            'title'            => $media->getTitle(),
        ], 201);
    }
}
