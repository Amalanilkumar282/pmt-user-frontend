export type MemberRole = 'Project Manager' | 'Developer' | 'Designer' | 'QA Tester' | 'DevOps' | 'Business Analyst';
export type MemberStatus = 'Active' | 'Inactive';

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  projectId: string;
  projectName?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedDate: string;
  teamId?: string; // If assigned to a team
  teamName?: string;
  avatar?: string;
}

export interface AddMemberDto {
  userId: string;
  projectId: string;
  role: MemberRole;
}

export interface UpdateMemberDto {
  role?: MemberRole;
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
