<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Address;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Address>
 */
class AddressRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Address::class);
    }

    /** @return Address[] */
    public function findByPersonId(string $personId): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.person = :personId')
            ->setParameter('personId', $personId)
            ->orderBy('a.fromDate', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Returns all addresses that have coordinates, useful for map rendering.
     *
     * @return Address[]
     */
    public function findWithCoordinates(): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.latitude IS NOT NULL')
            ->andWhere('a.longitude IS NOT NULL')
            ->orderBy('a.country', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
