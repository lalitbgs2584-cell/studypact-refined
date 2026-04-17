# Apply Performance Indexes

Run these commands to add the new indexes:

```bash
# Generate migration
pnpm prisma migrate dev --name add_performance_indexes

# Or for production
pnpm prisma migrate deploy
```

## New Indexes Added

### Task table:
- `[userId, scope, status]` - For filtering personal/group tasks by status
- `[groupId, scope, dueAt]` - For group task queries with due date filtering
- `[userId, status, dueAt]` - For user task queries with status + due date

### UserGroup table:
- `[userId, role]` - For finding user's admin/leader groups
- `[groupId, role]` - For finding group admins/leaders

## Expected Performance Improvement

- Task queries: 50-70% faster
- Workspace/access checks: 30-40% faster
- Leaderboard queries: 40-60% faster

## Verify Indexes

After migration, verify in PostgreSQL:

```sql
-- Check Task indexes
\d task

-- Check UserGroup indexes
\d user_group

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM task 
WHERE "userId" = 'xxx' AND scope = 'PERSONAL' 
ORDER BY "createdAt" DESC;
```
