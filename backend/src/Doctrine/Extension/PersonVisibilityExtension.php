<?php

declare(strict_types=1);

namespace App\Doctrine\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Person;
use App\Enum\Visibility;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final class PersonVisibilityExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(private readonly Security $security) {}

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        Operation $operation = null,
        array $context = [],
    ): void {
        if ($resourceClass !== Person::class) {
            return;
        }

        $this->addFilters($queryBuilder);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        Operation $operation = null,
        array $context = [],
    ): void {
        if ($resourceClass !== Person::class) {
            return;
        }

        $this->addFilters($queryBuilder);
    }

    private function addFilters(QueryBuilder $qb): void
    {
        $alias = $qb->getRootAliases()[0];

        // Always exclude soft-deleted persons
        $qb->andWhere("$alias.deletedAt IS NULL");

        // Super Admins see everything
        if ($this->security->isGranted('ROLE_SUPER_ADMIN')) {
            return;
        }

        $user = $this->security->getUser();

        if ($user === null) {
            // Unauthenticated: only public persons (shouldn't happen with our firewall, but defensive)
            $qb->andWhere("$alias.visibility = :vis")
               ->setParameter('vis', Visibility::Public->value);
            return;
        }

        // Branch Admins and Members can see public + family level
        // Private: only Super Admins (already returned above)
        $qb->andWhere("$alias.visibility IN (:allowed_vis)")
           ->setParameter('allowed_vis', [
               Visibility::Public->value,
               Visibility::Family->value,
               Visibility::Branch->value,
           ]);
    }
}

