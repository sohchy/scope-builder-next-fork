import type { ResponseType } from "./types";

export const RESPONSE_TYPES: { value: ResponseType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "scale", label: "Scale" },
  { value: "dropdown", label: "Dropdown" },
];

export function responseTypeLabel(value: ResponseType): string {
  return RESPONSE_TYPES.find((type) => type.value === value)?.label ?? value;
}
