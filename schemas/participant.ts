import { z } from "zod";

// Shared by the Add/Edit Participant sheets. `role` is stored as a CSV string
// (see MultiSelect), so these values also show up in queries like
// `role: { contains: "Payer" }`.
export const ROLE_OPTIONS = [
  { value: "End-User", label: "End-User" },
  { value: "Buyer-Decision-Maker", label: "Buyer/Decision Maker" },
  { value: "Payer", label: "Payer" },
  { value: "Influencer", label: "Influencer" },
  { value: "Recommender", label: "Recommender" },
  { value: "Saboteur", label: "Saboteur" },
];

// Values match the ParticipantRelationship enum in prisma/schema.prisma and drive
// the columns of the Relationship board on /participants/interviews.
export const RELATIONSHIP_OPTIONS = [
  { value: "family_friends_colleagues", label: "Family, Friends, Colleagues" },
  { value: "friend_of_friend", label: "Friend of Family/Friend/Colleague" },
  { value: "cold_connections", label: "Cold connections" },
  { value: "networking_event", label: "Networking Event" },
];

export const relationshipLabel = (value: string | null | undefined) =>
  RELATIONSHIP_OPTIONS.find((o) => o.value === value)?.label ?? "";

export const participantFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  organization: z.string().optional(),
  job_title: z.string().optional(),
  role: z.string().optional(),
  relationship: z.string().optional(),
  contact_info: z.string().optional(),
  rationale: z.string().optional(),
  blocking_issues: z.string().optional(),
  hypothesis_to_validate: z.string().optional(),
  learnings: z.string().optional(),
  market_segment: z.string().optional(),
  // Not rendered in the sheets anymore — derived from scheduled_date in
  // services/participants.ts, but kept so the current value round-trips on edit.
  status: z.string(),
  scheduled_date: z.date().optional(),
  // Not a column — the sheets surface it as the "Conducted" checkbox and
  // services/participants.ts folds it into `status`. Only meaningful once a
  // scheduled_date exists; `undefined` means "the caller has no opinion".
  conducted: z.boolean().optional(),
  // Only meaningful for a conducted interview — services/participants.ts clears
  // it otherwise, so it can never outlive the checkbox that sets it.
  pending_review: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});
