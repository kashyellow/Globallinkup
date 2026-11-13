import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const state = vi.hoisted(() => ({
  user: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } as null | { id: string },
  profile: { role: "user", approval_status: "approved" } as null | {
    role: string;
    approval_status: string;
  },
  listPages: [[]] as { name: string; id?: string | null }[][],
  cursors: {} as Record<string, number>,
  /** Pages per folder path; the member's own folder falls back to `listPages`. */
  folders: {} as Record<string, { name: string; id: string | null }[][]>,
  /** Folder entries stay listed after `remove` (Storage cannot delete a folder row). */
  listCalls: 0,
  storageError: false,
  deleteError: false,
  removed: [] as { bucket: string; paths: string[] }[],
  deleted: [] as string[],
  audits: [] as Record<string, unknown>[],
  signOuts: 0,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => state.user,
  getCurrentProfile: async () => state.profile,
}));
vi.mock("@/features/auth/actions", () => ({
  signOutAction: async () => {
    state.signOuts += 1;
    return { ok: true, redirectTo: "/login" };
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => ({
        list: async (prefix: string) => {
          if (state.storageError) return { data: null, error: { message: "boom" } };
          if (++state.listCalls > 60)
            throw new Error("list called too often: the cleanup would never end");
          // Each folder walks its pages once (removed files leave the listing), then runs empty.
          const key = `${bucket}:${prefix}`;
          const page = (state.cursors[key] = (state.cursors[key] ?? -1) + 1);
          const pages = state.folders[prefix] ?? (prefix === USER_ID ? state.listPages : []);
          return { data: pages[page] ?? [], error: null };
        },
        remove: async (paths: string[]) => {
          state.removed.push({ bucket, paths });
          return { error: null };
        },
      }),
    },
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          if (state.deleteError) return { error: { message: "nope" } };
          state.deleted.push(id);
          return { error: null };
        },
      },
    },
    from: (table: string) => ({
      insert: async (row: Record<string, unknown>) => {
        if (table === "audit_events") state.audits.push(row);
        return { error: null };
      },
    }),
  }),
}));

import { deleteOwnAccountAction } from "./actions";

beforeEach(() => {
  state.user = { id: USER_ID };
  state.profile = { role: "user", approval_status: "approved" };
  state.listPages = [[]];
  state.cursors = {};
  state.folders = {};
  state.listCalls = 0;
  state.storageError = false;
  state.deleteError = false;
  state.removed = [];
  state.deleted = [];
  state.audits = [];
  state.signOuts = 0;
});

describe("deleteOwnAccountAction", () => {
  it.each([["delete"], [" DELETE "], [""], [undefined]])(
    "refuses the confirmation %j",
    async (confirm) => {
      expect(await deleteOwnAccountAction({ confirm })).toEqual({ ok: false, error: "invalid" });
      expect(state.deleted).toHaveLength(0);
      expect(state.removed).toHaveLength(0);
    },
  );

  it("refuses a suspended member", async () => {
    state.profile = { role: "user", approval_status: "suspended" };
    expect(await deleteOwnAccountAction({ confirm: "DELETE" })).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(state.deleted).toHaveLength(0);
    expect(state.removed).toHaveLength(0);
  });

  it("refuses an admin", async () => {
    state.profile = { role: "admin", approval_status: "approved" };
    expect(await deleteOwnAccountAction({ confirm: "DELETE" })).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(state.deleted).toHaveLength(0);
  });

  it("returns forbidden, not an exception, when the account is already gone", async () => {
    state.user = null;
    expect(await deleteOwnAccountAction({ confirm: "DELETE" })).toEqual({
      ok: false,
      error: "forbidden",
    });
  });

  it("removes every page of files in both buckets", async () => {
    const page = (count: number, from = 0) =>
      Array.from({ length: count }, (_, index) => ({ name: `f${from + index}.png` }));
    state.listPages = [page(100), page(20, 100), []];
    await deleteOwnAccountAction({ confirm: "DELETE" });

    for (const bucket of ["avatars", "post-images"]) {
      const paths = state.removed.filter((call) => call.bucket === bucket).flatMap((c) => c.paths);
      expect(paths).toHaveLength(120);
      expect(paths[0]).toBe(`${USER_ID}/f0.png`);
      expect(paths.at(-1)).toBe(`${USER_ID}/f119.png`);
    }
  });

  it("empties subfolders and ends even when a folder row stays listed", async () => {
    // A member can upload to avatars/<id>/sub/x.png with their own JWT.
    state.listPages = [
      [
        { name: "sub", id: null },
        { name: "a.png", id: "1" },
      ],
      [{ name: "sub", id: null }],
    ];
    state.folders[`${USER_ID}/sub`] = [[{ name: "x.png", id: "2" }], []];
    expect((await deleteOwnAccountAction({ confirm: "DELETE" })).ok).toBe(true);

    const paths = state.removed.filter((call) => call.bucket === "avatars").flatMap((c) => c.paths);
    expect([...paths].sort()).toEqual([`${USER_ID}/a.png`, `${USER_ID}/sub/x.png`]);
    expect(state.deleted).toEqual([USER_ID]);
  });

  it("deletes the user, writes an id-only audit row and signs out", async () => {
    expect(await deleteOwnAccountAction({ confirm: "DELETE" })).toEqual({
      ok: true,
      redirectTo: "/",
    });
    expect(state.deleted).toEqual([USER_ID]);
    expect(state.audits).toEqual([
      { action: "member.deleted", target_type: "profile", target_id: USER_ID },
    ]);
    expect(state.signOuts).toBe(1);
  });

  it("keeps the session and writes no audit row when deleteUser fails", async () => {
    state.deleteError = true;
    expect(await deleteOwnAccountAction({ confirm: "DELETE" })).toEqual({
      ok: false,
      error: "unknown",
    });
    expect(state.audits).toHaveLength(0);
    expect(state.signOuts).toBe(0);
  });

  it("still deletes when storage cleanup fails", async () => {
    state.storageError = true;
    expect((await deleteOwnAccountAction({ confirm: "DELETE" })).ok).toBe(true);
    expect(state.deleted).toEqual([USER_ID]);
  });
});
