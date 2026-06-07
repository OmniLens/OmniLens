import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import pool from "@/lib/db";
import {
  addUserRepo,
  clearUserRepos,
  deleteWorkflows,
  getUserRepo,
  getWorkflows,
  loadUserAddedRepos,
  removeUserRepo,
  saveWorkflows,
  type Repository,
} from "@/lib/db-storage";

// These tests hit a real PostgreSQL instance via the app's connection pool.
// They are skipped when DB_* is unconfigured so a developer without a database
// (or `bun run test:unit`) doesn't see spurious failures. CI sets DB_HOST.
const hasDb = Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);

const MAX_REPOSITORIES = 12; // mirrors addUserRepo's limit (lib/db-storage.ts)

function makeRepo(overrides: Partial<Repository> = {}): Repository {
  const slug = overrides.slug ?? `owner-repo-${randomUUID().slice(0, 8)}`;
  return {
    slug,
    repoPath: `owner/${slug}`,
    displayName: "Repo",
    htmlUrl: `https://github.com/owner/${slug}`,
    defaultBranch: "main",
    ...overrides,
  };
}

// Seed a synthetic better-auth user row so the user_id FK on repositories /
// workflows is satisfied. Returns its id; deleteUser cascades children away.
async function seedUser(): Promise<string> {
  const id = `omnilens-int-test-${randomUUID()}`;
  await pool.query('INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)', [
    id,
    "Integration Test User",
    `${id}@example.test`,
  ]);
  return id;
}

async function deleteUser(id: string): Promise<void> {
  // ON DELETE CASCADE removes the user's repositories and workflows too.
  await pool.query('DELETE FROM "user" WHERE id = $1', [id]);
}

describe.skipIf(!hasDb)("db-storage integration", () => {
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    userId = await seedUser();
    otherUserId = await seedUser();
  });

  afterAll(async () => {
    await deleteUser(userId);
    await deleteUser(otherUserId);
    await pool.end();
  });

  // Isolate every test: wipe both users' app rows (not the user rows themselves).
  afterEach(async () => {
    const ids = [userId, otherUserId];
    await pool.query("DELETE FROM workflows WHERE user_id = ANY($1)", [ids]);
    await pool.query("DELETE FROM repositories WHERE user_id = ANY($1)", [ids]);
  });

  describe("addUserRepo", () => {
    it("adds a repository and persists it for that user", async () => {
      const res = await addUserRepo(makeRepo({ slug: "added-repo" }), userId);
      expect(res).toEqual({ success: true });

      const repos = await loadUserAddedRepos(userId);
      expect(repos).toHaveLength(1);
      expect(repos[0].slug).toBe("added-repo");
      expect(repos[0].repoPath).toBe("owner/added-repo");
    });

    it("defaults visibility to 'public' when not provided", async () => {
      await addUserRepo(makeRepo({ slug: "vis-default" }), userId);
      const repo = await getUserRepo("vis-default", userId);
      expect(repo?.visibility).toBe("public");
    });

    it("persists an explicit 'private' visibility", async () => {
      await addUserRepo(makeRepo({ slug: "vis-private", visibility: "private" }), userId);
      const repo = await getUserRepo("vis-private", userId);
      expect(repo?.visibility).toBe("private");
    });

    it("rejects a duplicate slug for the same user without inserting twice", async () => {
      const first = await addUserRepo(makeRepo({ slug: "dupe" }), userId);
      expect(first.success).toBe(true);

      const second = await addUserRepo(makeRepo({ slug: "dupe" }), userId);
      expect(second.success).toBe(false);
      expect(second.error).toMatch(/already exists/i);

      const repos = await loadUserAddedRepos(userId);
      expect(repos).toHaveLength(1);
    });

    it("enforces the 12-repository limit", async () => {
      for (let i = 0; i < MAX_REPOSITORIES; i++) {
        const res = await addUserRepo(makeRepo({ slug: `repo-${i}` }), userId);
        expect(res.success).toBe(true);
      }

      const overLimit = await addUserRepo(makeRepo({ slug: "repo-13" }), userId);
      expect(overLimit.success).toBe(false);
      expect(overLimit.error).toMatch(/maximum repository limit/i);

      expect(await loadUserAddedRepos(userId)).toHaveLength(MAX_REPOSITORIES);
    });

    it("scopes the limit per user — another user's repos don't count", async () => {
      for (let i = 0; i < MAX_REPOSITORIES; i++) {
        await addUserRepo(makeRepo({ slug: `other-${i}` }), otherUserId);
      }

      // userId is still empty, so this must succeed despite otherUser being full.
      const res = await addUserRepo(makeRepo({ slug: "mine" }), userId);
      expect(res.success).toBe(true);
    });
  });

  describe("loadUserAddedRepos / getUserRepo", () => {
    it("only returns repositories belonging to the requesting user", async () => {
      await addUserRepo(makeRepo({ slug: "mine" }), userId);
      await addUserRepo(makeRepo({ slug: "theirs" }), otherUserId);

      const mine = await loadUserAddedRepos(userId);
      expect(mine.map((r) => r.slug)).toEqual(["mine"]);

      // Cross-user read returns nothing.
      expect(await getUserRepo("theirs", userId)).toBeNull();
    });

    it("returns null for a slug that does not exist", async () => {
      expect(await getUserRepo("ghost", userId)).toBeNull();
    });
  });

  describe("removeUserRepo", () => {
    it("removes the repo and returns the removed row", async () => {
      await addUserRepo(makeRepo({ slug: "to-remove" }), userId);

      const removed = await removeUserRepo("to-remove", userId);
      expect(removed?.slug).toBe("to-remove");
      expect(await getUserRepo("to-remove", userId)).toBeNull();
    });

    it("returns null when removing a non-existent slug", async () => {
      expect(await removeUserRepo("nope", userId)).toBeNull();
    });

    it("will not remove another user's repository", async () => {
      await addUserRepo(makeRepo({ slug: "protected" }), otherUserId);

      expect(await removeUserRepo("protected", userId)).toBeNull();
      // Still there for its real owner.
      expect(await getUserRepo("protected", otherUserId)).not.toBeNull();
    });
  });

  describe("clearUserRepos", () => {
    it("clears only the target user's repositories", async () => {
      await addUserRepo(makeRepo({ slug: "a" }), userId);
      await addUserRepo(makeRepo({ slug: "b" }), userId);
      await addUserRepo(makeRepo({ slug: "keep" }), otherUserId);

      await clearUserRepos(userId);

      expect(await loadUserAddedRepos(userId)).toHaveLength(0);
      expect(await loadUserAddedRepos(otherUserId)).toHaveLength(1);
    });
  });

  describe("saveWorkflows / getWorkflows / deleteWorkflows", () => {
    const repoSlug = "owner-wf-repo";

    it("saves workflows and reads them back ordered by name", async () => {
      await saveWorkflows(
        repoSlug,
        [
          { id: 2, name: "Deploy", path: ".github/workflows/deploy.yml", state: "active" },
          { id: 1, name: "CI", path: ".github/workflows/ci.yml", state: "active" },
        ],
        userId,
      );

      const workflows = await getWorkflows(repoSlug, userId);
      expect(workflows.map((w) => w.name)).toEqual(["CI", "Deploy"]);
      expect(workflows.find((w) => w.id === 1)?.path).toBe(".github/workflows/ci.yml");
    });

    it("upserts on re-save and prunes workflows absent from the new set", async () => {
      await saveWorkflows(
        repoSlug,
        [
          { id: 1, name: "CI", path: "ci.yml", state: "active" },
          { id: 2, name: "Deploy", path: "deploy.yml", state: "active" },
        ],
        userId,
      );

      // Re-save with Deploy removed and CI renamed.
      await saveWorkflows(
        repoSlug,
        [{ id: 1, name: "CI Renamed", path: "ci.yml", state: "active" }],
        userId,
      );

      const workflows = await getWorkflows(repoSlug, userId);
      expect(workflows).toHaveLength(1);
      expect(workflows[0]).toMatchObject({ id: 1, name: "CI Renamed" });
    });

    it("scopes workflows per user", async () => {
      await saveWorkflows(repoSlug, [{ id: 1, name: "CI", path: "ci.yml", state: "active" }], userId);

      expect(await getWorkflows(repoSlug, otherUserId)).toEqual([]);
    });

    it("deleteWorkflows removes all workflows for the repo", async () => {
      await saveWorkflows(repoSlug, [{ id: 1, name: "CI", path: "ci.yml", state: "active" }], userId);

      await deleteWorkflows(repoSlug, userId);
      expect(await getWorkflows(repoSlug, userId)).toEqual([]);
    });
  });
});
