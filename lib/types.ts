// Shared domain types for the Final 450 tracker.

/** A problem from the static catalog (data/problems.json). */
export type Problem = {
  id: number;
  topic: string;
  title: string;
  url: string | null;
  leetcodeUrl?: string | null;
  codingNinjaUrl?: string | null;
};

/** A per-user progress row as stored in Supabase. */
export type ProgressRow = {
  problem_id: number;
  done: boolean;
  starred: boolean;
  note: string | null;
};

/** A catalog problem merged with the current user's progress. */
export type ProblemState = Problem & {
  done: boolean;
  starred: boolean;
  note: string;
};

export type StatusFilter = "all" | "pending" | "done" | "starred";

/** A user's profile row in Supabase. All fields optional except identity. */
export type Profile = {
  user_id: string;
  username: string | null;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  education: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  leetcode: string | null;
  codeforces: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_public: boolean;
};
