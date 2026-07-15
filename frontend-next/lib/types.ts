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
