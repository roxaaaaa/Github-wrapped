import { auth } from "@/auth";

const GITHUB_API_BASE = "https://api.github.com";

export async function getGitHubData() {
    const session = await auth();
    if (!session?.accessToken) {
        throw new Error("Not authenticated");
    }

    const headers = {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
    };


    // Fetch user profile to get the username
    const userRes = await fetch(`${GITHUB_API_BASE}/user`, { headers });
    if (!userRes.ok) {
        throw new Error(`Failed to fetch user profile: ${userRes.status} ${userRes.statusText}`);
    }
    const userProfile = await userRes.json();
    const username = userProfile.login;

    // 1. Fetch User Events (for Commits)
    // Date range: 01.01.2025 to 31.12.2025
    const startDate = new Date("2025-01-01T00:00:00Z");
    const endDate = new Date("2025-12-31T23:59:59Z");

    // Fetch events - get multiple pages to cover the full year
    let allEvents: any[] = [];
    let page = 1;
    const perPage = 100;
    let foundEventsInRange = true;

    // Fetch up to 10 pages (1000 events max) to ensure we cover all of 2025
    while (page <= 10) {
        try {
            const eventsRes = await fetch(
                `${GITHUB_API_BASE}/users/${username}/events?per_page=${perPage}&page=${page}`,
                { headers }
            );

            if (!eventsRes.ok) {
                console.error(`GitHub API error: ${eventsRes.status} ${eventsRes.statusText}`);
                break;
            }

            const events = await eventsRes.json();

            if (!Array.isArray(events)) {
                console.error("Events response is not an array:", events);
                break;
            }

            if (events.length === 0) {
                break;
            }

            // Filter events by date range (2025 only)
            const filteredEvents = events.filter((e: any) => {
                if (!e.created_at) return false;
                const eventDate = new Date(e.created_at);
                return eventDate >= startDate && eventDate <= endDate;
            });

            allEvents.push(...filteredEvents);

            // Check if we've gone past our date range (events are returned newest first)
            // If the oldest event in this page is before 2025, we can stop
            const oldestEvent = events[events.length - 1];
            if (oldestEvent && oldestEvent.created_at) {
                const oldestEventDate = new Date(oldestEvent.created_at);
                if (oldestEventDate < startDate) {
                    break; // We've gone past 2025, stop fetching
                }
            }

            page++;
        } catch (error) {
            console.error("Error fetching events:", error);
            break;
        }
    }

    // Filter for PushEvents within date range
    const pushEvents = allEvents.filter((e: any) => e.type === "PushEvent");

    // Data structures for visualizations
    const dayOfWeekCommits: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // 0=Sun, 6=Sat
    const commitMessageLengths: number[] = [];
    const monthlyCommits: Record<string, number> = {};
    let weekendCommits = 0;
    let weekdayCommits = 0;

    // Calculate Commit Persona
    let totalMessageLength = 0;
    let chaosKeywordsCount = 0;
    const chaosKeywords = ["fix", "bug", "oops", "wip", "broken", "idk", "temp"];

    pushEvents.forEach((event: any) => {
        const date = new Date(event.created_at);
        // Double-check date is within 2025 range
        if (date < startDate || date > endDate) {
            return;
        }

        const dayOfWeek = date.getDay();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Day of week tracking
        dayOfWeekCommits[dayOfWeek] = (dayOfWeekCommits[dayOfWeek] || 0) + (event.payload.size || 0);

        // Monthly tracking
        monthlyCommits[monthKey] = (monthlyCommits[monthKey] || 0) + (event.payload.size || 0);

        // Weekend vs weekday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendCommits += event.payload.size || 0;
        } else {
            weekdayCommits += event.payload.size || 0;
        }

        if (event.payload.commits && Array.isArray(event.payload.commits)) {
            event.payload.commits.forEach((commit: any) => {
                const msg = (commit.message || "").toLowerCase();
                const msgLength = msg.length;
                commitMessageLengths.push(msgLength);
                totalMessageLength += msgLength;
                if (chaosKeywords.some(kw => msg.includes(kw))) {
                    chaosKeywordsCount++;
                }
            });
        }
    });

    const totalCommits = weekendCommits + weekdayCommits || 1;
    const workLifeScore = Math.round((weekdayCommits / totalCommits) * 100);

    // Calculate weekend deviation
    const avgWeekdayCommits = (dayOfWeekCommits[1] + dayOfWeekCommits[2] + dayOfWeekCommits[3] + dayOfWeekCommits[4] + dayOfWeekCommits[5]) / 5;
    const avgWeekendCommits = (dayOfWeekCommits[0] + dayOfWeekCommits[6]) / 2;
    const weekendDeviation = avgWeekdayCommits > 0 ? avgWeekendCommits / avgWeekdayCommits : 0;

    let persona = "The Architect";
    const avgMessageLength = commitMessageLengths.length > 0
        ? commitMessageLengths.reduce((a, b) => a + b, 0) / commitMessageLengths.length
        : 0;
    const medianMessageLength = commitMessageLengths.length > 0
        ? [...commitMessageLengths].sort((a, b) => a - b)[Math.floor(commitMessageLengths.length / 2)]
        : 0;

    if (avgMessageLength > 50) persona = "The Poet";
    if (chaosKeywordsCount > commitMessageLengths.length * 0.3) persona = "The Chaos Theory";


    // 2. Fetch Repositories
    const reposRes = await fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=20&type=owner`, { headers });
    const repos = await reposRes.json();

    // 3. Dependency Addict (Scan package.json in top repos - increased to 10 for better data)
    const topRepos = Array.isArray(repos) ? repos.slice(0, 10) : [];
    const dependencies: Record<string, number> = {};

    await Promise.all(topRepos.map(async (repo: any) => {
        try {
            const pkgRes = await fetch(`${GITHUB_API_BASE}/repos/${repo.full_name}/contents/package.json`, { headers });
            if (pkgRes.ok) {
                const pkgData = await pkgRes.json();
                const content = atob(pkgData.content);
                const json = JSON.parse(content);
                const allDeps = { ...(json.dependencies || {}), ...(json.devDependencies || {}) };
                Object.keys(allDeps).forEach(dep => {
                    dependencies[dep] = (dependencies[dep] || 0) + 1;
                });
            }
        } catch (e) {
            // Ignore repos without package.json
        }
    }));

    const sortedDeps = Object.entries(dependencies).sort(([, a], [, b]) => b - a);
    const topDependency = sortedDeps.length > 0 ? sortedDeps[0][0] : "Vanilla JS";

    // Calculate dependency variance (lower = more addicted)
    const depValues = sortedDeps.map(([, count]) => count);
    const depMean = depValues.length > 0 ? depValues.reduce((a, b) => a + b, 0) / depValues.length : 0;
    const depVariance = depValues.length > 0
        ? depValues.reduce((sum, val) => sum + Math.pow(val - depMean, 2), 0) / depValues.length
        : 1;

    // 4. The One That Got Away
    // Find a repo created > 6 months ago, updated > 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date();

    const forgottenRepo = Array.isArray(repos) ? repos.find((repo: any) => {
        const createdAt = new Date(repo.created_at);
        const updatedAt = new Date(repo.updated_at);
        return createdAt < sixMonthsAgo && updatedAt < sixMonthsAgo;
    }) : null;

    // Calculate days since last update
    const daysSinceUpdate = forgottenRepo
        ? Math.floor((today.getTime() - new Date(forgottenRepo.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Calculate monthly standard deviation for coding season
    const monthlyValues = Object.values(monthlyCommits);
    const monthlyMean = monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;
    const monthlyStdDev = monthlyValues.length > 0
        ? Math.sqrt(monthlyValues.reduce((sum, val) => sum + Math.pow(val - monthlyMean, 2), 0) / monthlyValues.length)
        : 0;

    return {
        user: session.user,
        stats: {
            workLifeBalance: {
                weekday: weekdayCommits,
                weekend: weekendCommits,
                score: workLifeScore,
                label: workLifeScore > 90 ? "9-to-5 Pro" : "Weekend Warrior",
                weekendDeviation,
                dayOfWeekData: [
                    { day: "Sun", commits: dayOfWeekCommits[0] },
                    { day: "Mon", commits: dayOfWeekCommits[1] },
                    { day: "Tue", commits: dayOfWeekCommits[2] },
                    { day: "Wed", commits: dayOfWeekCommits[3] },
                    { day: "Thu", commits: dayOfWeekCommits[4] },
                    { day: "Fri", commits: dayOfWeekCommits[5] },
                    { day: "Sat", commits: dayOfWeekCommits[6] },
                ]
            },
            persona: {
                title: persona,
                description: persona === "The Poet" ? "Your commit messages are novels." :
                    persona === "The Chaos Theory" ? "You embrace entropy." :
                        "Clean, structured, reliable.",
                messageLengths: commitMessageLengths,
                avgLength: avgMessageLength,
                medianLength: medianMessageLength
            },
            codingSeason: {
                monthlyData: Object.entries(monthlyCommits)
                    .map(([month, commits]) => ({ month, commits }))
                    .sort((a, b) => a.month.localeCompare(b.month)),
                stdDev: monthlyStdDev,
                mean: monthlyMean
            },
            topDependency,
            dependencies: sortedDeps.slice(0, 20).map(([name, count]) => ({ name, count })),
            dependencyVariance: depVariance,
            forgottenRepo: forgottenRepo ? {
                name: forgottenRepo.name,
                lastUpdated: new Date(forgottenRepo.updated_at).toLocaleDateString(),
                createdAt: new Date(forgottenRepo.created_at).toLocaleDateString(),
                daysSinceUpdate,
                createdAtTimestamp: new Date(forgottenRepo.created_at).getTime(),
                updatedAtTimestamp: new Date(forgottenRepo.updated_at).getTime()
            } : null
        }
    };
}
