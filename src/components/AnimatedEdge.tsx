import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

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
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      {/* Base edge with subtle glow */}
      <BaseEdge id={id} path={edgePath} style={{
        ...style,
        strokeWidth: 3,
        stroke: '#6366f1',
        filter: 'drop-shadow(0 0 3px rgba(99, 102, 241, 0.4))',
      }} markerEnd={markerEnd} />
      
      {/* Animated flowing particles - indigo theme */}
      <circle r="5" fill="#818cf8" opacity="0.95" style={{ filter: 'drop-shadow(0 0 4px #818cf8)' }}>
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="4" fill="#a5b4fc" opacity="0.8">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="0.4s" />
      </circle>
      <circle r="3.5" fill="#c7d2fe" opacity="0.7">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="0.8s" />
      </circle>
      <circle r="3" fill="#818cf8" opacity="0.85">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="1.2s" />
      </circle>
      <circle r="2.5" fill="#e0e7ff" opacity="0.6">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} begin="1.6s" />
      </circle>
      
      {/* Large glow following the main particle */}
      <circle r="12" fill="#6366f1" opacity="0.15">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}

export function AnimatedEdgeFast({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{
        ...style,
        strokeWidth: 3,
        stroke: '#10b981',
        filter: 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.4))',
      }} markerEnd={markerEnd} />
      
      {/* Fast flowing particles - emerald theme */}
      <circle r="5" fill="#34d399" opacity="0.95" style={{ filter: 'drop-shadow(0 0 4px #34d399)' }}>
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="4" fill="#6ee7b7" opacity="0.8">
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} begin="0.2s" />
      </circle>
      <circle r="3.5" fill="#a7f3d0" opacity="0.7">
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} begin="0.4s" />
      </circle>
      <circle r="3" fill="#34d399" opacity="0.85">
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} begin="0.6s" />
      </circle>
      <circle r="2.5" fill="#d1fae5" opacity="0.6">
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} begin="0.8s" />
      </circle>
      
      <circle r="12" fill="#10b981" opacity="0.15">
        <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}

export function AnimatedEdgeSlow({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <g>
      <BaseEdge id={id} path={edgePath} style={{
        ...style,
        strokeWidth: 3,
        stroke: '#f59e0b',
        filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.4))',
      }} markerEnd={markerEnd} />
      
      {/* Slow flowing particles - amber theme */}
      <circle r="6" fill="#fbbf24" opacity="0.95" style={{ filter: 'drop-shadow(0 0 4px #fbbf24)' }}>
        <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="5" fill="#fcd34d" opacity="0.8">
        <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} begin="1s" />
      </circle>
      <circle r="4" fill="#fde68a" opacity="0.7">
        <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} begin="2s" />
      </circle>
      <circle r="3.5" fill="#fbbf24" opacity="0.85">
        <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} begin="3s" />
      </circle>
      
      <circle r="14" fill="#f59e0b" opacity="0.12">
        <animateMotion dur="4s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
}
