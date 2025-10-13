# 🤖 AI-Powered Search Feature

## Overview

The Project Management Tool now includes an intelligent search feature powered by Google's Gemini AI. Users can type natural language commands to navigate the application and create issues with pre-filled data.

## Features

### 🔍 Smart Navigation

Navigate to any page using natural language:

- "Go to board" → Navigate to board view
- "Show me reports" → Open report dashboard
- "Take me to timeline" → View project timeline

### ✨ Quick Issue Creation

Create issues with natural language:

- "Create a task for user authentication" → Opens modal with Task type and summary pre-filled
- "High priority bug: login not working" → Creates bug with High priority
- "Add a story about checkout process" → Creates story with description

### 🎯 Intelligent Parsing

Gemini understands:

- **Issue Types:** Task, Bug, Story, Epic
- **Priority Levels:** High, Medium, Low
- **Intent Recognition:** Create, add, make, report, etc.
- **Context Extraction:** Automatically fills summary and description

## How to Use

### Step 1: Type Your Command

In the search bar at the top of the page, type a natural language command:

```
Create a high priority task 'implement user login'
```

### Step 2: Press Enter

The AI will process your request and:

1. Show a loading spinner
2. Parse your intent
3. Navigate to the appropriate page
4. Open the Create Issue modal (if creating an issue)
5. Pre-fill the form with extracted data

### Step 3: Review and Submit

- Review the pre-filled information
- Adjust any fields as needed
- Click "Create Issue" to save

## Example Commands

### Navigation

| Command          | Result                       |
| ---------------- | ---------------------------- |
| "Show dashboard" | Navigate to main dashboard   |
| "Go to backlog"  | Navigate to backlog view     |
| "Open board"     | Navigate to kanban board     |
| "Show reports"   | Navigate to report dashboard |
| "View timeline"  | Navigate to timeline         |
| "Show summary"   | Navigate to project summary  |
| "Go to projects" | Navigate to projects page    |

### Issue Creation

| Command                               | Result                       |
| ------------------------------------- | ---------------------------- |
| "Create a task for user registration" | Task with summary pre-filled |
| "High priority bug: API timeout"      | Bug with High priority       |
| "Add a story about notifications"     | Story type issue             |
| "Make a task to fix homepage"         | Task creation                |
| "Report a bug: broken link"           | Bug report                   |

## Technical Architecture

```
User Input → Searchbar Component
    ↓
Gemini API (Structured Prompt)
    ↓
Parse JSON Response
    ↓
    ├→ Navigation (Angular Router)
    └→ Modal Event Emission
            ↓
        Header Component
            ↓
        Modal Service
            ↓
    Create Issue Modal (Pre-filled)
```

## Components Involved

### 1. Searchbar Component

- **Location:** `src/app/shared/searchbar/`
- **Responsibility:** Accept input, call Gemini, parse response, emit events
- **Output:** `openCreateModal` event emitter

### 2. Header Component

- **Location:** `src/app/shared/header/`
- **Responsibility:** Listen to searchbar events, trigger modal
- **Method:** `handleOpenCreateModal(fields)`

### 3. Modal Service

- **Location:** `src/app/modal/modal-service.ts`
- **Responsibility:** Manage modal state and configuration
- **Method:** `open(config: ModalConfig)`

### 4. Create Issue Modal

- **Location:** `src/app/modal/create-issue/`
- **Responsibility:** Display form, accept pre-filled data
- **Input:** Pre-filled data via ModalService

## Response Format

Gemini returns structured JSON:

```json
{
  "action": "create_issue",
  "route": "/projects",
  "modal": "create-issue",
  "fields": {
    "issueType": "Task",
    "summary": "implement user login",
    "description": "Add authentication functionality",
    "priority": "High"
  }
}
```

## Available Routes

- `/dashboard` - Main dashboard
- `/projects` - Projects overview
- `/backlog` - Product backlog
- `/board` - Kanban board
- `/timeline` - Project timeline
- `/report-dashboard` - Reports and analytics
- `/summary` - Project summary

## Field Mapping

### Issue Type

- Recognized: Task, Bug, Story, Epic
- Default: Task

### Priority

- Recognized: High, Medium, Low
- Default: Medium

### Summary

- Extracted from natural language input
- Used as issue title

### Description

- Optional, extracted if provided
- Can be empty

## Loading States

- **Spinner:** Animated spinner replaces search icon during API call
- **Disabled Input:** Search box is disabled while processing
- **Auto-clear:** Query is cleared after successful processing

## Error Handling

### Network Errors

- Logged to console
- UI remains functional
- User can retry

### JSON Parsing Errors

- Markdown code blocks automatically removed
- Invalid JSON logged for debugging
- Graceful failure without breaking UI

### Invalid Routes

- Handled by Angular Router
- Fallback to current page

## Configuration

### API Key

Located in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_API_KEY_HERE',
};
```

⚠️ **Security Note:** For production, move API key to backend proxy to hide it from client.

### Gemini Model

Currently using: `gemini-2.5-flash-lite`

- Fast response time (1-3 seconds)
- Good accuracy for structured outputs
- Cost-effective

## Troubleshooting

### Modal doesn't open

1. Check browser console for errors
2. Verify `CreateIssue` component is in `app.html`
3. Check ModalService is injected in Header

### Fields not pre-filled

1. Check Gemini response in console
2. Verify JSON structure matches expected format
3. Check field mapping in Header component

### Navigation doesn't work

1. Verify route exists in `app.routes.ts`
2. Check Router is injected in Searchbar
3. Ensure route path matches Gemini response

### API Errors

1. Verify API key is valid
2. Check internet connection
3. Review API quota/limits
4. Check browser console for error details

## Performance

- **API Response Time:** 1-3 seconds (typical)
- **Navigation:** Immediate after parsing
- **Modal Opening:** 300ms delay for smooth transition
- **Total Time:** ~2-4 seconds from Enter to modal display

## Future Enhancements

### Planned Features

- [ ] Voice input support
- [ ] Multi-step confirmations
- [ ] Search existing issues
- [ ] Edit issue via natural language
- [ ] Assign issues to users
- [ ] Set due dates via natural language
- [ ] Bulk operations

### Context Awareness

- [ ] Auto-detect current project
- [ ] Pre-fill based on current page
- [ ] Learn from user patterns
- [ ] Suggest common actions

## Testing

See `GEMINI_SEARCH_TESTING.md` for comprehensive testing guide.

Quick test:

1. Enter: `Create a task for testing`
2. Press Enter
3. Verify modal opens with pre-filled data

## Support

For issues or questions:

1. Check `GEMINI_SEARCH_IMPLEMENTATION.md` for technical details
2. Review `GEMINI_SEARCH_TESTING.md` for testing scenarios
3. Check browser console for error logs
4. Verify API key is valid and has quota

## License

This feature uses Google Gemini API. Refer to Google's terms of service for API usage policies.
