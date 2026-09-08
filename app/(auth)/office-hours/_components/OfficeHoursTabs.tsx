"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminSlot } from "@/services/officeHours";
import AvailabilityEditor from "./AvailabilityEditor";
import BookingView, { type SlotWithSubSlots } from "./BookingView";

interface OfficeHoursTabsProps {
  /** The instructor's own slots, for the editor. */
  ownSlots: AdminSlot[];
  /** Every instructor's slots, for the read-only schedule. */
  allSlots: SlotWithSubSlots[];
  /** Booker org id → startup name, so the schedule can name each team. */
  startupNames: Record<string, string>;
  currentUserId: string;
}

/**
 * Instructors get both halves of office hours: the availability they publish and
 * the schedule everyone books against — the latter read-only, since they book
 * nothing themselves.
 */
export default function OfficeHoursTabs({
  ownSlots,
  allSlots,
  startupNames,
  currentUserId,
}: OfficeHoursTabsProps) {
  const [tab, setTab] = useState("availability");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
      <TabsList>
        <TabsTrigger value="availability">Your availability</TabsTrigger>
        <TabsTrigger value="schedule">Office Hours</TabsTrigger>
      </TabsList>

      <TabsContent value="availability" className="flex-1 min-h-0 mt-4">
        <AvailabilityEditor initialSlots={ownSlots} />
      </TabsContent>

      <TabsContent value="schedule" className="flex-1 min-h-0 mt-4">
        <BookingView
          initialSlots={allSlots}
          startupNames={startupNames}
          currentUserId={currentUserId}
          readOnly
        />
      </TabsContent>
    </Tabs>
  );
}
