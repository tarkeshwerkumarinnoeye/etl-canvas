import { BaseEdge, getBezierPath, getSmoothStepPath, getStraightPath, type EdgeProps } from '@xyflow/react';

interface EdgeStyle {
  color: string;
  speed?: 'slow' | 'normal' | 'fast';
}

const defaultStyle: EdgeStyle = { color: '#6366f1', speed: 'normal' };

// Helper to extract style from edge data
function getEdgeStyle(data: any): EdgeStyle {
  return {
    color: data?.color || defaultStyle.color,
    speed: data?.speed || defaultStyle.speed,
  };
}

// Animated solid edge (default)
export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgeStyle = getEdgeStyle(data);
  const edgeColor = edgeStyle.color; // Always use the configured color for particles and marker
  const strokeColor = selected ? '#ef4444' : edgeColor; // Only stroke turns red when selected
  const duration = edgeStyle.speed === 'fast' ? 1 : edgeStyle.speed === 'slow' ? 4 : 2;

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{
        ...style,
        strokeWidth: selected ? 4 : 3,
        stroke: strokeColor,
        filter: `drop-shadow(0 0 3px ${strokeColor}66)`,
      }} markerEnd={markerEnd} />
      
      <circle r="5" fill={edgeColor} opacity="0.95" style={{ filter: `drop-shadow(0 0 4px ${edgeColor})` }}>
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="4" fill={edgeColor} opacity="0.7">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} begin={`${duration * 0.25}s`} />
      </circle>
      <circle r="3.5" fill={edgeColor} opacity="0.5">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} begin={`${duration * 0.5}s`} />
      </circle>
      <circle r="3" fill={edgeColor} opacity="0.7">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} begin={`${duration * 0.75}s`} />
      </circle>
      <circle r="12" fill={edgeColor} opacity="0.15">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}

// Solid static edge (no animation)
export function SolidEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgeStyle = getEdgeStyle(data);
  const strokeColor = selected ? '#ef4444' : edgeStyle.color;

  return (
    <BaseEdge id={id} path={edgePath} style={{
      ...style,
      strokeWidth: selected ? 4 : 3,
      stroke: strokeColor,
      filter: `drop-shadow(0 0 2px ${strokeColor}66)`,
    }} markerEnd={markerEnd} />
  );
}

// Dashed edge
export function DashedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgeStyle = getEdgeStyle(data);
  const strokeColor = selected ? '#ef4444' : edgeStyle.color;

  return (
    <BaseEdge id={id} path={edgePath} style={{
      ...style,
      strokeWidth: selected ? 4 : 3,
      stroke: strokeColor,
      strokeDasharray: '10 6',
      filter: `drop-shadow(0 0 2px ${strokeColor}66)`,
    }} markerEnd={markerEnd} />
  );
}

// Dotted edge
export function DottedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const edgeStyle = getEdgeStyle(data);
  const strokeColor = selected ? '#ef4444' : edgeStyle.color;

  return (
    <BaseEdge id={id} path={edgePath} style={{
      ...style,
      strokeWidth: selected ? 4 : 3,
      stroke: strokeColor,
      strokeDasharray: '2 4',
      strokeLinecap: 'round',
      filter: `drop-shadow(0 0 2px ${strokeColor}66)`,
    }} markerEnd={markerEnd} />
  );
}

// Step edge (right angles) with offset to prevent overlap
export function StepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const edgeStyle = getEdgeStyle(data);
  const strokeColor = selected ? '#ef4444' : edgeStyle.color;
  const offset = (data as any)?.offset || 25; // Default 25px offset from nodes
  
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset,
  });

  return (
    <BaseEdge id={id} path={edgePath} style={{
      ...style,
      strokeWidth: selected ? 4 : 3,
      stroke: strokeColor,
      filter: `drop-shadow(0 0 2px ${strokeColor}66)`,
    }} markerEnd={markerEnd} />
  );
}

// Straight edge
export function StraightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  const edgeStyle = getEdgeStyle(data);
  const strokeColor = selected ? '#ef4444' : edgeStyle.color;

  return (
    <BaseEdge id={id} path={edgePath} style={{
      ...style,
      strokeWidth: selected ? 4 : 3,
      stroke: strokeColor,
      filter: `drop-shadow(0 0 2px ${strokeColor}66)`,
    }} markerEnd={markerEnd} />
  );
}

// Animated step edge with offset
export function AnimatedStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps) {
  const edgeStyle = getEdgeStyle(data);
  const edgeColor = edgeStyle.color; // Always use the configured color for particles and marker
  const strokeColor = selected ? '#ef4444' : edgeColor; // Only stroke turns red when selected
  const duration = edgeStyle.speed === 'fast' ? 1 : edgeStyle.speed === 'slow' ? 4 : 2;
  const offset = (data as any)?.offset || 25;
  
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{
        ...style,
        strokeWidth: selected ? 4 : 3,
        stroke: strokeColor,
        filter: `drop-shadow(0 0 3px ${strokeColor}66)`,
      }} markerEnd={markerEnd} />
      
      <circle r="5" fill={edgeColor} opacity="0.95" style={{ filter: `drop-shadow(0 0 4px ${edgeColor})` }}>
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="4" fill={edgeColor} opacity="0.7">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} begin={`${duration * 0.5}s`} />
      </circle>
      <circle r="12" fill={edgeColor} opacity="0.15">
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}
