<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\PersonName;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PersonName>
 */
class PersonNameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PersonName::class);
    }

    /**
     * @return PersonName[]
     */
    public function findByPerson(string $personId): array
    {
        return $this->createQueryBuilder('pn')
            ->where('pn.person = :personId')
            ->setParameter('personId', $personId)
            ->orderBy('pn.nameType', 'ASC')
            ->addOrderBy('pn.fromDate', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
