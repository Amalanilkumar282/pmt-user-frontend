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
    const result = !!(this.team && this.team.lead && this.team.lead.id === memberId);
    if (result) {
      console.log('  Current lead detected:', memberId);
    }
    return result;
  }

  isCurrentMember(memberId: string): boolean {
    const result = !!(this.team && this.team.members && this.team.members.some(m => m && m.id === memberId));
    if (result) {
      console.log('  Current member detected:', memberId);
    }
    return result;
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
    console.log('🔄 Initializing form - Mode:', this.mode);
    console.log('🔄 Team data:', this.team);
    console.log('🔄 Team lead:', this.team?.lead);
    console.log('🔄 Team lead ID:', this.team?.lead?.id);
    console.log('🔄 Team lead projectMemberId:', this.team?.lead?.projectMemberId);
    console.log('🔄 Available members:', this.availableMembers.map(m => ({ 
      id: m.id, 
      name: m.name, 
      projectMemberId: m.projectMemberId 
    })));
    
    // Initialize form with team data (works for both create and edit)
    const leadId = this.team?.lead?.id || '';
    console.log('🔄 Setting leadId to:', leadId);
    
    this.teamForm = this.fb.group({
      name: [this.team?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [this.team?.description || '', [Validators.required, Validators.minLength(10)]],
      leadId: [leadId, Validators.required],
      tags: [this.team?.tags?.join(', ') || ''],
      status: [this.team?.status || 'Active'],
    });

    if (this.team && this.team.lead && this.team.members) {
      console.log('✅ Setting edit mode data:');
      console.log('  - Lead ID:', this.team.lead.id);
      console.log('  - Lead name:', this.team.lead.name);
      console.log('  - All members:', this.team.members.map(m => ({ id: m.id, name: m.name })));
      
      // Filter out the lead from members list to get just the regular members
      const memberIds = this.team.members
        .filter(m => m && m.id && m.id !== this.team!.lead.id)
        .map(m => m.id);
      
      console.log('  - Selected member IDs (excluding lead):', memberIds);
      this.selectedMemberIds.set(memberIds);
      
      // Mark the form as pristine after setting initial values (so it's valid but not dirty)
      this.teamForm.markAsPristine();
      this.teamForm.markAsUntouched();
      
      console.log('  - Form leadId value:', this.teamForm.get('leadId')?.value);
      console.log('  - Form valid:', this.teamForm.valid);
      console.log('  - Lead control valid:', this.teamForm.get('leadId')?.valid);
      
      // Log full form status for debugging
      setTimeout(() => this.logFormStatus(), 100);
    } else {
      console.log('➕ Create mode - resetting selected members');
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
    const selected = this.teamForm?.get('leadId')?.value === memberId;
    return selected;
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

      console.log('Edit mode - updatedBy:', updatedBy);
      console.log('Edit mode - status value:', formValue.status);
      console.log('Edit mode - formValue.leadId:', formValue.leadId);
      console.log('Edit mode - Available members:', this.availableMembers);

      if (updatedBy === 0) {
        alert('Unable to update team: User not logged in. Please refresh the page and try again.');
        return;
      }

      // Find lead member - ensure string comparison
      const leadMember = this.availableMembers.find(m => m.id === String(formValue.leadId));
      const selectedMembers = this.availableMembers.filter(m => this.selectedMemberIds().includes(m.id));

      console.log('Edit mode - Found lead member:', leadMember);
      console.log('Edit mode - Selected members:', selectedMembers);

      if (!leadMember) {
        console.error('❌ Lead member not found in available members!');
        console.error('Looking for ID:', formValue.leadId);
        console.error('Available member IDs:', this.availableMembers.map(m => ({ 
          id: m.id, 
          name: m.name, 
          email: m.email,
          projectMemberId: m.projectMemberId 
        })));
        
        // Try to find by email as fallback
        const leadByEmail = this.availableMembers.find(m => m.email === formValue.leadId);
        console.log('🔍 Attempting to find by email:', leadByEmail);
        
        if (leadByEmail) {
          console.log('✅ Found lead by email! Using this member:', leadByEmail);
          // Use the member found by email
          const dto: UpdateTeamDto = {
            name: formValue.name,
            description: formValue.description,
            leadId: leadByEmail.projectMemberId!,
            memberIds: selectedMembers.map(m => m.projectMemberId || 0).filter(id => id !== 0),
            label: tags,
            isActive: formValue.status === 'Active',
            updatedBy: updatedBy,
          };
          console.log('✅ UpdateTeamDto being sent:', dto);
          this.submitForm.emit(dto);
          return;
        }
        
        alert('Unable to update team: Lead member not found. Please select a valid team lead.');
        return;
      }

      if (!leadMember.projectMemberId) {
        console.error('❌ Lead member found but has no projectMemberId!', leadMember);
        alert('Unable to update team: Lead member has invalid data. Please try selecting the lead again.');
        return;
      }

      const dto: UpdateTeamDto = {
        name: formValue.name,
        description: formValue.description,
        leadId: leadMember.projectMemberId,
        memberIds: selectedMembers.map(m => m.projectMemberId || 0).filter(id => id !== 0),
        label: tags,
        isActive: formValue.status === 'Active',
        updatedBy: updatedBy,
      };
      
      console.log('✅ UpdateTeamDto being sent:', dto);
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
  
  // Debug helper
  logFormStatus(): void {
    console.log('📋 Form Status Debug:');
    console.log('  - Form valid:', this.teamForm?.valid);
    console.log('  - Form value:', this.teamForm?.value);
    console.log('  - Name valid:', this.nameControl?.valid, 'Value:', this.nameControl?.value);
    console.log('  - Description valid:', this.descriptionControl?.valid, 'Value:', this.descriptionControl?.value);
    console.log('  - Lead valid:', this.leadControl?.valid, 'Value:', this.leadControl?.value);
    console.log('  - Form errors:', {
      name: this.nameControl?.errors,
      description: this.descriptionControl?.errors,
      lead: this.leadControl?.errors
    });
  }
}
