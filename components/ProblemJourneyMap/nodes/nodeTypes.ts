import type { NodeTypes } from '@xyflow/react';
import { TriggerNode } from './TriggerNode';
import { ActionNode } from './ActionNode';
import { SplitRouteNode } from './SplitRouteNode';

// Defined outside any component — stable reference prevents RF from re-mounting nodes on render
export const journeyNodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  split_route: SplitRouteNode,
};
