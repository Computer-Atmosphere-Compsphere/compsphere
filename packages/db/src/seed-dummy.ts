import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import { db, schema } from "./index";

// ---------------------------------------------------------------------------
// PDF Generator — minimal valid PDF tanpa library eksternal
// ---------------------------------------------------------------------------
function generateMinimalPDF(title: string, teamName: string, teamCode: string, idx: number): Buffer {
  const topics = [
    "Artificial Intelligence & Machine Learning",
    "Internet of Things & Smart Systems",
    "Blockchain & Decentralized Applications",
    "Cloud Computing & Microservices",
    "Cybersecurity & Privacy Protection",
    "Data Analytics & Business Intelligence",
    "Mobile Application Development",
    "Web3 & Digital Finance Innovation",
    "Green Technology & Sustainability",
    "Healthcare Technology Solutions",
  ];

  const topic = topics[idx % topics.length];

  const lines = [
    title,
    "",
    `Team: ${teamName}`,
    `Team Code: ${teamCode}`,
    "",
    "TOPIC AREA",
    topic,
    "",
    "EXECUTIVE SUMMARY",
    `Platform inovatif dari ${teamName} yang memanfaatkan ${topic}`,
    "untuk memberikan solusi yang scalable dan sustainable.",
    "",
    "PROBLEM STATEMENT",
    `Masih terdapat kesenjangan antara kebutuhan masyarakat dan solusi teknologi`,
    `yang tersedia. ${teamName} hadir untuk menjembatani gap tersebut.`,
    "",
    "PROPOSED SOLUTION",
    "Kami mengembangkan platform dengan pendekatan user-centric yang mengintegrasikan",
    "teknologi terkini untuk menciptakan dampak nyata bagi komunitas Indonesia.",
    "",
    "TECH STACK",
    "- Frontend: React.js / Next.js",
    "- Backend: Node.js / Python FastAPI",
    "- Database: PostgreSQL / MongoDB",
    "- Cloud: AWS / Google Cloud Platform",
    "",
    "IMPACT & BENEFITS",
    "1. Meningkatkan efisiensi operasional hingga 60%",
    "2. Mengurangi biaya infrastruktur secara signifikan",
    "3. Memperluas jangkauan layanan ke seluruh Indonesia",
    "",
    "ROADMAP",
    "Q3 2026: MVP Development & Internal Testing",
    "Q4 2026: Beta Launch & User Acquisition",
    "Q1 2027: Full Launch & Scaling",
    "",
    "COMPSPHERE 2026 — Proposal Submission",
    `Generated for: ${teamCode}`,
  ];

  const textCmds = lines.reduce((acc, line) => {
    const escaped = line
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    return acc + `(${escaped}) Tj\nT*\n`;
  }, "BT\n/F1 10 Tf\n50 780 Td\n13 TL\n") + "ET\n";

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
// Data pools
// ---------------------------------------------------------------------------
const TEAM_PREFIXES = [
  "Alpha","Beta","Gamma","Delta","Epsilon","Zeta","Theta","Lambda",
  "Sigma","Omega","Nexus","Apex","Nova","Vega","Orion","Lyra",
  "Hydra","Draco","Cetus","Virgo",
];
const TEAM_SUFFIXES = [
  "Tech","Dev","Labs","Studio","Works","Code","Build","Forge",
  "Hive","Stack","Wave","Core","Logic","Mind","Node",
];
const TECH_THEMES = [
  "Innovators","Builders","Pioneers","Creators","Coders",
  "Makers","Hackers","Thinkers","Dreamers","Wizards",
];

const PROPOSAL_TITLES = [
  "AI-Driven Smart City Traffic Management System",
  "Blockchain-Based Land Registry for Rural Communities",
  "Telemedicine Platform for Remote Healthcare Access",
  "EdTech Gamification for Vocational Training",
  "IoT-Powered Waste Management Optimization",
  "Renewable Energy P2P Marketplace",
  "Mental Health Companion Chatbot with CBT Integration",
  "Supply Chain Transparency via Distributed Ledger",
  "Agricultural Yield Prediction using Satellite Imagery",
  "Inclusive Fintech for Unbanked Communities",
  "Smart Water Quality Monitoring Network",
  "AI-Powered Legal Document Assistant",
  "Decentralized Voting System for Student Organizations",
  "Carbon Credit Marketplace for SMEs",
  "Real-Time Disaster Response Coordination Platform",
  "Adaptive Learning Platform for K-12 Students",
  "Digital Identity Wallet for Public Services",
  "Predictive Maintenance System for Manufacturing",
  "Community-Based Food Security Tracking System",
  "E-Government Document Processing Automation",
  "Smart Parking Management System with IoT",
  "Open Data Platform for Urban Planning",
  "Peer-to-Peer Skill Exchange Marketplace",
  "AI-Based Crop Disease Detection via Mobile",
  "Renewable Energy Monitoring Dashboard for Households",
  "Healthcare Appointment & Queue Management System",
  "Digital Literacy Training for Senior Citizens",
  "Anti-Fraud Detection System for Banking",
  "Smart Tourism Navigation with AR Features",
  "Crowdfunded Micro-Loan Platform for MSMEs",
  "Environmental Impact Assessment Automation",
  "Public Transportation Real-Time Tracker",
  "AI-Powered Job Matching for Fresh Graduates",
  "Community Marketplace for Local Products",
  "Automated Customer Support via NLP Chatbot",
  "Digital Asset Management for Creative Industries",
  "Health Wearable Analytics Platform",
  "Food Delivery Optimization with ML Routing",
  "Child Education Progress Tracker for Parents",
  "Recycling Incentive Platform with Gamification",
  "Smart Home Energy Management System",
  "Precision Agriculture with Drone Technology",
  "Open-Source Medical Records Management",
  "Crowdsourced Urban Infrastructure Reporting",
  "Language Learning App for Indigenous Languages",
  "Digital Social Safety Net Distribution Platform",
  "AI-Powered Mental Wellness Assessment Tool",
  "Sustainable Fashion Marketplace with Impact Tracking",
  "Real-Time Air Quality Monitoring Network",
  "Smart Library Digital Resource Platform",
  "E-Commerce Analytics for Marketplace Sellers",
  "Community Emergency Alert System",
  "Peer Tutoring Platform for University Students",
  "Digital Heritage Documentation with AR",
  "Supply Chain Finance Platform for SMEs",
  "AI-Driven Sports Performance Analytics",
  "Transparent Charity Donation Tracking Platform",
  "Remote Work Productivity Analytics Tool",
  "Predictive Health Insurance Pricing Model",
  "Digital Nomad Community Hub Platform",
  "Autonomous Inventory Management for Retail",
  "Climate Risk Assessment for Agricultural Loans",
  "Social Enterprise Impact Measurement Dashboard",
  "Online Dispute Resolution Platform",
  "AI-Powered Recipe & Nutrition Planner",
  "Digital Skills Certification with Blockchain",
  "Inclusive Design Testing Platform",
  "Rural Connectivity Infrastructure Optimizer",
  "Employee Wellbeing Analytics Dashboard",
  "Smart Parking & EV Charging Integration",
  "Community Health Worker Support System",
  "Real Estate PropTech Investment Platform",
  "Automated Tax Filing Assistant for Freelancers",
  "Circular Economy Product Lifecycle Tracker",
  "Accessible Tourism Platform for Disabled Travelers",
  "Flood Early Warning System with AI Prediction",
  "Digital Cooperatives Management Platform",
  "Cross-Border Remittance Optimization Tool",
  "AI-Enhanced Security Surveillance System",
  "Student Mental Health Crisis Intervention App",
  "Community Solar Energy Sharing Platform",
  "Smart Agriculture Insurance Parametric Model",
  "Digital Apprenticeship Matching Platform",
  "Zero-Waste Restaurant Management System",
  "Women Entrepreneurship Support Ecosystem",
  "Personalized Medicine Recommendation System",
  "Smart Grid Demand Response Platform",
  "Open Government Budget Transparency Tool",
  "AI-Powered Immigration Document Checker",
  "Social Commerce Platform for Rural Artisans",
  "Urban Farming Management & Marketplace",
  "Student Loan Repayment Optimization App",
  "Digital Twins for Industrial Safety Monitoring",
  "Nonprofit Grant Management Platform",
  "Hybrid Learning Management System",
  "Coastal Erosion Monitoring with Satellite Data",
  "Digital Health Passport for Travelers",
  "SME Export Readiness Assessment Tool",
  "AI-Based Traffic Accident Prediction System",
  "Next-Gen EdTech Platform for Coding Education",
  "Smart Aquaculture Monitoring System",
];

const CATEGORIES: Array<"NATIONAL" | "MIX" | "INTERNATIONAL"> = [
  ...Array(70).fill("NATIONAL"),
  ...Array(20).fill("MIX"),
  ...Array(10).fill("INTERNATIONAL"),
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function seedDummy() {
  console.log("🌱 Starting dummy seed: 100 teams with status=NEW + proposal PDFs...\n");

  const uploadsBase = path.resolve(__dirname, "../../../apps/api/uploads");
  const proposalsDir = path.join(uploadsBase, "proposals");
  fs.mkdirSync(proposalsDir, { recursive: true });
  console.log(`📁 PDF output directory: ${proposalsDir}\n`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < 100; i++) {
    const teamCode = `CS26-DUMMY-${String(i + 1).padStart(3, "0")}`;
    const category = CATEGORIES[i];

    const prefix = TEAM_PREFIXES[i % TEAM_PREFIXES.length];
    const suffix = TEAM_SUFFIXES[Math.floor(i / TEAM_PREFIXES.length) % TEAM_SUFFIXES.length];
    const theme = TECH_THEMES[i % TECH_THEMES.length];
    const teamName = `${prefix} ${suffix} ${theme} ${i + 1}`;

    const paymentRequired = category !== "INTERNATIONAL";
    const paymentAmount = paymentRequired ? 120000 : 0;

    // Find a non-conflicting rank (use 1001+ range)
    const rank = 1000 + i + 1;

    // Upsert team with status NEW
    const [team] = await db
      .insert(schema.competitionTeams)
      .values({
        teamCode,
        teamName,
        category,
        countryMix:
          category === "MIX" ? "Indonesia, Singapore"
          : category === "INTERNATIONAL" ? "Singapore"
          : null,
        originalRank: rank,
        status: "NEW",
        paymentRequired,
        paymentAmount,
      })
      .onConflictDoUpdate({
        target: schema.competitionTeams.teamCode,
        set: { teamName, status: "NEW", category, originalRank: rank },
      })
      .returning({ id: schema.competitionTeams.id });

    // Upsert proposal
    const proposalTitle = PROPOSAL_TITLES[i % PROPOSAL_TITLES.length];
    const [proposal] = await db
      .insert(schema.proposals)
      .values({
        teamId: team.id,
        title: proposalTitle,
        description: `Proposal inovatif dari ${teamName} untuk COMPSPHERE 2026. Solusi teknologi berdampak nyata bagi masyarakat Indonesia.`,
        source: "MANUAL",
        devpostUrl: `https://devpost.com/project/cs26-dummy-${String(i + 1).padStart(3, "0")}`,
      })
      .onConflictDoNothing()
      .returning({ id: schema.proposals.id });

    if (!proposal) {
      // Proposal already exists — check if file record exists
      const existingProposal = await db.query.proposals.findFirst({
        where: (p, { eq }) => eq(p.teamId, team.id),
        with: { proposalFiles: true },
      });
      if (existingProposal?.proposalFiles && existingProposal.proposalFiles.length > 0) {
        skipCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`  ⏭️  ${i + 1}/100 (some skipped, already exist)`);
        }
        continue;
      }
      // Proposal exists but no file — add file
      if (existingProposal) {
        const pdfBuffer = generateMinimalPDF(existingProposal.title, teamName, teamCode, i);
        const pdfFilename = `dummy_${teamCode.replace(/-/g, "_").toLowerCase()}.pdf`;
        const pdfPath = path.join(proposalsDir, pdfFilename);
        if (!fs.existsSync(pdfPath)) fs.writeFileSync(pdfPath, pdfBuffer);
        await db.insert(schema.proposalFiles).values({
          proposalId: existingProposal.id,
          storageKey: `proposals/${pdfFilename}`,
          originalFilename: `proposal_${teamCode}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: pdfBuffer.length,
        }).onConflictDoNothing();
      }
      skipCount++;
      continue;
    }

    // Generate PDF and save
    const pdfBuffer = generateMinimalPDF(proposalTitle, teamName, teamCode, i);
    const pdfFilename = `dummy_${teamCode.replace(/-/g, "_").toLowerCase()}.pdf`;
    const pdfPath = path.join(proposalsDir, pdfFilename);
    fs.writeFileSync(pdfPath, pdfBuffer);

    await db.insert(schema.proposalFiles).values({
      proposalId: proposal.id,
      storageKey: `proposals/${pdfFilename}`,
      originalFilename: `proposal_${teamCode}.pdf`,
      mimeType: "application/pdf",
      sizeBytes: pdfBuffer.length,
    });

    successCount++;

    if ((i + 1) % 10 === 0) {
      console.log(`  ✅ ${i + 1}/100 teams processed`);
    }
  }

  console.log("\n🎉 Dummy seed completed!\n");
  console.log("═══════════════════════════════════════");
  console.log(`  Teams created/updated : ${successCount + skipCount}`);
  console.log(`  New proposals + PDFs  : ${successCount}`);
  console.log(`  Skipped (existing)    : ${skipCount}`);
  console.log("═══════════════════════════════════════");
  console.log(`  Team codes : CS26-DUMMY-001 to CS26-DUMMY-100`);
  console.log(`  Status     : NEW (ready for Phase 1 generation)`);
  console.log(`  Categories : 70 NATIONAL, 20 MIX, 10 INTERNATIONAL`);
  console.log(`  PDF dir    : ${proposalsDir}`);
  console.log("═══════════════════════════════════════\n");

  process.exit(0);
}

seedDummy().catch((err) => {
  console.error("❌ Dummy seed failed:", err);
  process.exit(1);
});
