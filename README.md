# Calendar Widget

A lightweight, web-based calendar widget built with **Next.js** and **React**, designed for quick access to calendar views with an emphasis on holidays and vacation planning.

---

## Features

- Displays a rolling 3-month calendar (previous, current, next)
- Highlights current day and holidays (work vs regular)
- Vacation planning cues with visual indicators on weeks containing work holidays
- Supports importing holiday data from `.ics` files
- Filter to show only holidays
- Responsive and clean UI with Tailwind CSS

---

## Tech Stack

- **Next.js** (React framework with App Router)
- **React** (Functional components with hooks)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Utility-first CSS framework)
- **date-fns** (Date utility library)
- **ical.js** (ICS file parsing for calendar data import)

---

## Getting Started

### Prerequisites

- Node.js (v20.18.0 recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:


git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME

2. Install dependencies:
   npm install
3. Run the development server:
   npm run dev
4. Open http://localhost:3000 in your browser to view the app.

### Usage
 - Navigate between months using the Previous and Next buttons.

- Import holiday data using .ics files with the file input.

- Toggle "Show only holidays" filter to simplify the calendar view.

- Use the legend to understand icons and colors.

### Folder Structure
- app/ — Next.js app directory (pages and layout)

- components/ — React components (e.g., CalendarView)

- public/ — Static assets

- styles/ — Global CSS (Tailwind configured here)
   

   
