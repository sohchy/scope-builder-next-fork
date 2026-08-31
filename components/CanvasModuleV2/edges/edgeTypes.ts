import type { EdgeTypes } from '@xyflow/react';
import { OrthoEdge } from './OrthoEdge';

// Defined outside any component to maintain stable references (avoids RF re-mounting all edges on render)
export const edgeTypes: EdgeTypes = {
  ortho: OrthoEdge,
};
