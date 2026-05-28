# Payment Service

Spring Boot service for VNPay checkout, subscriptions, and course payment access.

## Database schema (Flyway)

Payment domain tables are **owned by this service**:

| Version | Table / change |
|---------|----------------|
| `V1` | `user_subscriptions` |
| `V2` | `user_subscriptions.cancel_at_period_end` |
| `V3` | `user_subscriptions` renewal columns, `user_payment_methods` |
| `V5` | `payments` baseline, indexes, drop legacy FK to content `Course` |

`course_id` on `payments` is a logical UUID only — **no FK** across services.

Content-service no longer manages payment tables via Prisma.

## Course access

- `GET /api/payments/courses/{courseId}/access` — payment DB + content enrollment
- `GET /api/v1/courses/{id}/access` — free course / enrollment only (internal)

## Deploy

On Docker (`SPRING_PROFILES_ACTIVE=docker`), Flyway runs automatically on startup.

If DB previously used content-service payment migrations, clean Prisma history:

```sql
DELETE FROM "_prisma_migrations"
WHERE migration_name LIKE '%payment%' OR migration_name LIKE '%user_subscriptions%';
```
