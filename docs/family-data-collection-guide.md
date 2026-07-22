# Family Data Collection Guide
## Moyen Uddin Family Tree

> **How to use this guide**
> 1. Fill in the missing data in the tables below
> 2. Open `database/seed/moyen_family_data.json` and update the matching entry (find by `id`)
> 3. Re-run the import: `docker compose -f docker/docker-compose.yml exec php bin/console app:seed-moyen-family --force`
> 4. Refresh the tree at http://localhost:3000/tree
>
> **Or use the UI:** Go to any person's profile → click **Edit** to update data directly without re-importing.

---

## Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Complete — all key info known |
| ⚠️ | Partial — some info missing |
| ❓ | Placeholder — real name unknown |
| ✝ | Deceased |

---

## Current Database Summary
| | Count |
|--|-------|
| Total persons in database | **94** |
| Marriages recorded | **25** |
| Parent-child links | **113** |
| Placeholders (real name unknown) | **40** |
| Default birth place (Mohadebpur) | **95 persons** |
| Default address (Naogaon, Bangladesh) | **98 addresses** |

---

## Branch Planning

Branches are being set up based on grandparent lineage. Once Branch Management is built (Phase 6), each branch below will become a separate access scope:

| Branch ID | Branch Name | Root Person | Sub-branches |
|-----------|-------------|-------------|--------------|
| `branch-hafez` | Hafez Uddin Branch | Md Hafez Uddin Molla (1.1.1) | Mota, Mono, Alom, Lily, Sultana, Zahurul families |
| `branch-hazar` | Hazar Uddin Branch | Md Hazar Uddin Molla (1.1.2) | Pochi, Akbar families |
| `branch-zillur` | Zillur Rahman Branch | Md Zillur Rahman Molla (1.1.3) | Zinna, Rina, Aktar, Shiuly, Sweet families |
| `branch-siraz` | Siraz Uddin Branch | Md Siraz Uddin Molla (1.1.4) | Shahanaz, Monir, Sabina, Moyen families |
| `branch-royes` | Royes Uddin Branch | Md Royes Uddin Molla (1.1.5) | Muminul, Rehena families |
| `branch-fuppis` | Fuppis Branch | Md Hafez Uddin Molla daughters (1.1.6-8) | Fuppi Katihar, Debipur, Pagha families |

**Common ancestors** (visible to all branches):
- Md Damulla Uddin Molla (great-grandfather)
- Maryum Begum (great-grandmother)
- Md Azim Uddin Molla (grandfather)
- Mrs Rahima Begum (grandmother)

---

## Full Family Tree

```
Md Damulla Uddin Molla ──────────────── Maryum Begum
                    │
          Md Azim Uddin Molla ─────── Mrs Rahima Begum
                    │
   ┌────────────────┼──────────┬──────────────┬──────────┬──────┬──────┬──────┐
   │                │          │              │          │      │      │      │
1.1.1            1.1.2      1.1.3          1.1.4      1.1.5  1.1.6  1.1.7  1.1.8
Md Hafez       Md Hazar  Md Zillur     Md Siraz     Md Royes Fuppi  Fuppi  Fuppi
Uddin Molla   Uddin Molla Rahman Molla  Uddin Molla  Uddin   Katihar Debipur Pagha
+ Atia Beti               (no wife yet) + Munnuzan   Molla
   │                │          │          Begum       + Momena
   │            ┌───┼───┐   ┌──┼───┬──┬────┐   ┌──────┴──────┐
   │          Pochi Akbar Zossna Zinna Rina Aktar Shiuly Sweet  Muminul  Rehena
   │          (1968)(1965)(1978)(1980)(1982)(1984)(1985✝)(1988)  Islam   Yasmin
   │           + Bor +Maha  +Zobbar +Mamun +Rinna'r +Akter'r +Shiuly'r +Golapi (1987)  (1989)
   │                │  (div.) (2nd died2020) ar Rashid Bor  Bor   Bor      │        │
   │            ┌───┼───┐    └3 children    │         │     │    2children │      3 children
   │          Mahafuz Akhi Pinkki    ┌──┬───┘     Rinna  ┌──┴──┐  Sweet  Mominul  Rehena
   │          (1984) Bibi  Bibi      │  │         meye  Akter  Akter  Sele  meye  meye1/2
   │          +Habiba(1988)(1988)  Mitu Sujon    (2010) meye1 meye2 (2013)(2024-06-20) /sele1
   │                 +Akhi'r +Rony (1995)(1990)        (2015)(2018)
   │                  Bor           Mitu-soto
   │                                (2013)
   │
   ├── Mota (1960) ──── [husband?]
   │       ├── Chumki (elder)
   │       └── Chumki Sotobon (~1990)
   │               └── Chumki Soto Meye (2024)
   │
   ├── Mono (1965) ──── [husband?]
   │       ├── Masum (1985)
   │       ├── Masud (1987)
   │       └── Masuma (1989)
   │
   ├── Nazrul Islam ✝ (born & died 1990)
   │
   ├── Alom (1975) ──── [wife?]
   │       ├── Sadia (2009) ──── Rayhan
   │       └── Nyeem (2013)
   │
   ├── Lily (1990) ──── [husband?]
   │       ├── Lily Meye (2005)
   │       └── Lily Sele (2007)
   │
   ├── Sultana (1977)
   │       └── Sultana Meye (2020)
   │
   └── Zahurul Islam (1980)
           ├── Zahurul Meye (2010)
           └── Zahurul Sele (2012)

Branch 1.1.4 — Md Siraz Uddin Molla + Mrs Munnuzan Begum:
   ├── Shahanaz Parveen
   │       └── Md Abdul Bashar
   ├── Md Monir Uddin Molla
   │       ├── Shakkhor
   │       └── Shahitto
   ├── Sabina Yasmin
   │       ├── Saikat
   │       ├── Shihab
   │       └── Apon
   └── Md Moyen Uddin ← YOU
           └── Shikto Anubhab Uddin
```

---

## Data Collection Sheets

### ⚠️ Branch 1.1.1 — Md Hafez Uddin Molla + Atia Beti

| ID | Known Name | DOB | What's Needed |
|----|-----------|-----|---------------|
| `hafez-uddin-molla` | Md Hafez Uddin Molla | ? | Birth year, is he still living? |
| `atia-beti` | Atia Beti | ? | Birth year, maiden name, is she still living? |
| `mota` | Mota | ~1960 | **Real first name** (Mota = nickname) |
| `mota-husband` | Mota's husband | ? | **Full real name** |
| `mono` | Mono | ~1965 | **Real first name** (Mono = nickname) |
| `mono-husband` | Mono's husband | ? | **Full real name** |
| `alom` | Alom | ~1975 | Confirm if Alom is real name |
| `alom-wife` | Alom's wife | ? | **Full real name** |
| `lily` | Lily | ~1990 | Confirm if Lily is real name |
| `lily-husband` | Lily's husband | ? | **Full real name** |
| `sultana` | Sultana | ~1977 | Husband's name (if married) |
| `zahurul-islam` | Zahurul Islam | ~1980 | Wife's full name |
| `chumki` | Chumki (elder) | ? | Real full name, birth year |
| `chumki-sotobon` | Chumki Sotobon | ~1990 | Real full name, husband's name |
| `chumki-soto-meye` | Chumki Soto Meye | ~2024 | **Real full name**, father's name |
| `lily-meye` | Lily Meye | ~2005 | **Real full name** |
| `lily-sele` | Lily Sele | ~2007 | **Real full name** |
| `sultana-meye` | Sultana Meye | ~2020 | **Real full name**, father's name |
| `zahurul-sele` | Zahurul Sele | ~2012 | **Real full name**, mother's name |
| `zahurul-meye` | Zahurul Meye | ~2010 | **Real full name**, mother's name |

---

### ⚠️ Branch 1.1.2 — Md Hazar Uddin Molla

| ID | Known Name | DOB | What's Needed |
|----|-----------|-----|---------------|
| `hazar-uddin-molla` | Md Hazar Uddin Molla | ? | Birth year, wife's name, is he still living? |
| `pochi` | Pochi | ~1968 | **Real first name** (Pochi = nickname) |
| `pochi-husband` | Pochi's husband | ? | **Full real name** |
| `pochi-meye` | Pochi Meye | ~1990 | **Real full name** |
| `shahin` | Shahin | ~1985 | Full name with last name |
| `shahin-soto` | Shahin Soto | ~1987 | Real full name |
| `akbar-molla` | Md Akbar Molla | ~1965 | is he still living? |
| `mahabuba` | Mahabuba | ? | Birth year, maiden name |
| `mahafuz-molla` | Md Mahafuz Molla | ~1984 | is he still living? |
| `habiba` | Habiba | ? | Birth year, maiden name |
| `akhi-bibi` | Akhi Bibi | ~1988 | Full name confirm |
| `akhi-husband` | Akhi's husband | ? | **Full real name** |
| `pinkki-bibi` | Pinkki Bibi | ~1988 | Full name confirm |
| `rony` | Rony | ? | **Full real name** (Mr. Rony) |
| `zossna-bibi` | Zossna Bibi | ~1978 | Real name confirm, is she still living? |
| `zobbar` | Mr. Zobbar (1st husband, divorced) | ? | **Full real name**, divorce year |
| `zossna-second-husband` | 2nd husband (died 2020) | ? | **Full real name**, birth year |

---

### ⚠️ Branch 1.1.3 — Md Zillur Rahman Molla

| ID | Known Name | DOB | What's Needed |
|----|-----------|-----|---------------|
| `zillur-rahman-molla` | Md Zillur Rahman Molla | ? | Birth year, wife's name, is he still living? |
| `zinna-begum` | Zinna Begum | ~1980 | Full name confirm, is she still living? |
| `mamun-ar-rashid` | Mamun ar Rashid | ? | Birth year |
| `mitu-rashid` | Mitu Rashid | ~1995 | Full name confirm |
| `sujon-rashid` | Sujon Rashid | ~1990 | Full name confirm |
| `mitu-soto` | Mitu Soto | ~2013 | Real full name |
| `rina-begum` | Rina Begum | ~1982 | is she still living? |
| `rina-husband` | Rina's husband | ? | **Full real name** |
| `rinna-meye` | Rinna Meye | ~2010 | **Real full name** |
| `aktar-begum` | Aktar Begum | ~1984 | is she still living? |
| `akter-husband` | Aktar's husband | ? | **Full real name** |
| `akter-meye1` | Akter Meye 1 | ~2015 | **Real full name** |
| `akter-meye2` | Akter Meye 2 | ~2018 | **Real full name** |
| `shiuly-begum` ✝ | Shiuly Begum | ~1985, died 2020 | Exact death date |
| `shiuly-husband` | Shiuly's husband | ? | **Full real name** |
| `shiuly-sele` | Shiuly Sele | ~2014 | **Real full name**, confirm gender |
| `sweet-molla` | Sweet Molla | ~1988 | Full name confirm (Sweet = nickname?) |
| `golapi` | Golapi | ? | Birth year, maiden name |
| `sweet-sele` | Sweet Sele | ~2013 | **Real full name**, confirm gender |

---

### ⚠️ Branch 1.1.4 — Md Siraz Uddin Molla (Moyen's family)

| ID | Known Name | DOB | What's Needed |
|----|-----------|-----|---------------|
| `siraz-uddin-molla` | Md Siraz Uddin Molla | ? | Birth year, birth village, is he still living? |
| `munnuzan-begum` | Mrs Munnuzan Begum | ? | Full formal name, maiden name, birth year |
| `shahanaz-parveen` | Shahanaz Parveen | ? | Birth year, husband's name |
| `monir-uddin-molla` | Md Monir Uddin Molla | ? | Birth year, wife's name |
| `sabina-yasmin` | Sabina Yasmin | ? | Birth year, husband's name |
| `moyen-uddin` | **Md Moyen Uddin ← YOU** | ? | Birth date, birth place, spouse name |
| `abdul-bashar` | Md Abdul Bashar | ? | Birth year, father's name |
| `shakkhor` | Shakkhor | ? | Real name confirm, birth year |
| `shahitto` | Shahitto | ? | Real name confirm, birth year |
| `saikat` | Saikat | ? | Full name, birth year, father's name |
| `shihab` | Shihab | ? | Full name, birth year, father's name |
| `apon` | Apon | ? | Real name confirm, father's name |
| `shikto-anubhab` | Shikto Anubhab Uddin | ? | Birth date, birth place |

---

### ⚠️ Branch 1.1.5 — Md Royes Uddin Molla + Momena Begum

| ID | Known Name | DOB | What's Needed |
|----|-----------|-----|---------------|
| `royes-uddin-molla` | Md Royes Uddin Molla | ? | Birth year, is he still living? |
| `momena` | Momena Begum | ? | Birth year, maiden name |
| `muminul-islam` | Md Muminul Islam Molla | ~1987 | Wife's name |
| `mominul-meye` | Mominul Meye | **2024-06-20** ✅ | **Real full name**, mother's name |
| `rehena-yasmin` | Rehena Yasmin | ~1989 | Husband's name |
| `rehena-meye1` | Rehena Meye 1 | ~2010 | **Real full name**, father's name |
| `rehena-meye2` | Rehena Meye 2 | ~2014 | **Real full name**, father's name |
| `rehena-sele1` | Rehena Sele 1 | ~2020 | **Real full name**, father's name |

---

### ⚠️ Branch 1.1.6 / 1.1.7 / 1.1.8 — Fuppis

| ID | Known As | What's Needed |
|----|---------|---------------|
| `fuppi-katihar` | Fuppi Katihar | **Real first name**, birth year, children |
| `fuppi-katihar-husband` | Fuppi Katihar's husband | **Full real name**, birth year |
| `fuppi-debipur` | Fuppi Debipur | **Real first name**, birth year, children |
| `fuppi-debipur-husband` | Fuppi Debipur's husband | **Full real name**, birth year |
| `fuppi-pagha` | Fuppi Pagha | **Real first name**, birth year, children |
| `fuppi-pagha-husband` | Fuppi Pagha's husband | **Full real name**, birth year |

---

### ⚠️ Missing: Marriage dates and places (all 25 marriages)

| Marriage ID | Couple | What's Needed |
|------------|--------|---------------|
| `damulla-maryum` | Damulla + Maryum | Marriage year, place |
| `azim-rahima` | Azim + Rahima | Marriage year, place |
| `hafez-atia` | Hafez + Atia Beti | Marriage year, place |
| `siraz-munnuzan` | Siraz + Munnuzan | Marriage year, place |
| `royes-momena` | Royes + Momena | Marriage year, place |
| `fuppi-katihar-marriage` | Fuppi Katihar + husband | Year, both real names |
| `fuppi-debipur-marriage` | Fuppi Debipur + husband | Year, both real names |
| `fuppi-pagha-marriage` | Fuppi Pagha + husband | Year, both real names |
| `pochi-marriage` | Pochi + husband | Year, husband's real name |
| `akbar-mahabuba` | Akbar + Mahabuba | Marriage year, place |
| `mahafuz-habiba` | Mahafuz + Habiba | Marriage year, place |
| `akhi-marriage` | Akhi Bibi + husband | Year, husband's real name |
| `pinkki-rony` | Pinkki Bibi + Rony | Year, Rony's full name |
| `zossna-zobbar` | Zossna + Zobbar **(divorced)** | Marriage + divorce year, Zobbar's real name |
| `zossna-second` | Zossna + 2nd husband **(died 2020)** | Marriage year, his real name |
| `zinna-mamun` | Zinna + Mamun ar Rashid | Marriage year, place |
| `rina-marriage` | Rina + husband | Year, husband's real name |
| `aktar-marriage` | Aktar + husband | Year, husband's real name |
| `shiuly-marriage` | Shiuly + husband | Year, husband's real name |
| `sweet-golapi` | Sweet + Golapi | Marriage year, place |
| `mota-marriage` | Mota + husband | Year, husband's real name |
| `mono-marriage` | Mono + husband | Year, husband's real name |
| `alom-marriage` | Alom + wife | Year, wife's real name |
| `lily-marriage` | Lily + husband | Year, husband's real name |
| `sadia-rayhan` | Sadia + Rayhan | Marriage year, Rayhan's full name |

---

## How to Update the JSON

Open `database/seed/moyen_family_data.json` and find the entry by its `id`.

**Add a birth date (when only year is known):**
```jsonc
{
  "id": "moyen-uddin",
  "firstName": "Md Moyen",
  "lastName": "Uddin",
  "birthDate": "1990-01-01",
  "birthDatePrecision": "year",
  // ...other fields unchanged
}
```

**Add an exact birth date (day and month known):**
```jsonc
{
  "birthDate": "1990-05-15",
  "birthDatePrecision": "exact",
  // ...other fields unchanged
}
```

**Replace a placeholder name (e.g., "Mota"):**
```jsonc
{
  "id": "mota",
  "firstName": "Fatema",        // replace "Mota"
  "lastName": "Molla",
  "nickname": "Mota",           // keep the nickname
  // ...other fields unchanged
}
```

**Replace a placeholder spouse:**
```jsonc
{
  "id": "mota-husband",
  "firstName": "Md Karim",      // replace "Unknown"
  "lastName": "Bepari",         // replace "Unknown"
  // ...other fields unchanged
}
```

**Add a marriage date:**
```jsonc
{
  "id": "hafez-atia",
  "spouse1": "hafez-uddin-molla",
  "spouse2": "atia-beti",
  "marriageDate": "1958-01-01",
  "marriageDatePrecision": "year",
  "marriagePlace": "Dhaka, Bangladesh",
  // ...other fields unchanged
}
```

---

## Importing

Once you've updated the JSON, run:

```bash
# Docker (recommended):
docker compose exec php bin/console app:seed-moyen-family --force

# Direct:
cd backend && php bin/console app:seed-moyen-family --force
```

The `--force` flag clears and re-imports all data. Safe to run multiple times.

---

## How to Provide New Data

Just send new family members in this format and they'll be added:

```
X.X.X  Full Name (son/daughter, DOB DD.MM.YYYY) married to [Spouse Name]
    X.X.X.X  Child Name (son/daughter, DOB DD.MM.YYYY)
    X.X.X.X  Child Name (son/daughter, DOB DD.MM.YYYY)
```

Example of what was provided:
```
1.1.5 Md Royes Uddin Molla married to Ms. Momena
    1.1.5.1 Md Muminul Islam Molla (Son, dob 01.01.1987)
        1.1.5.1.1 Mominul meye (dob 20.06.2024)
    1.1.5.2 Rehena Yasmin (Daughter, dob 01.01.1989)
        1.1.5.2.1 Rehena-meye1 (Daughter, dob 01.01.2010)
```

---

## Adding New Members Manually to the JSON

Copy any existing entry and assign a new unique `id`. Add parent-child and marriage entries.

```json
// In "persons":
{
  "id": "new-person-id",
  "firstName": "First Name",
  "lastName": "Last Name",
  "gender": "male",
  "birthDate": "2000-01-01",
  "birthDatePrecision": "year",
  "isLiving": true
}

// In "parentChild":
{ "parent": "parent-id", "child": "new-person-id" }

// In "marriages" (if applicable):
{ "id": "new-marriage-id", "spouse1": "new-person-id", "spouse2": "other-person-id" }
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
| `nickname` | ⬜ | `"Mota"` | Common/family name — stored directly on person record |
| `maidenName` | ⬜ | `"Begum"` | For women after marriage |
| `birthDate` | ⬜ | `"1990-05-15"` | YYYY-MM-DD format |
| `birthDatePrecision` | ⬜ | `"year"` | `"exact"`, `"year"`, or `"approximate"` |
| `birthPlace` | ⬜ | `"Dhaka, Bangladesh"` | Free text |
| `deathDate` | ⬜ | `"2020-01-01"` | Required if deceased |
| `phone` | ⬜ | `"+8801712345678"` | Mobile / phone number |
| `nidNumber` | ⬜ | `"1234567890123"` | National ID card number |
| `bloodGroup` | ⬜ | `"A+"` | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `profession` | ⬜ | `"Farmer"` | Occupation / job title |
| `highestEducation` | ⬜ | `"SSC / O-Level"` | None, Primary, Secondary/JSC, SSC/O-Level, HSC/A-Level, Diploma, Bachelor's, Master's, PhD, Other |
| `biography` | ⬜ | `"..."` | Free text, any length |
| `_todo` | ⬜ | `["birthDate"]` | Reminder list — **ignored by importer** |
| `_placeholder` | ⬜ | `true` | Marks unconfirmed persons — **ignored by importer** |
