<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Branch;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<Branch, Branch>
 */
class BranchStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Branch
    {
        /** @var Branch $data */
        $user = $this->security->getUser();
        if ($user instanceof User && !$this->em->contains($data)) {
            $data->setCreatedBy($user);
        }

        $this->em->persist($data);
        $this->em->flush();

        return $data;
    }
}
