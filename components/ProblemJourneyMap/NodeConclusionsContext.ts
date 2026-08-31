'use client';

import { createContext, useContext } from 'react';

export type ConclusionStatus = "testing" | "validated" | "invalidated";

export interface NodeConclusion {
  id: string;
  status: ConclusionStatus;
  content: string;
}

export const NodeConclusionsContext = createContext<Map<string, NodeConclusion[]>>(new Map());
export const useNodeConclusions = () => useContext(NodeConclusionsContext);
