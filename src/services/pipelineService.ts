import { supabase } from '../lib/supabase';
import type { Pipeline, PipelineVersion } from '../types/supabase';

export const pipelineService = {
  // Create new pipeline
  async create(name: string, nodes: any[], edges: any[]): Promise<Pipeline> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pipelines')
      .insert({
        user_id: user.id,
        name,
        nodes,
        edges,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all user's pipelines
  async list(): Promise<Pipeline[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get single pipeline
  async get(id: string): Promise<Pipeline> {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update pipeline
  async update(id: string, updates: Partial<Pipeline>): Promise<Pipeline> {
    const { data, error } = await supabase
      .from('pipelines')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete pipeline
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Save version snapshot
  async saveVersion(pipelineId: string, nodes: any[], edges: any[], note?: string): Promise<PipelineVersion> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current version
    const pipeline = await this.get(pipelineId);
    const newVersion = pipeline.version + 1;

    const { data, error } = await supabase
      .from('pipeline_versions')
      .insert({
        pipeline_id: pipelineId,
        version: newVersion,
        nodes,
        edges,
        change_note: note,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update pipeline version number and current state
    await this.update(pipelineId, { version: newVersion, nodes, edges });

    return data;
  },

  // Get version history
  async getVersions(pipelineId: string): Promise<PipelineVersion[]> {
    const { data, error } = await supabase
      .from('pipeline_versions')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Restore to specific version
  async restoreVersion(pipelineId: string, versionId: string): Promise<void> {
    const { data: version, error: versionError } = await supabase
      .from('pipeline_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    await this.update(pipelineId, {
      nodes: version.nodes,
      edges: version.edges,
    });
  },

  // Share pipeline with user
  async share(pipelineId: string, email: string, permission: 'view' | 'edit' | 'admin') {
    // Get user by email from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profileData) {
      throw new Error('User not found. They may need to sign up first.');
    }

    const { error } = await supabase
      .from('pipeline_shares')
      .insert({
        pipeline_id: pipelineId,
        user_id: profileData.id,
        permission,
      });

    if (error) throw error;
  },

  // Get pipelines shared with user
  async getShared(): Promise<Pipeline[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        *,
        pipeline_shares!inner(permission)
      `)
      .eq('pipeline_shares.user_id', user.id);

    if (error) throw error;
    return data;
  },

  // Remove share
  async unshare(pipelineId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('pipeline_shares')
      .delete()
      .eq('pipeline_id', pipelineId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Toggle public/private
  async togglePublic(pipelineId: string, isPublic: boolean): Promise<void> {
    await this.update(pipelineId, { is_public: isPublic });
  },

  // Search pipelines
  async search(query: string): Promise<Pipeline[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
