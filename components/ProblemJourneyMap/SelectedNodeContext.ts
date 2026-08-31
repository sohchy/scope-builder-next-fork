'use client';

import { createContext, useContext } from 'react';

export interface SelectedProblem {
  nodeId: string;
  problemId: string;
}

export const SelectedNodeContext = createContext<SelectedProblem | null>(null);
export const useSelectedNode = () => useContext(SelectedNodeContext);
