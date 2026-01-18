import { auth } from "@/auth";
import { WrappedData, WorkLifeBalance, Persona, CodingSeason, Dependency, ForgottenRepo, Stats } from "@/types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

async function fetchContributionsWithGraphQL(username: string, token: string) {
    const query = `
        query($username: String!) {
            user(login: $username) {
                contributionsCollection(from: "2025-01-01T00:00:00Z", to: "2025-12-31T23:59:59Z") {
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                date
                                contributionCount
                            }
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(GITHUB_GRAPHQL_API, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables: { username } })
        });

        if (!response.ok) {
            console.error('GraphQL request failed', await response.text());
            return null;
        }

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            return null;
        }

        return data.data?.user?.contributionsCollection?.contributionCalendar;
    } catch (error) {
        console.error('Failed to fetch contributions via GraphQL:', error);
        return null;
    }
}

export async function getGitHubData(): Promise<WrappedData> {
    const session = await auth();
    // @ts-ignore
    if (!session?.accessToken) {
        throw new Error("Not authenticated");
    }
    // @ts-ignore
    const token = session.accessToken;

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
    };

    // 1. Fetch user profile
    const userRes = await fetch(`${GITHUB_API_BASE}/user`, { headers });
    if (!userRes.ok) {
        throw new Error(`Failed to fetch user profile: ${userRes.status}`);
    }
    const userProfile = await userRes.json();
    const username = userProfile.login;

    // 2. Start parallel fetches
    const contributionsPromise = fetchContributionsWithGraphQL(username, token);

    // Fetch recent events for Persona (commit messages)
    // We'll fetch 3 pages to get a good sample of messages
    const eventsPromise = (async () => {
        let allEvents: any[] = [];
        for (let page = 1; page <= 3; page++) {
            const res = await fetch(`${GITHUB_API_BASE}/users/${username}/events?per_page=100&page=${page}`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    allEvents.push(...data);
                    if (data.length < 100) break;
                }
            }
        }
        return allEvents;
    })();

    // Fetch repos for Dependencies and Forgotten Repo
    const reposPromise = fetch(`${GITHUB_API_BASE}/user/repos?sort=updated&per_page=50&type=owner`, { headers })
        .then(res => res.ok ? res.json() : []);

    const [contributionCalendar, events, repos] = await Promise.all([
        contributionsPromise,
        eventsPromise,
        reposPromise
    ]);

    // --- Process Contributions (WorkLifeBalance & CodingSeason & Total Counts) ---
    // Flatten the contribution days
    const allDays: { date: string; contributionCount: number }[] = [];
    if (contributionCalendar?.weeks) {
        contributionCalendar.weeks.forEach((week: any) => {
            week.contributionDays.forEach((day: any) => {
                allDays.push(day);
            });
        });
    }

    const dayOfWeekCommits: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const monthlyCommits: Record<string, number> = {};
    let weekendCommits = 0;
    let weekdayCommits = 0;
    let totalCommits = 0;

    // If GraphQL failed, we might have 0 stats, but we iterate what we have.
    allDays.forEach(day => {
        const date = new Date(day.date);
        const count = day.contributionCount;

        if (count > 0) {
            totalCommits += count;
            const dayOfWeek = date.getDay();
            dayOfWeekCommits[dayOfWeek] += count;

            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyCommits[monthKey] = (monthlyCommits[monthKey] || 0) + count;

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                weekendCommits += count;
            } else {
                weekdayCommits += count;
            }
        }
    });

    const workLifeScore = totalCommits > 0 ? Math.round((weekdayCommits / totalCommits) * 100) : 0;

    // Calculate weekend deviation
    const avgWeekdayCommits = (dayOfWeekCommits[1] + dayOfWeekCommits[2] + dayOfWeekCommits[3] + dayOfWeekCommits[4] + dayOfWeekCommits[5]) / 5;
    const avgWeekendCommits = (dayOfWeekCommits[0] + dayOfWeekCommits[6]) / 2;
    const weekendDeviation = avgWeekdayCommits > 0 ? avgWeekendCommits / avgWeekdayCommits : 0;

    // WorkLifeBalance Data
    const workLifeBalance: WorkLifeBalance = {
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
    };

    // CodingSeason Data
    const monthlyValues = Object.values(monthlyCommits);
    const monthlyMean = monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;
    const monthlyStdDev = monthlyValues.length > 0
        ? Math.sqrt(monthlyValues.reduce((sum, val) => sum + Math.pow(val - monthlyMean, 2), 0) / monthlyValues.length)
        : 0;

    const codingSeason: CodingSeason = {
        monthlyData: Object.entries(monthlyCommits)
            .map(([month, commits]) => ({ month, commits }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        stdDev: monthlyStdDev,
        mean: monthlyMean
    };


    // --- Process Events (Persona) ---
    // Used mainly for message analysis since GraphQL doesn't give messages
    const commitMessageLengths: number[] = [];
    let chaosKeywordsCount = 0;
    const chaosKeywords = ["fix", "bug", "oops", "wip", "broken", "idk", "temp", "shit", "damn"];

    const pushEvents = events.filter((e: any) => e.type === "PushEvent");
    pushEvents.forEach((event: any) => {
        if (event.payload.commits && Array.isArray(event.payload.commits)) {
            event.payload.commits.forEach((commit: any) => {
                const msg = (commit.message || "").toLowerCase();
                const msgLength = msg.length;
                commitMessageLengths.push(msgLength);
                if (chaosKeywords.some(kw => msg.includes(kw))) {
                    chaosKeywordsCount++;
                }
            });
        }
    });

    let personaTitle = "The Architect";
    const avgMessageLength = commitMessageLengths.length > 0
        ? commitMessageLengths.reduce((a, b) => a + b, 0) / commitMessageLengths.length
        : 0;
    const medianMessageLength = commitMessageLengths.length > 0
        ? [...commitMessageLengths].sort((a, b) => a - b)[Math.floor(commitMessageLengths.length / 2)]
        : 0;

    if (avgMessageLength > 50) personaTitle = "The Poet";
    if (chaosKeywordsCount > commitMessageLengths.length * 0.3) personaTitle = "The Chaos Theory";
    if (avgMessageLength < 10 && commitMessageLengths.length > 5) personaTitle = "The Minimalist";

    const persona: Persona = {
        title: personaTitle,
        description: personaTitle === "The Poet" ? "Your commit messages are novels." :
            personaTitle === "The Chaos Theory" ? "You embrace entropy." :
                personaTitle === "The Minimalist" ? "Short. Sweet. Done." :
                    "Clean, structured, reliable.",
        messageLengths: commitMessageLengths,
        avgLength: avgMessageLength,
        medianLength: medianMessageLength
    };


    // --- Process Repos (Dependency & Forgotten) ---
    const topRepos = Array.isArray(repos) ? repos.slice(0, 10) : [];
    const dependencies: Record<string, number> = {};

    await Promise.all(topRepos.map(async (repo: any) => {
        try {
            const pkgRes = await fetch(`${GITHUB_API_BASE}/repos/${repo.full_name}/contents/package.json`, { headers });
            if (pkgRes.ok) {
                const pkgData = await pkgRes.json();
                if (pkgData.content) {
                    const content = atob(pkgData.content);
                    const json = JSON.parse(content);
                    const allDeps = { ...(json.dependencies || {}), ...(json.devDependencies || {}) };
                    Object.keys(allDeps).forEach(dep => {
                        dependencies[dep] = (dependencies[dep] || 0) + 1;
                    });
                }
            }
        } catch (e) {
            // Ignore
        }
    }));

    const sortedDeps = Object.entries(dependencies).sort(([, a], [, b]) => b - a);
    const topDependency = sortedDeps.length > 0 ? sortedDeps[0][0] : "Vanilla JS";
    const depValues = sortedDeps.map(([, count]) => count);
    const depMean = depValues.length > 0 ? depValues.reduce((a, b) => a + b, 0) / depValues.length : 0;
    const depVariance = depValues.length > 0
        ? depValues.reduce((sum, val) => sum + Math.pow(val - depMean, 2), 0) / depValues.length
        : 1;

    // Forgotten Repo
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date();

    const forgottenRepoData = Array.isArray(repos) ? repos.find((repo: any) => {
        const createdAt = new Date(repo.created_at);
        const updatedAt = new Date(repo.updated_at);
        return createdAt < sixMonthsAgo && updatedAt < sixMonthsAgo;
    }) : null;

    let forgottenRepo: ForgottenRepo | null = null;
    if (forgottenRepoData) {
        const daysSinceUpdate = Math.floor((today.getTime() - new Date(forgottenRepoData.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        forgottenRepo = {
            name: forgottenRepoData.name,
            lastUpdated: new Date(forgottenRepoData.updated_at).toLocaleDateString(),
            createdAt: new Date(forgottenRepoData.created_at).toLocaleDateString(),
            daysSinceUpdate,
            createdAtTimestamp: new Date(forgottenRepoData.created_at).getTime(),
            updatedAtTimestamp: new Date(forgottenRepoData.updated_at).getTime()
        };
    }

    return {
        user: session.user,
        stats: {
            workLifeBalance,
            persona,
            codingSeason,
            topDependency,
            dependencies: sortedDeps.slice(0, 20).map(([name, count]) => ({ name, count })),
            dependencyVariance: depVariance,
            forgottenRepo
        }
    };
}
