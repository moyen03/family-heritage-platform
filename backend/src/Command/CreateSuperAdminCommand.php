<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use App\Enum\UserRole;
use Doctrine\ORM\EntityManagerInterface;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-super-admin',
    description: 'Create the first Super Admin user for the Family Heritage Platform.',
)]
final class CreateSuperAdminCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::OPTIONAL, 'Email address')
            ->addArgument('firstName', InputArgument::OPTIONAL, 'First name')
            ->addArgument('lastName', InputArgument::OPTIONAL, 'Last name')
            ->addArgument('password', InputArgument::OPTIONAL, 'Password');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Create Super Admin – Family Heritage Platform');

        $email     = $input->getArgument('email')     ?? $io->ask('Email address', 'admin@family.local');
        $firstName = $input->getArgument('firstName') ?? $io->ask('First name', 'Super');
        $lastName  = $input->getArgument('lastName')  ?? $io->ask('Last name', 'Admin');
        $password  = $input->getArgument('password')  ?? $io->askHidden('Password (hidden)');

        if (empty($email) || empty($password) || empty($firstName) || empty($lastName)) {
            $io->error('All fields are required.');
            return Command::FAILURE;
        }

        // Check if a user with this email already exists
        $existing = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existing !== null) {
            $io->warning("A user with email \"$email\" already exists.");
            return Command::FAILURE;
        }

        $user = new User(Uuid::uuid4()->toString());
        $user->setEmail($email);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setRole(UserRole::SuperAdmin);
        $user->setIsActive(true);

        $hashed = $this->passwordHasher->hashPassword($user, $password);
        $user->setPasswordHash($hashed);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $io->success([
            'Super Admin created successfully!',
            "Email:    $email",
            "Name:     $firstName $lastName",
            'Role:     Super Admin',
            '',
            'Login at: POST /api/auth/login',
            "Body:     {\"email\": \"$email\", \"password\": \"<your-password>\"}",
        ]);

        return Command::SUCCESS;
    }
}
