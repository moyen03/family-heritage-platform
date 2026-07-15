# 08 – Security & Privacy

## Authentication

- JWT Bearer tokens (LexikJWTAuthenticationBundle)
- Access token TTL: **1 hour**
- Refresh token TTL: **30 days**
- bcrypt password hashing (cost factor 12)
- Email verification on registration
- Invite-only registration (no public sign-up)

## Authorization

Symfony Security Voters control access to every resource.

### Roles

| Role | Code | Capabilities |
|------|------|-------------|
| Super Admin | `ROLE_SUPER_ADMIN` | Full access to everything |
| Branch Admin | `ROLE_BRANCH_ADMIN` | Manage their own branch |
| Member | `ROLE_MEMBER` | View + suggest edits |
| Viewer | `ROLE_VIEWER` | Read-only |

### Voters

Each entity has a dedicated Voter class:

- `PersonVoter`
- `BranchVoter`
- `MediaVoter`
- `StoryVoter`

## Privacy Levels

| Level | Who Sees It |
|-------|------------|
| `public` | Everyone (future public site) |
| `family` | All authenticated members |
| `branch` | Only members of the same branch |
| `private` | Super Admin + Branch Admin only |
| `custom` | Specific list of user IDs |

## Living Person Protection

If `is_living = true`:
- Birth date hidden (or year only)
- Current address hidden
- Contact info hidden
- Profile requires explicit permission to view
- Not included in public exports

## Data Security

- HTTPS enforced in production (Nginx config)
- CORS configured per environment
- SQL injection prevention via Doctrine ORM parameterized queries
- XSS prevention via React's escaped rendering
- CSRF protection on state-changing endpoints
- Rate limiting on authentication endpoints
- Input validation on all API inputs via Symfony Validator

## Audit Trail

Every write operation is recorded:

```
who changed it
when
what entity
what field
old value
new value
IP address
user agent
```

Nothing is hard-deleted. `deleted_at` is set instead.

## Approval Workflow

1. Member submits a change
2. System creates an `approval_request` with old/new values in JSON
3. Branch Admin receives notification
4. Branch Admin approves or rejects
5. If approved, change is applied and audit log created
6. If rejected, reason is recorded

## Export & GDPR Compliance

- Full data export available (JSON, XML, GEDCOM)
- Personal data can be anonymized for living people in exports
- Account deletion marks user as deleted (soft delete)

