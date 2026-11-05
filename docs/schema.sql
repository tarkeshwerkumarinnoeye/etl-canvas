-- ============================================================================
-- Pipeline Designer - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS pipeline_versions CASCADE;
DROP TABLE IF EXISTS pipeline_shares CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;

-- ============================================================================
-- 1. PIPELINES TABLE
-- Main table storing user-created pipelines
-- ============================================================================
CREATE TABLE pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pipeline data stored as JSONB for flexibility
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- View state (zoom, pan position)
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
  
  -- App settings
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Sharing & visibility
  is_public BOOLEAN DEFAULT FALSE,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pipelines_user_id ON pipelines(user_id);
CREATE INDEX idx_pipelines_is_public ON pipelines(is_public);
CREATE INDEX idx_pipelines_updated_at ON pipelines(updated_at DESC);
CREATE INDEX idx_pipelines_created_at ON pipelines(created_at DESC);

-- Full-text search index on name and description
CREATE INDEX idx_pipelines_search ON pipelines 
  USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- ============================================================================
-- 2. PIPELINE VERSIONS TABLE
-- Stores historical snapshots of pipelines
-- ============================================================================
CREATE TABLE pipeline_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  version INTEGER NOT NULL,
  
  -- Snapshot data
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  viewport JSONB,
  
  -- Metadata
  change_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure unique version per pipeline
  UNIQUE(pipeline_id, version)
);

CREATE INDEX idx_pipeline_versions_pipeline_id ON pipeline_versions(pipeline_id);
CREATE INDEX idx_pipeline_versions_version ON pipeline_versions(pipeline_id, version DESC);

-- ============================================================================
-- 3. PIPELINE SHARES TABLE
-- Manages sharing permissions between users
-- ============================================================================
CREATE TABLE pipeline_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Permission levels
  permission VARCHAR(20) DEFAULT 'view' 
    CHECK (permission IN ('view', 'edit', 'admin')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One share per user per pipeline
  UNIQUE(pipeline_id, user_id)
);

CREATE INDEX idx_pipeline_shares_pipeline_id ON pipeline_shares(pipeline_id);
CREATE INDEX idx_pipeline_shares_user_id ON pipeline_shares(user_id);

-- ============================================================================
-- 4. PROFILES TABLE (EXTENDS AUTH.USERS)
-- Additional user profile information
-- ============================================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pipelines table
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 7. FUNCTION TO AUTO-INCREMENT VERSION
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_pipeline_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = (
    SELECT COALESCE(MAX(version), 0) + 1 
    FROM pipeline_versions 
    WHERE pipeline_id = NEW.pipeline_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_version_insert
  BEFORE INSERT ON pipeline_versions
  FOR EACH ROW
  EXECUTE FUNCTION increment_pipeline_version();

-- ============================================================================
-- 8. ENABLE REALTIME
-- Required for live collaboration features
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pipelines;

-- ============================================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- Uncomment to insert sample pipeline for testing
/*
INSERT INTO pipelines (user_id, name, description, nodes, edges)
VALUES (
  'YOUR-USER-UUID-HERE',
  'Sample ETL Pipeline',
  'A demonstration pipeline with data transformation',
  '[
    {"id":"1","type":"pipeline","position":{"x":50,"y":150},"data":{"label":"PostgreSQL","type":"source-database","category":"source"}},
    {"id":"2","type":"pipeline","position":{"x":300,"y":150},"data":{"label":"Transform","type":"transform","category":"processing"}},
    {"id":"3","type":"pipeline","position":{"x":550,"y":150},"data":{"label":"Dashboard","type":"sink-dashboard","category":"sink"}}
  ]'::jsonb,
  '[
    {"id":"e1-2","source":"1","target":"2","type":"animated","data":{"color":"#3b82f6","speed":"normal"}},
    {"id":"e2-3","source":"2","target":"3","type":"animated","data":{"color":"#22c55e","speed":"fast"}}
  ]'::jsonb
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify setup is complete
-- ============================================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pipelines', 'pipeline_versions', 'pipeline_shares', 'profiles');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('pipelines', 'pipeline_versions', 'pipeline_shares', 'profiles');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('pipelines', 'pipeline_versions', 'pipeline_shares', 'profiles');

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
