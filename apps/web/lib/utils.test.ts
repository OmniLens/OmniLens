import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cn,
  duration,
  formatDuration,
  formatRepoDisplayName,
  formatRunTime,
  slugFromRepoPath,
  getAvatarColor,
  getAvatarLetter,
  getWorkflowDotClass,
  getWorkflowHealthLabel,
  getWorkflowPillClass,
  getWorkflowTextClass,
  isFeatureEnabled,
  removeEmojiFromWorkflowName,
  type WorkflowHealth,
} from "@/lib/utils";

describe("removeEmojiFromWorkflowName", () => {
  it("strips a leading emoji and following whitespace", () => {
    expect(removeEmojiFromWorkflowName("⏱️ Thresholds")).toBe("Thresholds");
  });

  it("strips multiple leading emojis", () => {
    expect(removeEmojiFromWorkflowName("✅🚀 Deploy")).toBe("Deploy");
  });

  it("returns empty string for falsy input", () => {
    expect(removeEmojiFromWorkflowName("")).toBe("");
  });

  it("leaves a plain name unchanged", () => {
    expect(removeEmojiFromWorkflowName("Build and Test")).toBe("Build and Test");
  });

  it("only strips from the start — trailing emoji is preserved", () => {
    expect(removeEmojiFromWorkflowName("Deploy 🚀")).toBe("Deploy 🚀");
  });
});

describe("formatRepoDisplayName", () => {
  it("converts owner/repo-name to title-cased words", () => {
    expect(formatRepoDisplayName("owner/my-repo")).toBe("My Repo");
  });

  it("converts underscores to spaces", () => {
    expect(formatRepoDisplayName("owner/my_cool_repo")).toBe("My Cool Repo");
  });

  it("keeps the nuqs special-case lowercase regardless of input casing", () => {
    expect(formatRepoDisplayName("owner/nuqs")).toBe("nuqs");
    expect(formatRepoDisplayName("owner/NUQS")).toBe("nuqs");
  });

  it("handles a bare repo name with no owner segment", () => {
    expect(formatRepoDisplayName("single-repo")).toBe("Single Repo");
  });
});

describe("slugFromRepoPath", () => {
  it("replaces the owner/repo separator with a hyphen", () => {
    expect(slugFromRepoPath("microsoft/vscode")).toBe("microsoft-vscode");
  });

  it("keeps the owner so the slug is unique when org matches repo name", () => {
    expect(slugFromRepoPath("OmniLens/OmniLens")).toBe("OmniLens-OmniLens");
  });

  it("only replaces the first slash", () => {
    expect(slugFromRepoPath("owner/repo/extra")).toBe("owner-repo/extra");
  });

  it("leaves a path with no slash unchanged", () => {
    expect(slugFromRepoPath("singletoken")).toBe("singletoken");
  });
});

describe("getAvatarLetter", () => {
  it("returns the uppercase first letter of the repo part", () => {
    expect(getAvatarLetter("owner/core")).toBe("C");
  });

  it("uppercases the first letter of a plain display name", () => {
    expect(getAvatarLetter("core")).toBe("C");
  });

  it("returns ? for empty input", () => {
    expect(getAvatarLetter("")).toBe("?");
  });

  it("falls back to the whole string when the repo part is empty (trailing slash)", () => {
    // split('/').pop() is "" (falsy) so the `|| displayNameOrPath` fallback
    // uses the full input, yielding the first letter of the owner.
    expect(getAvatarLetter("owner/")).toBe("O");
  });
});

describe("getAvatarColor", () => {
  const PALETTE = ["#00e5a0", "#4d9fff", "#c084fc", "#f59e0b", "#ef4444", "#6366f1"];

  it("is deterministic for the same input", () => {
    expect(getAvatarColor("owner/core")).toBe(getAvatarColor("owner/core"));
  });

  it("returns the first palette color for empty input", () => {
    expect(getAvatarColor("")).toBe("#00e5a0");
  });

  it("honors the per-repo override", () => {
    expect(getAvatarColor("Hiccup-za/peak")).toBe("#f97316");
  });

  it("always returns a color within the palette for non-override input", () => {
    expect(PALETTE).toContain(getAvatarColor("some/random-repo"));
  });
});

describe("workflow health styling helpers", () => {
  const healths: WorkflowHealth[] = [
    "consistent",
    "improved",
    "regressed",
    "still_failing",
    "idle",
  ];

  it("getWorkflowDotClass returns a class for every health value", () => {
    const expected: Record<WorkflowHealth, string> = {
      consistent: "bg-[#00e5a0]",
      improved: "bg-[#4d9fff]",
      regressed: "bg-amber-500",
      still_failing: "bg-red-500",
      idle: "bg-muted-foreground/40",
    };
    for (const h of healths) expect(getWorkflowDotClass(h)).toBe(expected[h]);
  });

  it("getWorkflowTextClass returns a class for every health value", () => {
    const expected: Record<WorkflowHealth, string> = {
      consistent: "text-[#00e5a0]",
      improved: "text-[#4d9fff]",
      regressed: "text-amber-500",
      still_failing: "text-red-500",
      idle: "text-muted-foreground/60",
    };
    for (const h of healths) expect(getWorkflowTextClass(h)).toBe(expected[h]);
  });

  it("getWorkflowHealthLabel returns the display label for every health value", () => {
    const expected: Record<WorkflowHealth, string> = {
      consistent: "HEALTHY",
      improved: "IMPROVED",
      regressed: "REGRESSED",
      still_failing: "FAILING",
      idle: "IDLE",
    };
    for (const h of healths) expect(getWorkflowHealthLabel(h)).toBe(expected[h]);
  });

  it("getWorkflowPillClass returns a non-empty class for every health value", () => {
    for (const h of healths) expect(getWorkflowPillClass(h).length).toBeGreaterThan(0);
  });
});

describe("formatDuration", () => {
  it("formats sub-minute durations as seconds", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(90)).toBe("1m 30s");
  });

  it("formats hours and minutes (dropping seconds)", () => {
    expect(formatDuration(3661)).toBe("1h 1m");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("handles the exact one-minute boundary", () => {
    expect(formatDuration(60)).toBe("1m 0s");
  });

  it("handles the exact one-hour boundary", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
  });
});

describe("duration", () => {
  it("formats a multi-hour span", () => {
    expect(duration("2024-01-01T10:00:00Z", "2024-01-01T12:30:15Z")).toBe("2h 30m 15s");
  });

  it("uses absolute value when end is before start", () => {
    expect(duration("2024-01-01T12:00:00Z", "2024-01-01T10:00:00Z")).toBe("2h 0m 0s");
  });

  it("formats a sub-minute span as seconds only", () => {
    expect(duration("2024-01-01T10:00:00Z", "2024-01-01T10:00:30Z")).toBe("30s");
  });

  it("formats a minutes-and-seconds span without an hour component", () => {
    expect(duration("2024-01-01T10:00:00Z", "2024-01-01T10:05:10Z")).toBe("5m 10s");
  });

  it("returns 0s for identical timestamps", () => {
    expect(duration("2024-01-01T10:00:00Z", "2024-01-01T10:00:00Z")).toBe("0s");
  });
});

describe("formatRunTime", () => {
  // TZ is pinned to UTC in vitest.config.ts, so HH:MM output is deterministic.
  it("formats an ISO timestamp as HH:MM", () => {
    expect(formatRunTime("2024-01-01T14:30:00Z")).toBe("14:30");
  });

  it("returns a value matching the HH:MM shape", () => {
    expect(formatRunTime("2024-01-01T09:05:00Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("isFeatureEnabled", () => {
  const KEY = "NEXT_PUBLIC_ENABLE_DEMO_FEATURE";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when the env var is 'true'", () => {
    vi.stubEnv(KEY, "true");
    expect(isFeatureEnabled("DEMO_FEATURE")).toBe(true);
  });

  it("returns true when the env var is '1'", () => {
    vi.stubEnv(KEY, "1");
    expect(isFeatureEnabled("DEMO_FEATURE")).toBe(true);
  });

  it("returns false when the env var is 'false'", () => {
    vi.stubEnv(KEY, "false");
    expect(isFeatureEnabled("DEMO_FEATURE")).toBe(false);
  });

  it("returns false when the env var is any other value", () => {
    vi.stubEnv(KEY, "yes");
    expect(isFeatureEnabled("DEMO_FEATURE")).toBe(false);
  });

  it("defaults to false in production when unset", () => {
    vi.stubEnv(KEY, undefined);
    vi.stubEnv("NODE_ENV", "production");
    expect(isFeatureEnabled("DEMO_FEATURE")).toBe(false);
  });

  it("defaults to true outside production when unset", () => {
    vi.stubEnv(KEY, undefined);
    vi.stubEnv("NODE_ENV", "development");
    expect(isFeatureEnabled("DEMO_FEATURE")).toBe(true);
  });
});

describe("cn", () => {
  it("merges conflicting tailwind classes, keeping the last", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy/conditional values", () => {
    const isHidden = false;
    expect(cn("flex", isHidden && "hidden", undefined, "gap-2")).toBe("flex gap-2");
  });
});
