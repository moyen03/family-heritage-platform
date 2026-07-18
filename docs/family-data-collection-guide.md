# Family Data Collection Guide
## Moyen Uddin Family Tree

> **How to use this guide**
> 1. Fill in the missing data in the tables below
> 2. Open `database/seed/moyen_family_data.json` and update the matching entry
> 3. Re-run the import: `docker compose exec php bin/console app:seed-moyen-family --force`
> 4. Refresh the tree at http://localhost:3000/tree

---

## Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Complete — all key info known |
| ⚠️ | Partial — some info missing |
| ❓ | Placeholder — real name unknown |
| ✝ | Deceased |

---

## Family Tree Overview

```
Md Damulla Uddin Molla ──────── Maryum Begum
                │
        Md Azim Uddin Molla ──── Mrs Rahima Begum
                │
    ┌───────────┼──────────────────────┬───────────────────┬─────────┬────────────────────────┐
    │           │                      │                   │         │
Md Hafez    Md Hazar     Md Zillur    Md Siraz Uddin   Md Royes   Fuppi      Fuppi      Fuppi
Uddin Molla Uddin Molla Rahman Molla  Molla ─ Munnuzan  Uddin     Katihar   Debipur    Pagha
    │                                     │    Begum     Molla
    │                              ┌──────┴──────────────┐
    │                         Shahanaz  Monir   Sabina  Md Moyen
    │                         Parveen   Uddin   Yasmin  Uddin ── (spouse?)
    │                            │      Molla     │         │
    │                        Abdul    Shakkhor  Saikat  Shikto
    │                        Bashar   Shahitto  Shihab  Anubhab
    │                                           Apon    Uddin
    │
    ├── Mota ──── [Mota's husband]
    │       ├── Chumki (elder)
    │       └── Chumki Sotobon ──── [unknown father]
    │               └── Chumki Soto Meye (2024)
    │
    ├── Mono ──── [Mono's husband]
    │       ├── Masum (1985)
    │       ├── Masud (1987)
    │       └── Masuma (1989)
    │
    ├── Nazrul Islam ✝ (born & died 1990)
    │
    ├── Alom ──── [Alom's wife]
    │       ├── Sadia (2009) ──── Rayhan
    │       └── Nyeem (2013)
    │
    ├── Lily ──── [Lily's husband]
    │       ├── Lily Meye (2005)
    │       └── Lily Sele (2007)
    │
    ├── Sultana (1977)
    │       └── Sultana Meye (2020)
    │
    └── Zahurul Islam (1980)
            ├── Zahurul Meye (2010)
            └── Zahurul Sele (2012)
```

---

## Data Collection Sheet

### ⚠️ Missing: Grandfather-generation (children of Azim Uddin Molla)

| ID in JSON | Known Name | What's Needed |
|-----------|------------|---------------|
| `hafez-uddin-molla` | Md Hafez Uddin Molla | Birth year, is he still living?, wife's full name |
| `hazar-uddin-molla` | Md Hazar Uddin Molla | Birth year, spouse, children (if any) |
| `zillur-rahman-molla` | Md Zillur Rahman Molla | Birth year, spouse, children (if any) |
| `siraz-uddin-molla` | Md Siraz Uddin Molla | Birth year, birth village, is he still living? |
| `munnuzan-begum` | Mrs Munnuzan Begum | Full name, maiden name, birth year |
| `royes-uddin-molla` | Md Royes Uddin Molla | Birth year, spouse, children (if any) |
| `fuppi-katihar` | Fuppi Katihar | **Real first name**, husband's name, children |
| `fuppi-debipur` | Fuppi Debipur | **Real first name**, husband's name, children |
| `fuppi-pagha` | Fuppi Pagha | **Real first name**, husband's name, children |

---

### ❓ Missing: Hafez Uddin Molla's children — REAL NAMES NEEDED

| ID in JSON | Known As | Gender | DOB (year) | What's Needed |
|-----------|----------|--------|-----------|---------------|
| `mota` | Mota | Female | ~1960 | **Real first name** (Mota = nickname) |
| `mota-husband` | Mota's husband | Male | ? | **Full real name** |
| `mono` | Mono | Female | ~1965 | **Real first name** (Mono = nickname) |
| `mono-husband` | Mono's husband | Male | ? | **Full real name** |
| `alom` | Alom | Male | ~1975 | Confirm if Alom is real name |
| `alom-wife` | Alom's wife | Female | ? | **Full real name** |
| `lily` | Lily | Female | ~1990 | Confirm if Lily is real name |
| `lily-husband` | Lily's husband | Male | ? | **Full real name** |
| `sultana` | Sultana | Female | ~1977 | Husband's name (if married) |
| `zahurul-islam` | Zahurul Islam | Male | ~1980 | Wife's full name |

---

### ⚠️ Missing: Moyen's siblings

| ID in JSON | Name | What's Needed |
|-----------|------|---------------|
| `shahanaz-parveen` | Shahanaz Parveen | Birth year, husband's name |
| `monir-uddin-molla` | Md Monir Uddin Molla | Birth year, wife's name |
| `sabina-yasmin` | Sabina Yasmin | Birth year, husband's name |
| `moyen-uddin` | **Md Moyen Uddin** ← YOU | Birth date, birth place, spouse name |

---

### ❓ Missing: Next generation — REAL NAMES NEEDED

| ID in JSON | Known As | Parent | DOB | What's Needed |
|-----------|----------|--------|-----|---------------|
| `chumki` | Chumki (elder) | Mota | ? | Real full name, birth year |
| `chumki-sotobon` | Chumki Sotobon | Mota | ~1990 | Real full name, husband's name (if any) |
| `masum` | Masum | Mono | ~1985 | Full name with last name |
| `masud` | Masud | Mono | ~1987 | Full name with last name |
| `masuma` | Masuma | Mono | ~1989 | Full name with last name |
| `sadia` | Sadia | Alom | ~2009 | Full name, marriage date with Rayhan |
| `rayhan` | Rayhan | — | ? | **Full real name**, birth year |
| `nyeem` | Nyeem | Alom | ~2013 | Full name confirm |
| `lily-meye` | Lily Meye | Lily | ~2005 | **Real full name** |
| `lily-sele` | Lily Sele | Lily | ~2007 | **Real full name** |
| `sultana-meye` | Sultana Meye | Sultana | ~2020 | **Real full name**, father's name |
| `zahurul-sele` | Zahurul Sele | Zahurul | ~2012 | **Real full name**, mother's name |
| `zahurul-meye` | Zahurul Meye | Zahurul | ~2010 | **Real full name**, mother's name |
| `abdul-bashar` | Md Abdul Bashar | Shahanaz | ? | Birth year, father's name |
| `shakkhor` | Shakkhor | Monir | ? | Real name (Shakkhor = ছক্কর, nickname?) |
| `shahitto` | Shahitto | Monir | ? | Real name (Shahitto = সাহিত্য, nickname?) |
| `saikat` | Saikat | Sabina | ? | Full name, birth year, father's name |
| `shihab` | Shihab | Sabina | ? | Full name, birth year, father's name |
| `apon` | Apon | Sabina | ? | Real name (Apon = আপন = nickname?), father's name |
| `shikto-anubhab` | Shikto Anubhab Uddin | **Moyen** | ? | Birth date, birth place |
| `chumki-soto-meye` | Chumki Soto Meye | Chumki Sotobon | ~2024 | **Real full name**, father's name |

---

### ⚠️ Missing: Marriage dates and places

| Couple | What's Needed |
|--------|---------------|
| Damulla + Maryum | Marriage year, place |
| Azim + Rahima | Marriage year, place |
| Siraz + Munnuzan | Marriage year, place |
| Mota + husband | Marriage year, place, husband's real name |
| Mono + husband | Marriage year, place, husband's real name |
| Alom + wife | Marriage year, place, wife's real name |
| Lily + husband | Marriage year, place, husband's real name |
| Sadia + Rayhan | Marriage year, Rayhan's full name |

---

## How to Update the JSON

Open `database/seed/moyen_family_data.json` and find the entry by its `id`. For example, to add Moyen's birth date:

```json
{
  "id": "moyen-uddin",
  "firstName": "Md Moyen",
  "lastName": "Uddin",
  "gender": "male",
  "birthDate": "1990-05-15",          ← add this
  "birthDatePrecision": "exact",       ← "exact" if day is known, "year" if only year known
  "birthPlace": "Dhaka, Bangladesh",   ← add this
  "isLiving": true,
  ...
}
```

To update a placeholder name (e.g., "Mota"):

```json
{
  "id": "mota",
  "firstName": "Fatema",              ← replace "Mota" with real first name
  "lastName": "Molla",
  "nickname": "Mota",                  ← keep the nickname too
  ...
}
```

To add a husband's real name (e.g., Mota's husband):

```json
{
  "id": "mota-husband",
  "firstName": "Md Karim",             ← replace "Unknown"
  "lastName": "Bepari",                ← replace "Unknown"
  "nickname": "Mota'r Bor",
  ...
}
```

---

## Importing

Once you've updated the JSON, run:

```bash
# If running locally with Docker:
docker compose exec php bin/console app:seed-moyen-family --force

# If running directly:
cd backend && php bin/console app:seed-moyen-family --force
```

The `--force` flag clears and re-imports the data. Safe to run multiple times.

---

## Adding New Members Later

To add a new person, copy any existing entry in `persons[]` and assign a new unique `id`. Add the parent-child entry in `parentChild[]`, and if married, add to `marriages[]`.

Example — adding a new child of Shikto Anubhab:

```json
// In "persons":
{
  "id": "shikto-child-1",
  "firstName": "New Child",
  "lastName": "Uddin",
  "gender": "male",
  "birthDate": "2026-01-01",
  "birthDatePrecision": "exact",
  "isLiving": true
}

// In "parentChild":
{ "parent": "shikto-anubhab", "child": "shikto-child-1" }
```

---

## Field Reference

| Field | Required | Example | Notes |
|-------|----------|---------|-------|
| `id` | ✅ | `"moyen-uddin"` | Unique slug, no spaces |
| `firstName` | ✅ | `"Md Moyen"` | Use `"Unknown"` if not known |
| `lastName` | ✅ | `"Uddin"` | Use `"Unknown"` if not known |
| `gender` | ✅ | `"male"` / `"female"` | |
| `isLiving` | ✅ | `true` / `false` | |
| `birthDate` | ⬜ | `"1990-05-15"` | YYYY-MM-DD |
| `birthDatePrecision` | ⬜ | `"year"` | `"exact"`, `"year"`, or `"approximate"` |
| `birthPlace` | ⬜ | `"Dhaka, Bangladesh"` | Free text |
| `deathDate` | ⬜ | `"2010-01-01"` | Required if deceased |
| `nickname` | ⬜ | `"Mota"` | Saved as PersonName (Nickname) |
| `maidenName` | ⬜ | `"Begum"` | For women after marriage |
| `biography` | ⬜ | `"..."` | Free text, any length |
| `_todo` | ⬜ | `["birthDate"]` | Reminder list, ignored by importer |
| `_placeholder` | ⬜ | `true` | Marks unconfirmed persons, ignored by importer |

