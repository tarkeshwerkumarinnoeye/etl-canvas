-- ============================================================================
-- Pipeline Designer - FIXED Row Level Security (RLS) Policies
-- 
-- FIX: Resolves "infinite recursion detected in policy" error
-- 
-- The issue was caused by circular references:
--   - pipelines policy → queries pipeline_shares
--   - pipeline_shares policy → queries pipelines
-- 
-- Solution: Use SECURITY DEFINER helper functions that bypass RLS
-- for cross-table lookups.
-- 
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================
DROP POLICY IF EXISTS "pipelines_select_own" ON pipelines;
DROP POLICY IF EXISTS "pipelines_select_public" ON pipelines;
DROP POLICY IF EXISTS "pipelines_select_shared" ON pipelines;
DROP POLICY IF EXISTS "pipelines_insert_own" ON pipelines;
DROP POLICY IF EXISTS "pipelines_update_own" ON pipelines;
DROP POLICY IF EXISTS "pipelines_update_shared_edit" ON pipelines;
DROP POLICY IF EXISTS "pipelines_delete_own" ON pipelines;
DROP POLICY IF EXISTS "pipelines_delete_shared_admin" ON pipelines;

DROP POLICY IF EXISTS "versions_select_own_pipeline" ON pipeline_versions;
DROP POLICY IF EXISTS "versions_select_shared_pipeline" ON pipeline_versions;
DROP POLICY IF EXISTS "versions_select_public_pipeline" ON pipeline_versions;
DROP POLICY IF EXISTS "versions_insert_own_pipeline" ON pipeline_versions;
DROP POLICY IF EXISTS "versions_insert_shared_pipeline" ON pipeline_versions;
DROP POLICY IF EXISTS "versions_delete_own_pipeline" ON pipeline_versions;

DROP POLICY IF EXISTS "shares_select_own_pipeline" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_select_own" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_insert_owner" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_insert_admin" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_update_owner" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_delete_owner" ON pipeline_shares;
DROP POLICY IF EXISTS "shares_delete_self" ON pipeline_shares;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;

-- ============================================================================
-- STEP 2: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- These bypass RLS to prevent circular references
-- ============================================================================

-- Function: Check if user owns a pipeline (bypasses RLS)
CREATE OR REPLACE FUNCTION is_pipeline_owner(pipeline_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pipelines 
    WHERE id = pipeline_uuid AND user_id = user_uuid
  );
$$;

-- Function: Check if user has permission on a pipeline (bypasses RLS)
CREATE OR REPLACE FUNCTION has_pipeline_permission(
  pipeline_uuid UUID, 
  user_uuid UUID, 
  required_permission VARCHAR
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pipeline_shares 
    WHERE pipeline_id = pipeline_uuid 
      AND user_id = user_uuid
      AND (
        permission = required_permission 
        OR permission = 'admin'
        OR (required_permission = 'view' AND permission IN ('view', 'edit', 'admin'))
        OR (required_permission = 'edit' AND permission IN ('edit', 'admin'))
      )
  );
$$;

-- Function: Get pipelines shared with user (bypasses RLS)
CREATE OR REPLACE FUNCTION get_shared_pipeline_ids(user_uuid UUID)
RETURNS TABLE(pipeline_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.pipeline_id 
  FROM pipeline_shares ps
  WHERE ps.user_id = user_uuid;
$$;

-- Function: Get pipelines owned by user (bypasses RLS)
CREATE OR REPLACE FUNCTION get_owned_pipeline_ids(user_uuid UUID)
RETURNS TABLE(pipeline_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id FROM pipelines p WHERE p.user_id = user_uuid;
$$;

-- ============================================================================
-- STEP 3: CREATE FIXED PIPELINES POLICIES
-- Using helper functions to avoid circular references
-- ============================================================================

-- Enable RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own pipelines
CREATE POLICY "pipelines_select_own"
  ON pipelines FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Anyone can view public pipelines
CREATE POLICY "pipelines_select_public"
  ON pipelines FOR SELECT
  TO authenticated
  USING (is_public = true);

-- SELECT: Users can view pipelines shared with them
-- FIX: Uses helper function instead of direct subquery
CREATE POLICY "pipelines_select_shared"
  ON pipelines FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_shared_pipeline_ids(auth.uid())));

-- INSERT: Users can create their own pipelines
CREATE POLICY "pipelines_insert_own"
  ON pipelines FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own pipelines
CREATE POLICY "pipelines_update_own"
  ON pipelines FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users with edit permission can update shared pipelines
-- FIX: Uses helper function
CREATE POLICY "pipelines_update_shared_edit"
  ON pipelines FOR UPDATE
  TO authenticated
  USING (has_pipeline_permission(id, auth.uid(), 'edit'));

-- DELETE: Users can delete their own pipelines
CREATE POLICY "pipelines_delete_own"
  ON pipelines FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- DELETE: Admins can delete shared pipelines
-- FIX: Uses helper function
CREATE POLICY "pipelines_delete_shared_admin"
  ON pipelines FOR DELETE
  TO authenticated
  USING (has_pipeline_permission(id, auth.uid(), 'admin'));

-- ============================================================================
-- STEP 4: CREATE FIXED PIPELINE VERSIONS POLICIES
-- ============================================================================

-- SELECT: Users can view versions of their own pipelines
CREATE POLICY "versions_select_own_pipeline"
  ON pipeline_versions FOR SELECT
  TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

-- SELECT: Users can view versions of shared pipelines
CREATE POLICY "versions_select_shared_pipeline"
  ON pipeline_versions FOR SELECT
  TO authenticated
  USING (has_pipeline_permission(pipeline_id, auth.uid(), 'view'));

-- INSERT: Users can create versions of their own pipelines
CREATE POLICY "versions_insert_own_pipeline"
  ON pipeline_versions FOR INSERT
  TO authenticated
  WITH CHECK (is_pipeline_owner(pipeline_id, auth.uid()));

-- INSERT: Users with edit permission can create versions of shared pipelines
CREATE POLICY "versions_insert_shared_pipeline"
  ON pipeline_versions FOR INSERT
  TO authenticated
  WITH CHECK (has_pipeline_permission(pipeline_id, auth.uid(), 'edit'));

-- DELETE: Users can delete versions of their own pipelines
CREATE POLICY "versions_delete_own_pipeline"
  ON pipeline_versions FOR DELETE
  TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

-- ============================================================================
-- STEP 5: CREATE FIXED PIPELINE SHARES POLICIES
-- ============================================================================

-- SELECT: Users can view shares for their own pipelines
CREATE POLICY "shares_select_own_pipeline"
  ON pipeline_shares FOR SELECT
  TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

-- SELECT: Users can view their own share records
CREATE POLICY "shares_select_own"
  ON pipeline_shares FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Pipeline owners can share their pipelines
CREATE POLICY "shares_insert_owner"
  ON pipeline_shares FOR INSERT
  TO authenticated
  WITH CHECK (is_pipeline_owner(pipeline_id, auth.uid()));

-- UPDATE: Pipeline owners can update share permissions
CREATE POLICY "shares_update_owner"
  ON pipeline_shares FOR UPDATE
  TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

-- DELETE: Pipeline owners can remove shares
CREATE POLICY "shares_delete_owner"
  ON pipeline_shares FOR DELETE
  TO authenticated
  USING (is_pipeline_owner(pipeline_id, auth.uid()));

-- DELETE: Users can remove their own shares (unshare themselves)
CREATE POLICY "shares_delete_self"
  ON pipeline_shares FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- STEP 6: CREATE PROFILES POLICIES
-- ============================================================================

-- SELECT: Anyone can view profiles (for sharing UI)
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Users can create their own profile (handled by trigger)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Users can delete their own profile
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the fix worked
-- ============================================================================

-- 1. Check all policies are created
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Verify no recursion issues by testing a simple query
-- (This should work without errors if policies are correct)
/*
SELECT id, name FROM pipelines WHERE user_id = auth.uid() LIMIT 1;
*/

-- 3. Test helper functions
/*
SELECT * FROM get_shared_pipeline_ids(auth.uid());
SELECT is_pipeline_owner('some-pipeline-id', auth.uid());
SELECT has_pipeline_permission('some-pipeline-id', auth.uid(), 'edit');
*/

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- PROBLEM:
--   "infinite recursion detected in policy for relation pipelines"
-- 
-- CAUSE:
--   pipelines policy → queries pipeline_shares table
--   pipeline_shares policy → queries pipelines table
--   = Circular reference = Infinite recursion
-- 
-- SOLUTION:
--   Created SECURITY DEFINER helper functions that bypass RLS:
--   - is_pipeline_owner() - Check if user owns pipeline
--   - has_pipeline_permission() - Check if user has permission
--   - get_shared_pipeline_ids() - Get shared pipeline IDs
--   - get_owned_pipeline_ids() - Get owned pipeline IDs
-- 
--   These functions use SECURITY DEFINER which runs with table owner
--   privileges, bypassing RLS checks and breaking the circular dependency.
-- 
-- ============================================================================
