import { checkRole } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import {
  getOfficeHourSlots,
  getAllSlotsWithBookings,
} from "@/services/officeHours";
import AvailabilityEditor from "./_components/AvailabilityEditor";
import BookingView from "./_components/BookingView";

export default async function OfficeHoursPage() {
  const isAdmin = await checkRole("admin");
  const { userId } = await auth();

  if (isAdmin) {
    const slots = await getOfficeHourSlots();
    return (
      <div className="p-8 h-full flex flex-col">
        <AvailabilityEditor initialSlots={slots} />
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
