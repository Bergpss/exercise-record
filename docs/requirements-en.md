# Fitness Record Web App - Requirements & Design Document

## 1. Project Overview

A web-based daily fitness recording application that helps users track and manage their workout data. The app provides an intuitive weekly view for training content and integrates Gemini AI for intelligent weekly summary analysis.

## 2. Core Feature Requirements

### 2.1 Daily Exercise Recording

| Data Field | Type | Description |
|------------|------|-------------|
| Date | Date | Automatically records the current date |
| Exercise | String | e.g., Push-ups, Squats, Pull-ups, etc. |
| Count | Number | Unit: reps/sets |
| Duration | Number | Unit: minutes |
| Feeling | Text | User's subjective feedback on the workout |

### 2.2 Weekly View Display

- **Primary View Mode**: Display training data on a weekly basis
- **Date Range**: Monday to Sunday (configurable start day)
- **Visual Content**:
  - Daily exercise list
  - Duration summary
  - Training intensity heatmap (optional)
  - Rest day indicators

### 2.3 AI Weekly Summary Feature

**Trigger Timing**: Every Monday (after previous week ends)

**Technical Implementation**:
- API Integration: Gemini API
- Model: gemini-3-pro-preview

**Summary Content**:
1. **Weekly Total Duration**: Accumulated training time
2. **Exercise Statistics**: Total reps/sets for each exercise
3. **Week-over-Week Comparison**: Progress or regression analysis
4. **Improvement Suggestions**: Data-driven recommendations for next week

## 3. Technical Architecture Design

### 3.1 Technology Stack

```
Frontend Framework: React + TypeScript
Styling: Vanilla CSS (Modern Design)
Build Tool: Vite
Data Storage: Supabase (PostgreSQL Cloud Database)
AI Integration: Gemini API
```

### 3.2 Project Structure

```
exercise-record/
├── src/
│   ├── components/
│   │   ├── WeekView/           # Weekly view component
│   │   ├── DayCard/            # Daily card component
│   │   ├── ExerciseForm/       # Exercise record form
│   │   ├── WeeklySummary/      # Weekly summary display
│   │   └── Header/             # Page header
│   ├── services/
│   │   ├── geminiService.ts    # Gemini API service
│   │   └── supabaseService.ts  # Supabase database service
│   ├── lib/
│   │   └── supabase.ts         # Supabase client configuration
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   └── dateUtils.ts        # Date utility functions
│   ├── hooks/
│   │   └── useExerciseData.ts  # Data management hook
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── docs/
│   ├── requirements-zh.md
│   └── requirements-en.md
├── .env.local                  # Environment variables (API Keys)
└── package.json
```

### 3.3 Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3.4 Data Models

```typescript
// Single exercise entry
interface ExerciseEntry {
  id: string;
  date: string;           // ISO date format YYYY-MM-DD
  exercise: string;       // Exercise name
  count: number;          // Repetition count
  duration: number;       // Duration in minutes
  feeling: string;        // Personal feedback
  createdAt: string;      // Creation timestamp
}

// Daily training summary
interface DayRecord {
  date: string;
  entries: ExerciseEntry[];
  totalDuration: number;
}

// Weekly training data
interface WeekData {
  weekStart: string;      // Week start date
  weekEnd: string;        // Week end date
  days: DayRecord[];
}

// AI weekly summary
interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  total_duration: number;
  exercise_stats: Record<string, number>;  // Exercise -> Total count
  comparison_with_last_week: string;
  improvement_suggestions: string;
  generated_at: string;
  created_at: string;
}
```

### 3.5 Supabase Database Schema

```sql
-- Users table (using Supabase Auth built-in)
-- Exercise entries table
CREATE TABLE exercise_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise VARCHAR(100) NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,  -- minutes
  feeling TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly summaries table
CREATE TABLE weekly_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  total_duration INTEGER NOT NULL DEFAULT 0,
  exercise_stats JSONB,
  comparison_with_last_week TEXT,
  improvement_suggestions TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable Row Level Security (RLS)
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can manage own entries" ON exercise_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own summaries" ON weekly_summaries
  FOR ALL USING (auth.uid() = user_id);
```

## 4. User Interface Design

### 4.1 Main Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Fitness Record | [← Prev] This Week [Next →] | [+ Add] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Mon       Tue       Wed       Thu       Fri       Sat       Sun   │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐ │
│  │     │  │     │  │     │  │     │  │     │  │     │  │     │ │
│  │Work │  │Work │  │Rest │  │Work │  │Work │  │Work │  │Rest │ │
│  │ out │  │ out │  │ Day │  │ out │  │ out │  │ out │  │ Day │ │
│  │     │  │     │  │     │  │     │  │     │  │     │  │     │ │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [📊 Generate Weekly Summary]                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AI Weekly Summary                                 │  │
│  │  Total Duration: 120 minutes                       │  │
│  │  Stats: Push-ups 150, Squats 100...               │  │
│  │  Comparison: 15% improvement from last week...    │  │
│  │  Suggestions: Consider adding core exercises...   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Design Style

- **Theme Colors**: Energetic orange/healthy green gradient
- **Style**: Modern, clean, card-based design
- **Animations**: Smooth micro-interactions
- **Responsive**: Desktop and mobile compatible

## 5. API Design

### 5.1 Gemini API Integration

```typescript
// Weekly summary prompt template
const generateWeeklySummaryPrompt = (
  currentWeekData: WeekData,
  lastWeekData: WeekData | null
): string => {
  return `
    Please generate a weekly fitness summary based on the following data:
    
    【Current Week Training Data】
    ${JSON.stringify(currentWeekData)}
    
    【Previous Week Training Data】
    ${lastWeekData ? JSON.stringify(lastWeekData) : 'No previous week data'}
    
    Please generate a summary including:
    1. Total training duration this week
    2. Total count for each exercise
    3. Comparison with last week (if available)
    4. Improvement suggestions for next week
    
    Use an encouraging and motivational tone.
  `;
};
```

## 6. Development Plan

### Phase 1: Foundation (1-2 days)
- [ ] Project initialization (Vite + React + TypeScript)
- [ ] Basic component structure setup
- [ ] Styling system establishment

### Phase 2: Core Features (2-3 days)
- [ ] Weekly view component development
- [ ] Exercise record form
- [ ] Local data persistence

### Phase 3: AI Integration (1-2 days)
- [ ] Gemini API integration
- [ ] Weekly summary generation
- [ ] Summary result display

### Phase 4: Polish & Optimization (1-2 days)
- [ ] UI/UX refinement
- [ ] Responsive design
- [ ] Testing and bug fixes

## 7. Future Enhancements

- Data export functionality (CSV/PDF)
- Training plan templates
- Historical data charts and analytics
- Cloud data synchronization
- Social sharing features
