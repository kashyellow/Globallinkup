import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Invite actions against faked Supabase clients. The fakes record what the
 * action asked for; the assertions are on the action's result and on which
 * side effects (auth user, storage, invite row, audit) did or did not happen.
 */

const state = vi.hoisted(() => ({
  capabilities: ["members.review"] as string[],
  openInvite: null as null | Record<string, unknown>,
  lookupError: null as null | { code: string },
  insertError: null as null | { code: string },
  profileExists: false,
  inviteResult: { data: { user: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } }, error: null } as {
    data: { user: { id: string } | null };
    error: null | { code?: string; status?: number; message?: string };
  },
  invites: [] as { email: string; options: { redirectTo: string } }[],
  inserts: [] as Record<string, unknown>[],
  uploads: [] as string[],
  deleted: [] as string[],
  audits: [] as { action: string; metadata?: unknown }[],
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/origin", () => ({ getRequestOrigin: async () => "http://localhost:3000" }));
vi.mock("@/lib/audit", () => ({
  recordAudit: async (input: { action: string; metadata?: unknown }) => {
    state.audits.push(input);
  },
}));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => ({ id: "11111111-1111-4111-8111-111111111111" }),
  getCurrentProfile: async () => ({ role: "admin", approval_status: "approved" }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async () => ({ data: state.capabilities, error: null }),
  }),
}));

function query(table: string) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    is: () => builder,
    update: () => builder,
    maybeSingle: async () => ({
      data:
        table === "member_invites"
          ? state.openInvite
          : state.profileExists
            ? { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }
            : null,
      error: table === "member_invites" ? state.lookupError : null,
    }),
    insert: async (row: Record<string, unknown>) => {
      state.inserts.push(row);
      return { error: state.insertError };
    },
    then: (resolve: (value: { error: null }) => void) => resolve({ error: null }),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: query,
    auth: {
      admin: {
        inviteUserByEmail: async (email: string, options: { redirectTo: string }) => {
          state.invites.push({ email, options });
          return state.inviteResult;
        },
        deleteUser: async (id: string) => {
          state.deleted.push(id);
          return { error: null };
        },
      },
    },
    storage: {
      from: () => ({
        upload: async (path: string) => {
          state.uploads.push(path);
          return { error: null };
        },
        remove: async () => ({ error: null }),
      }),
    },
  }),
}));

import { inviteMemberAction, resendInviteAction, revokeInviteAction } from "./invite-actions";

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function inviteForm(fields: Record<string, string | File> = {}) {
  const form = new FormData();
  const values = { email: " Ana@Example.COM ", fullName: "Ana Lopez", locale: "es", ...fields };
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

function idForm() {
  const form = new FormData();
  form.set("userId", USER_ID);
  return form;
}

beforeEach(() => {
  state.capabilities = ["members.review"];
  state.openInvite = null;
  state.lookupError = null;
  state.insertError = null;
  state.profileExists = false;
  state.inviteResult = { data: { user: { id: USER_ID } }, error: null };
  state.invites = [];
  state.inserts = [];
  state.uploads = [];
  state.deleted = [];
  state.audits = [];
});

describe("inviteMemberAction", () => {
  it("refuses an admin without the members desk", async () => {
    state.capabilities = ["marketplace.manage"];
    expect(await inviteMemberAction({ ok: false }, inviteForm())).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(state.invites).toHaveLength(0);
  });

  it("rejects an invalid email", async () => {
    const result = await inviteMemberAction({ ok: false }, inviteForm({ email: "nope" }));
    expect(result).toEqual({ ok: false, error: "invalid" });
  });

  it("rejects a non-image photo before creating any account", async () => {
    const photo = new File(["hi"], "notes.txt", { type: "text/plain" });
    const result = await inviteMemberAction({ ok: false }, inviteForm({ photo }));
    expect(result).toEqual({ ok: false, error: "photoInvalid" });
    expect(state.invites).toHaveLength(0);
  });

  it("rejects a photo over the 5 MB avatar limit before creating any account", async () => {
    const photo = new File([new Uint8Array(6 * 1024 * 1024)], "big.png", { type: "image/png" });
    const result = await inviteMemberAction({ ok: false }, inviteForm({ photo }));
    expect(result).toEqual({ ok: false, error: "photoInvalid" });
    expect(state.invites).toHaveLength(0);
  });

  it("points a second invite for the same email at Resend", async () => {
    state.openInvite = { user_id: USER_ID };
    const result = await inviteMemberAction({ ok: false }, inviteForm());
    expect(result).toEqual({ ok: false, error: "alreadyInvited" });
    expect(state.invites).toHaveLength(0);
  });

  it("does not treat a failed pending-invite lookup as no invite", async () => {
    state.lookupError = { code: "08006" };
    const result = await inviteMemberAction({ ok: false }, inviteForm());
    expect(result).toEqual({ ok: false, error: "unknown" });
    expect(state.invites).toHaveLength(0);
  });

  it("keeps a concurrent invite's account when its own insert collides", async () => {
    // Re-inviting an unconfirmed user returns the same id the other request staged.
    state.insertError = { code: "23505" };
    const result = await inviteMemberAction({ ok: false }, inviteForm());
    expect(result).toEqual({ ok: false, error: "alreadyInvited" });
    expect(state.deleted).toHaveLength(0);
  });

  it("reports an existing member's email as in use", async () => {
    state.inviteResult = { data: { user: null }, error: { code: "email_exists", status: 422 } };
    const result = await inviteMemberAction({ ok: false }, inviteForm());
    expect(result).toEqual({ ok: false, error: "emailInUse" });
  });

  it("reports a mail failure without staging an invite", async () => {
    state.inviteResult = { data: { user: null }, error: { status: 500, message: "smtp" } };
    const result = await inviteMemberAction({ ok: false }, inviteForm());
    expect(result).toEqual({ ok: false, error: "sendFailed" });
    expect(state.inserts).toHaveLength(0);
  });

  it("invites, stages the invite and audits by id only", async () => {
    const photo = new File(["img"], "me.png", { type: "image/png" });
    const result = await inviteMemberAction({ ok: false }, inviteForm({ photo }));

    expect(result).toEqual({ ok: true });
    expect(state.invites[0]).toMatchObject({
      email: "ana@example.com",
      options: { redirectTo: "http://localhost:3000/es/auth/confirm" },
    });
    expect(state.uploads[0]).toMatch(new RegExp(`^${USER_ID}/.+\\.png$`));
    expect(state.inserts[0]).toMatchObject({
      user_id: USER_ID,
      email: "ana@example.com",
      display_name: "Ana Lopez",
      locale: "es",
      avatar_path: state.uploads[0],
    });
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0].action).toBe("member.invite");
    expect(JSON.stringify(state.audits[0])).not.toContain("ana@example.com");
  });
});

describe("resendInviteAction", () => {
  it("refuses once the invitee has opened the link", async () => {
    state.openInvite = {
      email: "ana@example.com",
      locale: "en",
      opened_at: "2026-11-12T10:00:00Z",
      accepted_at: null,
    };
    const result = await resendInviteAction({ ok: false }, idForm());
    expect(result).toEqual({ ok: false, error: "notResendable" });
    expect(state.invites).toHaveLength(0);
  });

  it("re-sends an unopened invite in its stored language", async () => {
    state.openInvite = {
      email: "ana@example.com",
      locale: "en",
      opened_at: null,
      accepted_at: null,
    };
    expect(await resendInviteAction({ ok: false }, idForm())).toEqual({ ok: true });
    expect(state.invites[0].options.redirectTo).toBe("http://localhost:3000/en/auth/confirm");
  });
});

describe("revokeInviteAction", () => {
  it("refuses once the persona is submitted", async () => {
    state.openInvite = { avatar_path: null, accepted_at: "2026-11-12T10:00:00Z" };
    const result = await revokeInviteAction({ ok: false }, idForm());
    expect(result).toEqual({ ok: false, error: "notRevocable" });
    expect(state.deleted).toHaveLength(0);
  });

  it("deletes an unfinished invitee's account", async () => {
    state.openInvite = { avatar_path: null, accepted_at: null };
    expect(await revokeInviteAction({ ok: false }, idForm())).toEqual({ ok: true });
    expect(state.deleted).toEqual([USER_ID]);
  });
});
