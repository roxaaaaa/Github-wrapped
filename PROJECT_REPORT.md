# GitHub Wrapped - Project Technical Report

## 1. Project Overview
**GitHub Wrapped** is a web application that generates a "Spotify Wrapped" style summary of a developer's year on GitHub. It uses OAuth for security, REST APIs for data fetching, and high-fidelity animations for the presentation.

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (with custom animations and gradients)
- **Animation**: Framer Motion
- **Authentication**: Auth.js (NextAuth v5)
- **Data Source**: GitHub REST API

---

## 2. Step-by-Step Implementation Guide

### Step 1: Initialization
The project was initialized using `create-next-app` to set up a modern React environment with built-in routing and optimization.
**Command:**
```bash
npx create-next-app@latest ./ --typescript --tailwind --eslint
```
We immediately installed necessary dependencies for animations and auth:
```bash
npm install next-auth@beta framer-motion lucide-react date-fns
```

### Step 2: Authentication System (Auth.js)
**Objective**: Allow users to securely log in with their GitHub account so we can access their private data (repositories, commits).

**Implementation**:
1.  **Config**: Created `src/auth.ts` to export the NextAuth instance. We configured the `GitHub` provider.
2.  **Scopes**: We specifically requested:
    - `read:user`: To get profile info.
    - `repo`: To read private repository stats.
3.  **Token Handling**: We implemented a JWT callback to save the OAuth Access Token. This token is crucial because it allows our server-side API calls to act *on behalf* of the user.

### Step 3: The Intelligence Engine (Data Analysis)
**Objective**: Turn raw JSON data from GitHub into "Vibe Metrics".
**File**: `src/lib/github.ts`

We created a server-side function `getGitHubData()` that performs the following analysis:

1.  **Work-Life Balance**:
    - **Source**: Fetches the user's "PushEvents" (commits).
    - **Logic**: Checks the `created_at` timestamp. If the day is Saturday (6) or Sunday (0), it counts as a weekend commit.
2.  **Commit Persona**:
    - **Source**: Analyzes commit messages from PushEvents.
    - **Logic**: We look for keywords like "fix", "oops", "wip" to detect chaotic energy, or check message length to detect "Poets" (long distinct commit messages).
3.  **Dependency Addict**:
    - **Source**: Iterates through the user's top 3 recently updated repositories.
    - **Logic**: Fetches the `package.json` file content (encoded in Base64), decodes it, and parses `dependencies` and `devDependencies` to find the most frequent occurrence.
4.  **The One That Got Away**:
    - **Source**: Filters the user's repository list.
    - **Logic**: Finds a repo created >6 months ago that hasn't been updated in >6 months.

### Step 4: The Interface (UI & Animation)
**Objective**: Recreate the "Story" feel.

1.  **WrappedCard (`src/components/WrappedCard.tsx`)**:
    - A reusable card designed to fill the screen.
    - Uses `Framer Motion` for entrance and exit animations (`AnimatePresence`).
    - Uses vibrant CSS gradients for the "Neon" look.
2.  **Story Container (`src/components/Story.tsx`)**:
    - manages the state of which slide is currently active (`index`).
    - Implements an auto-advancing progress bar at the top, similar to Instagram/Snapchat stories.
    - Handles keyboard navigation (Left/Right arrows).

---

## 3. API Explanation
This project heavily relies on the **GitHub REST API**. Here is exactly how we use it:

### 1. `GET /users/{username}/events`
- **Purpose**: To retrieve the user's recent activity stream.
- **Why**: This is the only way to get specific commit timestamps and messages without cloning every single repository.
- **Key Fields Used**: `type` (PushEvent), `payload.commits` (message), `created_at`.

### 2. `GET /user/repos`
- **Purpose**: To get a list of repositories the user owns.
- **Parameters**: `sort=updated`, `type=owner`.
- **Why**: We need this to find the "Top Repositories" to scan for dependencies, and to find old "Forgotten" repositories.

### 3. `GET /repos/{owner}/{repo}/contents/{path}`
- **Purpose**: To read a specific file from a repository without cloning it.
- **Target**: `package.json`.
- **Process**: GitHub returns the file content as a Base64 encoded string. We decode this string on the server to parse the JSON and tally npm packages.

### 4. `POST /login/oauth/access_token` (Handled by NextAuth)
- **Purpose**: The OAuth handshake.
- **Process**: exchages the temporary `code` received from the frontend for a permanent `access_token`. This token is then used in the `Authorization: Bearer <token>` header for all the requests above.
