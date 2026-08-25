import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { db, schema } from "./index";
import crypto from "crypto";


// Helper: hash a token with SHA-256
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Helper: generate a random secure token
function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

async function seed() {
  console.log("🌱 Starting database seed...");

  // -------------------------------------------------------------------------
  // SYSTEM CONFIG — All business-critical configurable parameters
  // -------------------------------------------------------------------------
  console.log("  📝 Seeding system config...");
  const configs = [
    { key: "payment_amount_national", value: "120000", type: "NUMBER" as const },
    { key: "payment_amount_mix", value: "120000", type: "NUMBER" as const },
    { key: "payment_amount_international", value: "0", type: "NUMBER" as const },
    { key: "confirmation_window_hours", value: "48", type: "NUMBER" as const },
    { key: "top30_total_slots", value: "30", type: "NUMBER" as const },
    { key: "allocation_national_mix_ratio", value: "0.8", type: "NUMBER" as const },
    { key: "allocation_international_ratio", value: "0.2", type: "NUMBER" as const },
    { key: "max_team_members", value: "5", type: "NUMBER" as const },
    { key: "submission_deadline", value: "2026-10-11T10:00:00+07:00", type: "STRING" as const },
    { key: "scoring_weight_mvp", value: "0.35", type: "NUMBER" as const },
    { key: "scoring_weight_impact", value: "0.30", type: "NUMBER" as const },
    { key: "scoring_weight_creative", value: "0.20", type: "NUMBER" as const },
    { key: "scoring_weight_pitch", value: "0.15", type: "NUMBER" as const },
    { key: "score_min", value: "1", type: "NUMBER" as const },
    { key: "score_max", value: "100", type: "NUMBER" as const },
    { key: "competition_name", value: "COMPSPHERE 2026", type: "STRING" as const },
    { key: "competition_phase", value: "2", type: "NUMBER" as const },
    { key: "qr_token_expiry_hours", value: "72", type: "NUMBER" as const },
    { key: "invite_expiry_hours", value: "48", type: "NUMBER" as const },
    { key: "battle_royale_enabled", value: "false", type: "BOOLEAN" as const },
    { key: "countdown_compsphere_enabled", value: "false", type: "BOOLEAN" as const },
    { key: "countdown_talksphere_enabled", value: "false", type: "BOOLEAN" as const },
    { key: "countdown_enabled", value: "false", type: "BOOLEAN" as const },
    { key: "countdown_24h_enabled", value: "false", type: "BOOLEAN" as const },
    { key: "show_login_buttons", value: "true", type: "BOOLEAN" as const },
  ];

  for (const config of configs) {
    await db
      .insert(schema.systemConfig)
      .values(config)
      .onConflictDoUpdate({
        target: schema.systemConfig.key,
        set: { value: config.value, type: config.type },
      });
  }

  // -------------------------------------------------------------------------
  // COMPETITION TEAMS — 100 qualified teams (30 top + 10 waitlist + 60 others)
  // -------------------------------------------------------------------------
  console.log("  🏆 Seeding competition teams...");

  const teamNames = [
    // Top 30 — National
    "ByteForge Indonesia", "CodeCraft Nusantara", "TechVision Jakarta",
    "DataPulse Bandung", "CloudNine Surabaya", "NexGen Yogyakarta",
    "InnovatID Medan", "SmartBuild Bali", "DevMasters Malang",
    "CyberPeak Semarang", "PixelHub Makassar", "TechRoots Palembang",
    "CodeWave Batam", "AlgoKraft Bogor", "DataFlow Depok",
    "BuildRight Tangerang", "NetStorm Bekasi", "SysArch Pontianak",
    "BinaryEdge Manado", "StackHive Denpasar",
    // Top 30 — Mix
    "GlobalTech Mix Alpha", "CrossBorder Innovation", "FusionDev Squad",
    "HybridCode Collective", "BorderlessBuild Team",
    // Top 30 — International
    "SingTech Solutions", "KLDev Masters", "BKK Innovation Lab",
    "MNL CodeForce", "HCM TechBuilders",
    // Waitlist 31-40
    "ReservePro Team One", "ReservePro Team Two", "ReservePro Team Three",
    "ReservePro Team Four", "ReservePro Team Five",
    "ReservePro Team Six", "ReservePro Team Seven", "ReservePro Team Eight",
    "ReservePro Team Nine", "ReservePro Team Ten",
    // Remaining 41-100
    ...Array.from({ length: 60 }, (_, i) => `Qualified Team ${i + 41}`),
  ];

  const categories: Array<"NATIONAL" | "MIX" | "INTERNATIONAL"> = [
    // Ranks 1-20: NATIONAL
    ...Array(20).fill("NATIONAL"),
    // Ranks 21-25: MIX
    ...Array(5).fill("MIX"),
    // Ranks 26-30: INTERNATIONAL
    ...Array(5).fill("INTERNATIONAL"),
    // Waitlist 31-35: NATIONAL, 36-38: MIX, 39-40: INTERNATIONAL
    "NATIONAL", "NATIONAL", "NATIONAL", "NATIONAL", "NATIONAL",
    "MIX", "MIX", "MIX",
    "INTERNATIONAL", "INTERNATIONAL",
    // Remaining
    ...Array(60).fill("NATIONAL"),
  ];

  const getStatus = (rank: number): "TOP30" | "WAITLIST" => {
    if (rank <= 30) return "TOP30";
    if (rank <= 40) return "WAITLIST";
    return "TOP30"; // non-active qualified
  };

  const teamIds: string[] = [];
  const insertedTeams: Array<{ id: string; rank: number; category: "NATIONAL" | "MIX" | "INTERNATIONAL" }> = [];

  for (let i = 0; i < 100; i++) {
    const rank = i + 1;
    const category = categories[i];
    const status = rank <= 30 ? "TOP30" : rank <= 40 ? "WAITLIST" : "TOP30";
    const paymentRequired = category !== "INTERNATIONAL";
    const paymentAmount = paymentRequired ? 120000 : 0;

    const [team] = await db
      .insert(schema.competitionTeams)
      .values({
        teamCode: `CS26-${String(rank).padStart(3, "0")}`,
        teamName: teamNames[i] || `Team ${rank}`,
        category,
        countryMix: category === "MIX" ? "Indonesia, Singapore" : category === "INTERNATIONAL" ? "Singapore" : null,
        originalRank: rank,
        status,
        paymentRequired,
        paymentAmount,
      })
      .onConflictDoUpdate({
        target: schema.competitionTeams.teamCode,
        set: { teamName: teamNames[i] || `Team ${rank}`, status },
      })
      .returning({ id: schema.competitionTeams.id });

    teamIds.push(team.id);
    insertedTeams.push({ id: team.id, rank, category });
  }

  // -------------------------------------------------------------------------
  // PROPOSALS — Import for all teams
  // -------------------------------------------------------------------------
  console.log("  📋 Seeding proposals...");
  const proposalTitles = [
    "AI-Powered Government Service Assistant",
    "Smart City Traffic Management Platform",
    "Blockchain Voting System for Local Elections",
    "Telemedicine Platform for Rural Areas",
    "EdTech Gamification for K-12 Students",
    "Waste Management Optimization via IoT",
    "Renewable Energy Marketplace",
    "Mental Health Support Chatbot",
    "Supply Chain Transparency Tool",
    "Agricultural Yield Prediction System",
  ];

  for (let i = 0; i < Math.min(teamIds.length, 100); i++) {
    await db.insert(schema.proposals).values({
      teamId: teamIds[i],
      title: proposalTitles[i % proposalTitles.length] + ` (Team ${i + 1})`,
      description: `Innovative solution addressing public sector challenges using modern technology stack. This proposal focuses on scalable, accessible, and impactful technology for Indonesian communities.`,
      source: "DEVPOST",
      devpostUrl: `https://devpost.com/project/cs26-${String(i + 1).padStart(3, "0")}`,
    }).onConflictDoNothing();
  }

  // -------------------------------------------------------------------------
  // TEAM ACCESS TOKENS — 30 tokens for Top 30 teams
  // -------------------------------------------------------------------------
  console.log("  🔑 Generating team access tokens for Top 30...");
  const tokenData: Array<{ rank: number; teamCode: string; rawToken: string }> = [];

  for (let i = 0; i < 30; i++) {
    const rawToken = generateToken(32);
    const tokenHash = hashToken(rawToken);

    await db.insert(schema.teamAccessTokens).values({
      teamId: teamIds[i],
      tokenHash,
      status: "ISSUED",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }).onConflictDoNothing();

    tokenData.push({
      rank: i + 1,
      teamCode: `CS26-${String(i + 1).padStart(3, "0")}`,
      rawToken,
    });
  }

  // Print tokens for admin reference
  console.log("\n  ⚠️  TEAM ACCESS TOKENS (save these securely!):");
  console.log("  " + "=".repeat(70));
  tokenData.forEach(({ rank, teamCode, rawToken }) => {
    console.log(`  Rank ${String(rank).padStart(2)} | ${teamCode} | Token: ${rawToken}`);
  });
  console.log("  " + "=".repeat(70) + "\n");

  // -------------------------------------------------------------------------
  // BATTLE ROYALE CONFIG — Pre-create with inactive state
  // -------------------------------------------------------------------------
  console.log("  ⚔️  Seeding Battle Royale config...");
  const [brConfig] = await db
    .insert(schema.battleRoyaleConfig)
    .values({ isActive: false })
    .returning({ id: schema.battleRoyaleConfig.id });

  // Pre-create slots: 8 NATIONAL/MIX + 2 INTERNATIONAL (80/20 from 10 waitlist)
  // Actual slot counts are configurable via system_config
  const slotDistribution = [
    { category: "NATIONAL" as const, count: 6 },
    { category: "MIX" as const, count: 2 },
    { category: "INTERNATIONAL" as const, count: 2 },
  ];

  for (const { category, count } of slotDistribution) {
    for (let i = 0; i < count; i++) {
      await db.insert(schema.battleRoyaleSlots).values({
        configId: brConfig.id,
        category,
      });
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log("\nTo start development:");
  console.log("  npm run dev\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
