/**
 * Per-organization starting text for the Startup Idea card on the journey map.
 *
 * The value here is only ever a *seed*: it is written into a room's storage once,
 * the first time that org's journey page is opened after the card existed (see
 * `generateProblemJourneyRoom`). From then on the card is the team's own text —
 * editing or clearing it never brings the default back, and changing an entry
 * below does not rewrite a room that has already been seeded.
 *
 * Keyed by Clerk organization id. An org with no entry starts on a blank card.
 *
 * Source: "I-Corps Teams Tech Descriptions" — one-sentence technology
 * descriptions, transcribed verbatim. The comment above each entry is the team
 * name from that sheet; only the id is load-bearing.
 */
export const STARTUP_IDEA_DEFAULTS: Record<string, string> = {
  // Aion
  org_3IfPdYpjh2sNzeq2FWeoRR8aId1:
    "Aion develops AI systems that model and preserve human cognition, personality, and memory to create persistent digital representations of individuals.",

  // Extension Professional Development Program
  org_3IfPy0YsncXsM3KHErJOZLS1Tzf:
    "The Extension Professional Development Program builds the capacity of agricultural professionals through a library of modular, practitioner-focused online training courses in behavior change, stakeholder engagement, communication, and evaluation.",

  // Nsight Recovery Monitor
  org_3IfQ6yjuNuCwf1xQ7ItGPxEJZZV:
    "Nsight is a wearable head-position monitor that alerts vitrectomy patients in real time when they move outside their prescribed post-operative positioning, improving compliance and surgical outcomes.",

  // MagDI Ultra Dense NFC Interrogation System
  org_3IfQH2EyNjge2nvkyX0RJLRNblG:
    "MagDI is a cross-layer NFC technology that intelligently combines beamforming and inventory management to enable fast, reliable identification of ultra-dense passive NFC tags without modifying existing tags or standards.",

  // Early Intervention and Special Edition Meeting Prep
  org_3IfQQrdk8kvLejoSEr9Boldrz8x:
    "A calm, human-centric app that serves as a guide through the early intervention and special ed meeting process.",

  // Sentinel Rhythm Health
  org_3IfRtZqmtSnQKaUqBO3qN89CCjR:
    "We are creating a wearable for child with asthma to provide objective, real-time insight at the first sign of symptoms, so parents can act early and keep flare-ups from becoming emergencies.",

  // Soil-Biodegradable Hemp Biocomposite Netting for Agriculture
  org_3IfQbPEOV6jNYTCWelyBNeQrLR3:
    "We are developing high-tensile, soil-biodegradable netting extruded from passivated hemp fibers and biopolyesters for commercial sod production, eliminating buried plastics, equipment damage, and cleat-snag injury liabilities in sports turf and agriculture waste.",

  // AfterPoint
  org_3IfS0pArcef2IaVCmIVfPgQsfry:
    "To craft tools, spaces, and experiences for grievers navigating loss where they can hold memories, share tears, find connection, and grow hope.",

  // Adaptive Relational Intelligence Agent
  org_3IfSTHdKVarc0xESvejQNzaOffX:
    "How to Resolve organizational Conflict using Emotional Intelligence",

  // Efficient Crop Decisions
  org_3IfS4kXl22UgHbLc6IYXBRK2kc4:
    "An AI-powered decision-support tool that forecasts crop yield in-season and identifies when crop conditions signal a need for management intervention.",

  // Roll to Roll Membrane Manufacturing for Ultra Selective Separations
  org_3IfSDenRHvv49i3ZkMl4iyEzJz6:
    "We are exploring roll-to-roll manufacturing of ultra-selective membranes for high-performance industrial separations.",

  // AI-Driven, Performance-Aware, Database Design Optimization
  org_3IfSKQmupDnf6zIqKTCvCIgWV2u:
    "An AI-assisted software-engineering platform that helps development teams analyze and optimize ORM-based database designs for performance, scalability, maintainability, and cloud cost before deployment.",

  // Tagintell farm and forest watch
  org_3IfSZCQhIjKcw2KOnTohoAFDtzn:
    "Tagintell is a satellite-based monitoring platform that helps farmers and forest managers detect crop and forest condition changes",

  // AIMS-NE (Farrowing Crate Management)
  org_3IfSOty0yT6c1wMhnlNcmRhTEIT:
    "An accelerometer-based monitoring system installed on farrowing crates to detect movement patterns that may indicate potential birthing issues in sows and piglets.",

  // EnviroAMR Monitor
  org_3IfSdp7Ts7bJOl8cjk6KeK6UMNy:
    "An integrated data model that tracks antibiotic resistance by correlating environmental field data, hospital information, and ecological indicators.",
};

export function startupIdeaDefaultFor(orgId: string | null | undefined): string {
  if (!orgId) return "";
  return STARTUP_IDEA_DEFAULTS[orgId] ?? "";
}
