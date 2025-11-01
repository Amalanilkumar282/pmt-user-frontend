# Create Sprint Modal - Quick Reference

## 🚀 Quick Start

### Opening the Modal

```typescript
// In backlog-page.ts
handleCreateSprint() {
  this.isCreateSprintModalOpen = true;
}
```

### In Template

```html
<app-create-sprint-modal
  [isOpen]="isCreateSprintModalOpen"
  projectId="f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01"
  (close)="onCloseCreateSprintModal()"
  (sprintCreated)="onSprintCreated($event)"
>
</app-create-sprint-modal>
```

---

## 📋 Form Fields

| Field               | Type     | Required | Description                |
| ------------------- | -------- | -------- | -------------------------- |
| Sprint Name         | text     | ✅       | Name of the sprint         |
| Sprint Goal         | textarea | ❌       | Goal/objective             |
| Start Date          | date     | ✅       | Sprint start date          |
| End Date            | date     | ✅       | Sprint end date            |
| Status              | select   | ❌       | PLANNED, ACTIVE, COMPLETED |
| Target Story Points | number   | ❌       | Default: 40                |
| Team                | select   | ✅       | Team dropdown (dynamic)    |

---

## 🔄 Modal States

```typescript
enum ModalState {
  FORM = 'form', // Section 1
  AI_LOADING = 'ai_loading', // Section 2
  AI_RESULTS = 'ai_results', // Section 3
}
```

### State Flow

```
FORM → (Create Sprint) → AI_LOADING → (AI Response) → AI_RESULTS
  ↓                           ↓                           ↓
Close                      Skip AI                    Discard/Add
```

---

## 🛠️ Service Methods

### Sprint Service (`sprint.service.ts`)

```typescript
// Fetch teams
getTeamsByProject(projectId: string): Observable<TeamsApiResponse>

// Create sprint
createSprint(sprint: SprintRequest): Observable<SprintResponse>

// Generate AI plan
generateAISprintPlan(
  projectId: string,
  request: AISprintPlanRequest
): Observable<AISprintPlanResponse>

// Create issues
createIssue(issue: IssueCreateRequest): Observable<IssueCreateResponse>
createBulkIssues(issues: IssueCreateRequest[]): Observable<IssueCreateResponse[]>
```

---

## 🎨 Component Inputs/Outputs

### Inputs

```typescript
@Input() isOpen = false;
@Input() projectId = 'f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01';
```

### Outputs

```typescript
@Output() close = new EventEmitter<void>();
@Output() sprintCreated = new EventEmitter<any>();
```

---

## ⚙️ Key Methods

### Form Handling

```typescript
onSubmitForm(); // Validate & create sprint
validateForm(); // Form validation
```

### API Integration

```typescript
createSprint(); // POST /api/sprints
generateAIPlan(); // POST /api/sprints/projects/{id}/ai-plan
addSuggestedIssues(); // POST /api/Issue (bulk)
```

### User Actions

```typescript
skipAI(); // Skip AI suggestions
discardSuggestions(); // Close without adding issues
removeIssue(index); // Delete issue from list
getTotalStoryPoints(); // Calculate total points
```

---

## 📡 API Endpoints

### 1. Get Teams

```
GET /api/Team/project/{projectId}
Authorization: Bearer <token>
```

### 2. Create Sprint

```
POST /api/sprints
Authorization: Bearer <token>
Body: SprintRequest
```

### 3. AI Sprint Plan

```
POST /api/sprints/projects/{projectId}/ai-plan
Authorization: Bearer <token>
Body: AISprintPlanRequest
```

### 4. Create Issue

```
POST /api/Issue
Authorization: Bearer <token>
Body: IssueCreateRequest
```

---

## 🎯 Validation Rules

```typescript
// Required fields
✅ sprintName.trim() !== ''
✅ startDate !== ''
✅ endDate !== ''
✅ teamId !== ''

// Date validation
✅ endDate > startDate
```

---

## 🚨 Error Handling

### Toast Messages

```typescript
// Success
toastService.success('Sprint created successfully!');
toastService.success('N issues added to sprint successfully!');

// Errors
toastService.error('Sprint name is required');
toastService.error('End date must be after start date');
toastService.error('Failed to create sprint');
toastService.error('Failed to load teams');

// Info
toastService.info('Sprint created without AI suggestions');
toastService.info('Sprint created without adding suggested issues');
```

---

## 💡 Usage Examples

### Basic Usage

```typescript
// 1. User clicks "Create Sprint"
handleCreateSprint() {
  this.isCreateSprintModalOpen = true;
}

// 2. Modal opens, loads teams
ngOnInit() {
  this.loadTeams();
}

// 3. User fills form and submits
onSubmitForm() {
  if (this.validateForm()) {
    this.createSprint();
  }
}

// 4. Sprint created, AI suggestions fetched
createSprint() {
  this.sprintService.createSprint(request).subscribe(() => {
    this.generateAIPlan();
  });
}

// 5. User adds issues
addSuggestedIssues() {
  this.sprintService.createBulkIssues(requests).subscribe(() => {
    this.toastService.success('Issues added!');
    this.closeModal();
  });
}
```

---

## 🎨 Styling Classes

### Modal Structure

```css
.modal-backdrop       // Overlay
.modal-container      // Modal box
.modal-header         // Top section
.modal-body           // Content area
.modal-footer         // Action buttons;
```

### Form Elements

```css
.form-group          // Field wrapper
.form-label          // Field label
.form-input          // Text input
.form-textarea       // Textarea
.form-select         // Dropdown
.required            // * indicator;
```

### AI Section

```css
.loading-container   // Loader wrapper
.spinner             // Loading spinner
.ai-thinking-icon    // 🤖 emoji
.ai-summary          // Summary card
.issues-list         // Issues container
.issue-card          // Individual issue
.total-points        // Story points display;
```

---

## 🔧 Configuration

### Static Project ID

```typescript
// TODO: Replace with dynamic value from route
projectId = 'f3a2b1c4-9f6d-4e1a-9b89-7b2f3c8d9a01';
```

### Default Values

```typescript
formData = {
  sprintName: '',
  sprintGoal: '',
  startDate: '',
  endDate: '',
  targetStoryPoints: 40,
  teamId: '',
  status: 'PLANNED',
};
```

---

## 🧪 Testing Checklist

### Form Tests

- [ ] Open modal
- [ ] Load teams
- [ ] Validate required fields
- [ ] Validate date range
- [ ] Submit form

### API Tests

- [ ] Teams fetch success
- [ ] Sprint creation success
- [ ] AI planning success
- [ ] Issue creation success
- [ ] Handle API errors

### UI Tests

- [ ] Modal animations
- [ ] Loading states
- [ ] Delete issue button
- [ ] Story points calculation
- [ ] Responsive layout

---

## 📝 Code Snippets

### Create Sprint Request

```typescript
const sprintRequest: SprintRequest = {
  projectId: this.projectId,
  sprintName: this.formData.sprintName,
  sprintGoal: this.formData.sprintGoal || null,
  teamAssigned: parseInt(this.formData.teamId),
  startDate: this.formData.startDate,
  dueDate: this.formData.endDate,
  status: this.formData.status,
  storyPoint: this.formData.targetStoryPoints,
};
```

### AI Plan Request

```typescript
const aiRequest: AISprintPlanRequest = {
  sprintName: this.formData.sprintName,
  sprintGoal: this.formData.sprintGoal,
  startDate: this.formData.startDate,
  endDate: this.formData.endDate,
  targetStoryPoints: this.formData.targetStoryPoints,
  teamId: this.formData.teamId,
};
```

### Issue Creation Request

```typescript
const issueRequests = this.aiSuggestions.map((issue) => ({
  title: issue.issueKey,
  description: issue.rationale,
  issueType: 'Story',
  priority: 'MEDIUM',
  storyPoints: issue.storyPoints,
  assigneeId: issue.suggestedAssigneeId.toString(),
  projectId: this.projectId,
  labels: ['AI-Suggested', this.formData.sprintName],
}));
```

---

## 🔍 Debugging

### Console Logs

```typescript
console.log('Teams loaded:', this.teams);
console.log('Sprint created:', response);
console.log('AI suggestions received:', this.aiSuggestions);
console.log('Issues created:', responses);
```

### Error Tracking

```typescript
console.error('Error loading teams:', error);
console.error('Error creating sprint:', error);
console.error('Error generating AI plan:', error);
console.error('Error creating issues:', error);
```

---

## 📚 Related Files

```
src/app/
├── backlog/
│   ├── create-sprint-modal/
│   │   ├── create-sprint-modal.ts
│   │   ├── create-sprint-modal.html
│   │   └── create-sprint-modal.css
│   └── backlog-page/
│       ├── backlog-page.ts
│       └── backlog-page.html
└── sprint/
    └── sprint.service.ts
```

---

## ⚡ Performance Tips

1. **Teams Loading**

   - Cache teams data
   - Load on modal open, not on every render

2. **AI Suggestions**

   - Show loading state immediately
   - Provide skip option

3. **Bulk Issues**

   - Create in parallel
   - Show progress indicator

4. **Modal Animations**
   - Use CSS transitions
   - Avoid heavy JS animations

---

## 🎓 Best Practices

1. ✅ Always validate form data
2. ✅ Handle all API errors
3. ✅ Show loading states
4. ✅ Provide user feedback (toasts)
5. ✅ Clean up on modal close
6. ✅ Use TypeScript interfaces
7. ✅ Document TODOs in code
8. ✅ Follow existing patterns

---

**Last Updated:** November 1, 2025
