// The six stakeholder cards are fixed (not user-created). Only the rows inside
// each card are editable and persisted (see `StakeholderRow` in the schema).
// `key` matches the `stakeholder_type` column.

export interface StakeholderDefinition {
  key: string;
  title: string;
  description: string;
}

export const STAKEHOLDER_DEFINITIONS: StakeholderDefinition[] = [
  {
    key: "end_user",
    title: "End User",
    description: "The person who will actually use the product or service.",
  },
  {
    key: "buyer_decision_maker",
    title: "Buyer/Decision Maker",
    description: "The person with the clout to decide which solution gets adopted.",
  },
  {
    key: "payer",
    title: "Payer",
    description: "The person who has the budget for the solution.",
  },
  {
    key: "influencer",
    title: "Influencer",
    description:
      "The person who weighs in on the solution selection, adoption, and/or purchase.",
  },
  {
    key: "recommender",
    title: "Recommender",
    description: "A person tasked with making solution recommendations.",
  },
  {
    key: "saboteur",
    title: "Saboteur",
    description: "A person who loses out if the solution is adopted.",
  },
];
