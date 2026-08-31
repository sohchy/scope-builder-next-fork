import type { EdgeTypes } from '@xyflow/react';
import { JourneyEdge } from './JourneyEdge';

// Defined outside any component — stable reference
export const journeyEdgeTypes: EdgeTypes = {
  journey: JourneyEdge,
};
