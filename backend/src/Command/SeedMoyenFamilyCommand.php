<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Marriage;
use App\Entity\Person;
use App\Entity\PersonName;
use App\Entity\Relationship;
use App\Entity\User;
use App\Enum\DatePrecision;
use App\Enum\Gender;
use App\Enum\NameType;
use App\Enum\RelationshipType;
use App\Enum\UserRole;
use App\Enum\Visibility;
use Doctrine\ORM\EntityManagerInterface;
use Ramsey\Uuid\Uuid;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Reads /database/seed/moyen_family_data.json and imports the entire
 * Moyen Uddin family tree into the database.
 *
 * Usage:
 *   docker compose exec php bin/console app:seed-moyen-family
 *   docker compose exec php bin/console app:seed-moyen-family --force   # re-seed
 */
#[AsCommand(
    name: 'app:seed-moyen-family',
    description: 'Import the Moyen Uddin family tree from database/seed/moyen_family_data.json',
)]
final class SeedMoyenFamilyCommand extends Command
{
    /** @var array<string, Person> slug → entity */
    private array $personMap = [];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Re-import even if data already exists');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Import — Moyen Uddin Family Tree');

        // ── Load JSON data file ────────────────────────────────────────────────
        // Search in multiple locations so it works both in Docker and locally.
        $candidates = [
            dirname(__DIR__, 2) . '/data/moyen_family_data.json',                    // backend/data/ (Docker)
            dirname(__DIR__, 3) . '/database/seed/moyen_family_data.json',            // project-root/database/seed/ (local)
            dirname(__DIR__, 4) . '/database/seed/moyen_family_data.json',            // one more level up
        ];
        $jsonPath = null;
        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                $jsonPath = $candidate;
                break;
            }
        }
        if ($jsonPath === null) {
            $io->error('JSON data file not found. Tried:');
            foreach ($candidates as $c) { $io->text("  · {$c}"); }
            return Command::FAILURE;
        }

        // Strip // comments before decoding (JSON doesn't support them natively)
        $raw  = file_get_contents($jsonPath);
        $raw  = preg_replace('#//[^\n]*#', '', $raw);
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            $io->error('Failed to parse JSON: ' . json_last_error_msg());
            return Command::FAILURE;
        }

        // ── Guard / truncate ──────────────────────────────────────────────────
        $existing = $this->em->getRepository(Person::class)->findOneBy([
            'firstName' => 'Md Siraz Uddin',
            'lastName'  => 'Molla',
        ]);
        if ($existing !== null && !$input->getOption('force')) {
            $io->warning('Moyen family data already exists. Use --force to re-import.');
            return Command::SUCCESS;
        }

        // When --force: wipe existing family data before re-inserting
        if ($existing !== null && $input->getOption('force')) {
            $io->text('  🗑  Truncating existing family data before re-import…');
            $conn = $this->em->getConnection();
            $conn->executeStatement('SET FOREIGN_KEY_CHECKS=0');
            $conn->executeStatement('TRUNCATE TABLE relationships');
            $conn->executeStatement('TRUNCATE TABLE marriages');
            $conn->executeStatement('TRUNCATE TABLE person_branches');
            $conn->executeStatement('TRUNCATE TABLE person_names');
            $conn->executeStatement('TRUNCATE TABLE persons');
            $conn->executeStatement('SET FOREIGN_KEY_CHECKS=1');
            $this->em->clear();
            $io->text('  ✓ Tables cleared');
        }

        // ── Create / find admin user ───────────────────────────────────────────
        $io->section('Admin user');
        $admin = $this->em->getRepository(User::class)->findOneBy(['email' => 'admin@family.local']);
        if ($admin === null) {
            $admin = new User(Uuid::uuid4()->toString());
            $admin->setEmail('admin@family.local');
            $admin->setFirstName('Admin');
            $admin->setLastName('User');
            $admin->setRole(UserRole::SuperAdmin);
            $admin->setIsActive(true);
            $admin->setPasswordHash($this->passwordHasher->hashPassword($admin, 'Admin1234!'));
            $this->em->persist($admin);
            $io->text('  ✓ Created admin@family.local');
        } else {
            $io->text('  · Using existing admin@family.local');
        }

        // ── Create persons ─────────────────────────────────────────────────────
        $io->section('Creating persons');
        $personCount = 0;
        foreach ($data['persons'] as $pd) {
            if (!isset($pd['id'])) {
                continue; // skip pure comment-only entries (no id)
            }
            $person = $this->buildPerson($pd, $admin);
            $this->personMap[$pd['id']] = $person;
            $this->em->persist($person);
            $io->text("  ✓ [{$pd['id']}]  {$person->getFirstName()} {$person->getLastName()}");
            ++$personCount;
        }
        $this->em->flush(); // flush so PKs are assigned

        // ── Add nicknames ──────────────────────────────────────────────────────
        $io->section('Adding nicknames');
        $nameCount = 0;
        foreach ($data['persons'] as $pd) {
            if (!isset($pd['id']) || empty($pd['nickname'])) {
                continue;
            }
            $pn = new PersonName();
            $pn->setPerson($this->personMap[$pd['id']]);
            $pn->setName($pd['nickname']);
            $pn->setNameType(NameType::Nickname);
            $this->em->persist($pn);
            ++$nameCount;
        }
        $this->em->flush();
        $io->text("  ✓ {$nameCount} nicknames added");

        // ── Create marriages ───────────────────────────────────────────────────
        $io->section('Creating marriages');
        $marriageCount = 0;
        foreach ($data['marriages'] as $md) {
            if (!isset($this->personMap[$md['spouse1']], $this->personMap[$md['spouse2']])) {
                $io->warning("  ✗ Skipping [{$md['id']}]: one or both persons not found");
                continue;
            }

            $m = new Marriage();
            $m->setSpouse1($this->personMap[$md['spouse1']]);
            $m->setSpouse2($this->personMap[$md['spouse2']]);
            $m->setCreatedBy($admin);

            if (!empty($md['marriageDate'])) {
                $m->setMarriageDate(new \DateTime($md['marriageDate']));
                $m->setMarriageDatePrecision(
                    ($md['marriageDatePrecision'] ?? 'year') === 'exact'
                        ? DatePrecision::Exact
                        : DatePrecision::Year
                );
            }
            if (!empty($md['marriagePlace'])) {
                $m->setMarriagePlace($md['marriagePlace']);
            }
            if (!empty($md['isDivorced'])) {
                $m->setIsDivorced(true);
                if (!empty($md['divorceDate'])) {
                    $m->setDivorceDate(new \DateTime($md['divorceDate']));
                    $m->setDivorceDatePrecision(DatePrecision::Year);
                }
            }

            $this->em->persist($m);
            $io->text("  ✓ [{$md['id']}]");
            ++$marriageCount;
        }
        $this->em->flush();

        // ── Create parent→child relationships ─────────────────────────────────
        $io->section('Creating parent-child relationships');
        $relCount  = 0;

        foreach ($data['parentChild'] as $pc) {
            if (!isset($this->personMap[$pc['parent']], $this->personMap[$pc['child']])) {
                $io->warning("  ✗ Skipping {$pc['parent']} → {$pc['child']}: person not found");
                continue;
            }

            $fwd = new Relationship();
            $fwd->setPerson1($this->personMap[$pc['parent']]);
            $fwd->setPerson2($this->personMap[$pc['child']]);
            $fwd->setType(RelationshipType::Parent);
            $fwd->setCreatedBy($admin);
            $this->em->persist($fwd);
            $this->em->persist($fwd->createInverse());
            $relCount += 2;
        }

        // ── Auto-create sibling relationships ─────────────────────────────────
        // Build parent→children map, then pair all children of the same parent.
        $childrenByParent = [];
        foreach ($data['parentChild'] as $pc) {
            $childrenByParent[$pc['parent']][] = $pc['child'];
        }

        $siblingPairsDone = [];
        foreach ($childrenByParent as $children) {
            $n = count($children);
            for ($i = 0; $i < $n; ++$i) {
                for ($j = $i + 1; $j < $n; ++$j) {
                    $a   = $children[$i];
                    $b   = $children[$j];
                    $key = implode('|', [min($a, $b), max($a, $b)]); // stable key regardless of order

                    if (isset($siblingPairsDone[$key])) {
                        continue; // already created (e.g., shared two parents)
                    }
                    if (!isset($this->personMap[$a], $this->personMap[$b])) {
                        continue;
                    }

                    $fwd = new Relationship();
                    $fwd->setPerson1($this->personMap[$a]);
                    $fwd->setPerson2($this->personMap[$b]);
                    $fwd->setType(RelationshipType::Sibling);
                    $fwd->setCreatedBy($admin);
                    $this->em->persist($fwd);
                    $this->em->persist($fwd->createInverse());
                    $relCount += 2;

                    $siblingPairsDone[$key] = true;
                }
            }
        }

        $this->em->flush();
        $io->text("  ✓ {$relCount} relationship records (parent-child + siblings, both directions)");

        // ── Summary ────────────────────────────────────────────────────────────
        $placeholder = array_filter($data['persons'], fn ($p) => !empty($p['_placeholder']));
        $todo        = array_filter($data['persons'], fn ($p) => !empty($p['_todo']));

        $io->success([
            'Moyen Uddin family tree imported successfully!',
            '',
            "  Persons      : {$personCount}",
            "  Marriages    : {$marriageCount}",
            "  Relationships: {$relCount}",
            "  Nicknames    : {$nameCount}",
            '',
            '  ⚠  Placeholder persons (real name unknown) : ' . count($placeholder),
            '  📋 Persons with missing data (_todo fields) : ' . count($todo),
            '',
            '  See: database/seed/moyen_family_data.json  — edit and re-run with --force',
            '  Browse the tree at: http://localhost:3000/tree',
        ]);

        return Command::SUCCESS;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildPerson(array $pd, User $admin): Person
    {
        $p = new Person();
        $p->setFirstName($pd['firstName']);
        $p->setLastName($pd['lastName']);
        $p->setGender(Gender::from($pd['gender']));
        $p->setIsLiving($pd['isLiving'] ?? true);
        $p->setVisibility(Visibility::Family);
        $p->setCreatedBy($admin);

        if (!empty($pd['maidenName'])) {
            $p->setMaidenName($pd['maidenName']);
        }

        if (!empty($pd['birthDate'])) {
            $p->setBirthDate(new \DateTime($pd['birthDate']));
            $p->setBirthDatePrecision(match ($pd['birthDatePrecision'] ?? 'year') {
                'exact'       => DatePrecision::Exact,
                'approximate' => DatePrecision::Approximate,
                default       => DatePrecision::Year,
            });
        }

        if (!empty($pd['birthPlace'])) {
            $p->setBirthPlace($pd['birthPlace']);
        }

        if (!empty($pd['deathDate'])) {
            $p->setDeathDate(new \DateTime($pd['deathDate']));
            $p->setDeathDatePrecision(DatePrecision::Year);
            $p->setIsLiving(false);
        }

        if (!empty($pd['deathPlace'])) {
            $p->setDeathPlace($pd['deathPlace']);
        }

        if (!empty($pd['biography'])) {
            $p->setBiography($pd['biography']);
        }

        return $p;
    }
}

