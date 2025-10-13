# 🎬 Gemini Search - Visual Demo Guide

## Quick Demo (30 seconds)

### Demo 1: Create a Task

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Try: 'Create a task for user sign in' or 'Go to...'   │
│  [Create a task for user authentication_____________]  ⏎  │
└─────────────────────────────────────────────────────────────┘
                         ↓
                    ⏳ Loading...
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                     Create Issue                            │
├─────────────────────────────────────────────────────────────┤
│  Issue Type: [Task ▼]        Priority: [Medium ▼]         │
│  Summary: [user authentication                      ]      │
│  Description: [                                     ]      │
│                                                             │
│  [Cancel]                              [Create Issue]      │
└─────────────────────────────────────────────────────────────┘
```

### Demo 2: Navigate to Board

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Try: 'Create a task for user sign in' or 'Go to...'   │
│  [Go to board________________________________]  ⏎          │
└─────────────────────────────────────────────────────────────┘
                         ↓
                    ⏳ Loading...
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Board View                             │
├──────────────┬──────────────┬──────────────┬───────────────┤
│   To Do      │  In Progress │   Review     │     Done      │
├──────────────┼──────────────┼──────────────┼───────────────┤
│  [Issue 1]   │  [Issue 2]   │  [Issue 3]   │   [Issue 4]   │
│              │              │              │               │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

## Step-by-Step Demo Flow

### 🎯 Scenario 1: High Priority Bug Report

#### Step 1: Initial State

```
┌────────────────────────────────────────────┐
│  Dashboard                          🔔 ⚙️  │
├────────────────────────────────────────────┤
│  🔍 [                             ]        │
│                                            │
│  📊 Recent Activity                        │
│  ────────────────                          │
│  • Task completed                          │
│  • New bug reported                        │
└────────────────────────────────────────────┘
```

#### Step 2: User Types Command

```
┌────────────────────────────────────────────┐
│  Dashboard                          🔔 ⚙️  │
├────────────────────────────────────────────┤
│  🔍 [High priority bug: login fail|]       │
│                                            │
│  📊 Recent Activity                        │
│  ────────────────                          │
│  • Task completed                          │
│  • New bug reported                        │
└────────────────────────────────────────────┘
```

#### Step 3: User Presses Enter → Loading

```
┌────────────────────────────────────────────┐
│  Dashboard                          🔔 ⚙️  │
├────────────────────────────────────────────┤
│  ⏳ [High priority bug: login fail]        │
│      ↻ Processing...                       │
│  📊 Recent Activity                        │
│  ────────────────                          │
│  • Task completed                          │
│  • New bug reported                        │
└────────────────────────────────────────────┘
```

#### Step 4: Navigation + Modal Opens

```
┌────────────────────────────────────────────┐
│  Projects                           🔔 ⚙️  │
├────────────────────────────────────────────┤
│  🔍 [                             ]        │
│                                            │
│  ╔══════════════════════════════════════╗ │
│  ║      Create Issue                    ║ │
│  ╠══════════════════════════════════════╣ │
│  ║ Issue Type: [Bug ▼]  Priority: [🔴]  ║ │
│  ║ Summary: login fail                  ║ │
│  ║ Description:                         ║ │
│  ║ [                                ]   ║ │
│  ║                                      ║ │
│  ║ [Cancel]            [Create Issue]   ║ │
│  ╚══════════════════════════════════════╝ │
└────────────────────────────────────────────┘
```

### 🎯 Scenario 2: Quick Navigation

#### Before

```
Dashboard → Want to see Board
```

#### Command

```
🔍 "Show me the board"
```

#### After (2 seconds)

```
Board View → No modal, just navigation
```

## Visual States

### 1. Idle State

```css
┌────────────────────────────────┐
│ 🔍  [                       ]  │
│     ↑                          │
│     Grey search icon           │
└────────────────────────────────┘
```

### 2. Focused State

```css
┌────────────────────────────────┐
│ 🔍  [Type command...       ]  │
│     ↑                          │
│     Blue border                │
└────────────────────────────────┘
```

### 3. Loading State

```css
┌────────────────────────────────┐
│ ⏳  [Create a task...      ]  │
│  ↻  ↑                          │
│  Spin  Disabled, grey text     │
└────────────────────────────────┘
```

### 4. Success State

```css
┌────────────────────────────────┐
│ 🔍  [                       ]  │
│     ↑                          │
│     Input cleared              │
└────────────────────────────────┘
     ↓
Modal opens or page changes
```

## Console Output During Demo

### Successful Flow

```javascript
// User enters command
> Gemini raw response: {
    "action": "create_issue",
    "route": "/projects",
    "modal": "create-issue",
    "fields": {
      "issueType": "Task",
      "summary": "user authentication",
      "priority": "Medium"
    }
  }

// Parsing
> Parsed Gemini response: Object {...}

// Navigation
> Navigating to: /projects

// Modal event
> Emitting openCreateModal event with fields: Object {...}

// Header receives
> Header received openCreateModal event with fields: Object {...}
```

## Demo Script

### 🎤 Narrator Script

**Scene 1: Introduction (5 seconds)**

```
"Watch as I create a new task using natural language"
```

**Scene 2: Type Command (3 seconds)**

```
Types: "Create a task for user authentication"
```

**Scene 3: Press Enter (2 seconds)**

```
Presses Enter
Shows: Loading spinner
```

**Scene 4: Magic Happens (3 seconds)**

```
Shows: Navigation to /projects
Shows: Modal opening
Shows: Fields pre-filled
```

**Scene 5: Review (5 seconds)**

```
"Notice how the form is already filled with:
 - Issue Type: Task
 - Summary: user authentication
 - Priority: Medium"
```

**Scene 6: Submit (2 seconds)**

```
Clicks: Create Issue
Shows: Issue created successfully
```

## Interactive Demo Commands

### For Live Demo Session

#### Command Set 1: Issue Creation

```
1. "Create a task for user login"
2. "High priority bug: checkout broken"
3. "Add a story about notifications"
4. "Report a bug: 404 error on profile page"
```

#### Command Set 2: Navigation

```
1. "Go to board"
2. "Show timeline"
3. "Open reports"
4. "Take me to dashboard"
```

#### Command Set 3: Complex Commands

```
1. "Create a high priority task for API integration"
2. "Add a critical bug: database connection failing"
3. "Make a story for the shopping cart feature"
```

## Expected Results Table

| Command              | Navigation  | Modal  | Pre-filled Fields         |
| -------------------- | ----------- | ------ | ------------------------- |
| Create a task...     | → /projects | ✅ Yes | Type: Task, Summary: ...  |
| High priority bug... | → /projects | ✅ Yes | Type: Bug, Priority: High |
| Go to board          | → /board    | ❌ No  | N/A                       |
| Show timeline        | → /timeline | ❌ No  | N/A                       |
| Add a story...       | → /projects | ✅ Yes | Type: Story, Summary: ... |

## Troubleshooting During Demo

### Issue: Modal doesn't open

**Quick Fix:**

1. Check browser console
2. Refresh page
3. Try command again

### Issue: Fields not pre-filled

**Quick Fix:**

1. Check console for Gemini response
2. Verify JSON structure
3. Try simpler command

### Issue: Loading takes too long

**Expected:** 1-3 seconds
**Action:** Wait patiently, Gemini API varies

### Issue: Navigation wrong page

**Quick Fix:**

1. Check route in console log
2. Try: "Go to [specific page]"
3. Manual navigation works as fallback

## Presentation Tips

### 🎯 Do's

- ✅ Show loading state (it's impressive!)
- ✅ Point out console logs (transparency)
- ✅ Demonstrate different command variations
- ✅ Show both navigation and modal creation
- ✅ Highlight the speed (2-4 seconds total)
- ✅ Mention it's powered by Gemini AI

### ❌ Don'ts

- ❌ Don't rush through loading state
- ❌ Don't skip console logs
- ❌ Don't only show one type of command
- ❌ Don't forget to show the modal closing
- ❌ Don't hide error scenarios (show recovery!)

## Video Recording Guide

### Shot List

1. **Wide shot** - Full interface, searchbar visible
2. **Close-up** - Typing in searchbar
3. **Medium** - Loading state
4. **Wide** - Navigation happening
5. **Close-up** - Modal opening animation
6. **Detail** - Pre-filled fields
7. **Medium** - Form submission
8. **Wide** - Success state

### Timing

- Total video: 30-45 seconds
- Intro: 3 seconds
- Command entry: 5 seconds
- Processing: 2 seconds
- Result: 5 seconds
- Review: 3 seconds
- Outro: 2 seconds

## Screenshot Checklist

For documentation, capture:

- [ ] Empty searchbar (idle state)
- [ ] Searchbar with typed command
- [ ] Loading spinner active
- [ ] Modal opened with pre-filled data
- [ ] Console showing logs
- [ ] Navigation result (different page)
- [ ] Success state (issue created)

## Wow Factors to Highlight

### 🌟 Key Selling Points

1. **Natural Language**

   - "Just type what you want to do"
   - No need to remember exact syntax

2. **Speed**

   - "From thought to action in 3 seconds"
   - Faster than manual clicking

3. **Intelligence**

   - "AI understands your intent"
   - Extracts priority, type, summary automatically

4. **Seamless**

   - "Navigation + modal in one command"
   - No page refreshes, smooth transitions

5. **Forgiving**
   - "Works with many phrasings"
   - Natural variations accepted

## Demo Environment Setup

### Prerequisites

```bash
# 1. Ensure app is running
npm run start

# 2. Open browser to http://localhost:4200

# 3. Open DevTools (F12)

# 4. Clear console for clean demo

# 5. Test one command before live demo
```

### Backup Plan

- Have manual navigation ready
- Know how to open modal manually
- Have screenshots as fallback
- Prepare recorded video if live demo fails

## Success Metrics

After demo, audience should understand:

- ✅ How to use the feature
- ✅ What types of commands work
- ✅ Why it's better than manual navigation
- ✅ How fast it is
- ✅ What AI technology powers it

---

**Demo Ready:** ✅  
**Total Time:** 30-60 seconds  
**Complexity:** Low (easy to follow)  
**Wow Factor:** High (AI magic!)
