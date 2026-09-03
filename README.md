# ⚡ DevTrack — Developer OS

> Your personal command center for everything dev.

DevTrack is a full-stack developer dashboard that combines project tracking, job hunting, coding analytics, interview prep and focus tools — all in one place, built for developers by a developer.

![DevTrack Dashboard]( https://devtrack-alpha.vercel.app/dashboard)

## 🚀 Live App

**[devtrack-xxx.vercel.app]( https://devtrack-alpha.vercel.app)**

Sign in with Google and start tracking your developer journey instantly.

---

## 🎯 Why DevTrack?

Most developers juggle 5+ apps to manage their work:
- Notion for planning
- Spreadsheets for job applications  
- Strava or manual logs for productivity
- Google Calendar for interviews
- Notes app for prep

DevTrack replaces all of them with one focused tool built specifically for developers.

---

## ✨ Features

### ⊞ Dashboard
- Personalised greeting based on time of day
- Live stats — active projects, jobs applied, coding hours, goals
- Today's goals with progress tracking
- Activity feed showing recent actions
- Coding streak counter

### ◈ Project Tracker
- Track all your builds with status and progress
- Tech stack tags per project
- GitHub and live URL links
- Color coded by status
- Filter by In Progress, Completed, On Hold, Planning

### ▤ Project Timeline
- Gantt-style horizontal timeline view
- 3, 6 or 12 month views
- Navigate forward and backward in time
- Today marker
- Deadline countdown warnings
- Project summary cards

### ◎ Job Tracker
- Full application pipeline — Applied → Shortlisted → Assessment → Interview → Offer
- Pipeline stats with counts per stage
- Update status with one tap
- Track salary, location, remote, interview dates
- Link to job posting URL

### 🎤 Interview Prep
- Create prep sessions per company
- Track interview stage and outcome
- Add custom questions with your own answers
- Quick-add common and technical questions
- Tick off questions as you prepare
- Progress bar showing prep readiness
- Self-rating after each interview
- Notes tab for company research

### ◉ Developer Analytics
- Log coding sessions with duration and project
- GitHub integration — pull live stats with your username
- Repos, followers and total stars
- Language breakdown with progress bars
- Coding heatmap — 52 weeks of activity
- Bar chart — coding hours by day of week
- Line chart — coding trend over last 14 days
- Coding streak calculation

### ◌ Daily Focus
- Pomodoro timer — Focus (25m), Short Break (5m), Long Break (15m)
- Daily goals with completion tracking
- Progress bar for goal completion
- Quick notes — auto-saved to browser
- Daily motivational quotes

### 📋 Weekly Report
- Overall performance grade — S, A, B, C, D
- Score breakdown — Coding, Job Hunt, Goals, Consistency
- Daily breakdown bar chart
- This week's activity log
- Auto-generated next week targets based on performance
- Navigate through previous weeks

### ⌘ Command Palette
- Press `Ctrl+K` to open
- Search and navigate to any screen instantly
- Keyboard navigation with arrow keys
- Press Enter to go, Esc to close

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Routing | React Router v7 |
| Charts | Recharts |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
| Type | Progressive Web App (PWA) |

---

## 📁 Project Structure

src/
├── components/
│ ├── Layout.jsx # Sidebar + mobile header + theme toggle
│ ├── CommandPalette.jsx # Ctrl+K command search
│ └── ActivityFeed.jsx # Live activity timeline
├── context/
│ ├── AuthContext.jsx # Google auth state
│ └── ThemeContext.jsx # Dark/light mode
├── lib/
│ ├── supabase.js # Supabase client
│ ├── auth.js # Google OAuth
│ └── activity.js # Activity logging helpers
└── screens/
├── Login.jsx # Google sign in
├── Dashboard.jsx # Home with live stats
├── Projects.jsx # Project tracker
├── Timeline.jsx # Gantt timeline view
├── JobTracker.jsx # Job application pipeline
├── InterviewPrep.jsx # Interview prep tracker
├── Analytics.jsx # GitHub + coding analytics
├── Focus.jsx # Pomodoro + daily goals
└── WeeklyReport.jsx # Weekly performance report


---

## 🗄️ Database Schema (Supabase)

```sql
projects          -- Project tracking with tech stack and progress
jobs              -- Job applications with full pipeline
daily_goals       -- Daily goals linked to date
coding_sessions   -- Logged coding sessions with duration
activity_feed     -- Auto-generated activity timeline
interview_prep    -- Interview prep with questions and answers
```

Row Level Security enabled on all tables.

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/AbuData2025/devtrack.git
cd devtrack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key

# Run locally
npm run dev

# Build for production
npm run build
```

### Environment Variables

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key


---

## 📱 Install as App

**Desktop (Chrome):**
1. Open the live URL in Chrome
2. Click the install icon ⊕ in the address bar
3. Click Install — DevTrack opens as a standalone desktop app

**Android (Chrome):**
1. Open the live URL in Chrome
2. Tap three dots → Add to Home Screen
3. Tap Add — DevTrack appears on your home screen

---

## 🗺️ Roadmap

- [ ] AI-powered interview answer suggestions
- [ ] GitHub webhook for auto-logging commits
- [ ] LinkedIn job URL auto-fill
- [ ] Skills tracker with learning progress
- [ ] CV/Resume version tracker
- [ ] Dark/light mode (✅ done)
- [ ] Mobile responsive (✅ done)
- [ ] Command palette (✅ done)

---

## 👤 About

Built by **Abulele Mndini** — aspiring IT professional based in Cape Town, South Africa.

- 🏃 Training for the Nelson Mandela Half Marathon · October 2026
- 💼 Actively seeking IT internship/graduate roles
- ⚡ Building in public

---

## 📄 License

MIT License — feel free to fork and build your own version!
