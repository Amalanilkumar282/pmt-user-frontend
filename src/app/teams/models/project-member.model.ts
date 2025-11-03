export type MemberRole = 'Project Manager' | 'Developer' | 'Designer' | 'QA Tester' | 'DevOps' | 'Business Analyst';
export type MemberStatus = 'Active' | 'Inactive';

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName?: string;
  role: MemberRole; // Role name for display
  roleId: number; // Role ID from backend
  status: MemberStatus;
  joinedDate: string;
  teamId?: string; // If assigned to a team
  teamName?: string;
  avatar?: string;
}

export interface AddMemberDto {
  userId: string;
  projectId: string;
  roleId: number; // Changed from role to roleId
}

export interface UpdateMemberDto {
  roleId?: number; // Changed from role to roleId
  status?: MemberStatus;
  teamId?: string;
}

export interface MemberSearchResult {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  alreadyInProject?: boolean;
}
