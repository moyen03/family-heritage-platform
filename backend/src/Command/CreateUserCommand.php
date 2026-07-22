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
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-user',
    description: 'Create a user account with a chosen role (super_admin, branch_admin, member, viewer).',
)]
final class CreateUserCommand extends Command
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
            ->addArgument('email',     InputArgument::OPTIONAL, 'Email address')
            ->addArgument('firstName', InputArgument::OPTIONAL, 'First name')
            ->addArgument('lastName',  InputArgument::OPTIONAL, 'Last name')
            ->addArgument('password',  InputArgument::OPTIONAL, 'Password')
            ->addOption('role', 'r', InputOption::VALUE_REQUIRED, 'Role: super_admin | branch_admin | member | viewer', 'member');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Create User – Family Heritage Platform');

        $email     = $input->getArgument('email')     ?? $io->ask('Email address');
        $firstName = $input->getArgument('firstName') ?? $io->ask('First name');
        $lastName  = $input->getArgument('lastName')  ?? $io->ask('Last name');
        $password  = $input->getArgument('password')  ?? $io->askHidden('Password (hidden)');
        $roleStr   = $input->getOption('role');

        if (empty($email) || empty($password) || empty($firstName) || empty($lastName)) {
            $io->error('Email, name, and password are all required.');
            return Command::FAILURE;
        }

        $role = UserRole::tryFrom($roleStr);
        if ($role === null) {
            $io->error("Invalid role \"$roleStr\". Choose from: super_admin, branch_admin, member, viewer");
            return Command::FAILURE;
        }

        $existing = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existing !== null) {
            $io->warning("A user with email \"$email\" already exists.");
            return Command::FAILURE;
        }

        $user = new User(Uuid::uuid4()->toString());
        $user->setEmail($email);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setRole($role);
        $user->setIsActive(true);
        $user->setPasswordHash($this->passwordHasher->hashPassword($user, $password));

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $io->success([
            'User created successfully!',
            "Email:    $email",
            "Name:     $firstName $lastName",
            "Role:     {$role->label()}",
            '',
            'Login at: POST /api/auth/login',
            "Body:     {\"email\": \"$email\", \"password\": \"<your-password>\"}",
        ]);

        return Command::SUCCESS;
    }
}

