/**
 * The cohort this deployment is running. Orgs carry theirs on the Clerk
 * organization's `publicMetadata.cohort` (set by hand in the Clerk Dashboard);
 * only the ones that match get listed.
 *
 * `NEXT_PUBLIC_` so the value reaches client components too — it has to be
 * written as a literal member access for Next to inline it into the bundle.
 */
export const CURRENT_COHORT = process.env.NEXT_PUBLIC_COHORT || "fall25";

/** True when a Clerk org's public metadata puts it in the current cohort. */
export function isInCurrentCohort(
  publicMetadata: { cohort?: unknown } | null | undefined,
): boolean {
  return publicMetadata?.cohort === CURRENT_COHORT;
}
