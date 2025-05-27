"use client";

import { useState, useEffect } from "react";
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
  const [countryCode, setCountryCode] = useState("US");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showOnlyHolidays, setShowOnlyHolidays] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHolidays() {
      setErrorMessage(null);

      if (countryCode === "IN") {
        setHolidays([]);
        setErrorMessage(
          "Holiday data for India is not available from Nager API."
        );
        return;
      }

      try {
        const year = baseDate.getFullYear();
        const res = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
        );
        if (!res.ok) throw new Error("Failed to fetch holidays");
        const data = await res.json();

        const isWeekend = (dateStr: string) => {
          const day = new Date(dateStr).getDay();
          return day === 0 || day === 6;
        };

        const filtered = data.filter((h: any) => {
          if (!h.date || typeof h.localName !== "string") return false;

          // Exclude holidays on weekends
          if (isWeekend(h.date)) return false;

          const name = h.localName.trim();

          return true;
        });

        const seen = new Set<string>();
        const uniqueHolidays = filtered.filter((h: any) => {
          const key = `${h.date}|${h.localName.trim()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const parsed = uniqueHolidays.map((h: any) => ({
          date: h.date,
          name: h.localName.trim(),
          type: "regular",
        }));

        setHolidays(parsed);
      } catch (error) {
        console.error(error);
        setHolidays([]);
        setErrorMessage("Failed to load holiday data.");
      }
    }

    fetchHolidays();
  }, [baseDate, countryCode]);

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

  const months = [subMonths(baseDate, 1), baseDate, addMonths(baseDate, 1)];

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

  function countHolidaysInWeek(week: Date[], type: Holiday["type"]) {
    const uniqueDates = new Set<string>();
    for (const day of week) {
      const dateStr = format(day, "yyyy-MM-dd");
      const matching = holidays.filter(
        (h) => h.date === dateStr && h.type === type
      );
      if (matching.length > 0) {
        uniqueDates.add(dateStr); // count only once per date
      }
    }
    return uniqueDates.size;
  }

  function countHolidaysInWeekByMonth(
    week: Date[],
    type: Holiday["type"],
    currentMonth: number
  ) {
    const uniqueDates = new Set<string>();
    for (const day of week) {
      const dateStr = format(day, "yyyy-MM-dd");
      const isInCurrentMonth = day.getMonth() === currentMonth;
      if (!isInCurrentMonth) continue;

      const matching = holidays.filter(
        (h) => h.date === dateStr && h.type === type
      );
      if (matching.length > 0) {
        uniqueDates.add(dateStr); // count only once per date
      }
    }
    return uniqueDates.size;
  }

  const [availableCountries, setAvailableCountries] = useState<
    { countryCode: string; name: string }[]
  >([]);

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch(
          "https://date.nager.at/api/v3/AvailableCountries"
        );
        const data = await res.json();
        data.sort((a, b) => a.name.localeCompare(b.name)); // Optional: sort alphabetically
        setAvailableCountries(data);
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    }

    fetchCountries();
  }, []);

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">📅 Holiday Calendar Widget</h2>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Select Country:</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="border rounded p-1"
          >
            {availableCountries.length === 0 ? (
              <option disabled>Loading...</option>
            ) : (
              availableCountries.map((c) => (
                <option key={c.countryCode} value={c.countryCode}>
                  {c.name}
                </option>
              ))
            )}
          </select>
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

      {errorMessage && (
        <div className="mb-4 text-red-600 font-semibold">{errorMessage}</div>
      )}

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
                  //const workCount = countHolidaysInWeek(week, "work");
                  //const regularCount = countHolidaysInWeek(week, "regular");
                  const workCount = countHolidaysInWeekByMonth(
                    week,
                    "work",
                    monthDate.getMonth()
                  );
                  const regularCount = countHolidaysInWeekByMonth(
                    week,
                    "regular",
                    monthDate.getMonth()
                  );
                  let weekClass = "mb-1 rounded ";
                  const overrideWeekDarkGrey = regularCount >= 2;

                  if (overrideWeekDarkGrey) {
                    weekClass += "bg-gray-600 text-white ";
                  } else if (workCount > 1) {
                    weekClass += "bg-green-200 ";
                  } else if (workCount === 1) {
                    weekClass += "border-2 border-green-400 ";
                  } else if (regularCount === 1) {
                    weekClass += "border-2 border-gray-300 ";
                  }

                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-7 gap-1 ${weekClass.trim()}`}
                    >
                      {week.map((day, idx2) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const isCurrentMonth =
                          monthDate.getMonth() === day.getMonth();
                        const dayHolidays = isCurrentMonth
                          ? holidays.filter((h) => h.date === dayStr)
                          : [];
                        /* if (!isCurrentMonth && dayHolidays.length === 0) {
                          return <div key={idx2} />;
                        }*/

                        if (showOnlyHolidays && dayHolidays.length === 0) {
                          return <div key={idx2} />;
                        }

                        const hasWorkHoliday = dayHolidays.some(
                          (h) => h.type === "work"
                        );
                        const hasRegularHoliday = dayHolidays.some(
                          (h) => h.type === "regular"
                        );

                        const bgColor = !overrideWeekDarkGrey
                          ? isToday(day)
                            ? "bg-blue-300"
                            : hasWorkHoliday
                            ? "bg-green-300"
                            : hasRegularHoliday
                            ? "bg-yellow-200"
                            : ""
                          : "";

                        const textColor = overrideWeekDarkGrey
                          ? "text-white"
                          : isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400";

                        return (
                          <div
                            key={idx2}
                            className={`text-center py-1 rounded cursor-default select-none ${bgColor} ${textColor}`}
                            title={dayHolidays.map((h) => h.name).join(", ")}
                          >
                            {format(day, "d")}
                            {dayHolidays.length > 0 && (
                              <div
                                className={`text-[10px] mt-1 ${
                                  overrideWeekDarkGrey
                                    ? "text-white"
                                    : "text-gray-700"
                                }`}
                              >
                                {dayHolidays.some((h) => h.type === "work")
                                  ? "🏢"
                                  : dayHolidays.some(
                                      (h) => h.type === "regular"
                                    )
                                  ? "🎉"
                                  : ""}
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
            &gt; 1 Work Holiday This Week
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="border-2 border-gray-300 px-3 rounded">
            1 Regular Holiday This Week
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="bg-gray-600 px-3 rounded text-white">
            &gt;= 2 Regular Holidays This Week
          </span>
        </div>
      </div>
    </div>
  );
}
