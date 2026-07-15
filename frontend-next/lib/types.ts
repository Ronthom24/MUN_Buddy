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
