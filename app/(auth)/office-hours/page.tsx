import { checkRole } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import {
  getOfficeHourSlots,
  getAllSlotsWithBookings,
  getBookingStartupNames,
} from "@/services/officeHours";
import BookingView from "./_components/BookingView";
import OfficeHoursTabs from "./_components/OfficeHoursTabs";

export default async function OfficeHoursPage() {
  const isAdmin = await checkRole("admin");
  const { userId } = await auth();

  if (isAdmin) {
    // Instructors see their own availability and, alongside it, the whole
    // program's schedule so they know who booked with whom.
    // Startup names are resolved only here: the schedule names each booker's
    // team, and nothing on the startups' own booking view shows them.
    const [ownSlots, allSlots, startupNames] = await Promise.all([
      getOfficeHourSlots(),
      getAllSlotsWithBookings(),
      getBookingStartupNames(),
    ]);
    return (
      <div className="p-8 h-full flex flex-col">
        <OfficeHoursTabs
          ownSlots={ownSlots}
          allSlots={allSlots}
          startupNames={startupNames}
          currentUserId={userId!}
        />
      </div>
    );
  }

  const slots = await getAllSlotsWithBookings();
  return (
    <div className="p-8 h-full flex flex-col">
      <BookingView initialSlots={slots} currentUserId={userId!} />
    </div>
  );
}
