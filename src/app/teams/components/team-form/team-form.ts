import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamMember, CreateTeamDto, UpdateTeamDto, Team } from '../../models/team.model';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './team-form.html',
  styleUrls: ['./team-form.css'],
})
export class TeamFormComponent implements OnInit, OnChanges {
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['team']) {
      this.initForm();
      this.cdr.detectChanges();
    }
  }
  isCurrentLead(memberId: string): boolean {
    return !!(this.team && this.team.lead && this.team.lead.id === memberId);
  }

  isCurrentMember(memberId: string): boolean {
    return !!(this.team && this.team.members && this.team.members.some(m => m && m.id === memberId));
  }
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() team: Team | null = null;
  @Input() availableMembers: TeamMember[] = [];
  @Input() projectId: string = '1';
  
  @Output() submitForm = new EventEmitter<CreateTeamDto | UpdateTeamDto>();
  @Output() cancel = new EventEmitter<void>();

  teamForm!: FormGroup;
  selectedMemberIds = signal<string[]>([]);

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.teamForm = this.fb.group({
      name: [this.team?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [this.team?.description || '', [Validators.required, Validators.minLength(10)]],
      leadId: [this.team?.lead.id || '', Validators.required],
      tags: [this.team?.tags?.join(', ') || ''],
      status: [this.team?.status || 'Active'],
    });

    if (this.team) {
      console.log('Team data:', this.team);
      console.log('Lead ID:', this.team.lead.id);
      console.log('Members:', this.team.members);
      
      const memberIds = this.team.members.filter(m => m.id !== this.team!.lead.id).map(m => m.id);
      console.log('Selected member IDs:', memberIds);
      this.selectedMemberIds.set(memberIds);
    } else {
      this.selectedMemberIds.set([]);
    }
  }

  toggleMember(memberId: string): void {
    const current = this.selectedMemberIds();
    if (current.includes(memberId)) {
      this.selectedMemberIds.set(current.filter(id => id !== memberId));
    } else {
      this.selectedMemberIds.set([...current, memberId]);
    }
  }

  isMemberSelected(memberId: string): boolean {
    return this.selectedMemberIds().includes(memberId);
  }

  isLeadSelected(memberId: string): boolean {
    return this.teamForm.get('leadId')?.value === memberId;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      Object.keys(this.teamForm.controls).forEach(key => {
        this.teamForm.controls[key].markAsTouched();
      });
      return;
    }

    const formValue = this.teamForm.value;
    const tags = formValue.tags
      ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
      : [];

    // Find the selected lead and members to get their projectMemberIds
    const leadMember = this.availableMembers.find(m => m.id === formValue.leadId);
    const selectedMembers = this.availableMembers.filter(m => this.selectedMemberIds().includes(m.id));

    console.log('Form submission - Lead member:', leadMember);
    console.log('Form submission - Selected members:', selectedMembers);
    console.log('Form submission - Available members:', this.availableMembers);

    if (this.mode === 'create') {
      // Get createdBy from session storage
      let createdBy = 0;
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const userId = sessionStorage.getItem('userId');
        createdBy = userId ? parseInt(userId, 10) : 0;
      }

      const dto: CreateTeamDto = {
        name: formValue.name,
        description: formValue.description,
        projectId: this.projectId,
        leadId: leadMember?.projectMemberId || 0,
        memberIds: selectedMembers.map(m => m.projectMemberId || 0),
        label: tags,
        createdBy: createdBy,
      };
      console.log('CreateTeamDto being sent:', dto);
  this.submitForm.emit(dto);
    } else {
      // Get updatedBy from session storage
      let updatedBy = 0;
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        const userId = sessionStorage.getItem('userId');
        updatedBy = userId ? parseInt(userId, 10) : 0;
      }

      const leadMember = this.availableMembers.find(m => m.id === formValue.leadId);
      const selectedMembers = this.availableMembers.filter(m => this.selectedMemberIds().includes(m.id));

      const dto: UpdateTeamDto = {
        name: formValue.name,
        description: formValue.description,
        leadId: leadMember?.projectMemberId || 0,
        memberIds: selectedMembers.map(m => m.projectMemberId || 0),
        label: tags,
        isActive: formValue.status === 'Active',
        updatedBy: updatedBy,
      };
      this.submitForm.emit(dto);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get nameControl() {
    return this.teamForm.get('name');
  }

  get descriptionControl() {
    return this.teamForm.get('description');
  }

  get leadControl() {
    return this.teamForm.get('leadId');
  }
}
