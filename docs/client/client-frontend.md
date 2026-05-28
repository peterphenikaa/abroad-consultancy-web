# Client Frontend Architecture

## Tech Stack
- **Framework:** React 18
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **UI Primitives:** Radix UI
- **Routing:** React Router DOM v7
- **Data Fetching:** React Query, Axios
- **Offline & Storage:** Vite PWA Plugin, Dexie (IndexedDB), Workbox

## Directory Structure
- `src/pages/`: Top-level route components (e.g., Landing, AI Advisor, Courses, Dashboard).
- `src/components/`: Feature-level UI blocks and shared components.
- `src/services/`: API interaction logic and external service integrations.
- `src/ui/`: Atomic, reusable UI components.
- `src/hooks/`: Custom React hooks.
- `src/styles/`: Global stylesheets and CSS variables.

## Configuration & Environment
- **Development Server:** Runs on `0.0.0.0` at port `80`.
- **HMR:** Configured for client port `81`.
- **API Proxy:** All requests to `/api` are proxied to `http://cambridge-kong:8000`. (Note: Verify Kong URL matches actual API gateway setup).
- **Service Worker:** Configured via Vite PWA for caching media and core assets offline.

## Key Routes
- `/`: Landing Page
- `/advisor`: AI Advisor Interface
- `/courses`: Course Listing
- `/courses/:id`: Course Details
- `/courses/:courseId/quiz/:contentId/take`: Quiz Execution
- `/payment`: Payment Processing
- `/dashboard`: User Dashboard
- `/search`: Global Search
- `/analytics`: Analytics View
