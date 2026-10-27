#!/usr/bin/env node
/**
 * Create or promote a platform admin on a deployed environment.
 *
 * Why this exists (PRD D6, CA-3): `supabase db push` never runs `seed.sql`, so a
 * fresh cloud project has no admin. The local seed hardcodes
 * `admin@globallinkup.test`; production instead uses this script.
 *
 * Admins are operators, not members, so they skip the persona funnel:
 * `--create` inserts the Supabase Auth user plus the minimal `profiles` row the
 * app needs to sign in (`postAuthPath` only checks that a profile exists), and
 * `20261026150000_admin_visibility.sql` keeps that profile out of every
 * people-facing surface.
 *
 * Promotion needs the service role key: the `profiles_protect_privileges`
 * trigger rejects `role`/`approval_status` changes from any request that carries
 * a user JWT (supabase/migrations/20261016000000_initial_schema.sql).
 *
 * Usage:
 *   npm run admin:bootstrap -- --create --display-name="GlobalLinkup Admin"
 *   npm run admin:bootstrap -- --create --email=ops@example.com --password=…
 *   npm run admin:bootstrap                      # promote an existing account
 *   npm run admin:bootstrap -- --dry-run
 *   npm run admin:bootstrap -- --allow-local
 *
 * Exit codes: 0 done or already admin · 1 account/profile missing · 2 bad config.
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;
const DEFAULT_DISPLAY_NAME = "GlobalLinkup Admin";
const MIN_PASSWORD_LENGTH = 8;

const PROFILE_COLUMNS = "id, display_name, role, approval_status";

function printUsage() {
  console.log(`Create or promote a platform admin.

Usage: npm run admin:bootstrap -- [options]

Options:
  --create               Create the Supabase Auth user and a minimal profile
                         when they do not exist yet (skips the persona funnel).
  --display-name=<name>  Display name for a created profile.
                         Default: "${DEFAULT_DISPLAY_NAME}".
  --password=<secret>    Password for a created account. When the account
                         already exists this resets it. Omit to generate one.
  --role=<slug>          Admin role to assign (default: owner). Create roles in
                         the database first; unknown slugs are rejected.
  --email=<address>      Target account. Default: ADMIN_EMAIL.
  --dry-run              Print the plan without writing anything.
  --allow-local          Allow a local Supabase URL (127.0.0.1 / localhost).
  -h, --help             Show this message.

Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
environment (loaded from .env by the npm script).`);
}

function fail(message, code = 2) {
  console.error(`\nError: ${message}\n`);
  process.exit(code);
}

/** Decode a legacy Supabase JWT payload. Returns null for non-JWT keys. */
function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function resolveUrl(rawUrl) {
  if (!rawUrl) {
    fail("NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env (see .env.example).");
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    fail(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${rawUrl}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail(`NEXT_PUBLIC_SUPABASE_URL must use http or https: ${rawUrl}`);
  }
  return url;
}

function assertServiceKey(serviceKey, url, allowLocal) {
  if (!serviceKey) {
    fail("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env (see .env.example).");
  }

  const claims = decodeJwtPayload(serviceKey);

  if (claims) {
    if (claims.role !== "service_role") {
      fail(
        `SUPABASE_SERVICE_ROLE_KEY carries role "${claims.role}", expected "service_role". ` +
          "Use the service role key, not the anon/publishable key.",
      );
    }
    if (
      claims.ref &&
      url.hostname.endsWith(".supabase.co") &&
      url.hostname !== `${claims.ref}.supabase.co`
    ) {
      fail(`URL ${url.hostname} does not belong to the key's project (${claims.ref}).`);
    }
  } else if (serviceKey.startsWith("sb_publishable_")) {
    fail(
      "SUPABASE_SERVICE_ROLE_KEY holds a publishable key. Use the secret/service " +
        "role key — account creation and promotion are rejected for anything else.",
    );
  }

  if (LOCAL_HOSTS.has(url.hostname) && !allowLocal) {
    fail(
      `Refusing to touch a local database (${url.origin}). The local seed already ` +
        "creates admin@globallinkup.test; pass --allow-local if you really mean it.",
    );
  }
}

function generatePassword() {
  return randomBytes(18).toString("base64url");
}

async function findUserByEmail(supabase, email) {
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) {
      fail(`could not list auth users: ${error.message}`);
    }
    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (users.length < PAGE_SIZE) return null;
  }
  fail(`searched ${MAX_PAGES * PAGE_SIZE} users without finding ${email}.`, 2);
}

async function readProfile(supabase, id) {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    fail(`could not read the profile row: ${error.message}`);
  }
  return data;
}

async function insertProfile(supabase, { id, displayName }) {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id,
      display_name: displayName,
      role: "admin",
      approval_status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    fail(`could not create the profile row: ${error.message}`);
  }
  return data;
}

async function promoteProfile(supabase, id) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: "admin",
      approval_status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    fail(`promotion failed: ${error.message}`);
  }
  return data;
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      role: { type: "string" },
      create: { type: "boolean", default: false },
      "display-name": { type: "string" },
      password: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      "allow-local": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const email = (values.email ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  if (!email) {
    fail("no email given. Set ADMIN_EMAIL in .env or pass --email=<address>.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    fail(`"${email}" is not a valid email address.`);
  }
  if (values.password && values.password.length < MIN_PASSWORD_LENGTH) {
    fail(`--password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  const roleSlug = (values.role ?? "owner").trim();
  const displayName = (values["display-name"] ?? DEFAULT_DISPLAY_NAME).trim();
  if (values.create && !displayName) {
    fail("--display-name cannot be empty.");
  }

  const url = resolveUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  assertServiceKey(serviceKey, url, values["allow-local"]);

  const supabase = createClient(url.origin, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const authUser = await findUserByEmail(supabase, email);
  let profile = authUser ? await readProfile(supabase, authUser.id) : null;

  if (!authUser && !values.create) {
    fail(
      `no Supabase Auth user with email ${email}. Re-run with --create to make an ` +
        "admin account, or register through the persona funnel first.",
      1,
    );
  }
  if (authUser && !profile && !values.create) {
    fail(
      `auth user ${email} exists but has no profiles row. Re-run with --create to ` +
        "create the minimal admin profile.",
      1,
    );
  }

  const alreadyAdmin = profile?.role === "admin" && profile.approval_status === "approved";
  const willCreateUser = !authUser;
  const willCreateProfile = Boolean(authUser) && !profile;
  const willPromote = Boolean(profile) && !alreadyAdmin;
  const willResetPassword = Boolean(authUser) && Boolean(values.password);

  const steps = [];
  if (willCreateUser) steps.push(`create auth user (${displayName}) and admin profile`);
  if (willCreateProfile) steps.push(`create admin profile (${displayName})`);
  if (willPromote) steps.push("promote profile to admin / approved");
  if (willResetPassword) steps.push("reset password");

  console.log("Bootstrap admin");
  console.log(`  project : ${url.origin}`);
  console.log(`  email   : ${email}`);
  if (profile) console.log(`  profile : ${profile.display_name} (${profile.id})`);
  if (alreadyAdmin && !willResetPassword) {
    console.log("  status  : already admin / approved — nothing to do.");
    return;
  }
  if (steps.length === 0) {
    console.log("  status  : nothing to do.");
    return;
  }
  console.log(`  actions : ${steps.join("; ")}`);

  console.log(`  role    : ${roleSlug}`);

  if (values["dry-run"]) {
    console.log("  dry run : nothing was written.");
    return;
  }

  const { data: roleRow } = await supabase
    .from("admin_roles")
    .select("id, slug")
    .eq("slug", roleSlug)
    .maybeSingle();

  if (!roleRow) {
    fail(
      `unknown admin role "${roleSlug}". Create it in the admin UI or the database ` +
        "first, then re-run.",
      2,
    );
  }

  let password = null;
  let generatedPassword = false;

  if (willCreateUser) {
    generatedPassword = !values.password;
    password = values.password ?? generatePassword();
    const created = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      fail(`could not create the auth user: ${created.error?.message ?? "unknown error"}`);
    }
    profile = await insertProfile(supabase, { id: created.data.user.id, displayName });
  } else if (willCreateProfile) {
    profile = await insertProfile(supabase, { id: authUser.id, displayName });
  } else if (willPromote) {
    profile = await promoteProfile(supabase, authUser.id);
  }

  if (willResetPassword && authUser) {
    const updated = await supabase.auth.admin.updateUserById(authUser.id, {
      password: values.password,
    });
    if (updated.error) {
      fail(`could not reset the password: ${updated.error.message}`);
    }
  }

  if (profile.admin_role_id !== roleRow.id) {
    const { error: roleError } = await supabase
      .from("profiles")
      .update({ admin_role_id: roleRow.id })
      .eq("id", profile.id);

    if (roleError) fail(`could not assign the role: ${roleError.message}`);
  }

  console.log(
    `\n${profile.display_name} <${email}> is now ${profile.role} / ${profile.approval_status} (${roleRow.slug}).`,
  );
  if (generatedPassword && password) {
    console.log(`\nGenerated password (shown once): ${password}`);
    console.log("Sign in, then change it from the account settings.");
  }
  console.log("Sign in again so the role reaches the client.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
