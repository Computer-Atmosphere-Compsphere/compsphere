/**
 * seed-phase1-test.ts
 *
 * Comprehensive dummy data for Phase 1 judging test:
 *   - Ensures exactly 105 competition teams exist (adds 5 extra beyond the 100 from seed-dummy)
 *   - Adds 4 dummy judge profiles + JUDGE role assignments
 *   - Adds dummy participant profiles + team members for a handful of teams
 *   - Adds dummy payment records for NATIONAL/MIX dummy teams
 *
 * Run:
 *   cd packages/db
 *   npx tsx src/seed-phase1-test.ts
 */

import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { db, schema } from "./index";
import crypto from "crypto";
import { sql, eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMinimalPDF(teamCode: string, docType: string): Buffer {
  const lines = [
    `COMPSPHERE 2026 — ${docType}`,
    "",
    `Team Code   : ${teamCode}`,
    `Tanggal     : ${new Date().toLocaleDateString("id-ID")}`,
    "",
    "Status: DUMMY — Generated for Phase 1 testing",
    "",
    "COMPSPHERE 2026 | PUFA Computer Science",
  ];

  const textCmds = lines.reduce((acc, line) => {
    const escaped = line
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    return acc + `(${escaped}) Tj\nT*\n`;
  }, "BT\n/F1 12 Tf\n50 780 Td\n16 TL\n") + "ET\n";

  const streamBuf = Buffer.from(textCmds, "latin1");

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const obj4h = `4 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n`;
  const obj4f = "\nendstream\nendobj\n";
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const header = Buffer.from("%PDF-1.4\n");
  const b1 = Buffer.from(obj1);
  const b2 = Buffer.from(obj2);
  const b3 = Buffer.from(obj3);
  const b4h = Buffer.from(obj4h);
  const b4f = Buffer.from(obj4f);
  const b5 = Buffer.from(obj5);

  const off1 = header.length;
  const off2 = off1 + b1.length;
  const off3 = off2 + b2.length;
  const off4 = off3 + b3.length;
  const off5 = off4 + b4h.length + streamBuf.length + b4f.length;
  const xrefPos = off5 + b5.length;

  const xref = Buffer.from(
    "xref\n0 6\n" +
    "0000000000 65535 f \n" +
    `${String(off1).padStart(10, "0")} 00000 n \n` +
    `${String(off2).padStart(10, "0")} 00000 n \n` +
    `${String(off3).padStart(10, "0")} 00000 n \n` +
    `${String(off4).padStart(10, "0")} 00000 n \n` +
    `${String(off5).padStart(10, "0")} 00000 n \n` +
    "trailer\n<< /Size 6 /Root 1 0 R >>\n" +
    `startxref\n${xrefPos}\n%%EOF\n`
  );

  return Buffer.concat([header, b1, b2, b3, b4h, streamBuf, b4f, b5, xref]);
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const DUMMY_JUDGES = [
  {
    fullName: "Dr. Andi Wirawan, S.Kom., M.T.",
    email: "judge.andi.wirawan@compsphere-dummy.test",
    googleSub: "judge-dummy-sub-001",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=AndyWirawan",
  },
  {
    fullName: "Prof. Siti Rahayu, Ph.D.",
    email: "judge.siti.rahayu@compsphere-dummy.test",
    googleSub: "judge-dummy-sub-002",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=SitiRahayu",
  },
  {
    fullName: "Ir. Budi Santoso, M.Sc.",
    email: "judge.budi.santoso@compsphere-dummy.test",
    googleSub: "judge-dummy-sub-003",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=BudiSantoso",
  },
  {
    fullName: "Dr. Maya Putri Lestari",
    email: "judge.maya.lestari@compsphere-dummy.test",
    googleSub: "judge-dummy-sub-004",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=MayaLestari",
  },
];

const EXTRA_TEAMS = [
  { teamCode: "CS26-EXTRA-101", teamName: "Quantum Leap Innovators 101", category: "NATIONAL" as const, originalRank: 1101, countryMix: null },
  { teamCode: "CS26-EXTRA-102", teamName: "NeuralNet Builders 102", category: "NATIONAL" as const, originalRank: 1102, countryMix: null },
  { teamCode: "CS26-EXTRA-103", teamName: "CrossBorder Mix Creators 103", category: "MIX" as const, originalRank: 1103, countryMix: "Indonesia, Malaysia" },
  { teamCode: "CS26-EXTRA-104", teamName: "Global Pioneer Tech 104", category: "INTERNATIONAL" as const, originalRank: 1104, countryMix: "Thailand" },
  { teamCode: "CS26-EXTRA-105", teamName: "Horizon Stack Wave 105", category: "NATIONAL" as const, originalRank: 1105, countryMix: null },
];

const EXTRA_TEAM_PROPOSALS = [
  "AI-Powered Smart Campus Management System",
  "Neural Network-Based Traffic Flow Optimization",
  "Cross-Border Digital Payment Infrastructure",
  "Global Climate Change Monitoring Platform",
  "Decentralized Community Learning Hub",
];

const DUMMY_MEMBERS = [
  { fullName: "Rizki Pratama", email: "rizki.pratama@dummy.test", googleSub: "dummy-member-001" },
  { fullName: "Sinta Dewi", email: "sinta.dewi@dummy.test", googleSub: "dummy-member-002" },
  { fullName: "Fahmi Kurniawan", email: "fahmi.kurniawan@dummy.test", googleSub: "dummy-member-003" },
  { fullName: "Aulia Rahma", email: "aulia.rahma@dummy.test", googleSub: "dummy-member-004" },
  { fullName: "Dimas Setiawan", email: "dimas.setiawan@dummy.test", googleSub: "dummy-member-005" },
  { fullName: "Nadia Fitriani", email: "nadia.fitriani@dummy.test", googleSub: "dummy-member-006" },
  { fullName: "Kevin Santoso", email: "kevin.santoso@dummy.test", googleSub: "dummy-member-007" },
  { fullName: "Putri Handayani", email: "putri.handayani@dummy.test", googleSub: "dummy-member-008" },
  { fullName: "Arief Wicaksono", email: "arief.wicaksono@dummy.test", googleSub: "dummy-member-009" },
  { fullName: "Lina Kusuma", email: "lina.kusuma@dummy.test", googleSub: "dummy-member-010" },
  { fullName: "Bagas Nugroho", email: "bagas.nugroho@dummy.test", googleSub: "dummy-member-011" },
  { fullName: "Citra Permata", email: "citra.permata@dummy.test", googleSub: "dummy-member-012" },
  { fullName: "Dhani Prasetyo", email: "dhani.prasetyo@dummy.test", googleSub: "dummy-member-013" },
  { fullName: "Eka Suryaningsih", email: "eka.suryaningsih@dummy.test", googleSub: "dummy-member-014" },
  { fullName: "Fathur Rahman", email: "fathur.rahman@dummy.test", googleSub: "dummy-member-015" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seedPhase1Test() {
  console.log("🌱 Phase 1 Test Seed — Starting...\n");

  const uploadsBase = path.resolve(__dirname, "../../../apps/api/uploads");
  const proposalsDir = path.join(uploadsBase, "proposals");
  const paymentsDir = path.join(uploadsBase, "payments");
  fs.mkdirSync(proposalsDir, { recursive: true });
  fs.mkdirSync(paymentsDir, { recursive: true });

  // ── 1. Current team count ──────────────────────────────────────────────
  const [{ totalTeams }] = await db
    .select({ totalTeams: sql<number>`count(*)::int` })
    .from(schema.competitionTeams);
  console.log(`📊 Current team count: ${totalTeams}`);

  // ── 2. Extra teams (CS26-EXTRA-101 to -105) ────────────────────────────
  console.log("\n🏆 Step 1/5 — Inserting 5 extra teams...");
  const extraTeamIds: string[] = [];

  for (let i = 0; i < EXTRA_TEAMS.length; i++) {
    const t = EXTRA_TEAMS[i];
    const paymentRequired = t.category !== "INTERNATIONAL";

    const [team] = await db
      .insert(schema.competitionTeams)
      .values({
        teamCode: t.teamCode,
        teamName: t.teamName,
        category: t.category,
        countryMix: t.countryMix,
        originalRank: t.originalRank,
        status: "NEW",
        paymentRequired,
        paymentAmount: paymentRequired ? 120000 : 0,
      })
      .onConflictDoUpdate({
        target: schema.competitionTeams.teamCode,
        set: { teamName: t.teamName, status: "NEW" },
      })
      .returning({ id: schema.competitionTeams.id });

    extraTeamIds.push(team.id);

    // Proposal + PDF
    const [proposal] = await db
      .insert(schema.proposals)
      .values({
        teamId: team.id,
        title: EXTRA_TEAM_PROPOSALS[i],
        description: `Proposal inovatif dari ${t.teamName} untuk COMPSPHERE 2026.`,
        source: "MANUAL",
        devpostUrl: `https://devpost.com/project/${t.teamCode.toLowerCase().replace(/-/g, "")}`,
      })
      .onConflictDoNothing()
      .returning({ id: schema.proposals.id });

    if (proposal) {
      const pdfBuf = generateMinimalPDF(t.teamCode, "PROPOSAL SUBMISSION");
      const pdfName = `dummy_${t.teamCode.replace(/-/g, "_").toLowerCase()}_proposal.pdf`;
      const pdfPath = path.join(proposalsDir, pdfName);
      if (!fs.existsSync(pdfPath)) fs.writeFileSync(pdfPath, pdfBuf);
      await db.insert(schema.proposalFiles).values({
        proposalId: proposal.id,
        storageKey: `proposals/${pdfName}`,
        originalFilename: `proposal_${t.teamCode}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: pdfBuf.length,
      }).onConflictDoNothing();
    }

    console.log(`  ✅ ${t.teamCode} — ${t.teamName}`);
  }

  const [{ afterExtra }] = await db
    .select({ afterExtra: sql<number>`count(*)::int` })
    .from(schema.competitionTeams);
  console.log(`\n  📊 Total teams after extra: ${afterExtra}`);

  // ── 3. Dummy Judges ────────────────────────────────────────────────────
  console.log("\n⚖️  Step 2/5 — Creating 4 dummy judge profiles...");
  const judgeProfiles: Array<{ judgeId: string; name: string; email: string }> = [];

  for (const jd of DUMMY_JUDGES) {
    // Upsert profile
    let profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.email, jd.email),
    });

    if (!profile) {
      [profile] = await db
        .insert(schema.profiles)
        .values({
          googleSub: jd.googleSub,
          email: jd.email,
          fullName: jd.fullName,
          avatarUrl: jd.avatarUrl,
          onboardingStatus: "COMPLETE",
          preferredRole: "JUDGE",
        })
        .returning();
      console.log(`  ✅ Created profile: ${jd.fullName}`);
    } else {
      console.log(`  ⏭️  Profile exists: ${jd.fullName}`);
    }

    // Role assignment
    await db.insert(schema.roleAssignments).values({
      userId: profile.id,
      role: "JUDGE",
      source: "seed_dummy_judge",
    }).onConflictDoNothing();

    // Judge record
    let judgeRecord = await db.query.judges.findFirst({
      where: eq(schema.judges.userId, profile.id),
    });

    if (!judgeRecord) {
      [judgeRecord] = await db
        .insert(schema.judges)
        .values({ userId: profile.id, status: "ACTIVE" })
        .returning();
      console.log(`  🔑 Judge record created: ${jd.fullName}`);
    } else {
      // Ensure active
      await db.update(schema.judges).set({ status: "ACTIVE" }).where(eq(schema.judges.id, judgeRecord.id));
      console.log(`  ⏭️  Judge already exists (reactivated if needed): ${jd.fullName}`);
    }

    judgeProfiles.push({ judgeId: judgeRecord.id, name: jd.fullName, email: jd.email });
  }

  // ── 4. Dummy Participant Profiles + Team Members ───────────────────────
  console.log("\n👤 Step 3/5 — Creating 15 dummy participant profiles + team members...");

  const sampleTeamCodes = Array.from({ length: 15 }, (_, i) =>
    `CS26-DUMMY-${String(i + 1).padStart(3, "0")}`
  );

  // Get teams; some may not exist if seed-dummy wasn't run first
  const sampleTeams = await db.query.competitionTeams.findMany({});
  // Build lookup
  const teamByCode = new Map(sampleTeams.map((t) => [t.teamCode, t]));

  const participantProfileIds: string[] = [];

  for (let i = 0; i < DUMMY_MEMBERS.length; i++) {
    const m = DUMMY_MEMBERS[i];

    let profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.email, m.email),
    });

    if (!profile) {
      [profile] = await db.insert(schema.profiles).values({
        googleSub: m.googleSub,
        email: m.email,
        fullName: m.fullName,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.googleSub}`,
        onboardingStatus: "COMPLETE",
        preferredRole: "PARTICIPANT",
      }).returning();
    }

    participantProfileIds.push(profile.id);

    await db.insert(schema.roleAssignments).values({
      userId: profile.id,
      role: "PARTICIPANT",
      source: "seed_dummy_participant",
    }).onConflictDoNothing();

    const targetCode = sampleTeamCodes[i];
    const team = teamByCode.get(targetCode);
    if (team) {
      const memberRole = i % 5 === 0 ? "TEAM_LEADER" : "TEAM_MEMBER";
      await db.insert(schema.teamMembers).values({
        teamId: team.id,
        userId: profile.id,
        role: memberRole,
        status: "ACTIVE",
        verifiedAt: new Date(),
      }).onConflictDoNothing();
    }

    if ((i + 1) % 5 === 0) {
      console.log(`  ✅ ${i + 1}/${DUMMY_MEMBERS.length} participants done`);
    }
  }

  // ── 5. Payment Records ─────────────────────────────────────────────────
  console.log("\n💳 Step 4/5 — Generating payment records...");
  let paymentCount = 0;
  const paymentStatuses = ["APPROVED", "PENDING", "REJECTED"] as const;

  for (let i = 0; i < 15 && i < participantProfileIds.length; i++) {
    const teamCode = sampleTeamCodes[i];
    const team = teamByCode.get(teamCode);
    if (!team || !team.paymentRequired) continue;

    const existing = await db.query.payments.findFirst({
      where: eq(schema.payments.teamId, team.id),
    });
    if (existing) {
      console.log(`  ⏭️  Payment exists for ${teamCode}`);
      continue;
    }

    const status = paymentStatuses[i % 3];
    const pdfBuf = generateMinimalPDF(teamCode, "BUKTI PEMBAYARAN");
    const pdfName = `payment_proof_${teamCode.replace(/-/g, "_").toLowerCase()}.pdf`;
    const pdfPath = path.join(paymentsDir, pdfName);
    if (!fs.existsSync(pdfPath)) fs.writeFileSync(pdfPath, pdfBuf);

    await db.insert(schema.payments).values({
      teamId: team.id,
      amount: 120000,
      status,
      proofStorageKey: `payments/${pdfName}`,
      proofFilename: `payment_proof_${teamCode}.pdf`,
      submittedBy: participantProfileIds[i],
      submittedAt: new Date(Date.now() - randomInt(1, 10) * 86400000),
      verifiedAt: status !== "PENDING" ? new Date() : null,
      rejectionReason: status === "REJECTED"
        ? "Bukti pembayaran tidak sesuai dengan jumlah yang ditentukan."
        : null,
    });

    paymentCount++;
    console.log(`  ✅ [${status.padEnd(8)}] ${teamCode}`);
  }

  // ── 6. Set competition_phase = 1 ──────────────────────────────────────
  console.log("\n⚙️  Step 5/5 — Setting competition_phase = 1...");
  await db.update(schema.systemConfig)
    .set({ value: "1", updatedAt: new Date() })
    .where(eq(schema.systemConfig.key, "competition_phase"));
  console.log("  ✅ competition_phase = 1");

  // ── Summary ────────────────────────────────────────────────────────────
  const [{ grandTotal }] = await db
    .select({ grandTotal: sql<number>`count(*)::int` })
    .from(schema.competitionTeams);

  const [{ judgeTotal }] = await db
    .select({ judgeTotal: sql<number>`count(*)::int` })
    .from(schema.judges)
    .where(eq(schema.judges.status, "ACTIVE"));

  const teamsPerJudge = judgeTotal > 0 ? Math.ceil((grandTotal * 2) / judgeTotal) : 0;

  console.log("\n🎉 Phase 1 Test Seed Complete!\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Total competition teams  : ${grandTotal}`);
  console.log(`  Active judges            : ${judgeTotal}`);
  console.log(`  Dummy participant users  : ${DUMMY_MEMBERS.length}`);
  console.log(`  Payment records created  : ${paymentCount}`);
  console.log(`  Teams per judge (est.)   : ~${teamsPerJudge}`);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n  Judge accounts:");
  judgeProfiles.forEach((j, i) => {
    console.log(`    [${i + 1}] ${j.name}`);
    console.log(`         Email: ${j.email}`);
    console.log(`         ID   : ${j.judgeId}`);
  });
  console.log("\n  Next steps:");
  console.log("    1. Admin → Judges → verify 4 new judges appear");
  console.log("    2. Admin → Judges → Generate Phase 1 Assignments");
  console.log(`       ${grandTotal} teams × 2 judges = ${grandTotal * 2} total assignments`);
  console.log(`       across ${judgeTotal} judges (~${teamsPerJudge} teams/judge)`);
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(0);
}

seedPhase1Test().catch((err) => {
  console.error("❌ Phase 1 test seed failed:", err);
  process.exit(1);
});
