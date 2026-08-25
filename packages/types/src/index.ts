// =============================================================================
// COMPSPHERE.ID — Shared TypeScript Types
// Single source of truth for all entity types shared between web and api
// =============================================================================

// ---------------------------------------------------------------------------
// ENUMS (mirror PostgreSQL enums exactly)
// ---------------------------------------------------------------------------

export type TeamStatus =
  | "NEW"
  | "TOP30"
  | "AWAITING_CONFIRMATION"
  | "PAYMENT_PENDING"
  | "DOCUMENT_PENDING"
  | "VERIFICATION_PENDING"
  | "VERIFIED"
  | "DROPPED"
  | "WAITLIST"
  | "FINALIST"
  | "SUBMISSION_OPEN"
  | "SUBMITTED"
  | "JUDGED";

export type TeamCategory = "NATIONAL" | "MIX" | "INTERNATIONAL";

export type RoleType = "USER" | "PARTICIPANT" | "ADMIN" | "JUDGE";

export type MemberRole = "TEAM_LEADER" | "TEAM_MEMBER";

export type MemberStatus = "ACTIVE" | "PENDING" | "REMOVED";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TokenStatus = "ISSUED" | "ACTIVATED" | "REVOKED" | "EXPIRED";

export type SubmissionStatus = "DRAFT" | "SUBMITTED" | "LOCKED";

export type AttendanceType = "DAY1" | "DAY2" | "CEREMONY";

export type QRScanResult =
  | "VALID"
  | "ALREADY_SCANNED"
  | "INVALID"
  | "EXPIRED"
  | "NOT_ELIGIBLE";

export type OnboardingStatus = "INCOMPLETE" | "COMPLETE";

export type InviteStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export type SlotStatus = "AVAILABLE" | "CLAIMED";

// ---------------------------------------------------------------------------
// CORE ENTITIES
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  googleSub: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  preferredRole: RoleType | null;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionTeam {
  id: string;
  teamCode: string;
  teamName: string;
  category: TeamCategory;
  countryMix: string | null;
  originalRank: number;
  status: TeamStatus;
  paymentRequired: boolean;
  paymentAmount: number;
  confirmationStartedAt: string | null;
  confirmationDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  verifiedAt: string | null;
  // Joined fields
  profile?: Pick<Profile, "id" | "fullName" | "email" | "avatarUrl">;
}

export interface TeamAccessToken {
  id: string;
  teamId: string;
  status: TokenStatus;
  activatedBy: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  // Note: token_hash is NEVER returned to client
}

export interface MemberInvite {
  id: string;
  teamId: string;
  createdBy: string;
  status: InviteStatus;
  expiresAt: string;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
  // Note: invite_hash is NEVER returned to client; the raw invite token IS returned once on creation
  inviteToken?: string; // only present on creation response
}

export interface RoleAssignment {
  id: string;
  userId: string;
  role: RoleType;
  source: string;
  teamId: string | null;
  assignedAt: string;
  assignedBy: string | null;
  revokedAt: string | null;
}

export interface Proposal {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  files?: ProposalFile[];
}

export interface ProposalFile {
  id: string;
  proposalId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  teamId: string;
  amount: number;
  status: PaymentStatus;
  proofStorageKey: string | null;
  proofFilename: string | null;
  submittedBy: string;
  submittedAt: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

export interface Submission {
  id: string;
  teamId: string;
  repositoryUrl: string;
  deploymentUrl: string | null;
  slideStorageKey: string | null;
  slideFilename: string | null;
  slideSizeBytes: number | null;
  submittedAt: string;
  status: SubmissionStatus;
}

export interface Judge {
  id: string;
  userId: string;
  status: "ACTIVE" | "INACTIVE";
  profile?: Pick<Profile, "id" | "fullName" | "email" | "avatarUrl">;
}

export interface JudgeAssignment {
  id: string;
  judgeId: string;
  teamId: string;
  assignedAt: string;
  team?: Pick<CompetitionTeam, "id" | "teamName" | "teamCode" | "category">;
}

export interface JudgeScore {
  id: string;
  judgeId: string;
  teamId: string;
  mvpScore: number;
  impactScore: number;
  creativeScore: number;
  pitchScore: number;
  finalScore: number;
  submittedAt: string;
  updatedAt: string;
}

export interface BattleRoyaleSlot {
  id: string;
  category: TeamCategory;
  totalSlots: number;
  claimedSlots: number;
  availableSlots: number;
  isActive: boolean;
}

export interface QRToken {
  id: string;
  teamId: string;
  userId: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  // rawToken only returned on generation
  rawToken?: string;
}

export interface Attendance {
  id: string;
  teamId: string;
  userId: string;
  attendanceType: AttendanceType;
  attendanceDate: string;
  scannedBy: string;
  scannedAt: string;
  // Joined
  profile?: Pick<Profile, "fullName" | "email">;
  team?: Pick<CompetitionTeam, "teamName" | "teamCode">;
}

export interface Notification {
  id: string;
  userId: string | null;
  teamId: string | null;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: Pick<Profile, "fullName" | "email">;
}

export interface SystemConfig {
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  updatedAt: string;
  updatedBy: string | null;
}

export interface MigrationBatch {
  id: string;
  source: string;
  fileName: string;
  rowCount: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
}

// ---------------------------------------------------------------------------
// API REQUEST / RESPONSE TYPES
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth / Session
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: RoleType;
  teamId: string | null;
  memberRole: MemberRole | null;
  onboardingStatus: OnboardingStatus;
}

// Onboarding
export interface RedeemTeamTokenRequest {
  token: string;
}

export interface RedeemTeamTokenResponse {
  team: Pick<CompetitionTeam, "id" | "teamName" | "teamCode" | "category" | "originalRank">;
  alreadyHasLeader: boolean;
}

export interface ActivateAsLeaderRequest {
  teamId: string;
}

export interface RedeemRoleTokenRequest {
  token: string;
  role: "ADMIN" | "JUDGE";
}

// Payment
export interface SubmitPaymentRequest {
  teamId: string;
  amount: number;
  // file uploaded separately via multipart/form-data
}

export interface VerifyPaymentRequest {
  paymentId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}

// Submission
export interface SubmitPhase2Request {
  teamId: string;
  repositoryUrl: string;
  deploymentUrl?: string;
  // slide uploaded separately via multipart/form-data
}

// Battle Royale
export interface ClaimSlotRequest {
  teamId: string;
}

export interface BattleRoyaleStatus {
  isActive: boolean;
  slots: BattleRoyaleSlot[];
  startedAt: string | null;
  startedBy: string | null;
}

// Judging
export interface SubmitScoreRequest {
  teamId: string;
  mvpScore: number;
  impactScore: number;
  creativeScore: number;
  pitchScore: number;
}

// QR Scan
export interface ScanQRRequest {
  token: string;
  attendanceType: AttendanceType;
}

export interface ScanQRResponse {
  result: QRScanResult;
  participant?: {
    fullName: string;
    teamName: string;
    teamCode: string;
  };
  message: string;
}

// Admin metrics
export interface AdminOverviewMetrics {
  totalImported: number;
  newCount: number;
  top30Selected: number;
  awaitingConfirmation: number;
  paymentPending: number;
  verificationPending: number;
  verified: number;
  dropped: number;
  waitlistCount: number;
  battleRoyaleActive: boolean;
  submissionCount: number;
  attendanceCount: number;
}

// SSE Event types
export type SSEEventType =
  | "battle_royale:slot_updated"
  | "battle_royale:initiated"
  | "team:status_changed"
  | "payment:verified"
  | "payment:rejected"
  | "submission:locked"
  | "admin:counter_updated"
  | "notification:new"
  | "migration:team_added"
  | "heartbeat";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}

// Scoring weights (configurable via system_config)
export interface ScoringWeights {
  mvp: number;       // default: 0.35
  impact: number;    // default: 0.30
  creative: number;  // default: 0.20
  pitch: number;     // default: 0.15
}

export function calculateFinalScore(
  scores: { mvpScore: number; impactScore: number; creativeScore: number; pitchScore: number },
  weights: ScoringWeights = { mvp: 0.35, impact: 0.30, creative: 0.20, pitch: 0.15 }
): number {
  return (
    scores.mvpScore * weights.mvp +
    scores.impactScore * weights.impact +
    scores.creativeScore * weights.creative +
    scores.pitchScore * weights.pitch
  );
}
