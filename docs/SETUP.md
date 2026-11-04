# Supabase Setup Guide for Pipeline Designer

This guide walks you through setting up Supabase for the Pipeline Designer application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- GitHub account (optional, for OAuth)
- Google account (optional, for OAuth)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Click "New Project"
4. Fill in project details:
   - **Name**: `pipeline-designer` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free (to start)
5. Click "Create new project"
6. Wait 2-3 minutes for project initialization

## Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)

3. Create a `.env.local` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

⚠️ **Important**: Never commit `.env.local` to git! It's already in `.gitignore`.

## Step 3: Set Up Database Schema

### Option A: Using SQL Editor (Recommended)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `docs/schema.sql`
4. Click "Run" (or press Ctrl+Enter)
5. Wait for execution to complete
6. Repeat for `docs/rls-policies.sql`

### Option B: Using Table Editor (Visual)

1. Go to **Table Editor** in Supabase dashboard
2. Click "New Table"
3. Create tables manually following the schema in `docs/schema.sql`
4. Set up RLS policies in **Authentication** → **Policies**

## Step 4: Configure Authentication

### Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Configure email settings:
   - Enable "Confirm email" (recommended)
   - Set your site URL: `http://localhost:5173` (for development)
   - Add redirect URLs: `http://localhost:5173/**`

### Enable OAuth (Optional)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click "Create Credentials" → "OAuth client ID"
5. Configure consent screen:
   - User Type: External
   - App name: Pipeline Designer
   - User support email: your email
   - Developer contact: your email
6. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
7. Create OAuth client
8. Copy **Client ID** and **Client Secret**
9. In Supabase: **Authentication** → **Providers** → **Google**
10. Paste Client ID and Secret
11. Enable Google provider

#### GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name**: Pipeline Designer
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Generate a client secret
6. Copy **Client ID** and **Client Secret**
7. In Supabase: **Authentication** → **Providers** → **GitHub**
8. Paste Client ID and Secret
9. Enable GitHub provider

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 6: Run the Application

```bash
npm run dev
```

Open `http://localhost:5173` and you should see the login screen.

## Step 7: Test the Integration

1. **Sign Up**: Create a new account with your email
2. **Verify Email**: Check your inbox for verification link
3. **Create Pipeline**: Click "New Pipeline" and design a flow
4. **Auto-Save**: Make changes and wait 2 seconds - check console for "Auto-saved"
5. **Real-time**: Open the app in another browser tab - changes should sync
6. **Version History**: Click "Save Version" and restore previous versions

## Step 8: Deploy to Production

### Frontend (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Update Supabase URLs

1. In Supabase: **Authentication** → **URL Configuration**
2. Update Site URL to your Vercel URL
3. Add redirect URLs: `https://your-app.vercel.app/**`

## Troubleshooting

### Issue: "Failed to fetch" errors

**Solution**: Check that `.env.local` exists and contains correct values. Restart dev server.

### Issue: Email not received

**Solution**: 
- Check spam folder
- Verify email provider is enabled in Supabase
- Check Supabase logs: **Logs** → **Auth**

### Issue: RLS policy errors

**Solution**: 
- Ensure RLS is enabled on all tables
- Verify policies are created correctly
- Check that user is authenticated

### Issue: Real-time not working

**Solution**:
- Enable Realtime for tables: **Database** → **Replication**
- Check browser console for WebSocket errors

## Next Steps

- Customize the UI in `src/components/Auth.tsx`
- Add more OAuth providers
- Set up storage for pipeline exports
- Configure edge functions for advanced features
- Set up monitoring and analytics

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
