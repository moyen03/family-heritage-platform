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

#[AsCommand(
    name: 'app:seed-demo',
    description: 'Seed the database with a realistic 3-generation demo family (Hassan family).',
)]
final class SeedDemoFamilyCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Re-seed even if demo data already exists');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Demo Seed — Hassan Family (3 Generations)');

        // Guard: check if demo data already exists
        $existing = $this->entityManager->getRepository(Person::class)->findOneBy(['lastName' => 'Hassan']);
        if ($existing !== null && !$input->getOption('force')) {
            $io->warning('Demo data already exists. Use --force to re-seed.');
            return Command::SUCCESS;
        }

        // ── Create / find demo admin user ────────────────────────────────────
        $io->section('Creating demo admin user');
        $admin = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'demo@family.local']);
        if ($admin === null) {
            $admin = new User(Uuid::uuid4()->toString());
            $admin->setEmail('demo@family.local');
            $admin->setFirstName('Demo');
            $admin->setLastName('Admin');
            $admin->setRole(UserRole::SuperAdmin);
            $admin->setIsActive(true);
            $admin->setPasswordHash($this->passwordHasher->hashPassword($admin, 'demo1234'));
            $this->entityManager->persist($admin);
            $io->text('  ✓ Created demo@family.local (password: demo1234)');
        } else {
            $io->text('  · Using existing demo@family.local');
        }

        // ── Generation 1: Paternal Grandparents ──────────────────────────────
        $io->section('Generation 1 — Grandparents');

        $ibrahim = $this->makePerson(
            admin: $admin,
            firstName: 'Ibrahim',
            lastName: 'Hassan',
            gender: Gender::Male,
            birthDate: '1930-03-15',
            birthPlace: 'Beirut, Lebanon',
            deathDate: '2005-11-20',
            deathPlace: 'Beirut, Lebanon',
            isLiving: false,
            biography: 'Ibrahim Hassan was the patriarch of the Hassan family. A respected merchant who built his business in Beirut\'s trading district. Known for his wisdom and generosity, he leaves behind a large and loving family.',
        );
        $this->entityManager->persist($ibrahim);

        $fatima = $this->makePerson(
            admin: $admin,
            firstName: 'Fatima',
            lastName: 'Hassan',
            maidenName: 'Al-Rashid',
            gender: Gender::Female,
            birthDate: '1935-06-08',
            birthPlace: 'Tripoli, Lebanon',
            deathDate: '2010-04-02',
            deathPlace: 'Beirut, Lebanon',
            isLiving: false,
            biography: 'Fatima Al-Rashid married Ibrahim Hassan in 1955. She was a devoted mother to their four children and a beloved figure in the community.',
        );
        $this->entityManager->persist($fatima);

        // Paternal Maternal Grandparents
        $yusuf = $this->makePerson(
            admin: $admin,
            firstName: 'Yusuf',
            lastName: 'Al-Amin',
            gender: Gender::Male,
            birthDate: '1928-09-22',
            birthPlace: 'Damascus, Syria',
            deathDate: '2008-07-14',
            deathPlace: 'Amman, Jordan',
            isLiving: false,
            biography: 'Yusuf Al-Amin was a schoolteacher and poet from Damascus. He moved his family to Amman in 1970.',
        );
        $this->entityManager->persist($yusuf);

        $khadija = $this->makePerson(
            admin: $admin,
            firstName: 'Khadija',
            lastName: 'Al-Amin',
            maidenName: 'Nour',
            gender: Gender::Female,
            birthDate: '1932-01-30',
            birthPlace: 'Damascus, Syria',
            isLiving: true,
            biography: 'Khadija Nour married Yusuf Al-Amin in 1952. Now 94 years old, she lives with her daughter Maryam\'s family in London.',
        );
        $this->entityManager->persist($khadija);

        $io->text('  ✓ Ibrahim Hassan (1930–2005)');
        $io->text('  ✓ Fatima Al-Rashid Hassan (1935–2010)');
        $io->text('  ✓ Yusuf Al-Amin (1928–2008)');
        $io->text('  ✓ Khadija Nour Al-Amin (1932–)');

        // ── Generation 2: Parents ─────────────────────────────────────────────
        $io->section('Generation 2 — Parents');

        $ahmed = $this->makePerson(
            admin: $admin,
            firstName: 'Ahmed',
            lastName: 'Hassan',
            gender: Gender::Male,
            birthDate: '1960-05-12',
            birthPlace: 'Beirut, Lebanon',
            isLiving: true,
            biography: 'Ahmed Hassan is a civil engineer who emigrated to London in 1985. He married Maryam Al-Amin and together they raised three children. Founder of Hassan & Sons Engineering Ltd.',
        );
        $this->entityManager->persist($ahmed);

        $maryam = $this->makePerson(
            admin: $admin,
            firstName: 'Maryam',
            lastName: 'Hassan',
            maidenName: 'Al-Amin',
            gender: Gender::Female,
            birthDate: '1963-09-18',
            birthPlace: 'Amman, Jordan',
            isLiving: true,
            biography: 'Maryam Al-Amin studied literature at the University of Jordan before marrying Ahmed Hassan. She is a published author of three Arabic-language novels.',
        );
        $this->entityManager->persist($maryam);

        $omar = $this->makePerson(
            admin: $admin,
            firstName: 'Omar',
            lastName: 'Hassan',
            gender: Gender::Male,
            birthDate: '1958-11-03',
            birthPlace: 'Beirut, Lebanon',
            isLiving: true,
            biography: 'Omar Hassan, elder brother of Ahmed, is a cardiologist based in Dubai. He was previously married to Nadia Khalil (divorced 1998).',
        );
        $this->entityManager->persist($omar);

        $nadia = $this->makePerson(
            admin: $admin,
            firstName: 'Nadia',
            lastName: 'Hassan',
            maidenName: 'Khalil',
            gender: Gender::Female,
            birthDate: '1960-02-14',
            birthPlace: 'Beirut, Lebanon',
            isLiving: true,
            biography: 'Nadia Khalil was married to Omar Hassan from 1983 to 1998. She is a fashion designer based in Paris.',
        );
        $this->entityManager->persist($nadia);

        $layla = $this->makePerson(
            admin: $admin,
            firstName: 'Layla',
            lastName: 'Mahmoud',
            maidenName: 'Hassan',
            gender: Gender::Female,
            birthDate: '1965-07-29',
            birthPlace: 'Beirut, Lebanon',
            isLiving: true,
            biography: 'Layla Hassan married Tariq Mahmoud in 1990 and moved to Cairo. She is a professor of Arabic literature at Cairo University.',
        );
        $this->entityManager->persist($layla);

        $tariq = $this->makePerson(
            admin: $admin,
            firstName: 'Tariq',
            lastName: 'Mahmoud',
            gender: Gender::Male,
            birthDate: '1962-12-05',
            birthPlace: 'Cairo, Egypt',
            isLiving: true,
            biography: 'Tariq Mahmoud is an architect based in Cairo. He married Layla Hassan in 1990.',
        );
        $this->entityManager->persist($tariq);

        $io->text('  ✓ Ahmed Hassan (1960–)');
        $io->text('  ✓ Maryam Al-Amin Hassan (1963–)');
        $io->text('  ✓ Omar Hassan (1958–)');
        $io->text('  ✓ Nadia Khalil Hassan (1960–)');
        $io->text('  ✓ Layla Hassan Mahmoud (1965–)');
        $io->text('  ✓ Tariq Mahmoud (1962–)');

        // ── Generation 3: Children ────────────────────────────────────────────
        $io->section('Generation 3 — Children');

        $zaid = $this->makePerson(
            admin: $admin,
            firstName: 'Zaid',
            lastName: 'Hassan',
            gender: Gender::Male,
            birthDate: '1986-03-22',
            birthPlace: 'London, United Kingdom',
            isLiving: true,
            biography: 'Zaid Hassan is a software engineer at a fintech startup in London. He is the eldest child of Ahmed and Maryam.',
        );
        $this->entityManager->persist($zaid);

        $sara = $this->makePerson(
            admin: $admin,
            firstName: 'Sara',
            lastName: 'Hassan',
            gender: Gender::Female,
            birthDate: '1988-08-14',
            birthPlace: 'London, United Kingdom',
            isLiving: true,
            biography: 'Sara Hassan is a paediatric doctor at Great Ormond Street Hospital, London.',
        );
        $this->entityManager->persist($sara);

        $khalid = $this->makePerson(
            admin: $admin,
            firstName: 'Khalid',
            lastName: 'Hassan',
            gender: Gender::Male,
            birthDate: '1991-12-01',
            birthPlace: 'London, United Kingdom',
            isLiving: true,
            biography: 'Khalid Hassan is the youngest child of Ahmed and Maryam. He is completing a PhD in renewable energy at Imperial College London.',
        );
        $this->entityManager->persist($khalid);

        // Omar's child (from marriage with Nadia)
        $rania = $this->makePerson(
            admin: $admin,
            firstName: 'Rania',
            lastName: 'Hassan',
            gender: Gender::Female,
            birthDate: '1984-05-17',
            birthPlace: 'Beirut, Lebanon',
            isLiving: true,
            biography: 'Rania Hassan is the daughter of Omar Hassan and Nadia Khalil. She is a journalist based in Dubai.',
        );
        $this->entityManager->persist($rania);

        // Layla's children
        $kareem = $this->makePerson(
            admin: $admin,
            firstName: 'Kareem',
            lastName: 'Mahmoud',
            gender: Gender::Male,
            birthDate: '1992-04-09',
            birthPlace: 'Cairo, Egypt',
            isLiving: true,
            biography: 'Kareem Mahmoud is the son of Layla and Tariq. He is studying medicine in Cairo.',
        );
        $this->entityManager->persist($kareem);

        $io->text('  ✓ Zaid Hassan (1986–)');
        $io->text('  ✓ Sara Hassan (1988–)');
        $io->text('  ✓ Khalid Hassan (1991–)');
        $io->text('  ✓ Rania Hassan (1984–) — Omar\'s daughter');
        $io->text('  ✓ Kareem Mahmoud (1992–) — Layla\'s son');

        // ── Flush persons first so IDs are set ───────────────────────────────
        $this->entityManager->flush();

        // ── Person Names (nicknames / aliases) ────────────────────────────────
        $io->section('Person Names');

        $this->addName($ibrahim, 'Abu Ahmed', NameType::Nickname, 'Paternal honorific — father of Ahmed');
        $this->addName($fatima, 'Um Ahmed', NameType::Nickname, 'Maternal honorific — mother of Ahmed');
        $this->addName($ahmed, 'Abu Zaid', NameType::Nickname, 'Known as Abu Zaid after his eldest son was born');
        $this->addName($omar, 'Dr. Hassan', NameType::Title, 'Used professionally as a cardiologist');
        $this->addName($zaid, 'Z', NameType::Nickname, 'Goes by Z among friends');
        $this->addName($sara, 'Dr. Sara', NameType::Title, 'Used at Great Ormond Street Hospital');
        $this->entityManager->flush();

        $io->text('  ✓ 6 person names added');

        // ── Marriages ─────────────────────────────────────────────────────────
        $io->section('Marriages');

        // Gen 1
        $this->addMarriage($admin, $ibrahim, $fatima, '1955-08-20', 'Beirut, Lebanon');
        $this->addMarriage($admin, $yusuf, $khadija, '1952-06-10', 'Damascus, Syria');
        // Gen 2 — Omar & Nadia (divorced 1998)
        $this->addMarriage($admin, $omar, $nadia, '1983-04-15', 'Beirut, Lebanon', '1998-09-01', isDivorced: true);
        // Gen 2 — Ahmed & Maryam
        $this->addMarriage($admin, $ahmed, $maryam, '1985-10-05', 'London, United Kingdom');
        // Gen 2 — Layla & Tariq
        $this->addMarriage($admin, $layla, $tariq, '1990-07-20', 'Cairo, Egypt');

        $this->entityManager->flush();
        $io->text('  ✓ 5 marriages recorded (including 1 divorce)');

        // ── Relationships ─────────────────────────────────────────────────────
        $io->section('Relationships');

        // Ibrahim's children: Ahmed, Omar, Layla
        $this->addParentChild($admin, $ibrahim, $ahmed);
        $this->addParentChild($admin, $ibrahim, $omar);
        $this->addParentChild($admin, $ibrahim, $layla);
        $this->addParentChild($admin, $fatima, $ahmed);
        $this->addParentChild($admin, $fatima, $omar);
        $this->addParentChild($admin, $fatima, $layla);

        // Yusuf & Khadija's child: Maryam
        $this->addParentChild($admin, $yusuf, $maryam);
        $this->addParentChild($admin, $khadija, $maryam);

        // Ahmed & Maryam's children: Zaid, Sara, Khalid
        $this->addParentChild($admin, $ahmed, $zaid);
        $this->addParentChild($admin, $ahmed, $sara);
        $this->addParentChild($admin, $ahmed, $khalid);
        $this->addParentChild($admin, $maryam, $zaid);
        $this->addParentChild($admin, $maryam, $sara);
        $this->addParentChild($admin, $maryam, $khalid);

        // Omar & Nadia's child: Rania
        $this->addParentChild($admin, $omar, $rania);
        $this->addParentChild($admin, $nadia, $rania);

        // Layla & Tariq's child: Kareem
        $this->addParentChild($admin, $layla, $kareem);
        $this->addParentChild($admin, $tariq, $kareem);

        // Siblings (Gen 2 — Ibrahim's children)
        $this->addSibling($admin, $ahmed, $omar);
        $this->addSibling($admin, $ahmed, $layla);
        $this->addSibling($admin, $omar, $layla);

        // Siblings (Gen 3 — Ahmed's children)
        $this->addSibling($admin, $zaid, $sara);
        $this->addSibling($admin, $zaid, $khalid);
        $this->addSibling($admin, $sara, $khalid);

        // Half-siblings: Rania is half-sibling to Zaid, Sara, Khalid (share father's brother Omar)
        // Actually Rania is a cousin of Zaid/Sara/Khalid — let's not add that as a relationship type
        // since we don't have "cousin" — skip

        $this->entityManager->flush();
        $io->text('  ✓ 36 relationships created (parent/child + siblings, both directions)');

        // ── Summary ───────────────────────────────────────────────────────────
        $io->success([
            'Demo family seeded successfully!',
            '',
            '  Persons : 11 across 3 generations',
            '  Marriages: 5 (including 1 divorce)',
            '  Relationships: 36',
            '  Person Names: 6',
            '',
            '  Login with: demo@family.local / demo1234',
            '  Browse the tree at: http://localhost:3000/tree',
        ]);

        return Command::SUCCESS;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makePerson(
        User $admin,
        string $firstName,
        string $lastName,
        Gender $gender,
        string $birthDate,
        string $birthPlace,
        ?string $maidenName = null,
        ?string $deathDate = null,
        ?string $deathPlace = null,
        bool $isLiving = true,
        ?string $biography = null,
    ): Person {
        $p = new Person();
        $p->setFirstName($firstName);
        $p->setLastName($lastName);
        $p->setGender($gender);
        $p->setBirthDate(new \DateTime($birthDate));
        $p->setBirthDatePrecision(DatePrecision::Exact);
        $p->setBirthPlace($birthPlace);
        $p->setIsLiving($isLiving);
        $p->setVisibility(Visibility::Family);
        $p->setCreatedBy($admin);

        if ($maidenName !== null) {
            $p->setMaidenName($maidenName);
        }

        if ($deathDate !== null) {
            $p->setDeathDate(new \DateTime($deathDate));
            $p->setDeathDatePrecision(DatePrecision::Exact);
        }

        if ($deathPlace !== null) {
            $p->setDeathPlace($deathPlace);
        }

        if ($biography !== null) {
            $p->setBiography($biography);
        }

        return $p;
    }

    private function addName(Person $person, string $name, NameType $nameType, ?string $notes = null): void
    {
        $pn = new PersonName();
        $pn->setPerson($person);
        $pn->setName($name);
        $pn->setNameType($nameType);
        if ($notes !== null) {
            $pn->setNotes($notes);
        }
        $this->entityManager->persist($pn);
    }

    private function addMarriage(
        User $admin,
        Person $spouse1,
        Person $spouse2,
        string $marriageDate,
        string $marriagePlace,
        ?string $divorceDate = null,
        bool $isDivorced = false,
    ): Marriage {
        $m = new Marriage();
        $m->setSpouse1($spouse1);
        $m->setSpouse2($spouse2);
        $m->setMarriageDate(new \DateTime($marriageDate));
        $m->setMarriageDatePrecision(DatePrecision::Exact);
        $m->setMarriagePlace($marriagePlace);
        $m->setCreatedBy($admin);

        if ($divorceDate !== null) {
            $m->setDivorceDate(new \DateTime($divorceDate));
            $m->setDivorceDatePrecision(DatePrecision::Exact);
            $m->setIsDivorced(true);
        } elseif ($isDivorced) {
            $m->setIsDivorced(true);
        }

        $this->entityManager->persist($m);
        return $m;
    }

    /** Create parent→child and child→parent relationship pair. */
    private function addParentChild(User $admin, Person $parent, Person $child): void
    {
        $forward = new Relationship();
        $forward->setPerson1($parent);
        $forward->setPerson2($child);
        $forward->setType(RelationshipType::Parent);
        $forward->setCreatedBy($admin);
        $this->entityManager->persist($forward);
        $this->entityManager->persist($forward->createInverse());
    }

    /** Create sibling relationships (both directions). */
    private function addSibling(User $admin, Person $a, Person $b): void
    {
        $forward = new Relationship();
        $forward->setPerson1($a);
        $forward->setPerson2($b);
        $forward->setType(RelationshipType::Sibling);
        $forward->setCreatedBy($admin);
        $this->entityManager->persist($forward);
        $this->entityManager->persist($forward->createInverse());
    }
}
