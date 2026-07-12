// One-off admin tool: uses the service_role key (from .env.local, never
// committed) to bypass RLS directly via the Supabase JS client — no SQL
// Editor / browser automation needed.
//
// Usage:
//   node scripts/admin-users.mjs list    — show every account and its role
//   node scripts/admin-users.mjs reset   — delete all clients + every
//                                           non-manager auth account
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const url = process.env.VITE_SUPABASE_URL || readFileSync(new URL("../.env", import.meta.url), "utf8").match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local"); process.exit(1); }

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function loadState() {
  const { data: studios, error: e1 } = await admin.from("studios").select("id, name, slug, owner_id");
  if (e1) throw e1;
  const { data: clients, error: e2 } = await admin.from("clients").select("id, name, phone, email, auth_user_id, studio_id");
  if (e2) throw e2;
  const { data: usersPage, error: e3 } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (e3) throw e3;
  const users = usersPage.users;

  const managerIds = new Set(studios.map((s) => s.owner_id));
  const clientByAuthId = new Map(clients.map((c) => [c.auth_user_id, c]));
  const studioById = new Map(studios.map((s) => [s.id, s]));

  const rows = users.map((u) => {
    const studio = studios.find((s) => s.owner_id === u.id);
    const client = clientByAuthId.get(u.id);
    const role = studio ? "manager" : client ? "client" : "orphaned";
    return {
      id: u.id, email: u.email, role,
      studio: studio?.name || (client ? studioById.get(client.studio_id)?.name : null),
      client_name: client?.name || null, client_phone: client?.phone || null,
      created_at: u.created_at,
    };
  });
  return { studios, clients, users, rows, managerIds };
}

const cmd = process.argv[2];

if (cmd === "list") {
  const { rows } = await loadState();
  rows.sort((a, b) => a.role.localeCompare(b.role) || a.created_at.localeCompare(b.created_at));
  console.table(rows.map(({ id, ...rest }) => rest));
  const counts = rows.reduce((acc, r) => { acc[r.role] = (acc[r.role] || 0) + 1; return acc; }, {});
  console.log("Totals:", counts);
} else if (cmd === "reset") {
  const { clients, users, managerIds } = await loadState();
  console.log(`About to delete ${clients.length} client row(s) and ${users.length - managerIds.size} non-manager auth account(s).`);
  console.log(`Keeping exactly ${managerIds.size} manager account(s):`, [...managerIds]);

  if (clients.length) {
    const ids = clients.map((c) => c.id);
    // Live FK constraints aren't all ON DELETE CASCADE (some tables were
    // altered after schema.sql was written) — clear every table that
    // references clients.id first so the delete below doesn't get blocked.
    for (const [table, column] of [
      ["appointments", "client_id"], ["gallery_likes", "client_id"],
      ["notifications", "client_id"], ["standing_requests", "client_id"],
      ["gallery", "client_id"], ["invoices", "client_id"],
    ]) {
      const { error } = await admin.from(table).delete().in(column, ids);
      if (error && error.code !== "42P01") console.error(`  (cleanup ${table}: ${error.message})`);
    }
    const { error } = await admin.from("clients").delete().in("id", ids);
    if (error) throw error;
    console.log(`Deleted ${clients.length} client row(s).`);
  }

  const toDelete = users.filter((u) => !managerIds.has(u.id));
  for (const u of toDelete) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`Failed to delete ${u.email || u.id}:`, error.message);
    else console.log(`Deleted auth account: ${u.email || u.id}`);
  }
  console.log("Reset complete.");
} else {
  console.log("Usage: node scripts/admin-users.mjs list|reset");
}
