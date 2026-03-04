import { addMinutes, format, parse, isBefore, isEqual } from "date-fns";
import type { Schedule, Booking, BlockedDate } from "@/types/database";

export type TimeSlot = {
  start: string; // HH:mm
  end: string;   // HH:mm
};

/**
 * Calculate available time slots for a given date.
 */
export function getAvailableSlots({
  date,
  schedules,
  bookings,
  blockedDates,
  durationMinutes,
  bufferMinutes = 0,
}: {
  date: Date;
  schedules: Schedule[];
  bookings: Booking[];
  blockedDates: BlockedDate[];
  durationMinutes: number;
  bufferMinutes?: number;
}): TimeSlot[] {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayOfWeek = date.getDay();

  // Check if date is blocked
  if (blockedDates.some((b) => b.date === dateStr)) {
    return [];
  }

  // Get active schedules for this day
  const daySchedules = schedules.filter(
    (s) => s.day_of_week === dayOfWeek && s.is_active
  );

  if (daySchedules.length === 0) return [];

  // Get existing bookings for this date (non-cancelled)
  const dayBookings = bookings.filter(
    (b) => b.date === dateStr && b.status !== "cancelled"
  );

  const slots: TimeSlot[] = [];

  for (const schedule of daySchedules) {
    const schedStart = parse(schedule.start_time, "HH:mm", date);
    const schedEnd = parse(schedule.end_time, "HH:mm", date);

    let cursor = schedStart;

    while (true) {
      const slotEnd = addMinutes(cursor, durationMinutes);

      // Slot must fit within schedule window
      if (isBefore(schedEnd, slotEnd) && !isEqual(schedEnd, slotEnd)) break;

      const slotStartStr = format(cursor, "HH:mm");
      const slotEndStr = format(slotEnd, "HH:mm");

      // Check for conflicts with existing bookings
      const hasConflict = dayBookings.some((booking) => {
        const bStart = booking.start_time.slice(0, 5);
        const bEnd = booking.end_time.slice(0, 5);
        return slotStartStr < bEnd && slotEndStr > bStart;
      });

      if (!hasConflict) {
        slots.push({ start: slotStartStr, end: slotEndStr });
      }

      // Move cursor by duration + buffer
      cursor = addMinutes(cursor, durationMinutes + bufferMinutes);
    }
  }

  // Sort by start time
  slots.sort((a, b) => a.start.localeCompare(b.start));

  return slots;
}
