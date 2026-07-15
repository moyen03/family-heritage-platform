# 10 – Business Rules

## Person Rules

- BR-PERSON-01: A person must have at least a first name and last name
- BR-PERSON-02: Living persons have `is_living = true` by default
- BR-PERSON-03: A person with a death date is automatically set to `is_living = false`
- BR-PERSON-04: Birth date must be before death date if both are provided
- BR-PERSON-05: Marriage date must be after both spouses' birth dates
- BR-PERSON-06: A person cannot be their own parent, child, or spouse
- BR-PERSON-07: A person can have multiple marriages (sequential or historical)

## Relationship Rules

- BR-REL-01: Relationships are directional (person1 IS [type] OF person2)
- BR-REL-02: The inverse relationship is automatically created (e.g., if A is parent of B, B is child of A)
- BR-REL-03: Duplicate relationships between the same two people of the same type are not allowed
- BR-REL-04: A person can have multiple biological parents (to support unknown parents and blended families)
- BR-REL-05: Sibling relationships must share at least one common parent (unless manually overridden)

## Branch Rules

- BR-BRANCH-01: Every person must belong to at least one branch
- BR-BRANCH-02: A person can belong to multiple branches (e.g., exists in both maternal and paternal branches)
- BR-BRANCH-03: One branch per person is marked as primary
- BR-BRANCH-04: A branch must have at least one admin at all times
- BR-BRANCH-05: Branch Admins can only act within their branch scope

## Approval Rules

- BR-APPR-01: Any change made by a Member creates an approval request
- BR-APPR-02: Changes by Branch Admin within their branch do not require approval
- BR-APPR-03: Changes by Super Admin never require approval
- BR-APPR-04: An approval request must show the old value and the proposed new value
- BR-APPR-05: A rejected request is archived but never deleted
- BR-APPR-06: Approved changes are applied immediately and logged

## Privacy Rules

- BR-PRIV-01: Living persons default to `visibility = family`
- BR-PRIV-02: A deceased person defaults to `visibility = family`
- BR-PRIV-03: No living person's birth date or address is visible to Viewers
- BR-PRIV-04: Private persons are not included in any export unless explicitly requested by Super Admin

## Media Rules

- BR-MEDIA-01: Maximum file size: 50MB per file
- BR-MEDIA-02: Accepted formats: JPG, PNG, GIF, WEBP (photos); MP4, MOV (videos); PDF (documents); MP3, WAV (audio)
- BR-MEDIA-03: Media inherits the privacy level of the person it's attached to (unless overridden)
- BR-MEDIA-04: A media item can be tagged to multiple people
- BR-MEDIA-05: Deletion of a person does not delete their media (media is archived)

## Audit Rules

- BR-AUDIT-01: Every INSERT, UPDATE, and DELETE is logged
- BR-AUDIT-02: The audit log is append-only — it cannot be edited or deleted
- BR-AUDIT-03: Deleted records can be restored by Super Admin
- BR-AUDIT-04: Audit logs are retained indefinitely

## Birthday Rules

- BR-BDAY-01: Birthday notifications are sent 7 days in advance
- BR-BDAY-02: Birthdays of deceased persons are not notified
- BR-BDAY-03: Birthdays of private persons are not notified to general members

