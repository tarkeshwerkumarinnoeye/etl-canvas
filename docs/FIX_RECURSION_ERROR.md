# 🚨 Quick Fix: Infinite Recursion Error

## The Error

```
{code: "42P17", message: "infinite recursion detected in policy for relation \"pipelines\""}
```

## Why This Happens

The original RLS policies had **circular references**:

```
pipelines policy        → queries pipeline_shares table
pipeline_shares policy  → queries pipelines table
                         ↓
                    INFINITE RECURSION ❌
```

## The Fix

Use **SECURITY DEFINER helper functions** that bypass RLS for cross-table lookups:

```sql
-- These functions run with table owner privileges, breaking the cycle
CREATE FUNCTION is_pipeline_owner(...) SECURITY DEFINER ...
CREATE FUNCTION has_pipeline_permission(...) SECURITY DEFINER ...
```

## How to Fix Your Deployment

### Option 1: Run the Fixed SQL (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `docs/rls-policies-fixed.sql`
4. Click **Run**
5. ✅ Done! The error should be resolved.

### Option 2: Quick Fix (Minimal Changes)

If you just want to fix the error quickly, run this in SQL Editor:

```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "pipelines_select_shared" ON pipelines;
DROP POLICY IF EXISTS "pipelines_update_shared_edit" ON pipelines;
DROP POLICY IF EXISTS "pipelines_delete_shared_admin" ON pipelines;
DROP POLICY IF EXISTS "shares_select_own_pipeline" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_insert_owner" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_update_owner" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_delete_owner" ON pipeline_shares;

-- Create helper function
CREATE OR REPLACE FUNCTION is_pipeline_owner(pipeline_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM pipelines WHERE id = pipeline_uuid AND user_id = user_uuid);
$$;

CREATE OR REPLACE FUNCTION has_pipeline_permission(pipeline_uuid UUID, user_uuid UUID, required_permission VARCHAR)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM pipeline_shares 
    WHERE pipeline_id = pipeline_uuid AND user_id = user_uuid
    AND (permission = required_permission OR permission = 'admin'
      OR (required_permission = 'view' AND permission IN ('view', 'edit', 'admin'))
      OR (required_permission = 'edit' AND permission IN ('edit', 'admin')))
  );
$$;

CREATE OR REPLACE FUNCTION get_shared_pipeline_ids(user_uuid UUID)
RETURNS TABLE(pipeline_id UUID) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ps.pipeline_id FROM pipeline_shares ps WHERE ps.user_id = user_uuid;
$$;

-- Recreate policies using helper functions
CREATE POLICY "pipelines_select_shared" ON pipelines FOR SELECT TO authenticated
  USING (id IN (SELECT get_shared_pipeline_ids(auth.uid())));

CREATE POLICY "pipelines_update_shared_edit" ON pipelines FOR UPDATE TO authenticated
  USING (has_pipeline_permission(id, auth.uid(), 'edit'));

CREATE POLICY "pipelines_delete_shared_admin" ON pipelines FOR DELETE TO authenticated
  USING (has_pipeline_permission(id, auth.uid(), 'admin'));

CREATE POLICY "shares_select_own_pipeline" ON pipeline_shares FOR SELECT TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

CREATE POLICY "shares_insert_owner" ON pipeline_shares FOR INSERT TO authenticated
  WITH CHECK (is_pipeline_owner(pipeline_id, auth.uid()));

CREATE POLICY "shares_update_owner" ON pipeline_shares FOR UPDATE TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

CREATE POLICY "shares_delete_owner" ON pipeline_shares FOR DELETE TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));
```

## Verify the Fix

After running the fix, test by creating a new pipeline in your app. The error should be gone.

You can also verify in SQL Editor:

```sql
-- This should work without errors
SELECT id, name FROM pipelines WHERE user_id = auth.uid();
```

## What Changed

| Before | After |
|--------|-------|
| Direct subqueries between tables | SECURITY DEFINER helper functions |
| Circular RLS references | Functions bypass RLS for cross-table lookups |
| ❌ Infinite recursion | ✅ Clean policy evaluation |

## Security Note

SECURITY DEFINER functions run with **table owner privileges**, which is safe here because:
- They only perform read operations (SELECT EXISTS)
- They're called within RLS policies that still enforce user context
- They don't expose raw table access
- They're marked as STABLE for query optimization

## Need More Help?

- Check `docs/rls-policies-fixed.sql` for the complete fixed version
- Review `docs/README.md` for full documentation
- See Supabase docs on [SECURITY DEFINER](https://supabase.com/docs/guides/database/postgres/row-level-security#using-security-definer)
