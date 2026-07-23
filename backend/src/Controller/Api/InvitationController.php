<?php

declare(strict_types=1);

namespace App\Controller\Api;

use App\Entity\BranchAdmin;
use App\Entity\BranchInvitation;
use App\Entity\BranchMembership;
use App\Entity\User;
use App\Enum\BranchMemberRole;
use App\Enum\UserRole;
use App\Repository\BranchAdminRepository;
use App\Repository\BranchInvitationRepository;
use App\Repository\BranchMembershipRepository;
use App\Repository\BranchRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Ramsey\Uuid\Uuid;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class InvitationController extends AbstractController
{
    public function __construct(
        private readonly BranchRepository $branchRepo,
        private readonly BranchInvitationRepository $inviteRepo,
        private readonly UserRepository $userRepo,
        private readonly EntityManagerInterface $em,
        private readonly Security $security,
        private readonly MailerInterface $mailer,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly BranchAdminRepository $branchAdminRepo,
        private readonly BranchMembershipRepository $membershipRepo,
    ) {
    }

    /**
     * Returns true if the given user is super admin OR is admin of the given branch
     * (via branch_admins table OR branch_memberships with branch_admin role).
     */
    private function isAdminOfBranch(\App\Entity\Branch $branch, User $user): bool
    {
        if ($user->getRole() === UserRole::SuperAdmin) {
            return true;
        }

        $branchId      = $branch->getId();
        $adminBranches = $this->branchAdminRepo->getBranchIdsForUser($user->getId());
        if (in_array($branchId, $adminBranches, true)) {
            return true;
        }

        $memberAdminBranches = $this->membershipRepo->getBranchAdminIdsForUser($user->getId());
        return in_array($branchId, $memberAdminBranches, true);
    }

    /** Send an invitation email to join a branch */
    #[Route('/branches/{branchId}/invite', name: 'api_branch_invite', methods: ['POST'])]
    #[IsGranted('ROLE_BRANCH_ADMIN')]
    public function invite(string $branchId, Request $request): JsonResponse
    {
        $branch = $this->branchRepo->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        /** @var User $inviter */
        $inviter = $this->security->getUser();

        // Ensure the caller is actually admin of THIS branch, not just any branch
        if (!$this->isAdminOfBranch($branch, $inviter)) {
            return $this->json(['error' => 'You are not an admin of this branch'], 403);
        }

        $body  = json_decode($request->getContent(), true) ?? [];
        $email = trim($body['email'] ?? '');
        $role  = $body['role'] ?? 'viewer';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['error' => 'A valid email address is required'], 400);
        }

        $allowedRoles = array_map(fn ($case) => $case->value, BranchMemberRole::cases());
        if (!in_array($role, $allowedRoles, true)) {
            return $this->json(['error' => 'Invalid role. Allowed: ' . implode(', ', $allowedRoles)], 400);
        }

        // Check if already a member
        $existing = $this->userRepo->findOneBy(['email' => $email]);
        if ($existing && $branch->hasMembership($existing)) {
            return $this->json(['error' => 'This person is already a member of this branch'], 409);
        }

        // Check for existing pending invitation — renew it instead of blocking
        $pending = $this->em->getRepository(BranchInvitation::class)->findOneBy([
            'email'  => $email,
            'branch' => $branch,
            'status' => 'pending',
        ]);
        if ($pending && $pending->isPending()) {
            // Supersede the old pending invitation so its token is invalidated,
            // then fall through to create a fresh one below.
            $pending->setStatus('expired');
        }

        $invitation = new BranchInvitation();
        $invitation->setBranch($branch);
        $invitation->setEmail($email);
        $invitation->setRole($role);
        $invitation->setInvitedBy($inviter);

        $this->em->persist($invitation);
        $this->em->flush();

        // Send invitation email
        $acceptUrl = sprintf(
            '%s/invite/%s',
            rtrim($_ENV['FRONTEND_URL'] ?? 'http://localhost:3000', '/'),
            $invitation->getToken()
        );

        try {
            $emailMessage = (new Email())
                ->from('noreply@familyheritage.local')
                ->to($email)
                ->subject(sprintf('You\'ve been invited to join %s – Family Heritage Platform', $branch->getName()))
                ->html(sprintf(
                    '<h2>You\'ve been invited!</h2>
                    <p><strong>%s</strong> has invited you to join the <strong>%s</strong> branch on the Family Heritage Platform.</p>
                    <p>Click the link below to create your account and join:</p>
                    <p><a href="%s" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Accept Invitation</a></p>
                    <p>This link expires in 72 hours.</p>
                    <p style="color:#888;font-size:12px;">If you did not expect this invitation, you can ignore this email.</p>',
                    htmlspecialchars($inviter->getFullName()),
                    htmlspecialchars($branch->getName()),
                    htmlspecialchars($acceptUrl)
                ));

            $this->mailer->send($emailMessage);
        } catch (\Throwable) {
            // Email failed but invitation is created — return the accept URL for manual sharing
            return $this->json([
                'message'   => 'Invitation created (email delivery failed — share the link manually)',
                'acceptUrl' => $acceptUrl,
                'token'     => $invitation->getToken(),
                'email'     => $email,
                'expiresAt' => $invitation->getExpiresAt()->format(\DateTimeInterface::ATOM),
            ], 201);
        }

        return $this->json([
            'message'   => 'Invitation sent successfully',
            'acceptUrl' => $acceptUrl,
            'token'     => $invitation->getToken(),
            'email'     => $email,
            'expiresAt' => $invitation->getExpiresAt()->format(\DateTimeInterface::ATOM),
        ], 201);
    }

    /** Get invitation details by token (public — for the accept page) */
    #[Route('/invitations/{token}', name: 'api_invitation_get', methods: ['GET'])]
    public function getByToken(string $token): JsonResponse
    {
        $invitation = $this->inviteRepo->findByToken($token);

        if (!$invitation) {
            return $this->json(['error' => 'Invitation not found'], 404);
        }

        if (!$invitation->isPending()) {
            return $this->json([
                'error'  => 'This invitation has already been ' . $invitation->getStatus() . ' or has expired',
                'status' => $invitation->getStatus(),
            ], 410);
        }

        return $this->json([
            'token'       => $invitation->getToken(),
            'email'       => $invitation->getEmail(),
            'branchName'  => $invitation->getBranch()->getName(),
            'role'        => $invitation->getRole(),
            'invitedBy'   => $invitation->getInvitedBy()->getFullName(),
            'expiresAt'   => $invitation->getExpiresAt()->format(\DateTimeInterface::ATOM),
        ]);
    }

    /** Accept an invitation — creates account (if needed) + joins branch */
    #[Route('/invitations/{token}/accept', name: 'api_invitation_accept', methods: ['POST'])]
    public function accept(string $token, Request $request): JsonResponse
    {
        $invitation = $this->inviteRepo->findByToken($token);

        if (!$invitation) {
            return $this->json(['error' => 'Invitation not found'], 404);
        }

        if (!$invitation->isPending()) {
            return $this->json(['error' => 'This invitation is no longer valid'], 410);
        }

        $body      = json_decode($request->getContent(), true) ?? [];
        $firstName = trim($body['firstName'] ?? '');
        $lastName  = trim($body['lastName'] ?? '');
        $password  = $body['password'] ?? '';

        if (!$firstName || !$lastName || strlen($password) < 8) {
            return $this->json(['error' => 'First name, last name, and password (min 8 chars) are required'], 400);
        }

        $branch = $invitation->getBranch();
        $email  = $invitation->getEmail();

        // Find or create user
        $user = $this->userRepo->findOneBy(['email' => $email]);
        if (!$user) {
            $user = new User(Uuid::uuid4()->toString());
            $user->setEmail($email);
            $user->setFirstName($firstName);
            $user->setLastName($lastName);
            // Branch admins need at least Member global role so they can write
            $globalRole = ($invitation->getRole() === BranchMemberRole::BranchAdmin->value)
                ? UserRole::Member
                : UserRole::Viewer;
            $user->setRole($globalRole);
            $user->setIsActive(true);
            $user->setPasswordHash($this->passwordHasher->hashPassword($user, $password));
            $this->em->persist($user);
        }

        // Add to branch if not already a member
        if (!$branch->hasMembership($user)) {
            $role       = BranchMemberRole::tryFrom($invitation->getRole()) ?? BranchMemberRole::Viewer;
            $membership = new BranchMembership($branch, $user, $invitation->getInvitedBy(), $role);
            $this->em->persist($membership);

            // Branch admins also go into the dedicated branch_admins table
            if ($role === BranchMemberRole::BranchAdmin) {
                $this->em->persist(new BranchAdmin($branch, $user, $invitation->getInvitedBy()));
            }
        }

        // Mark invitation accepted
        $invitation->setStatus('accepted');
        $invitation->setAcceptedAt(new \DateTimeImmutable());

        $this->em->flush();

        return $this->json([
            'message'    => 'Welcome! Your account has been created and you\'ve joined ' . $branch->getName(),
            'email'      => $email,
            'branchName' => $branch->getName(),
            'role'       => $invitation->getRole(),
        ], 201);
    }

    /** List all invitations for a branch (admin only) */
    #[Route('/branches/{branchId}/invitations', name: 'api_branch_invitations_list', methods: ['GET'])]
    #[IsGranted('ROLE_BRANCH_ADMIN')]
    public function listInvitations(string $branchId): JsonResponse
    {
        $branch = $this->branchRepo->find($branchId);
        if (!$branch) {
            return $this->json(['error' => 'Branch not found'], 404);
        }

        /** @var User $currentUser */
        $currentUser = $this->security->getUser();
        if (!$this->isAdminOfBranch($branch, $currentUser)) {
            return $this->json(['error' => 'You are not an admin of this branch'], 403);
        }

        $invitations = $this->em->getRepository(BranchInvitation::class)->findBy(
            ['branch' => $branch],
            ['createdAt' => 'DESC']
        );

        $data = array_map(fn (BranchInvitation $inv) => [
            'id'         => $inv->getId(),
            'email'      => $inv->getEmail(),
            'role'       => $inv->getRole(),
            'status'     => $inv->isPending() ? 'pending' : $inv->getStatus(),
            'invitedBy'  => $inv->getInvitedBy()->getFullName(),
            'expiresAt'  => $inv->getExpiresAt()->format(\DateTimeInterface::ATOM),
            'acceptedAt' => $inv->getAcceptedAt()?->format(\DateTimeInterface::ATOM),
        ], $invitations);

        return $this->json(['invitations' => $data, 'count' => count($data)]);
    }
}

