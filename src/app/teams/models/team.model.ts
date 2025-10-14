export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Team Lead' | 'Developer' | 'Designer' | 'Tester' | 'Product Owner' | 'Scrum Master';
  avatar?: string;
  joinedDate: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  projectId: string;
  projectName?: string;
  lead: TeamMember;
  members: TeamMember[];
  activeSprints: string[];
  createdAt: string;
  updatedAt: string;
  status: 'Active' | 'Inactive';
  tags?: string[];
}

export interface TeamStats {
  totalMembers: number;
  activeSprints: number;
  completedSprints: number;
  totalIssues: number;
  completedIssues: number;
  velocity: number;
}

export interface CreateTeamDto {
  name: string;
  description: string;
  projectId: string;
  leadId: string;
  memberIds: string[];
  tags?: string[];
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  leadId?: string;
  memberIds?: string[];
  status?: 'Active' | 'Inactive';
  tags?: string[];
}
