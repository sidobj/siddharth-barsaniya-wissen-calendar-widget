"use client";

import { useState } from "react";
import ICAL from "ical.js";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isToday,
} from "date-fns";

type Holiday = {
  date: string; // 'yyyy-MM-dd'
  name: string;
  type: "regular" | "work";
};

export default function CalendarView() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([
    // Initial mock data
    { date: "2025-06-10", name: "Company Retreat", type: "work" },
    { date: "2025-06-10", name: "National Day", type: "regular" },
    { date: "2025-07-04", name: "Independence Day", type: "regular" },
  ]);
  const [showOnlyHolidays, setShowOnlyHolidays] = useState(false);

  // Helper: get all days to display for a month grid (start from Sunday)
  function getMonthDays(baseDate: Date) {
    const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 0 });
    const days = [];

    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }

  // Get 3 months (prev, current, next)
  const months = [subMonths(baseDate, 1), baseDate, addMonths(baseDate, 1)];

  // Group days into weeks for vacation planning highlighting
  // Return array of arrays of dates per week
  function getWeeks(days: Date[]) {
    const weeks: Date[][] = [];
    let week: Date[] = [];

    days.forEach((day) => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });

    if (week.length) weeks.push(week);
    return weeks;
  }

  // Count work holidays in a week
  function countWorkHolidaysInWeek(week: Date[]) {
    return week.reduce((count, day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      return (
        count +
        holidays.filter((h) => h.date === dayStr && h.type === "work").length
      );
    }, 0);
  }

  // ICS import handler
  async function handleICSFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    try {
      const jcalData = ICAL.parse(text);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents("vevent");

      const parsedHolidays: Holiday[] = vevents.map((vevent) => {
        const event = new ICAL.Event(vevent);
        const date = format(event.startDate.toJSDate(), "yyyy-MM-dd");
        return {
          date,
          name: event.summary || "Unnamed Event",
          type: "regular", // ICS does not usually specify work vs regular, so default regular
        };
      });

      setHolidays(parsedHolidays);
      setShowOnlyHolidays(false);
    } catch (error) {
      console.error("Failed to parse ICS file:", error);
      alert("Failed to parse ICS file. Please check console.");
    }
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">📅 Holiday Calendar Widget</h2>

      {/* ICS Import + Filter */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="file"
            accept=".ics"
            onChange={handleICSFile}
            className="block"
          />
          <span className="text-sm text-gray-700">Import Holidays (.ics)</span>
        </label>

        <label className="flex items-center gap-2 ml-auto">
          <input
            type="checkbox"
            checked={showOnlyHolidays}
            onChange={() => setShowOnlyHolidays(!showOnlyHolidays)}
          />
          <span className="text-sm text-gray-700">Show Only Holidays</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {months.map((monthDate, idx) => {
          const days = getMonthDays(monthDate);
          const weeks = getWeeks(days);

          return (
            <div key={idx} className="border rounded shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg">
                  {format(monthDate, "MMMM yyyy")}
                </h3>
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs font-bold text-center mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div>
                {weeks.map((week, i) => {
                  const workHolidayCount = countWorkHolidaysInWeek(week);

                  // Determine week highlight style based on work holidays count
                  let weekClass = "";
                  if (workHolidayCount === 1) {
                    weekClass = "border-2 border-green-400 rounded mb-1";
                  } else if (workHolidayCount > 1) {
                    weekClass = "bg-green-200 rounded mb-1";
                  } else {
                    weekClass = "mb-1";
                  }

                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-7 gap-1 ${weekClass}`}
                    >
                      {week.map((day, idx2) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const dayHolidays = holidays.filter(
                          (h) => h.date === dayStr
                        );

                        // Skip days outside the month when showOnlyHolidays is ON and no holiday on that day
                        if (showOnlyHolidays && dayHolidays.length === 0) {
                          return <div key={idx2} />;
                        }

                        const hasWorkHoliday = dayHolidays.some(
                          (h) => h.type === "work"
                        );
                        const hasRegularHoliday = dayHolidays.some(
                          (h) => h.type === "regular"
                        );

                        const isCurrentMonth =
                          monthDate.getMonth() === day.getMonth();

                        const bgColor = isToday(day)
                          ? "bg-blue-300"
                          : hasWorkHoliday
                          ? "bg-green-300"
                          : hasRegularHoliday
                          ? "bg-yellow-200"
                          : "";

                        const textColor = isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400";

                        return (
                          <div
                            key={idx2}
                            className={`text-center py-1 rounded cursor-default select-none ${bgColor} ${textColor}`}
                          >
                            {format(day, "d")}
                            {dayHolidays.length > 0 && (
                              <div className="text-[10px] mt-1 text-gray-700">
                                {dayHolidays
                                  .map((h) => (h.type === "work" ? "🏢" : "🎉"))
                                  .join(" ")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => setBaseDate(subMonths(baseDate, 1))}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Previous
        </button>
        <button
          onClick={() => setBaseDate(addMonths(baseDate, 1))}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Next
        </button>
      </div>

      {/* Legend */}
      <div className="mt-8 text-sm flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-1">
          <span className="bg-green-300 px-2 rounded">🏢</span> Work Holiday
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-yellow-200 px-2 rounded">🎉</span> Regular Holiday
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-blue-300 px-2 rounded w-5 h-5 inline-block"></span>{" "}
          Today
        </div>
        <div className="flex items-center gap-1">
          <span className="border-2 border-green-400 px-3 rounded">
            1 Work Holiday This Week
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-green-200 px-3 rounded">
            Multiple Work Holidays This Week
          </span>
        </div>
      </div>
    </div>
  );
}
