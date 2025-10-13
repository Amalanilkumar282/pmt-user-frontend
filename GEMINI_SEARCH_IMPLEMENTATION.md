# Gemini-Powered Intelligent Search Implementation

## Overview

This implementation integrates Gemini AI with the searchbar component to enable natural language commands that trigger in-app navigation and open modals with pre-filled data.

## Architecture

### Component Flow

```
User Input → Searchbar → Gemini API → Parse JSON Response →
  ├─→ Navigate (Angular Router)
  └─→ Emit Event → Header → ModalService → Create Issue Modal (Pre-filled)
```

## Components Modified

### 1. Searchbar Component (`src/app/shared/searchbar/searchbar.ts`)

**Changes:**

- Added `@Output() openCreateModal = new EventEmitter<any>()`
- Injected `Router` for navigation
- Enhanced Gemini prompt to request structured JSON responses
- Added `processGeminiResponse()` method to:
  - Clean markdown code blocks from response
  - Parse JSON response
  - Navigate to routes
  - Emit modal events with field data

**Export Interface:**

```typescript
export interface GeminiActionResponse {
  action?: string;
  route?: string;
  modal?: string;
  fields?: {
    issueType?: string;
    summary?: string;
    description?: string;
    priority?: string;
    [key: string]: any;
  };
}
```

### 2. Header Component (`src/app/shared/header/header.ts`)

**Changes:**

- Injected `ModalService`
- Added `handleOpenCreateModal(fields: any)` method
- Maps Gemini fields to modal configuration
- Opens create-issue modal with pre-filled data

**Template Binding:**

```html
<app-searchbar (openCreateModal)="handleOpenCreateModal($event)"></app-searchbar>
```

### 3. Create Issue Modal (`src/app/modal/create-issue/create-issue.ts`)

**No changes needed** - Already supports pre-filled data through `ModalService` config:

- Accepts `data` property in `ModalConfig`
- Pre-fills form fields when modal opens

## Usage Examples

### Example 1: Create a Task

**User Input:**

```
Create a task 'user sign in' in project-1
```

**Expected Gemini Response:**

```json
{
  "action": "create_issue",
  "route": "/projects",
  "modal": "create-issue",
  "fields": {
    "issueType": "Task",
    "summary": "user sign in",
    "description": "",
    "priority": "Medium"
  }
}
```

**Result:**

1. Navigate to `/projects`
2. Open Create Issue modal
3. Pre-fill: Issue Type = "Task", Summary = "user sign in", Priority = "Medium"

### Example 2: Create a Bug

**User Input:**

```
Report a high priority bug: login button not working
```

**Expected Gemini Response:**

```json
{
  "action": "create_issue",
  "route": "/backlog",
  "modal": "create-issue",
  "fields": {
    "issueType": "Bug",
    "summary": "login button not working",
    "description": "The login button is not responding to clicks",
    "priority": "High"
  }
}
```

### Example 3: Navigate Only

**User Input:**

```
Show me the board
```

**Expected Gemini Response:**

```json
{
  "action": "navigate",
  "route": "/board"
}
```

## Gemini Prompt Structure

The searchbar sends an enhanced prompt to guide Gemini:

```typescript
const structuredPrompt = `You are an intelligent assistant for a project management application. 
Parse the user's request and return ONLY a JSON object (no markdown, no code blocks, just raw JSON) with the following structure:

{
  "action": "create_issue" | "navigate" | "search",
  "route": "/projects" | "/backlog" | "/board" | "/epic" | "/sprint" | "/timeline" | "/report-dashboard" | "/summary",
  "modal": "create-issue" (if action is create_issue),
  "fields": {
    "issueType": "Task" | "Bug" | "Story" | "Epic",
    "summary": "brief title",
    "description": "optional description",
    "priority": "High" | "Medium" | "Low"
  }
}

User request: "${prompt}"

Return only the JSON object, nothing else.`;
```

## Available Routes

- `/projects` - Projects page
- `/backlog` - Backlog view
- `/board` - Board view
- `/epic` - Epic management
- `/sprint` - Sprint view
- `/timeline` - Timeline view
- `/report-dashboard` - Reports and analytics
- `/summary` - Project summary

## Modal Configuration

The Header component configures the Create Issue modal with these fields:

| Field        | Type     | Required | Options                                       |
| ------------ | -------- | -------- | --------------------------------------------- |
| Issue Type   | select   | Yes      | Task, Bug, Story, Epic                        |
| Summary      | text     | Yes      | -                                             |
| Description  | textarea | No       | -                                             |
| Priority     | select   | Yes      | High, Medium, Low                             |
| Assignee     | select   | No       | Unassigned, John Doe, Jane Smith, Bob Johnson |
| Sprint       | select   | No       | Backlog, Sprint 1, Sprint 2, Sprint 3         |
| Story Points | number   | No       | -                                             |
| Due Date     | date     | No       | -                                             |

## Error Handling

### JSON Parsing

- Automatically removes markdown code blocks (`json, `)
- Logs parsing errors with the raw response
- Fails gracefully without breaking the UI

### API Errors

- Catches fetch errors
- Logs errors to console
- User can retry by entering the prompt again

## Testing Recommendations

1. **Test Natural Language Variations:**

   - "Create a task..."
   - "Add new bug..."
   - "Make a story for..."
   - "Report an issue..."

2. **Test Navigation:**

   - "Go to board"
   - "Show me the backlog"
   - "Open timeline"

3. **Test Priority Recognition:**

   - "High priority bug..."
   - "Low priority task..."
   - "Critical issue..."

4. **Test Issue Types:**
   - "Create a bug..."
   - "Add a story..."
   - "New epic..."

## Future Enhancements

1. **Context Awareness:**

   - Use current project/sprint context
   - Pre-fill based on current page

2. **Additional Actions:**

   - Edit existing issues
   - Assign to users
   - Add comments
   - Change status

3. **Search Results:**

   - Return existing issues matching query
   - Quick navigation to issues

4. **Multi-step Interactions:**

   - Confirm before creating
   - Ask for missing required fields

5. **Voice Input:**
   - Add voice-to-text for searchbar
   - Hands-free issue creation

## Security Considerations

⚠️ **Important:** The Gemini API key is currently hardcoded in `environment.ts`. For production:

1. Move API key to environment variables
2. Use backend proxy to hide API key
3. Implement rate limiting
4. Add request validation

## Troubleshooting

### Modal doesn't open

- Check browser console for event emission logs
- Verify ModalService is injected in Header
- Ensure CreateIssue component is in app.html

### Fields not pre-filled

- Check Gemini response format in console
- Verify field names match modal configuration
- Check data mapping in Header component

### Navigation doesn't work

- Verify route exists in app.routes.ts
- Check Router is injected in Searchbar
- Ensure route path is correct in Gemini response

### Gemini returns invalid JSON

- Check prompt structure
- Verify API key is valid
- Review Gemini response cleaning logic
