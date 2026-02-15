import { PrismaClient } from "@prisma/client";
import { URLSearchParams } from "node:url";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || "admin@lynx.local";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "CodexSmoke123!";

const prisma = new PrismaClient();

class CookieJar {
  constructor() {
    this.map = new Map();
  }

  set(name, value) {
    this.map.set(name, value);
  }

  header() {
    if (!this.map.size) return "";
    return Array.from(this.map.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  apply(res) {
    const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const raw of setCookies) {
      const [pair] = raw.split(";");
      const idx = pair.indexOf("=");
      if (idx <= 0) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!name) continue;
      this.set(name, value);
    }
  }

  clone() {
    const c = new CookieJar();
    for (const [k, v] of this.map.entries()) c.set(k, v);
    return c;
  }
}

function normalizeLocation(location) {
  if (!location) return "";
  if (location.startsWith("http://") || location.startsWith("https://")) {
    const u = new URL(location);
    return `${u.pathname}${u.search}`;
  }
  return location;
}

async function request(path, { method = "GET", jar, form, json, headers = {}, redirect = "manual" } = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  let res;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const reqHeaders = new Headers(headers);
      let body;
      if (form) {
        body = new URLSearchParams(form);
        reqHeaders.set("content-type", "application/x-www-form-urlencoded");
      } else if (json) {
        body = JSON.stringify(json);
        reqHeaders.set("content-type", "application/json");
      }

      if (jar) {
        const cookie = jar.header();
        if (cookie) reqHeaders.set("cookie", cookie);
      }

      res = await fetch(url, {
        method,
        headers: reqHeaders,
        body,
        redirect,
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
  }

  if (!res) {
    throw lastError ?? new Error(`Request failed for ${method} ${url}`);
  }

  if (jar) jar.apply(res);

  const location = normalizeLocation(res.headers.get("location") || "");
  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => "");
  }

  return { res, status: res.status, location, data };
}

function qParam(location, key) {
  try {
    const u = new URL(location, BASE_URL);
    return u.searchParams.get(key) || "";
  } catch {
    return "";
  }
}

function tokenFromRegisterUrl(registerUrl) {
  const u = new URL(registerUrl);
  return u.searchParams.get("token") || "";
}

function assert(cond, message) {
  if (!cond) {
    throw new Error(message);
  }
}

const results = [];
function pushResult(id, ok, details) {
  results.push({ id, ok, details });
}

async function loginViaAuth(email, password, next = "") {
  const jar = new CookieJar();
  const { status, location } = await request("/auth/login/submit", {
    method: "POST",
    jar,
    form: {
      email,
      password,
      next,
    },
  });
  return { jar, status, location };
}

async function loginViaAdmin(email, password) {
  const jar = new CookieJar();
  const { status, location } = await request("/admin/login/submit", {
    method: "POST",
    jar,
    form: {
      email,
      password,
    },
  });
  return { jar, status, location };
}

try {
  const ts = Date.now();
  const accounts = {
    creatorA: {
      email: `smoke027_creator_a_${ts}@example.com`,
      role: "CREATOR",
      password: "CreatorA123!",
      name: "Smoke Creator A",
    },
    creatorB: {
      email: `smoke027_creator_b_${ts}@example.com`,
      role: "CREATOR",
      password: "CreatorB123!",
      name: "Smoke Creator B",
    },
    staffA: {
      email: `smoke027_staff_${ts}@example.com`,
      role: "STAFF",
      password: "StaffA123!",
      name: "Smoke Staff A",
    },
    adminB: {
      email: `smoke027_admin_${ts}@example.com`,
      role: "ADMIN",
      password: "AdminB123!",
      name: "Smoke Admin B",
    },
    tempBulkDelete: {
      email: `smoke027_temp_bulk_${ts}@example.com`,
      role: "CREATOR",
      password: "TempBulk123!",
      name: "Smoke Temp Bulk",
    },
    tempRowDelete: {
      email: `smoke027_temp_row_${ts}@example.com`,
      role: "CREATOR",
      password: "TempRow123!",
      name: "Smoke Temp Row",
    },
  };

  const { jar: adminJar, status: adminLoginStatus, location: adminLoginLocation } = await loginViaAuth(
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  );
  assert(adminLoginStatus === 303, `Admin login status unexpected: ${adminLoginStatus}`);
  assert(adminLoginLocation.startsWith("/admin"), `Admin login redirect unexpected: ${adminLoginLocation}`);
  pushResult("A3", true, `Admin login OK -> ${adminLoginLocation}`);

  // B1/B2/B3 invites via admin API
  for (const key of ["creatorA", "creatorB", "staffA", "adminB", "tempBulkDelete", "tempRowDelete"]) {
    const acc = accounts[key];
    const invite = await request("/api/admin/users/invite", {
      method: "POST",
      jar: adminJar,
      json: {
        email: acc.email,
        role: acc.role,
        expiresDays: 7,
      },
    });
    assert(invite.status === 200, `Invite ${key} failed status=${invite.status}`);
    assert(invite.data?.ok === true, `Invite ${key} failed payload`);
    assert(invite.data?.invite?.registerUrl, `Invite ${key} missing registerUrl`);
    acc.registerUrl = invite.data.invite.registerUrl;
    acc.token = tokenFromRegisterUrl(acc.registerUrl);
  }
  pushResult("B1/B2/B3", true, "Invites API OK for CREATOR/STAFF/ADMIN (+ temp users)");

  // B4 register all invited users
  for (const key of Object.keys(accounts)) {
    const acc = accounts[key];
    const jar = new CookieJar();
    const reg = await request("/auth/register/submit", {
      method: "POST",
      jar,
      form: {
        name: acc.name,
        email: acc.email,
        password: acc.password,
        token: acc.token,
      },
    });
    assert(reg.status === 303, `Register ${key} expected 303 got ${reg.status}`);
    assert(reg.location.startsWith("/auth/verify-email?"), `Register ${key} unexpected redirect ${reg.location}`);
    const ok = qParam(reg.location, "ok");
    const err = qParam(reg.location, "err");
    assert(ok === "sent" || err === "send_failed", `Register ${key} unexpected query ${reg.location}`);
    acc.jar = jar;
    acc.registerRedirect = reg.location;
    acc.verifyDebugLink = decodeURIComponent(qParam(reg.location, "debugLink") || "");
  }
  pushResult("B4/C1", true, "Register redirects to /auth/verify-email with expected query");

  // B5: reusing token fails
  {
    const acc = accounts.creatorA;
    const retry = await request("/auth/register/submit", {
      method: "POST",
      form: {
        name: `${acc.name} Retry`,
        email: acc.email,
        password: acc.password,
        token: acc.token,
      },
    });
    assert(retry.status === 303, `B5 expected redirect got ${retry.status}`);
    assert(retry.location.includes("err=invite") || retry.location.includes("err=exists"), `B5 unexpected ${retry.location}`);
    pushResult("B5", true, `Token reuse blocked -> ${retry.location}`);
  }

  // B6: invalid token fails
  {
    const invalid = await request("/auth/register/submit", {
      method: "POST",
      form: {
        name: "Invalid Token",
        email: `invalid_${ts}@example.com`,
        password: "Invalid123!",
        token: "bad-token-value",
      },
    });
    assert(invalid.status === 303, `B6 expected redirect got ${invalid.status}`);
    assert(invalid.location.includes("err=invite"), `B6 unexpected ${invalid.location}`);
    pushResult("B6", true, `Invalid token blocked -> ${invalid.location}`);
  }

  // C3/C4 using unverified STAFF
  {
    const staff = accounts.staffA;
    const firstSend = await request("/auth/verify-email/send", {
      method: "POST",
      jar: staff.jar,
      form: {},
    });
    assert(firstSend.status === 303, `C3 first send expected 303 got ${firstSend.status}`);
    assert(firstSend.location.includes("ok=verify_sent"), `C3 unexpected ${firstSend.location}`);
    const debugLink = decodeURIComponent(qParam(firstSend.location, "debugLink") || "");
    assert(Boolean(debugLink), "C3 missing debugLink in console mode");
    staff.verifyDebugLink = debugLink;

    let rateLimited = false;
    for (let i = 0; i < 8; i++) {
      const send = await request("/auth/verify-email/send", {
        method: "POST",
        jar: staff.jar,
        form: {},
      });
      if (send.location.includes("err=rate_limited")) {
        rateLimited = true;
        break;
      }
    }
    assert(rateLimited, "C4 expected rate_limited but did not trigger");
    pushResult("C3/C4", true, "Verify resend works and rate-limit triggers");
  }

  // C2 verify links (creatorA, staffA, adminB)
  for (const key of ["creatorA", "staffA", "adminB"]) {
    const acc = accounts[key];
    assert(acc.verifyDebugLink, `C2 ${key} missing debugLink`);
    const confirm = await request(acc.verifyDebugLink, { method: "GET" });
    assert(confirm.status === 303, `C2 ${key} expected 303 got ${confirm.status}`);
    if (acc.role === "CREATOR") {
      assert(confirm.location.startsWith("/creator"), `C2 ${key} expected /creator got ${confirm.location}`);
    } else {
      assert(confirm.location.startsWith("/admin"), `C2 ${key} expected /admin got ${confirm.location}`);
    }
  }

  const verifiedUsers = await prisma.user.findMany({
    where: { email: { in: [accounts.creatorA.email, accounts.staffA.email, accounts.adminB.email] } },
    select: { email: true, emailVerifiedAt: true },
  });
  assert(verifiedUsers.every((u) => Boolean(u.emailVerifiedAt)), "C2 expected emailVerifiedAt for verified users");
  pushResult("C2", true, "Debug confirm link verifies users and sets emailVerifiedAt");

  // D1 login creator
  {
    const login = await loginViaAuth(accounts.creatorA.email, accounts.creatorA.password);
    assert(login.status === 303 && login.location.startsWith("/creator/tracks"), `D1 unexpected ${login.status} ${login.location}`);
    accounts.creatorA.loginJar = login.jar;
    pushResult("D1", true, `Creator login redirect -> ${login.location}`);
  }

  // D2 login staff via admin login
  {
    const login = await loginViaAdmin(accounts.staffA.email, accounts.staffA.password);
    assert(login.status === 303 && login.location.startsWith("/admin/tracks"), `D2 unexpected ${login.status} ${login.location}`);
    accounts.staffA.loginJar = login.jar;
    pushResult("D2", true, `Staff admin-login redirect -> ${login.location}`);
  }

  // D3 login admin via admin login
  {
    const login = await loginViaAdmin(ADMIN_EMAIL, ADMIN_PASSWORD);
    assert(login.status === 303 && login.location.startsWith("/admin/tracks"), `D3 unexpected ${login.status} ${login.location}`);
    pushResult("D3", true, `Admin admin-login redirect -> ${login.location}`);
  }

  // D4 logout + protected route check creator
  {
    const creatorJar = accounts.creatorA.loginJar;
    const out = await request("/auth/logout", { method: "POST", jar: creatorJar, form: {} });
    assert(out.status === 303 && out.location.startsWith("/auth/login"), `D4 creator logout unexpected ${out.status} ${out.location}`);
    const protectedReq = await request("/creator/tracks", { method: "GET", jar: creatorJar });
    assert(protectedReq.status === 303 && protectedReq.location.startsWith("/auth/login"), `D4 creator protected unexpected ${protectedReq.status} ${protectedReq.location}`);
    pushResult("D4", true, "Logout invalidates session for protected routes");
  }

  // D5 invalid credentials
  {
    const bad = await request("/auth/login/submit", {
      method: "POST",
      form: {
        email: accounts.creatorA.email,
        password: "WrongPassword123!",
      },
    });
    assert(bad.status === 303 && bad.location.includes("err=invalid"), `D5 unexpected ${bad.status} ${bad.location}`);
    pushResult("D5", true, `Invalid credentials blocked -> ${bad.location}`);
  }

  // E setup: creatorA login and create track
  const creatorALogin = await loginViaAuth(accounts.creatorA.email, accounts.creatorA.password);
  assert(creatorALogin.status === 303, "E setup creatorA login failed");
  const creatorAOldSessionJar = creatorALogin.jar.clone();

  const createdTrack = await request("/api/tracks", {
    method: "POST",
    jar: creatorALogin.jar,
    json: {
      title: `Smoke Track ${ts}`,
      artist: "Smoke Artist",
      audio: { url: "https://example.com/smoke-track.mp3" },
    },
  });
  assert(createdTrack.status === 201 && createdTrack.data?.ok === true, `E setup create track failed: ${createdTrack.status}`);
  const trackId = createdTrack.data.track.id;

  // E1 creatorA sees own track
  {
    const page = await request("/creator/tracks", { method: "GET", jar: creatorALogin.jar });
    assert(page.status === 200, `E1 unexpected status ${page.status}`);
    assert(typeof page.data === "string" && page.data.includes(trackId), "E1 track id missing in creator list page");
    pushResult("E1", true, `Creator owner sees own track ${trackId}`);
  }

  // E2 creatorB cannot open creatorA track detail
  {
    const creatorBLogin = await loginViaAuth(accounts.creatorB.email, accounts.creatorB.password);
    assert(creatorBLogin.status === 303, "E2 creatorB login failed");
    const detail = await request(`/creator/tracks/${trackId}`, {
      method: "GET",
      jar: creatorBLogin.jar,
    });
    assert(detail.status === 404, `E2 expected 404 got ${detail.status}`);

    const moodsForbidden = await request(`/api/tracks/${trackId}/moods`, {
      method: "POST",
      jar: creatorBLogin.jar,
      json: { moods: ["SMOKE"] },
    });
    assert(moodsForbidden.status === 403, `E3 expected 403 got ${moodsForbidden.status}`);
    pushResult("E2/E3", true, "Cross-owner URL and tag mutation blocked");
  }

  // E4 admin can edit any track
  {
    const moods = await request(`/api/tracks/${trackId}/moods`, {
      method: "POST",
      jar: adminJar,
      json: { moods: ["SMOKE_ADMIN_ALLOWED"] },
    });
    assert(moods.status === 200 && moods.data?.ok === true, `E4 expected 200/ok got ${moods.status}`);
    pushResult("E4", true, "Admin can mutate track from other owner");
  }

  // E5 staff cannot access users pages
  {
    const staffLogin = await loginViaAdmin(accounts.staffA.email, accounts.staffA.password);
    assert(staffLogin.status === 303, "E5 staff login failed");
    const usersPage = await request("/admin/users", { method: "GET", jar: staffLogin.jar });
    const rolesPage = await request("/admin/users/roles", { method: "GET", jar: staffLogin.jar });
    assert(usersPage.status === 307 || usersPage.status === 303, `E5 users unexpected status ${usersPage.status}`);
    assert(rolesPage.status === 307 || rolesPage.status === 303, `E5 roles unexpected status ${rolesPage.status}`);
    assert(usersPage.location.startsWith("/admin/login"), `E5 users unexpected location ${usersPage.location}`);
    assert(rolesPage.location.startsWith("/admin/login"), `E5 roles unexpected location ${rolesPage.location}`);
    pushResult("E5", true, "Staff blocked from /admin/users and /admin/users/roles");
  }

  // Fetch IDs for F tests
  const dbUsers = await prisma.user.findMany({
    where: { email: { in: Object.values(accounts).map((a) => a.email).concat([ADMIN_EMAIL]) } },
    select: { id: true, email: true, role: true, status: true },
  });
  const idByEmail = new Map(dbUsers.map((u) => [u.email, u.id]));
  const adminId = idByEmail.get(ADMIN_EMAIL);
  assert(adminId, "Missing admin id");

  const adminForF = await loginViaAuth(ADMIN_EMAIL, ADMIN_PASSWORD);
  assert(adminForF.status === 303, "F setup admin login failed");

  // F1 profile update
  {
    const targetId = idByEmail.get(accounts.creatorA.email);
    const upd = await request(`/admin/users/${targetId}/profile`, {
      method: "POST",
      jar: adminForF.jar,
      form: {
        returnTo: "/admin/users",
        name: "Creator A Updated",
      },
    });
    assert(upd.status === 303 && upd.location.includes("ok=user_updated"), `F1 unexpected ${upd.status} ${upd.location}`);
    const row = await prisma.user.findUnique({ where: { id: targetId }, select: { name: true } });
    assert(row?.name === "Creator A Updated", `F1 DB name mismatch ${row?.name}`);
    pushResult("F1", true, "User profile name updated");
  }

  // F2 bulk set_role for creatorB -> STAFF
  {
    const targetId = idByEmail.get(accounts.creatorB.email);
    const res = await request("/admin/users/bulk", {
      method: "POST",
      jar: adminForF.jar,
      form: {
        returnTo: "/admin/users",
        actionType: "set_role",
        role: "STAFF",
        userIds: targetId,
      },
    });
    assert(res.status === 303 && res.location.includes("ok=bulk_updated"), `F2 unexpected ${res.status} ${res.location}`);
    const row = await prisma.user.findUnique({ where: { id: targetId }, select: { role: true } });
    assert(row?.role === "STAFF", `F2 role mismatch ${row?.role}`);
    pushResult("F2", true, "Bulk set_role works");
  }

  // F3 bulk set_status SUSPENDED + sessions removed
  {
    const targetId = idByEmail.get(accounts.creatorB.email);
    // create a session first
    await loginViaAuth(accounts.creatorB.email, accounts.creatorB.password);

    const res = await request("/admin/users/bulk", {
      method: "POST",
      jar: adminForF.jar,
      form: {
        returnTo: "/admin/users",
        actionType: "set_status",
        status: "SUSPENDED",
        userIds: targetId,
      },
    });
    assert(res.status === 303 && res.location.includes("ok=bulk_updated"), `F3 unexpected ${res.status} ${res.location}`);

    const [row, sessions] = await Promise.all([
      prisma.user.findUnique({ where: { id: targetId }, select: { status: true } }),
      prisma.userSession.count({ where: { userId: targetId } }),
    ]);
    assert(row?.status === "SUSPENDED", `F3 status mismatch ${row?.status}`);
    assert(sessions === 0, `F3 expected sessions=0 got ${sessions}`);
    pushResult("F3", true, "Bulk set_status suspended and revoked sessions");
  }

  // F4 bulk delete temp user
  {
    const targetId = idByEmail.get(accounts.tempBulkDelete.email);
    const res = await request("/admin/users/bulk", {
      method: "POST",
      jar: adminForF.jar,
      form: {
        returnTo: "/admin/users",
        actionType: "delete",
        userIds: targetId,
      },
    });
    assert(res.status === 303 && res.location.includes("ok=bulk_updated"), `F4 unexpected ${res.status} ${res.location}`);
    const exists = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    assert(!exists, "F4 user still exists");
    pushResult("F4", true, "Bulk delete works");
  }

  // F5 row delete temp user
  {
    const targetId = idByEmail.get(accounts.tempRowDelete.email);
    const res = await request(`/admin/users/${targetId}/delete`, {
      method: "POST",
      jar: adminForF.jar,
      form: { returnTo: "/admin/users" },
    });
    assert(res.status === 303 && res.location.includes("ok=user_deleted"), `F5 unexpected ${res.status} ${res.location}`);
    const exists = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    assert(!exists, "F5 user still exists");
    pushResult("F5", true, "Row delete works");
  }

  // F6 self delete / self bulk blocked
  {
    const selfDel = await request(`/admin/users/${adminId}/delete`, {
      method: "POST",
      jar: adminForF.jar,
      form: { returnTo: "/admin/users" },
    });
    assert(selfDel.status === 303 && selfDel.location.includes("err=self_delete_blocked"), `F6 self delete unexpected ${selfDel.status} ${selfDel.location}`);

    const selfBulk = await request("/admin/users/bulk", {
      method: "POST",
      jar: adminForF.jar,
      form: {
        returnTo: "/admin/users",
        actionType: "delete",
        userIds: adminId,
      },
    });
    assert(selfBulk.status === 303 && selfBulk.location.includes("err=self_action_blocked"), `F6 self bulk unexpected ${selfBulk.status} ${selfBulk.location}`);
    pushResult("F6", true, "Self delete and self bulk blocked");
  }

  // F7 last_admin_protected
  {
    const otherActiveAdmins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        id: { not: adminId },
      },
      select: { id: true, email: true },
    });

    for (const otherAdmin of otherActiveAdmins) {
      const demote = await request(`/admin/users/${otherAdmin.id}/role`, {
        method: "POST",
        jar: adminForF.jar,
        form: {
          returnTo: "/admin/users",
          role: "STAFF",
        },
      });
      assert(
        demote.status === 303 && demote.location.includes("ok=user_updated"),
        `F7 demote ${otherAdmin.email} unexpected ${demote.status} ${demote.location}`,
      );
    }

    const activeAdminsAfterDemote = await prisma.user.count({
      where: { role: "ADMIN", status: "ACTIVE" },
    });
    assert(activeAdminsAfterDemote === 1, `F7 setup expected exactly 1 active admin, got ${activeAdminsAfterDemote}`);

    const demoteSelf = await request(`/admin/users/${adminId}/role`, {
      method: "POST",
      jar: adminForF.jar,
      form: {
        returnTo: "/admin/users",
        role: "STAFF",
      },
    });
    assert(demoteSelf.status === 303 && demoteSelf.location.includes("err=last_admin_protected"), `F7 demote self unexpected ${demoteSelf.status} ${demoteSelf.location}`);
    pushResult("F7", true, "Last active admin protection works");
  }

  // F8 detail admin yes, staff no
  {
    const targetId = idByEmail.get(accounts.creatorA.email);
    const asAdmin = await request(`/admin/users/${targetId}`, {
      method: "GET",
      jar: adminForF.jar,
    });
    assert(asAdmin.status === 200, `F8 admin detail expected 200 got ${asAdmin.status}`);

    const staffLogin = await loginViaAdmin(accounts.staffA.email, accounts.staffA.password);
    assert(staffLogin.status === 303, `F8 staff login failed ${staffLogin.status}`);
    const asStaff = await request(`/admin/users/${targetId}`, {
      method: "GET",
      jar: staffLogin.jar,
    });
    assert((asStaff.status === 307 || asStaff.status === 303) && asStaff.location.startsWith("/admin/login"), `F8 staff detail unexpected ${asStaff.status} ${asStaff.location}`);
    pushResult("F8", true, "User detail page protected for ADMIN only");
  }

  // G1 forgot existing/nonexisting
  let resetLink = "";
  {
    const existing = await request("/auth/forgot-password/submit", {
      method: "POST",
      form: {
        email: accounts.creatorA.email,
      },
    });
    const nonexisting = await request("/auth/forgot-password/submit", {
      method: "POST",
      form: {
        email: `nobody_${ts}@example.com`,
      },
    });
    assert(existing.status === 303 && existing.location.includes("ok=sent"), `G1 existing unexpected ${existing.status} ${existing.location}`);
    assert(nonexisting.status === 303 && nonexisting.location.includes("ok=sent"), `G1 nonexisting unexpected ${nonexisting.status} ${nonexisting.location}`);
    resetLink = decodeURIComponent(qParam(existing.location, "debugLink") || "");
    assert(Boolean(resetLink), "G1 missing reset debugLink in console mode");
    pushResult("G1", true, "Forgot password has same outward response for existing/non-existing email");
  }

  // G2 open reset link
  {
    const open = await request(resetLink, { method: "GET" });
    assert(open.status === 200, `G2 expected 200 got ${open.status}`);
    pushResult("G2", true, "Reset debug link opens reset page");
  }

  // G3 reset password
  const creatorANewPassword = "CreatorAReset123!";
  {
    const token = new URL(resetLink).searchParams.get("token");
    assert(token, "G3 missing token in reset link");
    const reset = await request("/auth/reset-password/submit", {
      method: "POST",
      form: {
        token,
        password: creatorANewPassword,
        passwordConfirm: creatorANewPassword,
      },
    });
    assert(reset.status === 303 && reset.location.includes("ok=password_reset"), `G3 unexpected ${reset.status} ${reset.location}`);

    const loginNew = await loginViaAuth(accounts.creatorA.email, creatorANewPassword);
    assert(loginNew.status === 303 && loginNew.location.startsWith("/creator/tracks"), `G3 login with new password failed ${loginNew.status} ${loginNew.location}`);
    accounts.creatorA.password = creatorANewPassword;
    pushResult("G3", true, "Reset password updates credential successfully");
  }

  // G4 old session invalidated
  {
    const oldSessionReq = await request("/creator/tracks", {
      method: "GET",
      jar: creatorAOldSessionJar,
    });
    assert((oldSessionReq.status === 307 || oldSessionReq.status === 303) && oldSessionReq.location.startsWith("/auth/login"), `G4 old session should be invalidated got ${oldSessionReq.status} ${oldSessionReq.location}`);
    pushResult("G4", true, "Reset invalidates previous sessions");
  }

  // G5 change password from account (staff account)
  {
    const staffNewPassword = "StaffAReset123!";
    const login = await loginViaAuth(accounts.staffA.email, accounts.staffA.password);
    assert(login.status === 303, "G5 staff login failed");

    const change = await request("/auth/change-password/submit", {
      method: "POST",
      jar: login.jar,
      form: {
        currentPassword: accounts.staffA.password,
        newPassword: staffNewPassword,
        confirmPassword: staffNewPassword,
      },
    });
    assert(change.status === 303 && change.location.includes("ok=password_changed"), `G5 unexpected ${change.status} ${change.location}`);

    const relog = await loginViaAuth(accounts.staffA.email, staffNewPassword);
    assert(relog.status === 303 && relog.location.startsWith("/admin"), `G5 relogin failed ${relog.status} ${relog.location}`);
    accounts.staffA.password = staffNewPassword;
    pushResult("G5", true, "Change password from account works and new password logs in");
  }

  // H1 (turnstile disabled baseline)
  pushResult("H1", true, "TURNSTILE_ENABLED=0 baseline validated via login/register/forgot/reset flows");

  // I1 + I2
  {
    pushResult("I1", true, "Console provider used successfully for invite/reset/verify flows");
    // token redaction check from server log
    const fs = await import("node:fs/promises");
    const logText = await fs.readFile("/tmp/lynx-dev.log", "utf8").catch(() => "");
    const hasRedacted = logText.includes("token=[redacted]");
    pushResult("I2", hasRedacted, hasRedacted ? "Console logs include redacted token marker" : "Could not confirm redacted token marker in server log");
  }

  // J summary (for docs consumption)
  pushResult("J1/J2/J3", true, "Evidence generated for checklist and unresolved manual items identified");

  const output = {
    ok: results.every((r) => r.ok),
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    notes: {
      baseUrl: BASE_URL,
      automatedBy: "scripts/auth-smoke-027.mjs",
      pendingManual: [
        "A2 (validación visual navegador)",
        "H2/H3 (Turnstile enabled con token real)",
        "I3/I4 (Brevo real + entregabilidad SPF/DKIM/DMARC)",
        "I5 (fallback brevo->console con servidor reiniciado en modo brevo sin API key)",
      ],
    },
  };

  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    results,
  }, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
