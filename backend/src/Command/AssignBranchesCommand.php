<?php

declare(strict_types=1);

namespace App\Command;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Automatically assigns all family members to their branches.
 *
 * Rules (Option B – full bloodline tracking):
 *   PRIMARY  ⭐  – the root of the branch AND every blood descendant (via parent-child chain)
 *   SECONDARY    – spouses / in-laws who married into the family but are not blood descendants
 *
 * Already-completed branches (like Siraz) are left untouched.
 */
#[AsCommand(name: 'app:assign-branches', description: 'Auto-assign family members to their branches from the tree')]
class AssignBranchesCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io   = new SymfonyStyle($input, $output);
        $conn = $this->em->getConnection();

        // ── 1. Load data ──────────────────────────────────────────────────────

        /** @var array<array{id:string,name:string}> $branches */
        $branches = $conn->fetchAllAssociative(
            'SELECT id, name FROM branches WHERE is_shared = 0 AND deleted_at IS NULL ORDER BY name',
        );

        /** @var array<array{parent_id:string,child_id:string}> $rels */
        $rels = $conn->fetchAllAssociative(
            "SELECT person1_id AS parent_id, person2_id AS child_id
               FROM relationships
              WHERE type IN ('parent','step_parent','adopted_parent')",
        );

        /** @var array<array{spouse1_id:string,spouse2_id:string}> $marriages */
        $marriages = $conn->fetchAllAssociative('SELECT spouse1_id, spouse2_id FROM marriages');

        /** @var array<array{id:string,first_name:string,last_name:string,gender:string}> $persons */
        $persons = $conn->fetchAllAssociative(
            'SELECT id, first_name, last_name, gender FROM persons WHERE deleted_at IS NULL',
        );

        // ── 2. Build index maps ───────────────────────────────────────────────

        // parent_id → [child_id, …]
        $childrenOf = [];
        foreach ($rels as $r) {
            $childrenOf[$r['parent_id']][] = $r['child_id'];
        }

        // person_id → [spouse_id, …]
        $spousesOf = [];
        foreach ($marriages as $m) {
            $spousesOf[$m['spouse1_id']][] = $m['spouse2_id'];
            $spousesOf[$m['spouse2_id']][] = $m['spouse1_id'];
        }

        // Set of parents (anyone who is person1 in a parent-type relationship)
        $isParent = [];
        foreach ($rels as $r) {
            $isParent[$r['parent_id']] = true;
        }

        // Existing branch assignments → skip re-inserting
        $existing = $conn->fetchAllAssociative('SELECT person_id, branch_id FROM person_branches');
        $done     = [];
        foreach ($existing as $e) {
            $done[$e['branch_id'] . '|' . $e['person_id']] = true;
        }

        // ── 3. Branch name → root person lookup ──────────────────────────────
        // Strategy: first word of branch name is the surname/given-name of the founder.
        // Prefer: male > parent > first match.

        $findRoot = function (string $branchName) use ($persons, $isParent): ?string {
            $keyword = explode(' ', $branchName)[0];   // e.g. "Hafez" from "Hafez Family"
            $matches = [];
            foreach ($persons as $p) {
                if (str_contains($p['first_name'], $keyword) || str_contains($p['last_name'], $keyword)) {
                    $matches[] = $p;
                }
            }
            if (empty($matches)) {
                return null;
            }
            // Prefer males who are also parents (= branch founders)
            usort($matches, static function (array $a, array $b) use ($isParent): int {
                $aScore = ($a['gender'] === 'male' ? 2 : 0) + (isset($isParent[$a['id']]) ? 1 : 0);
                $bScore = ($b['gender'] === 'male' ? 2 : 0) + (isset($isParent[$b['id']]) ? 1 : 0);
                return $bScore - $aScore;
            });
            return $matches[0]['id'];
        };

        // ── 4. Process each branch ────────────────────────────────────────────

        $totalInserted = 0;

        foreach ($branches as $branch) {
            $branchId   = $branch['id'];
            $branchName = $branch['name'];

            // Count how many are already assigned
            $alreadyCount = (int) $conn->fetchOne(
                'SELECT COUNT(*) FROM person_branches WHERE branch_id = ?',
                [$branchId],
            );

            if ($alreadyCount > 5) {
                $io->text("⏭  Skipping <info>{$branchName}</info> — already has {$alreadyCount} members");
                continue;
            }

            $rootId = $findRoot($branchName);
            if ($rootId === null) {
                $io->warning("Could not find root person for branch: {$branchName}");
                continue;
            }

            // Find root person name for display
            $rootName = '';
            foreach ($persons as $p) {
                if ($p['id'] === $rootId) {
                    $rootName = $p['first_name'] . ' ' . $p['last_name'];
                    break;
                }
            }
            $io->section("{$branchName} (root: {$rootName})");

            // ── BFS to collect all blood descendants ─────────────────────────
            $blood = [$rootId => true];
            $queue = [$rootId];
            while (!empty($queue)) {
                $current = array_shift($queue);
                foreach ($childrenOf[$current] ?? [] as $childId) {
                    if (!isset($blood[$childId])) {
                        $blood[$childId] = true;
                        $queue[]         = $childId;
                    }
                }
            }

            // ── Collect spouses / in-laws ─────────────────────────────────────
            $inLaws = [];
            foreach (array_keys($blood) as $personId) {
                foreach ($spousesOf[$personId] ?? [] as $spouseId) {
                    if (!isset($blood[$spouseId]) && !isset($inLaws[$spouseId])) {
                        $inLaws[$spouseId] = true;
                    }
                }
            }

            // ── Insert ────────────────────────────────────────────────────────
            $inserted = 0;

            foreach (array_keys($blood) as $personId) {
                $key = "{$branchId}|{$personId}";
                if (isset($done[$key])) {
                    continue;
                }
                $conn->executeStatement(
                    'INSERT INTO person_branches (person_id, branch_id, is_primary) VALUES (?,?,1)',
                    [$personId, $branchId],
                );
                $done[$key] = true;
                $inserted++;
            }

            foreach (array_keys($inLaws) as $personId) {
                $key = "{$branchId}|{$personId}";
                if (isset($done[$key])) {
                    continue;
                }
                $conn->executeStatement(
                    'INSERT INTO person_branches (person_id, branch_id, is_primary) VALUES (?,?,0)',
                    [$personId, $branchId],
                );
                $done[$key] = true;
                $inserted++;
            }

            $bloodCount  = count($blood);
            $inLawCount  = count($inLaws);
            $io->text("  ✅ {$bloodCount} primary (blood) + {$inLawCount} secondary (in-laws) → {$inserted} new inserts");
            $totalInserted += $inserted;
        }

        $io->success("Done — {$totalInserted} total new branch assignments created.");

        return Command::SUCCESS;
    }
}
