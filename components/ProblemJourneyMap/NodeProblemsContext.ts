'use client';

import { createContext, useContext } from 'react';
import type { Problem } from './components/ActionNodeSheet';

export const NodeProblemsContext = createContext<Map<string, Problem[]>>(new Map());
export const useNodeProblems = () => useContext(NodeProblemsContext);
