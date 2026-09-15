import type { NodeTypes } from "@xyflow/react";

import { AdLibCardNode } from "./AdLibCardNode";

// Defined outside any component — stable reference prevents RF from re-mounting nodes on render
export const adLibNodeTypes: NodeTypes = {
  adlib_card: AdLibCardNode,
};
