"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganizationList } from "@clerk/nextjs";

import StartupsTable from "./StartupsTable";
import {
  LAST_MILESTONE,
  defaultMilestoneAccess,
  type MilestoneAccessState,
  type MilestoneReviewInput,
} from "@/lib/milestones";
import {
  getAllMilestoneAccess,
  reviewMilestone,
  setMilestoneAvailability,
} from "@/services/milestoneAccess";

/**
 * The row as it looks after a review: the milestone stamped reviewed, and — when
 * the instructor left "Unlock next milestone" ticked — the following one switched
 * on. `unlockedMilestone` is null when nothing was unlocked.
 */
function withReview(
  access: MilestoneAccessState[],
  milestone: number,
  reviewedAt: Date,
  unlockedMilestone: number | null,
): MilestoneAccessState[] {
  return access.map((entry) => {
    if (entry.milestone === milestone) return { ...entry, reviewedAt };
    if (entry.milestone === unlockedMilestone)
      return { ...entry, available: true };
    return entry;
  });
}

export default function Startups() {
  const [data, setData] = useState<any[]>([]);
  const [accessByOrg, setAccessByOrg] = useState<
    Record<string, MilestoneAccessState[]>
  >({});
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
      pageSize: 100,
    },
  });

  const getData = async () => {
    const startups =
      userMemberships.data?.map((membership) => membership.organization) || [];

    const data = [];

    for (let i = 0; i < startups.length; i++) {
      const startup = startups[i];
      const memberships = await startup.getMemberships();

      const founders = memberships.data.filter(
        (membership) =>
          membership.role === "org:founder" || membership.role === "org:member",
      );
      const mentors = memberships.data.filter(
        (membership) => membership.role === "org:mentor",
      );

      if (startup.publicMetadata?.cohort === "spring26") {
        data.push({
          org_id: startup.id,
          name: startup.name,
          createdAt: startup.createdAt,
          founders: founders.map((founder) => {
            if (
              founder.publicUserData?.firstName &&
              founder.publicUserData?.lastName
            )
              return `${founder.publicUserData?.firstName} ${founder.publicUserData?.lastName}`;

            if (founder.publicUserData?.firstName)
              return founder.publicUserData?.firstName;

            if (founder.publicUserData?.lastName)
              return founder.publicUserData?.lastName;

            return founder.publicUserData?.identifier;
          }),
          // mentors: mentors.map((mentor) => {
          //   console.log("mentor");

          //   return `${mentor.publicUserData?.firstName} ${mentor.publicUserData?.lastName}`;
          // }),
          mentors: startup.publicMetadata?.lead_instructor || "",
        });
      }
    }

    setData(data);
  };

  useEffect(() => {
    getData();
  }, [userMemberships.data?.length]);

  useEffect(() => {
    getAllMilestoneAccess().then(setAccessByOrg);
  }, []);

  // Startups with no rows yet fall back to "only milestone 0 unlocked".
  const rows = useMemo(
    () =>
      data.map((startup) => ({
        ...startup,
        milestones: accessByOrg[startup.org_id] ?? defaultMilestoneAccess(),
      })),
    [data, accessByOrg],
  );

  const onToggleMilestone = useCallback(
    (orgId: string, milestone: number, available: boolean) => {
      // Optimistic: flip it locally, roll this startup's row back if the write fails.
      let previous: MilestoneAccessState[] | undefined;

      setAccessByOrg((current) => {
        const access = current[orgId] ?? defaultMilestoneAccess();
        previous = access;

        return {
          ...current,
          [orgId]: access.map((entry) =>
            entry.milestone === milestone ? { ...entry, available } : entry,
          ),
        };
      });

      setMilestoneAvailability(orgId, milestone, available).catch(() => {
        setAccessByOrg((current) =>
          previous ? { ...current, [orgId]: previous } : current,
        );
      });
    },
    [],
  );

  // Signing off is one-way, so there is no un-review path to model here — the icon
  // stops being clickable the moment this lands. The server returns the real
  // timestamp (an existing one if it was already reviewed) and which milestone it
  // actually unlocked; we take both over the optimistic guess so the row agrees
  // with the database. A rejection rolls the whole thing back, unlock included.
  const onReviewMilestone = useCallback(
    (orgId: string, milestone: number, values: MilestoneReviewInput) => {
      let previous: MilestoneAccessState[] | undefined;

      const optimisticUnlock =
        values.unlockNext && milestone < LAST_MILESTONE ? milestone + 1 : null;

      setAccessByOrg((current) => {
        const access = current[orgId] ?? defaultMilestoneAccess();
        previous = access;

        return {
          ...current,
          [orgId]: withReview(access, milestone, new Date(), optimisticUnlock),
        };
      });

      reviewMilestone(orgId, milestone, values)
        .then((result) =>
          setAccessByOrg((current) => ({
            ...current,
            [orgId]: withReview(
              current[orgId] ?? defaultMilestoneAccess(),
              milestone,
              result.reviewedAt,
              result.unlockedMilestone,
            ),
          })),
        )
        .catch(() => {
          setAccessByOrg((current) =>
            previous ? { ...current, [orgId]: previous } : current,
          );
        });
    },
    [],
  );

  return (
    <StartupsTable
      data={rows}
      onToggleMilestone={onToggleMilestone}
      onReviewMilestone={onReviewMilestone}
      onSelectOrganization={(organization: any) => {
        // Open in a new tab so admins keep this list around while working
        // through milestones. The interstitial sets the active org on arrival.
        window.open(
          `/switch-startup?org=${encodeURIComponent(organization.org_id)}`,
          "_blank",
          "noopener",
        );
      }}
    />
  );
}
