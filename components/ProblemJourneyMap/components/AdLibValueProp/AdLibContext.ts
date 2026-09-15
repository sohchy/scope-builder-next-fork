"use client";

import { createContext, useContext } from "react";

import type { AdLibField } from "@/liveblocks.config";

interface AdLibContextValue {
  /** Pure viewer (Examples pages): blanks are read-only and writes are no-ops. */
  readOnly: boolean;
  updateCardField: (cardId: string, field: AdLibField, value: string) => void;
  /** Opens the delete confirmation. Nothing is written until it's confirmed. */
  requestDeleteCard: (cardId: string) => void;
}

export const AdLibContext = createContext<AdLibContextValue | null>(null);

export function useAdLibContext(): AdLibContextValue {
  const value = useContext(AdLibContext);
  if (!value) {
    throw new Error("useAdLibContext must be used inside AdLibValuePropCanvas");
  }
  return value;
}
