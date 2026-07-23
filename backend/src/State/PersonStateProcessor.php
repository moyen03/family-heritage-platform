<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Person;
use App\Entity\PersonBranch;
use App\Entity\User;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchMembershipRepository;
use App\Repository\BranchRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * @implements ProcessorInterface<Person, Person|null>
 */
final class PersonStateProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly Security $security,
        private readonly BranchAdminRepository $branchAdminRepo,
        private readonly BranchMembershipRepository $membershipRepo,
        private readonly BranchRepository $branchRepository,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): ?Person
    {
        if (!$data instanceof Person) {
            return null;
        }

        if ($operation instanceof Delete) {
            $data->softDelete();
            $this->entityManager->flush();
            return null;
        }

        if ($operation instanceof Post) {
            /** @var User $user */
            $user = $this->security->getUser();
            $data->setCreatedBy($user);

            // If the creator is a Branch Admin (but not Super Admin), auto-assign
            // the new person to their branch(es) so the person stays visible
            // immediately after creation (PersonVisibilityExtension requires
            // at least one branch assignment to be visible to non-super-admins).
            if (!$this->security->isGranted('ROLE_SUPER_ADMIN')
                && $this->security->isGranted('ROLE_BRANCH_ADMIN')
            ) {
                $adminBranchIds      = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
                $memberAdminBranchIds = $this->membershipRepo->getBranchAdminIdsForUser($user->getId());
                $branchIds = array_values(array_unique(array_merge($adminBranchIds, $memberAdminBranchIds)));

                $this->entityManager->persist($data);
                $this->entityManager->flush(); // need the person ID before creating PersonBranch

                foreach ($branchIds as $branchId) {
                    $branch = $this->branchRepository->find($branchId);
                    if ($branch === null) {
                        continue;
                    }
                    $personBranch = new PersonBranch($data, $branch, false);
                    $this->entityManager->persist($personBranch);
                }

                $this->entityManager->flush();
                return $data;
            }
        }

        $this->entityManager->persist($data);
        $this->entityManager->flush();

        return $data;
    }
}
