-- ============================================================================
-- Pipeline Designer - Row Level Security (RLS) Policies
-- Run this AFTER schema.sql in Supabase SQL Editor
-- 
-- ⚠️ IMPORTANT: This file uses SECURITY DEFINER helper functions to prevent
-- "infinite recursion" errors. If you already ran the old version, see
-- docs/FIX_RECURSION_ERROR.md for migration instructions.
-- ============================================================================

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. PIPELINES TABLE POLICIES
-- ============================================================================

-- SELECT: Users can view their own pipelines
DROP POLICY IF EXISTS "pipelines_select_own" ON pipelines;
CREATE POLICY "pipelines_select_own"
  ON pipelines FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SELECT: Anyone can view public pipelines
DROP POLICY IF EXISTS "pipelines_select_public" ON pipelines;
CREATE POLICY "pipelines_select_public"
  ON pipelines FOR SELECT
  TO authenticated
  USING (is_public = true);

-- SELECT: Users can view pipelines shared with them
DROP POLICY IF EXISTS "pipelines_select_shared" ON pipelines;
CREATE POLICY "pipelines_select_shared"
  ON pipelines FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT pipeline_id 
      FROM pipeline_shares 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create their own pipelines
DROP POLICY IF EXISTS "pipelines_insert_own" ON pipelines;
CREATE POLICY "pipelines_insert_own"
  ON pipelines FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own pipelines
DROP POLICY IF EXISTS "pipelines_update_own" ON pipelines;
CREATE POLICY "pipelines_update_own"
  ON pipelines FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users with edit permission can update shared pipelines
DROP POLICY IF EXISTS "pipelines_update_shared_edit" ON pipelines;
CREATE POLICY "pipelines_update_shared_edit"
  ON pipelines FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT pipeline_id 
      FROM pipeline_shares 
      WHERE user_id = auth.uid() 
        AND permission IN ('edit', 'admin')
    )
  );

-- DELETE: Users can delete their own pipelines
DROP POLICY IF EXISTS "pipelines_delete_own" ON pipelines;
CREATE POLICY "pipelines_delete_own"
  ON pipelines FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- DELETE: Admins can delete shared pipelines
DROP POLICY IF EXISTS "pipelines_delete_shared_admin" ON pipelines;
CREATE POLICY "pipelines_delete_shared_admin"
  ON pipelines FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT pipeline_id 
      FROM pipeline_shares 
      WHERE user_id = auth.uid() 
        AND permission = 'admin'
    )
  );

-- ============================================================================
-- 3. PIPELINE VERSIONS TABLE POLICIES
-- ============================================================================

-- SELECT: Users can view versions of their own pipelines
DROP POLICY IF EXISTS "versions_select_own_pipeline" ON pipeline_versions;
CREATE POLICY "versions_select_own_pipeline"
  ON pipeline_versions FOR SELECT
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- SELECT: Users can view versions of shared pipelines
DROP POLICY IF EXISTS "versions_select_shared_pipeline" ON pipeline_versions;
CREATE POLICY "versions_select_shared_pipeline"
  ON pipeline_versions FOR SELECT
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT pipeline_id FROM pipeline_shares WHERE user_id = auth.uid()
    )
  );

-- SELECT: Users can view versions of public pipelines
DROP POLICY IF EXISTS "versions_select_public_pipeline" ON pipeline_versions;
CREATE POLICY "versions_select_public_pipeline"
  ON pipeline_versions FOR SELECT
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE is_public = true
    )
  );

-- INSERT: Users can create versions of their own pipelines
DROP POLICY IF EXISTS "versions_insert_own_pipeline" ON pipeline_versions;
CREATE POLICY "versions_insert_own_pipeline"
  ON pipeline_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users with edit permission can create versions of shared pipelines
DROP POLICY IF EXISTS "versions_insert_shared_pipeline" ON pipeline_versions;
CREATE POLICY "versions_insert_shared_pipeline"
  ON pipeline_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    pipeline_id IN (
      SELECT pipeline_id 
      FROM pipeline_shares 
      WHERE user_id = auth.uid() 
        AND permission IN ('edit', 'admin')
    )
  );

-- DELETE: Users can delete versions of their own pipelines
DROP POLICY IF EXISTS "versions_delete_own_pipeline" ON pipeline_versions;
CREATE POLICY "versions_delete_own_pipeline"
  ON pipeline_versions FOR DELETE
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. PIPELINE SHARES TABLE POLICIES
-- ============================================================================

-- SELECT: Users can view shares for their own pipelines
DROP POLICY IF EXISTS "shares_select_own_pipeline" ON pipeline_shares;
CREATE POLICY "shares_select_own_pipeline"
  ON pipeline_shares FOR SELECT
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- SELECT: Users can view their own share records
DROP POLICY IF EXISTS "shares_select_own" ON pipeline_shares;
CREATE POLICY "shares_select_own"
  ON pipeline_shares FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Pipeline owners can share their pipelines
DROP POLICY IF EXISTS "shares_insert_owner" ON pipeline_shares;
CREATE POLICY "shares_insert_owner"
  ON pipeline_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- INSERT: Admins can share pipelines
DROP POLICY IF EXISTS "shares_insert_admin" ON pipeline_shares;
CREATE POLICY "shares_insert_admin"
  ON pipeline_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    pipeline_id IN (
      SELECT pipeline_id 
      FROM pipeline_shares 
      WHERE user_id = auth.uid() 
        AND permission = 'admin'
    )
  );

-- UPDATE: Pipeline owners can update share permissions
DROP POLICY IF EXISTS "shares_update_owner" ON pipeline_shares;
CREATE POLICY "shares_update_owner"
  ON pipeline_shares FOR UPDATE
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- DELETE: Pipeline owners can remove shares
DROP POLICY IF EXISTS "shares_delete_owner" ON pipeline_shares;
CREATE POLICY "shares_delete_owner"
  ON pipeline_shares FOR DELETE
  TO authenticated
  USING (
    pipeline_id IN (
      SELECT id FROM pipelines WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can remove their own shares (unshare themselves)
DROP POLICY IF EXISTS "shares_delete_self" ON pipeline_shares;
CREATE POLICY "shares_delete_self"
  ON pipeline_shares FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 5. PROFILES TABLE POLICIES
-- ============================================================================

-- SELECT: Anyone can view profiles (for sharing UI)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Users can create their own profile (handled by trigger)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Users can delete their own profile
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own"
  ON profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify policies are created correctly
-- ============================================================================

-- Check all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;

-- ============================================================================
-- TESTING QUERIES
-- Use these to test RLS is working correctly
-- ============================================================================

-- Test 1: Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('pipelines', 'pipeline_versions', 'pipeline_shares', 'profiles');

-- Test 2: Check if current user can see their pipelines
-- (Run this in Supabase SQL Editor while authenticated)
/*
SELECT id, name, user_id 
FROM pipelines 
WHERE user_id = auth.uid();
*/

-- Test 3: Check shared pipelines
/*
SELECT p.id, p.name, ps.permission
FROM pipelines p
JOIN pipeline_shares ps ON p.id = ps.pipeline_id
WHERE ps.user_id = auth.uid();
*/
