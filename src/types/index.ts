export interface WorkLifeBalance {
    weekday: number;
    weekend: number;
    score: number;
    label: string;
    weekendDeviation: number;
    dayOfWeekData: { day: string; commits: number }[];
}

export interface Persona {
    title: string;
    description: string;
    messageLengths: number[];
    avgLength: number;
    medianLength: number;
}

export interface CodingSeason {
    monthlyData: { month: string; commits: number }[];
    stdDev: number;
    mean: number;
}

export interface Dependency {
    name: string;
    count: number;
}

export interface ForgottenRepo {
    name: string;
    lastUpdated: string;
    createdAt: string;
    daysSinceUpdate: number;
    createdAtTimestamp: number;
    updatedAtTimestamp: number;
}

export interface Stats {
    workLifeBalance: WorkLifeBalance;
    persona: Persona;
    codingSeason: CodingSeason;
    topDependency: string;
    dependencies: Dependency[];
    dependencyVariance: number;
    forgottenRepo: ForgottenRepo | null;
}

export interface WrappedData {
    user: any;
    stats: Stats;
}
