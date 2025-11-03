# Board Operations - Backend Integration Guide

## 🔧 CRITICAL FIXES APPLIED (November 2, 2025)

### Issues Fixed:
1. ✅ **Drag-and-Drop Not Working** - `board-column` now calls `updateIssueStatusApi()` with backend integration
2. ✅ **Edit Modal Not Closing** - Modal closes automatically after `onSubmit` callback
3. ✅ **Missing Project Context** - `ProjectContextService` injected into `board-column` component

---

## 🧪 Quick Test (3 Minutes)

### Test 1: Drag-and-Drop ⏱️ 60 seconds
```
1. Open board page
2. Drag issue to different column
3. Check console: "[BoardColumn] Issue status updated successfully"
4. Refresh page
5. ✅ Issue stays in new column
```

### Test 2: Edit Issue ⏱️ 60 seconds
```
1. Click issue card
2. Click "Edit"
3. Change title
4. Click "Save Changes"
5. ✅ Modal closes, title updates
```

### Test 3: Change Assignee ⏱️ 60 seconds
```
1. Click issue card
2. Click "Edit"
3. Open "Assignee" dropdown
4. ✅ See real project members
5. Select member, save
6. ✅ Initials update on card
```

---

## Overview
Successfully integrated all board operations with backend API endpoints. All CRUD operations for issues now call the backend and properly handle success/error states.

## Changes Made

### 1. **IssueApiService** Updates
**File:** `src/app/board/services/issue-api.service.ts`

#### Added Methods:
- `updateIssue(dto: UpdateIssueDto)` - Full issue update via PUT /api/Issue
- `mapIssueToUpdateDto()` - Helper to map frontend Issue partial updates to backend DTO
- Added `labels` field to `UpdateIssueDto` interface

#### Key Features:
- Only sends fields that are explicitly updated (partial updates)
- Converts labels array to JSON string for backend
- Handles date conversions to ISO format
- Maps assignee names to numeric IDs

### 2. **UserApiService** Updates
**File:** `src/app/shared/services/user-api.service.ts`

#### Updated Method:
- `getUsersByProject(projectId)` - Changed endpoint to `/api/User/by-project/{projectId}`
- Maps extended backend user response (with roles, teams) to simplified User interface

### 3. **BoardStore** Updates
**File:** `src/app/board/board-store.ts`

#### Added API Methods:
```typescript
updateIssueStatusApi(issueId, statusId, projectId)  // For drag-and-drop
updateIssueApi(issueId, projectId, updates)         // For issue detail edits
```

#### Key Features:
- Optimistic UI updates after successful API calls
- Proper error handling and logging
- Updates local signal state to reflect changes immediately

### 4. **BoardColumnsContainer** Updates
**File:** `src/app/board/components/board-columns-container/board-columns-container.ts`

#### Enhanced Drag-and-Drop:
- Integrated with `ProjectContextService` to get current project ID
- Calls `updateIssueStatusApi` when issue is dropped in new column
- Uses column's `statusId` (numeric) instead of name-based matching
- **Rollback UI changes** if API call fails
- User-friendly error alerts

#### Key Logic:
```typescript
async onDrop(event: CdkDragDrop<Issue[]>) {
  // 1. Move issue in UI (optimistic update)
  transferArrayItem(...);
  
  // 2. Get target column's statusId
  const targetColumnDef = this.buckets().find(b => b.def.id === event.container.id)?.def;
  
  // 3. Call backend API
  await this.store.updateIssueStatusApi(issue.id, targetColumnDef.statusId, projectId);
  
  // 4. On error: rollback UI and show alert
}
```

### 5. **IssueDetailedView** Updates
**File:** `src/app/backlog/issue-detailed-view/issue-detailed-view.ts`

#### New Features:
- Loads project members via `UserApiService.getUsersByProject()`
- Uses `effect()` to reload members when project changes
- Populates assignee dropdown with real project members (not dummy data)
- Maps assignee names ↔ numeric IDs properly
- Emits `updateIssue` event with proper field mappings

#### Modal Submit Flow:
1. User edits issue in modal (title, description, assignee, dates, etc.)
2. Modal submits form data
3. `onEditIssue()` converts form data to `Partial<Issue>`
4. Maps assignee name back to numeric ID
5. Emits `updateIssue` event to parent (BoardPage)

### 6. **BoardPage** Updates
**File:** `src/app/board/components/board-page/board-page.ts`

#### New Handler:
```typescript
async onUpdateIssue(updates: Partial<Issue>) {
  await this.store.updateIssueApi(issue.id, projectId, updates);
  this.isModalOpen.set(false);  // Close modal on success
}
```

#### Template Binding:
```html
<app-issue-detailed-view
  (updateIssue)="onUpdateIssue($event)"
/>
```

## API Endpoints Used

### 1. **Update Issue**
```
PUT /api/Issue
```
**Request Body:**
```json
{
  "id": "issue-uuid",
  "projectId": "project-uuid",
  "issueType": "TASK",
  "title": "Updated title",
  "description": "Updated description",
  "priority": "HIGH",
  "assigneeId": 5,
  "startDate": "2025-11-02T00:00:00Z",
  "dueDate": "2025-11-10T00:00:00Z",
  "sprintId": "sprint-uuid",
  "storyPoints": 5,
  "epicId": "epic-uuid",
  "reporterId": 1,
  "attachmentUrl": "http://...",
  "statusId": 2,
  "labels": "[\"bug\",\"urgent\"]"
}
```

**Response:**
```json
{
  "status": 200,
  "data": "issue-uuid",
  "message": "Issue updated successfully"
}
```

### 2. **Get Users by Project**
```
GET /api/User/by-project/{projectId}
```

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "id": 5,
      "email": "dev1@company.com",
      "name": "Developer 1",
      "avatarUrl": null,
      "isActive": true,
      "roleId": 4,
      "roleName": "Developer",
      "teams": [
        { "teamId": 1, "teamName": "Team 1" }
      ]
    }
  ],
  "message": "Request processed successfully"
}
```

## User Flows

### Flow 1: Drag-and-Drop Issue to New Status
1. User drags task card from "To Do" column to "In Progress" column
2. `BoardColumnsContainer.onDrop()` is triggered
3. UI optimistically moves the card to new column
4. Backend API called: `PUT /api/Issue` with `statusId: 2` (In Progress)
5. On success: card stays in new column
6. On error: card reverted to original column + error alert shown

### Flow 2: Edit Issue Details
1. User clicks on task card to open issue detail modal
2. `IssueDetailedView` loads project members for assignee dropdown
3. User clicks "Edit" button in modal
4. Edit modal opens with pre-filled data
5. User changes title, assignee, due date
6. User clicks "Save Changes"
7. `IssueDetailedView.onEditIssue()` converts form data to updates
8. Emits `updateIssue` event
9. `BoardPage.onUpdateIssue()` receives event
10. Calls `BoardStore.updateIssueApi()` with partial updates
11. Backend API called: `PUT /api/Issue` with only changed fields
12. On success: modal closes, UI updates
13. On error: error alert shown, modal stays open

### Flow 3: Change Assignee
1. User opens issue detail modal
2. Clicks "Edit"
3. Clicks on "Assignee" dropdown
4. Sees list of real project members (loaded from `/api/User/by-project/{projectId}`)
5. Selects new assignee
6. Clicks "Save"
7. Assignee name is mapped back to numeric ID
8. Backend receives: `{ assigneeId: 10, ... }`
9. Issue updated successfully

## Error Handling

### Drag-and-Drop Error:
```typescript
try {
  await this.store.updateIssueStatusApi(...);
} catch (error) {
  // Rollback UI
  transferArrayItem(
    event.container.data,
    event.previousContainer.data,
    event.currentIndex,
    event.previousIndex
  );
  alert('Failed to update issue status. Please try again.');
}
```

### Issue Update Error:
```typescript
try {
  await this.store.updateIssueApi(...);
  this.isModalOpen.set(false);
} catch (error) {
  console.error('Failed to update issue:', error);
  alert('Failed to update issue. Please try again.');
  // Modal stays open for retry
}
```

## Testing Checklist

- [ ] **Drag-and-Drop Test**
  1. Start dev server and log in
  2. Navigate to a project board
  3. Drag an issue from one column to another
  4. Verify issue moves in UI
  5. Check browser console for successful API call
  6. Refresh page - issue should stay in new column (persisted)

- [ ] **Title Edit Test**
  1. Click on an issue card
  2. Click "Edit" button
  3. Change the title
  4. Click "Save Changes"
  5. Verify modal closes and title updates in card
  6. Refresh page - new title should persist

- [ ] **Description Edit Test**
  1. Open issue detail modal
  2. Click "Edit"
  3. Change description
  4. Save and verify

- [ ] **Assignee Change Test**
  1. Open issue detail modal
  2. Click "Edit"
  3. Click "Assignee" dropdown
  4. Verify you see real project members (not dummy data)
  5. Select new assignee
  6. Save and verify assignee updates

- [ ] **Due Date Change Test**
  1. Open issue detail modal
  2. Click "Edit"
  3. Change due date
  4. Save and verify

- [ ] **Error Rollback Test**
  1. Turn off backend server
  2. Try to drag-and-drop an issue
  3. Verify issue reverts to original column
  4. Verify error alert is shown

- [ ] **Project Members Loading Test**
  1. Open issue detail modal in different projects
  2. Verify assignee dropdown shows members specific to each project
  3. Check console for API calls to `/api/User/by-project/{projectId}`

## Debugging Tips

### Enable Detailed Logging:
All operations log to browser console with `[BoardStore]`, `[BoardColumnsContainer]`, `[IssueDetailedView]` prefixes.

### Common Issues:

1. **Issue not updating after drag-and-drop:**
   - Check browser console for API errors
   - Verify `statusId` exists on column definition
   - Confirm project ID is available in context

2. **Assignee dropdown empty:**
   - Check API response from `/api/User/by-project/{projectId}`
   - Verify project ID is correct
   - Check browser console for UserApiService errors

3. **Updates not persisting:**
   - Verify backend API is returning 200 status
   - Check that issue ID and project ID are UUIDs (correct format)
   - Confirm authorization token is valid

## Next Steps

1. Run full test suite (use checklist above)
2. Add unit tests for new methods
3. Consider adding loading spinners during API calls
4. Add toast notifications instead of alert() for better UX
5. Implement optimistic updates for all fields (not just status)
6. Add undo/redo functionality

## Files Modified

1. `src/app/board/services/issue-api.service.ts`
2. `src/app/shared/services/user-api.service.ts`
3. `src/app/board/board-store.ts`
4. `src/app/board/components/board-columns-container/board-columns-container.ts`
5. `src/app/backlog/issue-detailed-view/issue-detailed-view.ts`
6. `src/app/board/components/board-page/board-page.ts`
7. `src/app/board/components/board-page/board-page.html`

---

**Integration completed:** November 2, 2025
**Status:** ✅ Ready for testing
