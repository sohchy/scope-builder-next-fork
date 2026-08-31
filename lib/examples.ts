// Shared helpers for the read-only "Examples" pages.
//
// Example data is GLOBAL (the same for every org). DB rows are written with a
// synthetic `org_id` (see `exampleOrgId`) plus an `example_number` discriminator so
// they can never collide with any real org's rows; example reads filter by
// `example_number` only. The Problem Journey canvas lives in Liveblocks, so each
// example gets its own dedicated room (see `exampleRoomId`).

/** Liveblocks room id holding example set N's journey-map canvas. */
export function exampleRoomId(n: number): string {
  return `problem-journey-example-${n}`;
}

/** Synthetic org id stamped on example set N's DB rows. */
export function exampleOrgId(n: number): string {
  return `example-${n}`;
}

/** True when a Liveblocks room id belongs to an example set (read-only). */
export function isExampleRoomId(roomId: string): boolean {
  return roomId.startsWith("problem-journey-example-");
}
