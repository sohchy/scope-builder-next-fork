'use client';

import { createContext, useContext } from 'react';
import type { Solution } from './components/ActionNodeSheet';

export const NodeSolutionsContext = createContext<Map<string, Solution[]>>(new Map());
export const useNodeSolutions = () => useContext(NodeSolutionsContext);
