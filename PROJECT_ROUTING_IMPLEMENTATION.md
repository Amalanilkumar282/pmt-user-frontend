# Project-Based Routing Implementation

## Overview
This document describes the implementation of a project-based routing structure for the PMT User Frontend application. The routing flow now follows a project-centric approach where users first select a project and then navigate to project-specific views.

## Routing Structure

### New Route Flow
```
/ → /projects (landing page showing all projects)
/projects → Projects list page
/projects/:projectId → Redirects to /projects/:projectId/board
/projects/:projectId/board → Board view for specific project
/projects/:projectId/backlog → Backlog view for specific project
/projects/:projectId/summary → Summary view for specific project
/projects/:projectId/timeline → Timeline view for specific project
/projects/:projectId/report-dashboard → Reports dashboard for specific project
/projects/:projectId/report-dashboard/burnup-chart → Burnup chart for specific project
/projects/:projectId/report-dashboard/burndown-chart → Burndown chart for specific project
/projects/:projectId/report-dashboard/velocity-chart → Velocity chart for specific project
```

### Old vs New Routes Comparison
| Old Route | New Route |
|-----------|-----------|
| `/` → `/dashboard` | `/` → `/projects` |
| `/board` | `/projects/:projectId/board` |
| `/backlog` | `/projects/:projectId/backlog` |
| `/summary` | `/projects/:projectId/summary` |
| `/timeline` | `/projects/:projectId/timeline` |
| `/report-dashboard` | `/projects/:projectId/report-dashboard` |

## Key Changes

### 1. App Routes (`app.routes.ts`)
- Changed root redirect from `/dashboard` to `/projects`
- Nested all project-specific routes under `projects/:projectId` path
- Added automatic redirect from project base path to board view

### 2. Project Context Service (`project-context.service.ts`)
**New service created to manage current project context**
- Stores the current project ID as a signal
- Provides methods to set and clear project context
- Used by all project-specific components to track which project is active

### 3. Project List Navigation
**Updated `project-list` component:**
- Added Router injection for navigation
- Added `navigateToProject()` method to navigate to project board
- Made table rows clickable to navigate to projects
- Added `stopPropagation()` to star and menu buttons to prevent row click

### 4. Sidebar Navigation
**Major updates to `sidebar` component:**
- Integrated ProjectContextService to track current project
- Dynamic navigation items based on project context
- When in a project context, shows:
  - Board
  - Backlog
  - Summary
  - Timeline
  - Reports
- When not in project context, shows:
  - All Projects
  - Dashboard
- All navigation links use dynamic routing with project ID
- Added visual divider between project navigation and general navigation

### 5. Component Updates
**All project-specific components updated to:**
- Inject `ActivatedRoute` and `ProjectContextService`
- Extract project ID from route parameters in `ngOnInit()`
- Set project context using the service

**Components updated:**
- `board-page.ts`
- `backlog-page.ts`
- `summary-page.ts`
- `timeline-component.ts`
- `report-dashboard-home.ts`
- `burnup-chart.ts`
- `burndown-chart.ts`
- `velocity-chart.ts`

**Components that clear project context:**
- `projects-page.ts` - Clears context when viewing all projects
- `main-dashboard-home.ts` - Clears context when viewing main dashboard

### 6. Route Parameter Access
**Different levels of nesting require different access:**
- Direct children: `this.route.parent?.snapshot.paramMap.get('projectId')`
- Nested children (charts): `this.route.parent?.parent?.snapshot.paramMap.get('projectId')`

## User Flow

### Typical User Journey
1. **Enter Application** → Lands on `/projects` (All Projects page)
2. **Click on a Project** → Navigates to `/projects/1/board` (Board view for project 1)
3. **Navigate via Sidebar** → Can access:
   - Board: `/projects/1/board`
   - Backlog: `/projects/1/backlog`
   - Summary: `/projects/1/summary`
   - Timeline: `/projects/1/timeline`
   - Reports: `/projects/1/report-dashboard`
4. **Return to All Projects** → Click "All Projects" in sidebar → Back to `/projects`
5. **Select Different Project** → Click another project → Navigate to `/projects/2/board`

### Project Context Management
- **Setting Context**: When navigating to any project route, the project ID is automatically extracted and stored
- **Using Context**: The sidebar uses the stored project ID to build dynamic navigation links
- **Clearing Context**: When navigating to non-project pages (projects list, dashboard), context is cleared

## Benefits

1. **URL Structure**: Clear hierarchy showing project → feature relationship
2. **Deep Linking**: Users can bookmark specific project views
3. **Navigation**: Sidebar dynamically adapts based on whether user is in a project
4. **Scalability**: Easy to add new project-specific features
5. **User Experience**: Clear separation between project list and project views

## Technical Implementation Details

### Project Context Service
```typescript
@Injectable({ providedIn: 'root' })
export class ProjectContextService {
  private _currentProjectId = signal<string | null>(null);
  readonly currentProjectId = this._currentProjectId.asReadonly();

  setCurrentProjectId(projectId: string) { ... }
  clearCurrentProjectId() { ... }
}
```

### Route Configuration Pattern
```typescript
{
  path: 'projects/:projectId',
  children: [
    { path: '', redirectTo: 'board', pathMatch: 'full' },
    { path: 'board', component: BoardPage },
    // ... other routes
  ]
}
```

### Component Integration Pattern
```typescript
export class BoardPage implements OnInit {
  private route = inject(ActivatedRoute);
  private projectContextService = inject(ProjectContextService);

  ngOnInit(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('projectId');
    if (projectId) {
      this.projectContextService.setCurrentProjectId(projectId);
    }
  }
}
```

## Future Enhancements

1. **Route Guards**: Add guards to verify project exists before navigating
2. **Project Data Loading**: Fetch project details when project ID changes
3. **Breadcrumbs**: Add breadcrumb navigation showing project hierarchy
4. **Project Resolver**: Pre-load project data before route activation
5. **Child Route Params**: Consider using route resolvers for cleaner param access

## Testing Considerations

When testing the updated routing:
1. Verify project list navigation works
2. Test deep linking to specific project pages
3. Confirm sidebar updates correctly based on project context
4. Check that back navigation works as expected
5. Validate that project context clears when leaving project views

## Migration Notes

For existing users:
- Old bookmarked URLs will no longer work
- Consider implementing URL redirects or handling in a route guard
- Users will need to re-bookmark pages with new URL structure
