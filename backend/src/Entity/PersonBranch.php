<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\PersonBranchRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PersonBranchRepository::class)]
#[ORM\Table(name: 'person_branches')]
class PersonBranch
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Person::class, inversedBy: 'personBranches')]
    #[ORM\JoinColumn(name: 'person_id', nullable: false)]
    private Person $person;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Branch::class, inversedBy: 'personBranches')]
    #[ORM\JoinColumn(name: 'branch_id', nullable: false)]
    #[Groups(['person:read'])]
    private Branch $branch;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['person:read'])]
    private bool $isPrimary = false;

    public function __construct(Person $person, Branch $branch, bool $isPrimary = false)
    {
        $this->person = $person;
        $this->branch = $branch;
        $this->isPrimary = $isPrimary;
    }

    public function getPerson(): Person
    {
        return $this->person;
    }

    public function getBranch(): Branch
    {
        return $this->branch;
    }

    public function isPrimary(): bool
    {
        return $this->isPrimary;
    }

    public function setIsPrimary(bool $isPrimary): static
    {
        $this->isPrimary = $isPrimary;
        return $this;
    }
}
