# GitHub Wrapped Technical Migration Report

## Overview
This document outlines the technical issues found in the initial implementation of the GitHub Wrapped application, the specific limitations that caused data inaccuracies (missing commits), and the solution implemented using GitHub's GraphQL API.

## 1. How It Was Before (The Problem)

### Previous Implementation
The initial version of `src/lib/github.ts` relied entirely on the **GitHub REST API** explicitly the user events endpoint:
```typescript
GET /users/{username}/events
```
The logic involved paging through these events to find `PushEvent` types and calculating statistics (commit counts, dates, messages) manually from this list.

### Why It Didn't Work
The core issue lies in the **limitations of the GitHub Events API**:
1.  **Retention Period**: The standard Events API only yields events from the **past 90 days**.
2.  **Event Limit**: It is restricted to the most recent **300 events**.

**The Result:**
For any active developer, the API would simply stop returning data after the most recent 300 interactions or 3 months. This meant that stats like "Total Commits for 2025," "Coding Season" (monthly breakdown), and "Work-Life Balance" were completely calculating off a tiny, recent slice of data, ignoring the majority of the year.

---

## 2. What Changed

To resolve this, we shifted the core activity tracking to **GitHub's GraphQL API**, which powers the famous "contribution graph" on your GitHub profile.

### Key Changes
1.  **Adopted GraphQL for Contributions**: We now use the `contributionsCollection` query to fetch the entire year's contribution calendar in a single request.
2.  **Hybrid Data Fetching Strategy**:
    *   **GraphQL**: Used for *quantitative* data (Total commits, daily activity, intensity, streaks).
    *   **REST API**: Retained for *qualitative* data (Commit messages for "Persona", repo contents for "Dependency Addict").
3.  **Type Safety**: Introduced a centralized `src/types/index.ts` to ensure data consistency across the transformation layer.

---

## 3. How It Works Now

The new `getGitHubData` workflow operates in three parallel streams:

### Step A: The Quantitative Stream (GraphQL)
We execute the following textual query against `https://api.github.com/graphql`:
```graphql
query($username: String!) {
  user(login: $username) {
    contributionsCollection(from: "2025-01-01T00:00:00Z", to: "2025-12-31T23:59:59Z") {
      contributionCalendar { ... }
    }
  }
}
```
**Outcome:** This returns the exact commit count for every single day of 2025, ensuring `totalCommits` and the monthly distribution charts are 100% accurate.

### Step B: The Qualitative Stream (REST - Events)
We still fetch the recent ~300 events via REST.
**Why?** GraphQL counts commits but doesn't easily provide the *message content* for thousands of commits without complex pagination.
**Outcome:** We analyze this smaller sample of recent commit messages to determine the user's "Persona" (e.g., "The Poet" vs. "The Minimalist") and "Chaos Score" (based on keywords like "oops", "fix").

### Step C: The Repository Stream (REST - Repos)
We fetch the user's top repositories to scan `package.json` files.
**Outcome:** This powers the "Dependency Addict" section by counting the most used libraries in your actual code.

### Summary of Improvements
| Feature | Old Logic (REST) | New Logic (GraphQL + REST) |
| :--- | :--- | :--- |
| **Total Commits** | Inaccurate (max 300 events) | **100% Accurate** (Full Year) |
| **Monthly Stats** | Missing data older than 90 days | **Complete** (Jan - Dec) |
| **Commit Messages** | Analyzed recent batch | Analyzed recent batch (Unchanged) |
| **Performance** | Multiple paginated HTTP calls | Single GraphQL Call + Parallel REST calls |

The application now provides a true "Year in Review" rather than just a "Quarter in Review."
