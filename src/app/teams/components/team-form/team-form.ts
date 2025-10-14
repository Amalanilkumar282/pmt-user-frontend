import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
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
export class TeamFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() team: Team | null = null;
  @Input() availableMembers: TeamMember[] = [];
  @Input() projectId: string = '1';
  
  @Output() submitForm = new EventEmitter<CreateTeamDto | UpdateTeamDto>();
  @Output() cancel = new EventEmitter<void>();

  teamForm!: FormGroup;
  selectedMemberIds = signal<string[]>([]);

  constructor(private fb: FormBuilder) {}

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
      this.selectedMemberIds.set(
        this.team.members.filter(m => m.id !== this.team!.lead.id).map(m => m.id)
      );
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

    if (this.mode === 'create') {
      const dto: CreateTeamDto = {
        name: formValue.name,
        description: formValue.description,
        projectId: this.projectId,
        leadId: formValue.leadId,
        memberIds: this.selectedMemberIds(),
        tags,
      };
      this.submitForm.emit(dto);
    } else {
      const dto: UpdateTeamDto = {
        name: formValue.name,
        description: formValue.description,
        leadId: formValue.leadId,
        memberIds: this.selectedMemberIds(),
        status: formValue.status,
        tags,
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
