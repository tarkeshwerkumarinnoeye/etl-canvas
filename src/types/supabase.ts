export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  viewport?: { x: number; y: number; zoom: number };
  settings?: any;
  is_public: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineVersion {
  id: string;
  pipeline_id: string;
  version: number;
  nodes: any[];
  edges: any[];
  viewport?: any;
  change_note?: string;
  created_at: string;
  created_by?: string;
}

export interface PipelineShare {
  id: string;
  pipeline_id: string;
  user_id: string;
  permission: 'view' | 'edit' | 'admin';
  created_at: string;
}

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export type StorageMode = 'local' | 'cloud';
