# Board Backend Integration Plan

## Current State Analysis

### Existing Implementation
1. **Board API Service** (`board-api.service.ts`) - Partially implemented with API endpoints
2. **Board Service** (`board.service.ts`) - Has signal-based state management
3. **Board Store** (`board-store.ts`) - Manages issues, sprints, and filtering
4. **Board Components** - UI components for board display and interaction

### Issues Identified
1. **Emoji Usage in Logs** - Console logs contain emojis (need removal)
2. **Model Mismatches** - Frontend Board model doesn't fully align with API BoardApi interface
3. **Column Management** - Column CRUD operations not fully integrated
4. **Status Mapping** - Status IDs need proper mapping between frontend and backend
5. **User Context** - Missing user ID context for create/update/delete operations

## Integration Steps

### Phase 1: Clean Up and Prepare (Priority: HIGH)
**Goal:** Remove emojis, fix logging, align models

#### Step 1.1: Remove Emoji Logging
- Files to update:
  - `src/app/board/board-store.ts`
  - `src/app/board/services/board.service.ts`
  - `src/app/board/components/board-page/board-page.ts`
  - All other board-related files
- Replace emoji logs with clean text prefixes like:
  - `[BoardStore]`, `[BoardService]`, `[BoardPage]`
  - `INFO:`, `ERROR:`, `WARN:`

#### Step 1.2: Align Board Models
- Update `Board` interface to include:
  - `id` as number (from API)
  - `description` field
  - `isActive` field
  - `metadata` field (optional)
  - `type` as string ('scrum', 'kanban', 'custom')
- Add proper type conversions in mapping functions

#### Step 1.3: Create User Context Service
- Create `src/app/shared/services/user-context.service.ts`
- Store current user ID from session/token
- Provide methods: `getCurrentUserId()`, `getCurrentUserEmail()`

### Phase 2: Board Management Integration (Priority: HIGH)
**Goal:** Connect board CRUD operations to backend

#### Step 2.1: Load Boards by Project
- Update `BoardService.loadBoardsByProject()`
- Already partially implemented - needs testing
- Add error handling and fallback logic

#### Step 2.2: Load Single Board with Columns
- Update `BoardService.loadBoardById()`
- Fetch board details including columns
- Update local cache properly

#### Step 2.3: Create Board Integration
- Implement `BoardService.createBoard()` method
- Connect to POST `/api/Board`
- Add board to local cache after creation
- Navigate to new board after creation

#### Step 2.4: Update Board Integration
- Implement `BoardService.updateBoard()` method
- Connect to PUT `/api/Board/{boardId}`
- Update local cache
- Show success notification

#### Step 2.5: Delete Board Integration
- Implement `BoardService.deleteBoard()` method
- Connect to DELETE `/api/Board/{boardId}`
- Remove from local cache
- Redirect to project boards list

### Phase 3: Column Management Integration (Priority: HIGH)
**Goal:** Enable dynamic column management

#### Step 3.1: Load Board Columns
- Use existing `getBoardColumns()` in `BoardApiService`
- Update `BoardStore.columns` signal when board changes
- Sync with backend column order/position

#### Step 3.2: Create Column
- Create UI component/modal for adding columns
- Implement `BoardService.createColumn()` method
- Connect to POST `/api/Board/column`
- Update board columns in cache
- Refresh board view

#### Step 3.3: Update Column
- Enable inline column editing (name, color)
- Implement column reordering (drag-drop)
- Implement `BoardService.updateColumn()` method
- Connect to PUT `/api/Board/column/{columnId}`
- Update local state

#### Step 3.4: Delete Column
- Add delete button/confirmation for columns
- Implement `BoardService.deleteColumn()` method
- Connect to DELETE `/api/Board/column/{columnId}`
- Handle issues in deleted column (move to default)
- Update local state

### Phase 4: Status Integration (Priority: MEDIUM)
**Goal:** Properly map status between frontend and backend

#### Step 4.1: Create Status Service
- Create `src/app/shared/services/status.service.ts`
- Fetch available statuses from backend
- Cache status list locally
- Provide status lookup methods

#### Step 4.2: Status Mapping in Columns
- Map `statusId` from API to frontend status enum
- Update `mapColumnApiToColumnDef()` to use proper status mapping
- Ensure backward compatibility

#### Step 4.3: Issue Status Updates
- Update `BoardStore.updateIssueStatusApi()` to use statusId
- Map frontend status to backend statusId before API call

### Phase 5: Board Routing and Navigation (Priority: MEDIUM)
**Goal:** Implement proper routing for boards

#### Step 5.1: Update Board Routes
- Current route: `/board/:projectId`
- Add route: `/board/:projectId/:boardId`
- Add route: `/board/:projectId/create`
- Handle default board selection

#### Step 5.2: Board Selection Component
- Create board switcher dropdown in toolbar
- List all project boards
- Highlight current board
- Allow quick switching

#### Step 5.3: Default Board Logic
- If no boardId in route, select default:
  - First team board for team members
  - First project board for project view
  - Create prompt if no boards exist

### Phase 6: Board Creation Workflow (Priority: MEDIUM)
**Goal:** Complete board creation flow

#### Step 6.1: Create Board Modal
- Design modal with form:
  - Board name (required)
  - Description
  - Type: Scrum / Kanban / Custom
  - Team selection (optional)
  - Column template selection
- Validate inputs

#### Step 6.2: Board Templates
- Define default column sets:
  - Scrum: To Do, In Progress, In Review, Done
  - Kanban: Backlog, To Do, In Progress, Done
  - Custom: Allow user to select/create columns
- Pre-populate column data

#### Step 6.3: Create Board API Call
- Call `createBoard()` with user input
- Handle success: navigate to new board
- Handle errors: show validation messages

### Phase 7: Board Settings and Configuration (Priority: LOW)
**Goal:** Enable board customization

#### Step 7.1: Board Settings Modal
- Access from board toolbar
- Edit board name, description
- Change board type
- Associate/disassociate team
- Activate/deactivate board

#### Step 7.2: Column Configuration
- Add/edit/delete columns
- Reorder columns (drag-drop)
- Set column colors
- Map to status

#### Step 7.3: Save Settings
- Update board via API
- Show confirmation
- Reload board data

### Phase 8: Team Board Integration (Priority: LOW)
**Goal:** Integrate team-specific boards

#### Step 8.1: Team Context in Boards
- Filter boards by team in board service
- Show team name in board header
- Link to team page

#### Step 8.2: Team Board Sprint Integration
- Show active sprint issues by default
- Allow sprint selection in team boards
- Sync with sprint service

### Phase 9: Testing and Error Handling (Priority: HIGH)
**Goal:** Ensure robustness

#### Step 9.1: Add Comprehensive Error Handling
- Network errors
- Authorization errors (401, 403)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)

#### Step 9.2: Add Loading States
- Show loading spinners during API calls
- Disable actions during loading
- Show skeleton screens

#### Step 9.3: Add Success Notifications
- Board created
- Board updated
- Board deleted
- Column created/updated/deleted

#### Step 9.4: Update Tests
- Update existing tests to use new API integration
- Add integration tests for API calls
- Mock API responses in tests

### Phase 10: Performance Optimization (Priority: LOW)
**Goal:** Improve performance

#### Step 10.1: Implement Caching Strategy
- Cache boards list per project
- Invalidate cache on create/update/delete
- Set cache expiry time

#### Step 10.2: Optimize API Calls
- Avoid redundant API calls
- Use query params for filtering
- Implement pagination if needed

## Implementation Order (Recommended)

### Week 1: Foundation
1. Phase 1.1: Remove emoji logging (2 hours)
2. Phase 1.2: Align board models (3 hours)
3. Phase 1.3: Create user context service (2 hours)
4. Phase 2.1-2.2: Load boards integration (4 hours)

### Week 2: Core Board Operations
1. Phase 2.3: Create board integration (4 hours)
2. Phase 2.4: Update board integration (3 hours)
3. Phase 2.5: Delete board integration (2 hours)
4. Phase 6.1-6.3: Board creation workflow (6 hours)

### Week 3: Column Management
1. Phase 3.1: Load columns integration (2 hours)
2. Phase 3.2: Create column (4 hours)
3. Phase 3.3: Update column (4 hours)
4. Phase 3.4: Delete column (3 hours)

### Week 4: Status and Navigation
1. Phase 4.1-4.3: Status integration (5 hours)
2. Phase 5.1-5.3: Board routing and navigation (6 hours)

### Week 5: Settings and Polish
1. Phase 7.1-7.3: Board settings (6 hours)
2. Phase 9.1-9.3: Error handling and notifications (5 hours)

### Week 6: Team Integration and Testing
1. Phase 8.1-8.2: Team board integration (4 hours)
2. Phase 9.4: Update tests (6 hours)
3. Phase 10.1-10.2: Performance optimization (4 hours)

## Technical Considerations

### API Response Structure
```typescript
interface ApiResponse<T> {
  status: number;
  data: T;
  message: string;
}
```

### Error Response Structure
```typescript
interface ApiError {
  status: number;
  data: string | null;
  message: string;
}
```

### Authentication
- All API calls require Bearer token
- Token stored in sessionStorage as 'accessToken'
- Handle 401 responses by redirecting to login

### Status Mapping
Backend status table has IDs:
- 1: To Do
- 2: In Progress
- 3: In Review
- 4: Done
- 5: On Hold
- etc.

Frontend should maintain this mapping or fetch from API.

## Files to Create/Update

### New Files to Create
1. `src/app/shared/services/user-context.service.ts`
2. `src/app/shared/services/status.service.ts`
3. `src/app/board/components/create-board-modal/create-board-modal.ts`
4. `src/app/board/components/board-settings-modal/board-settings-modal.ts`
5. `src/app/board/components/board-selector/board-selector.ts`
6. `src/app/board/models/status.model.ts`

### Files to Update
1. `src/app/board/models/board.model.ts` - Align with API
2. `src/app/board/models/api-interfaces.ts` - Add missing interfaces
3. `src/app/board/services/board.service.ts` - Add CRUD methods
4. `src/app/board/services/board-api.service.ts` - Complete implementation
5. `src/app/board/board-store.ts` - Remove emojis, integrate columns
6. `src/app/board/components/board-page/board-page.ts` - Add board loading
7. `src/app/board/components/board-toolbar/board-toolbar.ts` - Add board selector
8. `src/app/board/app.routes.ts` - Add board routes

## Success Criteria

- [ ] All emoji logging removed
- [ ] Board models aligned with API
- [ ] User context service implemented
- [ ] Load boards by project working
- [ ] Create board working with proper navigation
- [ ] Update board working with notifications
- [ ] Delete board working with confirmation
- [ ] Load board columns working
- [ ] Create column working with UI
- [ ] Update column (name, color, position) working
- [ ] Delete column working with issue handling
- [ ] Status service implemented and integrated
- [ ] Board routing working with proper defaults
- [ ] Board selector/switcher working
- [ ] Error handling comprehensive
- [ ] Loading states implemented
- [ ] All tests passing
- [ ] No console errors in production mode

## Risk Mitigation

1. **Breaking Changes**: Test thoroughly before deploying to production
2. **Data Loss**: Implement confirmation dialogs for delete operations
3. **Performance**: Monitor API response times, implement caching
4. **User Experience**: Provide clear feedback for all operations
5. **Backwards Compatibility**: Ensure old routes still work during transition
