export interface Organizer {
  id: number;
  fullName: string;
  email: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_path: string | null;
  banner_path: string | null;
  website: string | null;
  contact_email: string | null;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  member_role?: "owner" | "admin" | "member";
  member_status?: "invited" | "active" | "revoked";
}

export interface Conference {
  id: number;
  organizer_id: number;
  organization_id: number;
  name: string;
  acronym: string | null;
  short_name: string | null;
  institution: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  status: "draft" | "published" | "archived";
  registration_status: "open" | "closed" | "invite_only";
  max_delegates: number | null;
  conference_code: string;
  payment_required: 0 | 1;
  currency: string;
  results_published: 0 | 1;
  results_published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: number;
  organization_id: number;
  email: string;
  full_name: string | null;
  org_role: "owner" | "admin" | "member";
  status: "invited" | "active" | "revoked";
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationStats {
  totalConferences: number;
  draftConferences: number;
  publishedConferences: number;
  archivedConferences: number;
  totalDelegates: number;
  totalMembers: number;
}

export type DelegateStatus = "pending" | "approved" | "rejected" | "waitlisted" | "withdrawn";

export interface Delegate {
  id: number;
  conference_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  school: string | null;
  grade: string | null;
  mun_experience: "beginner" | "1-3" | "4-10" | "10+";
  status: DelegateStatus;
  created_at: string;
  updated_at: string;
  possibleDuplicate?: boolean;
}

export interface Committee {
  id: number;
  conference_id: number;
  name: string;
  chair: string | null;
  vice_chair: string | null;
  capacity: number | null;
  type: "standard" | "crisis";
  status: "open" | "closed";
}

export interface Portfolio {
  id: number;
  committee_id: number;
  name: string;
  type: "country" | "position" | "observer";
  status: "available" | "assigned";
  description?: string | null;
}

export interface Agenda {
  id: number;
  committee_id: number;
  title: string;
  description: string | null;
  background_notes: string | null;
  status: "draft" | "published" | "archived";
  publication_date: string | null;
}

export interface CommitteeStats {
  assignedCount: number;
  totalPortfolios: number;
  availablePortfolios: number;
  preferenceCount: number;
}

export interface ScheduleEvent {
  id: number;
  schedule_day_id: number;
  committee_id: number | null;
  committee_name: string | null;
  title: string;
  type: "committee_session" | "general_event" | "ceremony";
  location: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "updated" | "cancelled";
}

export interface ScheduleDay {
  id: number;
  conference_id: number;
  day_date: string;
  label: string | null;
  events: ScheduleEvent[];
}

export interface DelegateSelf {
  id: number;
  fullName: string;
  email: string;
  school?: string | null;
  grade?: string | null;
  munExperience?: string;
  status: DelegateStatus;
}

export interface DelegateProfile {
  delegate: DelegateSelf;
  conference: { id: number; name: string; acronym: string | null } | null;
  committeePreferences: { preference_rank: number; committee_id: number; committee_name: string }[];
  countryPreferences: { preference_rank: number; country_name: string }[];
  assignment: {
    published: boolean;
    committeeId?: number | null;
    committee?: string | null;
    portfolioId?: number | null;
    portfolio?: string | null;
    portfolioType?: string | null;
  };
}

export interface Announcement {
  id: number;
  conference_id: number;
  title: string;
  category: string;
  target_audience: string;
  priority: "normal" | "important" | "urgent";
  content: string;
  publish_date: string | null;
  status: string;
  created_at: string;
}

export interface Resource {
  id: number;
  conference_id: number;
  committee_id: number | null;
  title: string;
  category: string;
  description: string | null;
  file_path: string | null;
  visibility: string;
  status: string;
  download_count: number;
  created_at: string;
}

export interface Note {
  id: number;
  delegate_id: number;
  title: string;
  content: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface DelegateDocument {
  id: number;
  delegate_id: number;
  committee_id: number | null;
  agenda_id: number | null;
  type: "position_paper" | "speech";
  title: string;
  content: string | null;
  status: "draft" | "final";
  created_at: string;
  updated_at: string;
}

export interface Resolution {
  id: number;
  conference_id: number;
  committee_id: number;
  agenda_id: number | null;
  delegate_id: number;
  title: string;
  body: string;
  status: "draft" | "submitted" | "under_review" | "passed" | "failed";
  organizer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRow {
  id: number | null;
  delegate_id: number;
  delegate_name: string;
  delegate_school: string | null;
  committee_id: number | null;
  committee_name: string | null;
  portfolio_id: number | null;
  portfolio_name: string | null;
  status: "unassigned" | "assigned" | null;
  published: 0 | 1 | null;
}

export interface RegistrationAnalytics {
  totalApplications: number;
  byStatus: Record<DelegateStatus, number>;
  approvalRate: number;
  institutionDistribution: { school: string; count: number }[];
  experienceDistribution: { experience: string; count: number }[];
  registrationsByDay: { day: string; count: number }[];
}

export type PaymentMethod = "cash" | "bank_transfer" | "upi" | "cheque" | "other";
export type PaymentStatus = "submitted" | "under_verification" | "verified" | "failed" | "refunded" | "cancelled";
export type DerivedPaymentStatus = PaymentStatus | "pending" | "not_required";

export interface FeeCategory {
  id: number;
  conference_id: number;
  name: string;
  amount: string;
  currency: string;
  description: string | null;
  is_required: 0 | 1;
  status: "active" | "archived";
}

export interface PaymentConfig {
  paymentRequired: boolean;
  currency: string;
  feeCategories: FeeCategory[];
}

export interface Payment {
  id: number;
  conference_id: number;
  delegate_id: number;
  delegate_name: string;
  delegate_email?: string;
  fee_category_id: number | null;
  fee_category_name: string | null;
  amount: string;
  currency: string;
  method: PaymentMethod;
  transaction_reference: string | null;
  status: PaymentStatus;
  payment_date: string | null;
  notes: string | null;
  recorded_by: "delegate" | "organizer";
  verified_at: string | null;
  created_at: string;
}

export interface Refund {
  id: number;
  payment_id: number;
  delegate_id: number;
  delegate_name: string;
  amount: string;
  reason: string;
  notes: string | null;
  refund_date: string;
  created_at: string;
}

export interface Discount {
  id: number;
  delegate_id: number;
  delegate_name: string;
  fee_category_id: number | null;
  fee_category_name: string | null;
  type: string;
  amount: string;
  reason: string;
  created_at: string;
}

export interface PaymentDashboard {
  totalRevenue: number;
  expectedRevenue: number;
  collectedRevenue: number;
  outstandingPayments: number;
  pendingVerification: number;
  pendingVerificationCount: number;
  refundedAmount: number;
  refundedCount: number;
  paymentSuccessRate: number;
  recentTransactions: Payment[];
  dailyRevenue: { day: string; total: number }[];
}

export interface PaymentAnalytics {
  paymentMethodDistribution: { method: PaymentMethod; count: number; total: number }[];
  revenueByFeeType: { feeCategoryId: number; feeCategoryName: string; total: number }[];
  revenueByDate: { day: string; total: number }[];
  refundTrends: { day: string; total: number }[];
  collectionRate: number;
  outstandingBalance: number;
}

export interface DelegatePaymentSummary {
  paymentRequired: boolean;
  currency: string;
  feeCategories: FeeCategory[];
  payments: Payment[];
  discounts: Discount[];
  status: DerivedPaymentStatus;
}

export interface AssignmentAnalytics {
  totalApproved: number;
  assignedCount: number;
  unassignedCount: number;
  committeeFillRate: {
    committeeId: number;
    committeeName: string;
    capacity: number | null;
    assigned: number;
    fillRate: number | null;
  }[];
}

export interface Award {
  id: number;
  conference_id: number;
  delegate_id: number;
  delegate_name: string;
  committee_id: number | null;
  committee_name: string | null;
  portfolio_id: number | null;
  portfolio_name: string | null;
  category: string;
  citation: string | null;
  created_at: string;
}

export type CertificateType = "participation" | "award" | "workshop_participation" | "custom";

export interface CertificateTemplate {
  id: number;
  organization_id: number;
  name: string;
  certificate_type: CertificateType;
  title: string;
  body_text: string;
  signatory_name: string | null;
  signatory_title: string | null;
  accent_color: string;
  status: "active" | "archived";
}

export interface Certificate {
  id: number;
  certificate_number: string;
  conference_id: number;
  delegate_id: number;
  delegate_name?: string;
  delegate_email?: string;
  template_id: number;
  template_name?: string;
  template_title?: string;
  award_id: number | null;
  certificate_type: CertificateType;
  issued_at: string;
  download_count: number;
  last_downloaded_at: string | null;
}

export interface CertificateStats {
  totalCertificates: number;
  downloadedCount: number;
  totalDownloads: number;
}

export interface DelegateResults {
  resultsPublished: boolean;
  resultsPublishedAt: string | null;
  ownAwards: Award[];
  allAwards: Award[];
}

export interface CheckinToken {
  token: string;
  qrDataUrl: string;
}

export interface AttendanceRosterEntry {
  delegateId: number;
  delegateName: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  method: "manual" | "qr_token" | null;
}

export interface AttendanceEventAnalytics {
  scheduleEventId: number;
  title: string;
  type: string;
  startTime: string;
  checkedInCount: number;
  expectedCount: number;
  attendanceRate: number;
}

export interface AttendanceAnalytics {
  events: AttendanceEventAnalytics[];
  overallAttendanceRate: number;
}

export interface CertificateVerification {
  valid: boolean;
  certificateNumber?: string;
  delegateName?: string;
  conferenceName?: string;
  certificateType?: CertificateType;
  issuedAt?: string;
}
