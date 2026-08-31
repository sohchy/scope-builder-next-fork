import { clerkClient } from "@clerk/nextjs/server";

import type { MailjetRecipient } from "@/lib/mailjet";

/**
 * Resolving "everyone on a startup's team" to real email addresses. Shared by the
 * office-hours invites and the milestone review notification — both need the same
 * Clerk round trip, and neither should ever fail because of it.
 */

/**
 * Clerk org membership roles that count as "the startup team".
 * Mirrors how the Startups page counts founders (Startups.tsx).
 */
export const STARTUP_MEMBER_ROLES = new Set(["org:founder", "org:member"]);

export interface StartupContext {
  name: string | null;
  /** The whole team, so nobody on the startup misses the mail. */
  recipients: MailjetRecipient[];
}

export const EMPTY_STARTUP: StartupContext = { name: null, recipients: [] };

export async function getStartupContext(orgId: string): Promise<StartupContext> {
  try {
    const client = await clerkClient();
    const [organization, memberships] = await Promise.all([
      client.organizations.getOrganization({ organizationId: orgId }),
      client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100,
      }),
    ]);

    const userIds = memberships.data
      .filter((m) => STARTUP_MEMBER_ROLES.has(m.role))
      .map((m) => m.publicUserData?.userId)
      .filter((id): id is string => !!id);

    if (userIds.length === 0) {
      return { name: organization.name ?? null, recipients: [] };
    }

    // publicUserData.identifier isn't guaranteed to be an email, so resolve the
    // real addresses.
    const users = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    const recipients = users.data.flatMap<MailjetRecipient>((user) => {
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress;
      if (!email) return [];
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
      return [{ Email: email, Name: name }];
    });

    return { name: organization.name ?? null, recipients };
  } catch (err) {
    console.error(`[startup-recipients] could not resolve startup ${orgId}`, err);
    return EMPTY_STARTUP;
  }
}

/** First occurrence wins, so the more specific display name survives the merge. */
export function dedupeRecipients(
  recipients: MailjetRecipient[],
): MailjetRecipient[] {
  const seen = new Set<string>();
  return recipients.filter((r) => {
    const key = r.Email.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
