import CalendarView from "../components/CalendarView";

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <h1 className="text-xl font-bold mb-4">📅 Holiday Calendar Widget</h1>
      <CalendarView />
    </main>
  );
}
