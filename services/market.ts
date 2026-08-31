"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import type {
  StakeholderRow as PrismaStakeholderRow,
  MarketSegment as PrismaMarketSegment,
  MarketSegmentNote as PrismaMarketSegmentNote,
} from "@/lib/generated/prisma";

// Re-exported as type aliases (not an `export type {}` list) — a "use server"
// file only allows async-function value exports, and Next's checker doesn't
// erase re-export lists before enforcing that. Alias declarations are erased.
export type StakeholderRow = PrismaStakeholderRow;
export type MarketSegment = PrismaMarketSegment;
export type MarketSegmentNote = PrismaMarketSegmentNote;

export type MarketData = {
  stakeholderRows: StakeholderRow[];
  segments: MarketSegment[];
  note: MarketSegmentNote | null;
};

export type MarketSegmentInput = {
  name?: string;
  notes?: string;
  beachhead?: boolean;
  order?: number;
};

async function requireOrg() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  return orgId;
}

export async function getMarketData(): Promise<MarketData> {
  const orgId = await requireOrg();

  const [stakeholderRows, segments, note] = await Promise.all([
    prisma.stakeholderRow.findMany({
      where: { org_id: orgId },
      orderBy: { order: "asc" },
    }),
    prisma.marketSegment.findMany({
      where: { org_id: orgId },
      orderBy: { order: "asc" },
    }),
    prisma.marketSegmentNote.findUnique({ where: { org_id: orgId } }),
  ]);

  return { stakeholderRows, segments, note };
}

// --- Stakeholder rows -------------------------------------------------------

export async function createStakeholderRow(
  stakeholderType: string,
  value: string,
  order = 0,
): Promise<StakeholderRow> {
  const orgId = await requireOrg();

  const row = await prisma.stakeholderRow.create({
    data: {
      org_id: orgId,
      stakeholder_type: stakeholderType,
      value,
      order,
    },
  });

  revalidatePath("/user-journey-map");

  return row;
}

export async function updateStakeholderRow(id: number, value: string) {
  const orgId = await requireOrg();

  await prisma.stakeholderRow.updateMany({
    where: { id, org_id: orgId },
    data: { value },
  });

  revalidatePath("/user-journey-map");
}

export async function deleteStakeholderRow(id: number) {
  const orgId = await requireOrg();

  await prisma.stakeholderRow.deleteMany({
    where: { id, org_id: orgId },
  });

  revalidatePath("/user-journey-map");
}

// --- Market segments --------------------------------------------------------

// Leaner than getMarketData() for callers that only need the segment list —
// e.g. the market segment picker on the Add/Edit Participant sheets.
export async function getMarketSegments(): Promise<MarketSegment[]> {
  const orgId = await requireOrg();

  return prisma.marketSegment.findMany({
    where: { org_id: orgId },
    orderBy: { order: "asc" },
  });
}

export async function createMarketSegment(
  data: MarketSegmentInput,
): Promise<MarketSegment> {
  const orgId = await requireOrg();

  const segment = await prisma.marketSegment.create({
    data: {
      org_id: orgId,
      name: data.name ?? "",
      notes: data.notes ?? "",
      beachhead: data.beachhead ?? false,
      order: data.order ?? 0,
    },
  });

  revalidatePath("/user-journey-map");

  return segment;
}

export async function updateMarketSegment(id: number, data: MarketSegmentInput) {
  const orgId = await requireOrg();

  await prisma.marketSegment.updateMany({
    where: { id, org_id: orgId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.beachhead !== undefined ? { beachhead: data.beachhead } : {}),
      ...(data.order !== undefined ? { order: data.order } : {}),
    },
  });

  revalidatePath("/user-journey-map");
}

export async function deleteMarketSegment(id: number) {
  const orgId = await requireOrg();

  await prisma.marketSegment.deleteMany({
    where: { id, org_id: orgId },
  });

  revalidatePath("/user-journey-map");
}

// --- Section-level note -----------------------------------------------------

export async function upsertMarketSegmentNote(content: string) {
  const orgId = await requireOrg();

  await prisma.marketSegmentNote.upsert({
    where: { org_id: orgId },
    create: { org_id: orgId, content },
    update: { content },
  });

  revalidatePath("/user-journey-map");
}
