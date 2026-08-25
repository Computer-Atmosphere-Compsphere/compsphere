import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { PublicLayout } from "@/layouts/PublicLayout";
import { ParticipantLayout } from "@/layouts/ParticipantLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { JudgeLayout } from "@/layouts/JudgeLayout";

// Public pages
import { Landing } from "@/pages/public/Landing";
import { Guidebook } from "@/pages/public/Guidebook";
import { Timeline } from "@/pages/public/Timeline";
import { Announcements } from "@/pages/public/Announcements";
import { SubEventDetail } from "@/pages/public/SubEventDetail";

// Auth
import { AuthCallback } from "@/pages/auth/AuthCallback";

// Onboarding
import { Onboarding } from "@/pages/onboarding/Onboarding";
import { OnboardingUser } from "@/pages/onboarding/OnboardingUser";
import { OnboardingParticipant } from "@/pages/onboarding/OnboardingParticipant";
import { OnboardingAdmin } from "@/pages/onboarding/OnboardingAdmin";
import { OnboardingJudge } from "@/pages/onboarding/OnboardingJudge";

// Participant pages
import { Dashboard as ParticipantDashboard } from "@/pages/participant/Dashboard";
import { Team } from "@/pages/participant/Team";
import { Confirmation } from "@/pages/participant/Confirmation";
import { Payment } from "@/pages/participant/Payment";
import { Submission } from "@/pages/participant/Submission";
import { QRCode } from "@/pages/participant/QRCode";
import { Notifications } from "@/pages/participant/Notifications";

// Admin pages
import { Dashboard as AdminDashboard } from "@/pages/admin/Dashboard";
import { Migration } from "@/pages/admin/Migration";
import { Teams as AdminTeams } from "@/pages/admin/Teams";
import { Top30 } from "@/pages/admin/Top30";
import { TeamDetail } from "@/pages/admin/TeamDetail";
import { Payments } from "@/pages/admin/Payments";
import { Verification } from "@/pages/admin/Verification";
import { BattleRoyale } from "@/pages/admin/BattleRoyale";
import { Submissions } from "@/pages/admin/Submissions";
import { Attendance } from "@/pages/admin/Attendance";
import { Judges } from "@/pages/admin/Judges";
import { ScoringOverview } from "@/pages/admin/ScoringOverview";
import { Config } from "@/pages/admin/Config";
import { Audit } from "@/pages/admin/Audit";

// Judge pages
import { JudgeDashboard } from "@/pages/judge/Dashboard";
import { JudgeTeams } from "@/pages/judge/Teams";
import { Proposals } from "@/pages/judge/Proposals";
import { Scoring } from "@/pages/judge/Scoring";

// Route guard
import { useAuth } from "@/hooks/useAuth";

function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// Allows users with a Google session even if they have NO Compsphere profile
// yet (brand-new account) — required so onboarding is reachable after sign-in.
function RequireGoogleSession({ children }: { children: React.ReactNode }) {
  const { hasGoogleSession, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="w-10 h-10 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasGoogleSession) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/guidebook" element={<Guidebook />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/events/:id" element={<SubEventDetail />} />
      </Route>

      {/* ── Auth callback ────────────────────────────── */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ── Onboarding ───────────────────────────────── */}
      <Route
        path="/onboarding"
        element={
          <RequireGoogleSession>
            <Onboarding />
          </RequireGoogleSession>
        }
      />
      <Route
        path="/onboarding/user"
        element={
          <RequireGoogleSession>
            <OnboardingUser />
          </RequireGoogleSession>
        }
      />
      <Route
        path="/onboarding/participant"
        element={
          <RequireGoogleSession>
            <OnboardingParticipant />
          </RequireGoogleSession>
        }
      />
      <Route
        path="/onboarding/admin"
        element={
          <RequireGoogleSession>
            <OnboardingAdmin />
          </RequireGoogleSession>
        }
      />
      <Route
        path="/onboarding/judge"
        element={
          <RequireGoogleSession>
            <OnboardingJudge />
          </RequireGoogleSession>
        }
      />

      {/* ── Participant console ───────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth role="PARTICIPANT">
            <ParticipantLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ParticipantDashboard />} />
        <Route path="team" element={<Team />} />
        <Route path="confirmation" element={<Confirmation />} />
        <Route path="payment" element={<Payment />} />
        <Route path="submission" element={<Submission />} />
        <Route path="qr" element={<QRCode />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ── Admin console ────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <RequireAuth role="ADMIN">
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="migration" element={<Migration />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="teams/:teamId" element={<TeamDetail />} />
        <Route path="top30" element={<Top30 />} />
        <Route path="payments" element={<Payments />} />
        <Route path="verification" element={<Verification />} />
        <Route path="battle-royale" element={<BattleRoyale />} />
        <Route path="submissions" element={<Submissions />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="judges" element={<Judges />} />
        <Route path="scoring" element={<ScoringOverview />} />
        <Route path="config" element={<Config />} />
        <Route path="audit" element={<Audit />} />
      </Route>

      {/* ── Judge console ─────────────────────────────── */}
      <Route
        path="/judge"
        element={
          <RequireAuth role="JUDGE">
            <JudgeLayout />
          </RequireAuth>
        }
      >
        <Route index element={<JudgeDashboard />} />
        <Route path="teams" element={<JudgeTeams />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="scoring/:teamId" element={<Scoring />} />
      </Route>

      {/* ── Fallback ──────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
