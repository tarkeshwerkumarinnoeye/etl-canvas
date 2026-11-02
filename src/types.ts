import type { Node, Edge } from '@xyflow/react';

export type PipelineNodeType = 
  | 'source-database'
  | 'source-api'
  | 'source-file'
  | 'source-stream'
  | 'transform'
  | 'filter'
  | 'aggregate'
  | 'ml-model'
  | 'queue'
  | 'cache'
  | 'sink-database'
  | 'sink-dashboard'
  | 'sink-alert'
  | 'sink-datalake';

export interface PipelineNodeData extends Record<string, unknown> {
  label: string;
  type: PipelineNodeType;
  category: 'source' | 'processing' | 'sink' | 'infrastructure';
  icon: string;
  description: string;
}

export type PipelineNode = Node<PipelineNodeData>;
export type PipelineEdge = Edge & { animated?: boolean; data?: { speed?: 'slow' | 'normal' | 'fast' } };

export interface SidebarItem {
  type: PipelineNodeType;
  label: string;
  category: 'source' | 'processing' | 'sink' | 'infrastructure';
  icon: string;
  description: string;
  color: string;
}
