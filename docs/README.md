# Supabase Integration - Complete Guide

This document provides a comprehensive overview of the Supabase integration in the Pipeline Designer application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Authentication](#authentication)
5. [Real-time Features](#real-time-features)
6. [Auto-Save](#auto-save)
7. [Version History](#version-history)
8. [Sharing & Collaboration](#sharing--collaboration)
9. [API Reference](#api-reference)
10. [Security](#security)
11. [Performance](#performance)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Pipeline Designer now uses **Supabase** as its backend, providing:

✅ **Cloud Storage** - Save pipelines to PostgreSQL database  
✅ **Authentication** - Email, Google, and GitHub login  
✅ **Real-time Sync** - Live collaboration across devices  
✅ **Auto-Save** - Automatic saving with 2-second debounce  
✅ **Version History** - Track changes and restore previous versions  
✅ **Sharing** - Share pipelines with team members  
✅ **Free Tier** - 500MB database, 50K monthly active users  

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │ Pipeline │  │  Editor  │              │
│  │  Component│  │   List   │  │Component │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                    │
│       └──────────────┴──────────────┘                    │
│                      │                                   │
│              ┌───────▼────────┐                         │
│              │  Supabase SDK  │                         │
│              └───────┬────────┘                         │
└──────────────────────┼──────────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │    Supabase      │
              │  ┌────────────┐  │
              │  │   Auth     │  │
              │  │  Service   │  │
              │  └────────────┘  │
              │  ┌────────────┐  │
              │  │ PostgreSQL │  │
              │  │  Database  │  │
              │  └────────────┘  │
              │  ┌────────────┐  │
              │  │  Realtime  │  │
              │  │  Service   │  │
              │  └────────────┘  │
              └──────────────────┘
```

### Key Components

1. **Auth Component** (`src/components/Auth.tsx`)
   - Email magic link login
   - Google OAuth
   - GitHub OAuth
   - Session management

2. **Pipeline List** (`src/components/PipelineList.tsx`)
   - Dashboard showing all user's pipelines
   - Create new pipelines
   - Search and filter
   - Delete pipelines
   - Real-time updates

3. **Pipeline Editor** (`src/components/PipelineEditor.tsx`)
   - Main editor with React Flow
   - Auto-save integration
   - Version history
   - Save status indicator

4. **Services** (`src/services/pipelineService.ts`)
   - CRUD operations for pipelines
   - Version management
   - Sharing functionality

5. **Hooks**
   - `useAutoSave` - Debounced auto-save
   - `useRealtimePipeline` - Real-time sync

---

## Database Schema

### Tables

#### 1. `pipelines`
Main table storing pipeline data.

```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Fields:**
- `nodes` - Array of React Flow nodes (JSONB)
- `edges` - Array of React Flow edges (JSONB)
- `viewport` - Current view position and zoom
- `version` - Auto-incrementing version number
- `is_public` - Public visibility flag

#### 2. `pipeline_versions`
Stores historical snapshots.

```sql
CREATE TABLE pipeline_versions (
  id UUID PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  viewport JSONB,
  change_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(pipeline_id, version)
);
```

#### 3. `pipeline_shares`
Manages sharing permissions.

```sql
CREATE TABLE pipeline_shares (
  id UUID PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pipeline_id, user_id)
);
```

#### 4. `profiles`
Extended user profile information.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

Performance indexes are created for:
- `pipelines.user_id` - Fast user pipeline queries
- `pipelines.updated_at` - Sort by last modified
- `pipelines.is_public` - Filter public pipelines
- Full-text search on `name` and `description`

### Triggers

1. **`update_updated_at_column()`** - Auto-updates `updated_at` timestamp
2. **`handle_new_user()`** - Creates profile on user signup
3. **`increment_pipeline_version()`** - Auto-increments version number

---

## Authentication

### Supported Methods

1. **Email Magic Link**
   - User enters email
   - Receives login link via email
   - Click link to authenticate
   - No password required

2. **Google OAuth**
   - One-click Google login
   - Requires Google Cloud Console setup
   - Automatic profile creation

3. **GitHub OAuth**
   - One-click GitHub login
   - Requires GitHub OAuth App setup
   - Automatic profile creation

### Session Management

```typescript
// Check session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Redirect to login
  }
});

// Sign out
await supabase.auth.signOut();
```

### Protected Routes

The app uses a wrapper component (`App.tsx`) that:
1. Checks authentication status
2. Redirects to login if not authenticated
3. Shows pipeline list if authenticated but no pipeline selected
4. Shows editor if pipeline is selected

---

## Real-time Features

### Real-time Sync

Pipelines sync in real-time across all connected clients.

```typescript
// Subscribe to pipeline changes
const channel = supabase
  .channel(`pipeline:${pipelineId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'pipelines',
    filter: `id=eq.${pipelineId}`,
  }, (payload) => {
    // Update local state
    setPipeline(payload.new);
  })
  .subscribe();
```

### Use Cases

1. **Multi-device Sync** - Edit on desktop, see changes on tablet
2. **Team Collaboration** - Multiple users see updates instantly
3. **Live Presentations** - Audience sees changes in real-time

### Limitations

- Free tier: 200 concurrent connections
- Pro tier: 500 concurrent connections
- Updates are debounced (2 seconds) to prevent excessive writes

---

## Auto-Save

### How It Works

1. User makes changes (add/remove/move nodes, edit edges)
2. Changes are debounced for 2 seconds
3. If no further changes, pipeline is saved to Supabase
4. Save status indicator shows "Saving..." → "Saved"
5. On error, shows "Save failed"

### Implementation

```typescript
const { saveStatus, lastSaved } = useAutoSave(pipelineId, nodes, edges);

// In UI
{saveStatus === 'saving' && <span>Saving...</span>}
{saveStatus === 'saved' && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
{saveStatus === 'error' && <span>Save failed</span>}
```

### Configuration

```typescript
useAutoSave(pipelineId, nodes, edges, {
  debounceMs: 2000,  // Wait 2 seconds after last change
  enabled: true,     // Enable/disable auto-save
});
```

### Manual Save

Users can also manually save versions:
- Click "Save Version" button
- Enter optional note
- Creates snapshot in `pipeline_versions` table

---

## Version History

### Creating Versions

```typescript
await pipelineService.saveVersion(
  pipelineId,
  nodes,
  edges,
  "Added ML model node"  // Optional note
);
```

### Listing Versions

```typescript
const versions = await pipelineService.getVersions(pipelineId);
// Returns array of versions with timestamps and notes
```

### Restoring Versions

```typescript
await pipelineService.restoreVersion(pipelineId, versionId);
// Loads the snapshot into the current pipeline
```

### Version UI

Future enhancement: Add version history panel showing:
- Version number
- Timestamp
- Change note
- Author
- Restore button

---

## Sharing & Collaboration

### Share Pipeline

```typescript
await pipelineService.share(
  pipelineId,
  "user@example.com",
  "edit"  // 'view', 'edit', or 'admin'
);
```

### Permission Levels

1. **view** - Can view pipeline, cannot edit
2. **edit** - Can edit nodes and edges
3. **admin** - Can edit, delete, and manage shares

### Get Shared Pipelines

```typescript
const shared = await pipelineService.getShared();
// Returns pipelines shared with current user
```

### Remove Share

```typescript
await pipelineService.unshare(pipelineId, userId);
```

### Public Pipelines

```typescript
await pipelineService.togglePublic(pipelineId, true);
// Makes pipeline visible to all authenticated users
```

---

## API Reference

### Pipeline Service

#### `create(name, nodes, edges)`
Create a new pipeline.

```typescript
const pipeline = await pipelineService.create(
  "My ETL Pipeline",
  nodes,
  edges
);
```

#### `list()`
Get all user's pipelines.

```typescript
const pipelines = await pipelineService.list();
```

#### `get(id)`
Get single pipeline by ID.

```typescript
const pipeline = await pipelineService.get(pipelineId);
```

#### `update(id, updates)`
Update pipeline fields.

```typescript
await pipelineService.update(pipelineId, {
  name: "New Name",
  nodes: newNodes,
  edges: newEdges,
});
```

#### `delete(id)`
Delete pipeline and all versions.

```typescript
await pipelineService.delete(pipelineId);
```

#### `saveVersion(pipelineId, nodes, edges, note?)`
Save version snapshot.

```typescript
await pipelineService.saveVersion(
  pipelineId,
  nodes,
  edges,
  "Added filter node"
);
```

#### `getVersions(pipelineId)`
Get version history.

```typescript
const versions = await pipelineService.getVersions(pipelineId);
```

#### `restoreVersion(pipelineId, versionId)`
Restore to specific version.

```typescript
await pipelineService.restoreVersion(pipelineId, versionId);
```

#### `share(pipelineId, email, permission)`
Share with user.

```typescript
await pipelineService.share(
  pipelineId,
  "colleague@company.com",
  "edit"
);
```

#### `getShared()`
Get pipelines shared with user.

```typescript
const shared = await pipelineService.getShared();
```

#### `unshare(pipelineId, userId)`
Remove share.

```typescript
await pipelineService.unshare(pipelineId, userId);
```

#### `togglePublic(pipelineId, isPublic)`
Toggle public visibility.

```typescript
await pipelineService.togglePublic(pipelineId, true);
```

#### `search(query)`
Search pipelines by name/description.

```typescript
const results = await pipelineService.search("ETL");
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

#### Pipelines
- ✅ Users can view their own pipelines
- ✅ Users can view public pipelines
- ✅ Users can view pipelines shared with them
- ✅ Users can create their own pipelines
- ✅ Users can update their own pipelines
- ✅ Users with edit permission can update shared pipelines
- ✅ Users can delete their own pipelines
- ✅ Admins can delete shared pipelines

#### Pipeline Versions
- ✅ Users can view versions of their pipelines
- ✅ Users can view versions of shared pipelines
- ✅ Users can create versions of their pipelines
- ✅ Users with edit permission can create versions

#### Pipeline Shares
- ✅ Owners can manage shares
- ✅ Admins can manage shares
- ✅ Users can view their own shares
- ✅ Users can remove themselves from shares

#### Profiles
- ✅ Anyone can view profiles (for sharing UI)
- ✅ Users can update their own profile

### Best Practices

1. **Never expose service role key** - Only use anon key in frontend
2. **Validate input** - Sanitize user input before saving
3. **Rate limiting** - Supabase has built-in rate limits
4. **Audit logs** - Monitor suspicious activity in Supabase dashboard
5. **Regular backups** - Supabase provides automatic daily backups

---

## Performance

### Optimization Tips

1. **Debounce auto-save** - Already implemented (2 seconds)
2. **Use indexes** - Created for common queries
3. **Limit real-time subscriptions** - Only subscribe to current pipeline
4. **Paginate large lists** - For users with 100+ pipelines
5. **Cache frequently accessed data** - Use React Query or SWR

### Monitoring

Monitor performance in Supabase dashboard:
- **Database** → Query performance
- **Logs** → API request times
- **Realtime** → Connection count

### Scaling

- **Free tier**: Good for 0-100 users
- **Pro tier ($25/mo)**: Good for 100-1000 users
- **Team tier ($599/mo)**: Good for 1000+ users

---

## Troubleshooting

### Common Issues

#### 1. "Failed to fetch" errors
**Cause**: Missing or incorrect environment variables  
**Solution**: Check `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

#### 2. Email not received
**Cause**: Email provider not configured  
**Solution**: Check Supabase → Authentication → Email Templates

#### 3. RLS policy errors
**Cause**: Policies not created correctly  
**Solution**: Re-run `docs/rls-policies.sql`

#### 4. Real-time not working
**Cause**: Realtime not enabled for table  
**Solution**: Enable in Supabase → Database → Replication

#### 5. Auto-save not triggering
**Cause**: Pipeline ID is null  
**Solution**: Ensure pipeline is loaded before editing

### Debug Mode

Enable debug logging:

```typescript
// In src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  debug: true,
});
```

### Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

## Next Steps

### Recommended Enhancements

1. **Version History UI** - Visual timeline of versions
2. **Comments/Annotations** - Add notes to pipelines
3. **Templates** - Pre-built pipeline templates
4. **Export to Code** - Generate Python/SQL from visual pipeline
5. **Analytics** - Track pipeline usage and performance
6. **Mobile App** - View pipelines on mobile devices

### Migration from Local Storage

For existing users with local storage data:

```typescript
// Migration script
const localData = localStorage.getItem('pipeline');
if (localData) {
  const { nodes, edges } = JSON.parse(localData);
  await pipelineService.create("Imported Pipeline", nodes, edges);
  localStorage.removeItem('pipeline');
}
```

---

## Conclusion

The Supabase integration provides a robust, scalable backend for the Pipeline Designer with:

✅ Cloud storage and sync  
✅ User authentication  
✅ Real-time collaboration  
✅ Auto-save and version history  
✅ Sharing and permissions  
✅ Enterprise-grade security  

All features are available on the free tier, with easy scaling as your user base grows.

For setup instructions, see [SETUP.md](./SETUP.md).
