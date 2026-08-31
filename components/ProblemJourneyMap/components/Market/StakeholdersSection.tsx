"use client";

import type { StakeholderRow } from "@/services/market";
import { STAKEHOLDER_DEFINITIONS } from "./constants";
import { StakeholderCard } from "./StakeholderCard";

interface StakeholdersSectionProps {
  rows: StakeholderRow[];
  readOnly?: boolean;
}

export function StakeholdersSection({ rows, readOnly = false }: StakeholdersSectionProps) {
  const rowsByType = new Map<string, StakeholderRow[]>();
  for (const row of rows) {
    const list = rowsByType.get(row.stakeholder_type) ?? [];
    list.push(row);
    rowsByType.set(row.stakeholder_type, list);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-[#1F2430]">Stakeholders</h2>
      <p className="mb-4 mt-1 text-base text-[#4E5566]">
        In the realm of decision-making, the individual wielding influence
        determines the path…
      </p>

      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAKEHOLDER_DEFINITIONS.map((definition) => (
          <StakeholderCard
            key={definition.key}
            definition={definition}
            initialRows={rowsByType.get(definition.key) ?? []}
            readOnly={readOnly}
          />
        ))}
      </div>
    </section>
  );
}
