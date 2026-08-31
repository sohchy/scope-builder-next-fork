import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  addMinutes,
} from "date-fns";

export interface TimeOption {
  label: string;
  value: string; // "HH:mm"
}

export interface DayInfo {
  date: Date;
  dayName: string;
  dayDate: string; // e.g. "May 19"
}

export interface Week {
  weekStart: Date;
  weekEnd: Date;
  label: string; // e.g. "May 19 — May 25"
  days: DayInfo[];
}

/** Parse "HH:mm" into total minutes from midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Format total minutes from midnight back to "HH:mm" */
function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Format "HH:mm" to "9:30 AM" / "2:00 PM" */
export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m).padStart(2, "0");
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Produces 30-min interval options from startTime to endTime inclusive.
 * e.g. generateTimeOptions("08:00", "10:00") → [{label:"8:00 AM", value:"08:00"}, ...]
 */
export function generateTimeOptions(
  startTime: string,
  endTime: string
): TimeOption[] {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const options: TimeOption[] = [];
  for (let m = start; m <= end; m += 30) {
    const value = fromMinutes(m);
    options.push({ label: formatTimeDisplay(value), value });
  }
  return options;
}

/**
 * Add 30 minutes to a "HH:mm" string.
 */
export function addThirtyMinutes(time: string): string {
  const mins = toMinutes(time);
  return fromMinutes(mins + 30);
}

/**
 * Returns true if a > b (comparing "HH:mm" strings).
 */
export function isAfter(a: string, b: string): boolean {
  return toMinutes(a) > toMinutes(b);
}

/**
 * Generates one Week object per Mon–Sun week that overlaps the [startDate, endDate] range.
 */
export function generateWeeks(startDate: Date, endDate: Date): Week[] {
  const weekStarts = eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 1 } // Monday
  );

  return weekStarts.map((ws) => {
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: ws, end: we }).map((d) => ({
      date: d,
      dayName: format(d, "EEEE"), // "Monday"
      dayDate: format(d, "MMM d"), // "May 19"
    }));

    const startLabel = format(ws, "MMM d");
    const endLabel = format(we, "MMM d");
    return {
      weekStart: ws,
      weekEnd: we,
      label: `${startLabel} — ${endLabel}`,
      days,
    };
  });
}

/**
 * Splits an owner slot (e.g. 9:30–10:30) into 30-min sub-intervals.
 * Used for the student/mentor sign-up view.
 */
export function split30MinIntervals(
  startTime: string,
  endTime: string
): { start: string; end: string }[] {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const intervals: { start: string; end: string }[] = [];
  for (let m = start; m < end; m += 30) {
    intervals.push({ start: fromMinutes(m), end: fromMinutes(m + 30) });
  }
  return intervals;
}
