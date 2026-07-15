# 06 – API Design

## Base URL

```
http://localhost:8000/api
```

Production:
```
https://your-domain.com/api
```

## Authentication

All endpoints (except `/api/auth/*`) require a JWT Bearer token:

```
Authorization: Bearer <token>
```

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register (invite-based) |
| POST | /api/auth/login | Login, receive JWT |
| POST | /api/auth/refresh | Refresh JWT token |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password | Reset password |
| GET | /api/auth/me | Get current user profile |

---

## Person Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/persons | List persons (paginated, filterable) |
| POST | /api/persons | Create a person |
| GET | /api/persons/{id} | Get person detail |
| PUT | /api/persons/{id} | Update person |
| DELETE | /api/persons/{id} | Soft delete person |
| GET | /api/persons/{id}/ancestors | Get all ancestors |
| GET | /api/persons/{id}/descendants | Get all descendants |
| GET | /api/persons/{id}/relationship/{otherId} | Find relationship path |
| GET | /api/persons/{id}/media | Get person's media |
| GET | /api/persons/{id}/stories | Get person's stories |
| GET | /api/persons/{id}/events | Get person's events |
| GET | /api/persons/{id}/addresses | Get person's addresses |

---

## Relationship Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/relationships | Create a relationship |
| GET | /api/relationships/{id} | Get relationship |
| PUT | /api/relationships/{id} | Update relationship |
| DELETE | /api/relationships/{id} | Delete relationship |
| POST | /api/marriages | Create marriage |
| PUT | /api/marriages/{id} | Update marriage |
| DELETE | /api/marriages/{id} | Delete marriage |

---

## Family Tree Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tree/{personId} | Get tree data (graph format) |
| GET | /api/tree/{personId}/ancestors | Ancestor tree |
| GET | /api/tree/{personId}/descendants | Descendant tree |

---

## Branch Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/branches | List branches |
| POST | /api/branches | Create branch |
| GET | /api/branches/{id} | Get branch |
| PUT | /api/branches/{id} | Update branch |
| POST | /api/branches/{id}/admins | Add branch admin |
| DELETE | /api/branches/{id}/admins/{userId} | Remove branch admin |
| GET | /api/branches/{id}/members | List branch members |
| POST | /api/branches/{id}/invite | Invite member |

---

## Media Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/media | List media |
| POST | /api/media | Upload media |
| GET | /api/media/{id} | Get media item |
| PUT | /api/media/{id} | Update media metadata |
| DELETE | /api/media/{id} | Delete media |
| POST | /api/media/{id}/tag | Tag a person in media |
| DELETE | /api/media/{id}/tag/{personId} | Remove tag |

---

## Address Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/addresses | Add address |
| GET | /api/addresses/{id} | Get address |
| PUT | /api/addresses/{id} | Update address |
| DELETE | /api/addresses/{id} | Delete address |

---

## Story & Event Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/stories | Create story |
| GET | /api/stories/{id} | Get story |
| PUT | /api/stories/{id} | Update story |
| DELETE | /api/stories/{id} | Delete story |
| POST | /api/events | Create event |
| GET | /api/events/{id} | Get event |
| PUT | /api/events/{id} | Update event |
| DELETE | /api/events/{id} | Delete event |

---

## Approval Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/approval-requests | List pending requests |
| POST | /api/approval-requests | Submit a change request |
| GET | /api/approval-requests/{id} | Get request detail |
| POST | /api/approval-requests/{id}/approve | Approve |
| POST | /api/approval-requests/{id}/reject | Reject |

---

## Map Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/map/locations | All current family locations |
| GET | /api/map/migration/{personId} | Migration path for a person |
| GET | /api/map/heatmap | Family concentration data |

---

## Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/family-book/{personId} | PDF family book |
| GET | /api/reports/ancestors/{personId} | PDF ancestor report |
| GET | /api/reports/descendants/{personId} | PDF descendant report |
| GET | /api/reports/relationship/{id1}/{id2} | PDF relationship report |
| GET | /api/reports/birthdays | Upcoming birthdays list |
| GET | /api/reports/statistics | Family statistics |

---

## Standard Response Format

### Success

```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 25
  }
}
```

### Error

```json
{
  "error": {
    "code": "PERSON_NOT_FOUND",
    "message": "Person with ID xyz was not found.",
    "status": 404
  }
}
```

### Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "status": 422,
    "violations": [
      {
        "field": "firstName",
        "message": "This value should not be blank."
      }
    ]
  }
}
```

