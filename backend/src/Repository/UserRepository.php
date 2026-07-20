<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }
        $user->setPasswordHash($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => $email, 'deletedAt' => null]);
    }

    /** @return array<int, User> */
    public function findActive(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.isActive = :active')
            ->andWhere('u.deletedAt IS NULL')
            ->setParameter('active', true)
            ->orderBy('u.lastName', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find active users, optionally filtered by a name/email search string.
     *
     * @return array<int, User>
     */
    public function findActiveUsers(string $search = ''): array
    {
        $qb = $this->createQueryBuilder('u')
            ->where('u.isActive = :active')
            ->andWhere('u.deletedAt IS NULL')
            ->setParameter('active', true)
            ->orderBy('u.lastName', 'ASC')
            ->addOrderBy('u.firstName', 'ASC');

        if ($search !== '') {
            $qb->andWhere(
                $qb->expr()->orX(
                    'LOWER(u.firstName) LIKE :q',
                    'LOWER(u.lastName)  LIKE :q',
                    'LOWER(u.email)     LIKE :q'
                )
            )->setParameter('q', '%' . mb_strtolower($search) . '%');
        }

        return $qb->getQuery()->getResult();
    }
}
