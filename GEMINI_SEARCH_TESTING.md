# Gemini Search Testing Guide

## Quick Test Commands

### 1. Create Issue Commands

#### Task Creation

```
Create a task 'user sign in'
Create a task for implementing authentication
Add a new task: setup database connection
Make a task to fix the login page
```

**Expected Result:**

- Navigate to `/projects`
- Open Create Issue modal
- Pre-fill: Issue Type = "Task", Summary from prompt, Priority = "Medium"

#### Bug Reports

```
Report a bug: login button not working
High priority bug - payment gateway failing
Create a bug for the broken search feature
Add a critical bug: server crashes on startup
```

**Expected Result:**

- Navigate to `/projects` or `/backlog`
- Open Create Issue modal
- Pre-fill: Issue Type = "Bug", Summary from prompt, Priority based on urgency

#### Story Creation

```
Create a story for user registration
Add a new story: shopping cart functionality
Make a story about user profile management
```

**Expected Result:**

- Navigate to `/projects` or `/backlog`
- Open Create Issue modal
- Pre-fill: Issue Type = "Story", Summary from prompt

### 2. Navigation Commands

#### Board Navigation

```
Go to board
Show me the board
Open the board view
Navigate to kanban board
```

**Expected Result:**

- Navigate to `/board`
- No modal opens

#### Backlog Navigation

```
Show backlog
Go to backlog
Open backlog view
Navigate to product backlog
```

**Expected Result:**

- Navigate to `/backlog`
- No modal opens

#### Timeline Navigation

```
Show timeline
Go to timeline
Open timeline view
Show project timeline
```

**Expected Result:**

- Navigate to `/timeline`
- No modal opens

#### Reports Navigation

```
Show reports
Go to report dashboard
Open analytics
Show me the reports
View project metrics
```

**Expected Result:**

- Navigate to `/report-dashboard`
- No modal opens

#### Projects Navigation

```
Show projects
Go to projects
Open projects page
Navigate to projects
```

**Expected Result:**

- Navigate to `/projects`
- No modal opens

#### Summary Navigation

```
Show summary
Go to summary
Open project summary
View project overview
```

**Expected Result:**

- Navigate to `/summary`
- No modal opens

#### Dashboard Navigation

```
Go to dashboard
Show dashboard
Take me to home
Open main dashboard
```

**Expected Result:**

- Navigate to `/dashboard`
- No modal opens

### 3. Complex Commands (Combined Actions)

#### Create + Navigate

```
Create a high priority task 'fix homepage' in projects
Add a bug to the backlog: API timeout error
Make a story for the board: user notifications
```

**Expected Result:**

- Navigate to specified route
- Open Create Issue modal with pre-filled data

### 4. Natural Language Variations

Test that the AI understands different phrasings:

```
I need to add a task for user authentication
Can you create a bug report for the broken link?
Please make a story about the checkout process
Add new task: implement dark mode
Report issue: app crashing on mobile
```

## Testing Checklist

### ✅ Basic Functionality

- [ ] Searchbar accepts text input
- [ ] Pressing Enter triggers Gemini API call
- [ ] Loading spinner appears during API call
- [ ] Input is disabled while loading
- [ ] Query clears after successful processing

### ✅ Navigation Testing

- [ ] `/projects` route works
- [ ] `/backlog` route works
- [ ] `/board` route works
- [ ] `/timeline` route works
- [ ] `/report-dashboard` route works
- [ ] `/summary` route works
- [ ] `/dashboard` route works
- [ ] Invalid routes handled gracefully

### ✅ Modal Testing

- [ ] Create Issue modal opens
- [ ] Modal has correct title
- [ ] Issue Type field is pre-filled
- [ ] Summary field is pre-filled
- [ ] Description field is pre-filled (if provided)
- [ ] Priority field is pre-filled
- [ ] Other fields are empty/default
- [ ] Modal can be closed
- [ ] Form validation works
- [ ] Submit button works

### ✅ Issue Types

- [ ] "Task" is recognized and set
- [ ] "Bug" is recognized and set
- [ ] "Story" is recognized and set
- [ ] "Epic" is recognized and set

### ✅ Priority Levels

- [ ] "High" priority is recognized
- [ ] "Medium" priority is recognized
- [ ] "Low" priority is recognized
- [ ] Default is "Medium" if not specified

### ✅ Error Handling

- [ ] Invalid JSON response handled
- [ ] API errors logged to console
- [ ] Network errors don't break UI
- [ ] User can retry after error

### ✅ User Experience

- [ ] Placeholder text is helpful
- [ ] Loading state is clear
- [ ] Transitions are smooth (300ms delay)
- [ ] Console logs are informative
- [ ] No console errors in normal flow

## Browser Console Checks

Open Developer Tools (F12) and check:

### Expected Console Logs

1. **Successful Flow:**

```
Gemini raw response: {"action":"create_issue",...}
Parsed Gemini response: {action: "create_issue", ...}
Navigating to: /projects
Emitting openCreateModal event with fields: {...}
Header received openCreateModal event with fields: {...}
```

2. **Navigation Only:**

```
Gemini raw response: {"action":"navigate",...}
Parsed Gemini response: {action: "navigate", route: "/board"}
Navigating to: /board
```

### Error Logs (Should be handled gracefully)

```
❌ Error calling Gemini API: [error details]
❌ Error parsing Gemini response: [error details]
Response text was: [raw response]
```

## Manual Testing Scenarios

### Scenario 1: Happy Path - Create Task

1. Enter: "Create a task for user login"
2. Press Enter
3. **Verify:**
   - Spinner shows
   - Navigate to /projects
   - Modal opens
   - Fields pre-filled correctly

### Scenario 2: Navigation Only

1. Enter: "Go to board"
2. Press Enter
3. **Verify:**
   - Spinner shows
   - Navigate to /board
   - No modal opens

### Scenario 3: Complex Issue Creation

1. Enter: "High priority bug - checkout not working on mobile"
2. Press Enter
3. **Verify:**
   - Navigate to appropriate page
   - Modal opens
   - Issue Type = "Bug"
   - Priority = "High"
   - Summary contains key information

### Scenario 4: Multiple Sequential Commands

1. Enter: "Show me the timeline"
2. Press Enter, wait for navigation
3. Enter: "Create a task for documentation"
4. Press Enter
5. **Verify:** Each command works independently

### Scenario 5: Error Recovery

1. Disconnect internet
2. Enter: "Create a task"
3. Press Enter
4. **Verify:** Error logged, UI still functional
5. Reconnect internet
6. Enter: "Create a task"
7. **Verify:** Works normally

## Performance Testing

### Response Time

- Gemini API typically responds in 1-3 seconds
- Navigation happens immediately after parsing
- Modal opens 300ms after navigation

### Multiple Requests

- Test rapid sequential requests
- Verify loading state prevents duplicate calls
- Check no race conditions occur

## Edge Cases

### Empty/Invalid Input

- Empty search: Should do nothing
- Only spaces: Should do nothing
- Very long text: Should still work

### Ambiguous Commands

- "show" alone: Test how Gemini interprets
- "task": Test minimal input
- "go": Test incomplete commands

### Special Characters

```
Create a task: "Fix the 'bug' in <component>"
Add task with & symbol
Task with 100% completion
```

## API Key Testing

⚠️ **Important:** Test with valid and invalid API keys

### Valid Key

- All features work
- Responses are parsed correctly

### Invalid Key

- Error logged to console
- UI remains functional
- User can still navigate manually

## Regression Testing

After making changes, verify:

- [ ] Existing manual search still works (if any)
- [ ] Navigation without Gemini works
- [ ] Modal can be opened manually elsewhere
- [ ] Other header features work (notifications, settings)
- [ ] Sidebar toggle works
- [ ] No new console errors

## Browser Compatibility

Test in:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (responsive view)

## Accessibility Testing

- [ ] Searchbar is keyboard accessible
- [ ] Tab navigation works
- [ ] Enter key triggers search
- [ ] Loading state is announced (consider aria-live)
- [ ] Modal is keyboard accessible

## Documentation Review

Verify all documentation matches implementation:

- [ ] README is up to date
- [ ] GEMINI_SEARCH_IMPLEMENTATION.md is accurate
- [ ] Code comments are clear
- [ ] Examples work as documented

## Sign-off Checklist

Before marking as complete:

- [ ] All tests pass
- [ ] No console errors in happy path
- [ ] Error handling works
- [ ] Documentation is complete
- [ ] Code is clean and commented
- [ ] Performance is acceptable
- [ ] UX is smooth and intuitive
