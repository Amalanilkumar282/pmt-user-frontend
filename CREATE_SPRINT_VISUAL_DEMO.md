# Create Sprint Modal - Visual Demo Guide

## 🎬 User Journey Walkthrough

This guide provides a step-by-step visual walkthrough of the Create Sprint Modal with AI Sprint Planner feature.

---

## 📍 Entry Point: Backlog Page

### Initial State

```
┌─────────────────────────────────────────────────────────┐
│ Backlog Page                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Filters]  [Epic Controls]              [+ Create Sprint] │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │ Active Sprints                               │      │
│  │  Sprint 1                                    │      │
│  │  Sprint 2                                    │      │
│  └─────────────────────────────────────────────┘      │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │ Backlog                                      │      │
│  │  • Issue 1                                   │      │
│  │  • Issue 2                                   │      │
│  └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

**Action:** User clicks **[+ Create Sprint]** button

---

## 🎯 Section 1: Sprint Creation Form

### Modal Opens - Teams Loading

```
╔═════════════════════════════════════════════════════════╗
║ 🚀 Create Sprint                                        ║
║ Plan your next sprint with AI-powered suggestions      ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  Sprint Name *                                          ║
║  [____________________________]                         ║
║                                                         ║
║  Sprint Goal                                            ║
║  [____________________________]                         ║
║  [____________________________]                         ║
║                                                         ║
║  Start Date *        End Date *                         ║
║  [__________]        [__________]                       ║
║                                                         ║
║  Status              Target Story Points                ║
║  [PLANNED ▼]         [40______]                         ║
║                                                         ║
║  Team *                                                 ║
║  [Loading teams... ▼]                                   ║
║                                                         ║
╠═════════════════════════════════════════════════════════╣
║                        [Cancel]  [Create Sprint...] (disabled) ║
╚═════════════════════════════════════════════════════════╝
```

### Teams Loaded

```
╔═════════════════════════════════════════════════════════╗
║ 🚀 Create Sprint                                        ║
║ Plan your next sprint with AI-powered suggestions      ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  Sprint Name *                                          ║
║  [Sprint 15________________________]                    ║
║                                                         ║
║  Sprint Goal                                            ║
║  [Implement user authentication and]                   ║
║  [profile management system____]                        ║
║                                                         ║
║  Start Date *        End Date *                         ║
║  [2025-02-01]        [2025-02-14]                       ║
║                                                         ║
║  Status              Target Story Points                ║
║  [PLANNED ▼]         [40______]                         ║
║                                                         ║
║  Team *                                                 ║
║  [Frontend Team (5 members) ▼]                          ║
║   ├─ Frontend Team (5 members)                          ║
║   ├─ Backend Team (4 members)                           ║
║   └─ QA Team (3 members)                                ║
║                                                         ║
╠═════════════════════════════════════════════════════════╣
║                [Cancel]  [⚡ Create Sprint & Get AI...] ║
╚═════════════════════════════════════════════════════════╝
```

**Form Filled:**

- ✅ Sprint Name: "Sprint 15"
- ✅ Sprint Goal: "Implement user authentication and profile management"
- ✅ Start Date: "2025-02-01"
- ✅ End Date: "2025-02-14"
- ✅ Status: "PLANNED"
- ✅ Target Story Points: 40
- ✅ Team: "Frontend Team (5 members)"

**Action:** User clicks **[⚡ Create Sprint & Get AI Suggestions]**

---

## ⏳ Section 2: AI Loading State

### Sprint Created, AI Generating

```
╔═════════════════════════════════════════════════════════╗
║ 💡 Sprint Created Successfully!                        ║
║ Generating AI-powered issue recommendations...         ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║                                                         ║
║                       ╔══════╗                          ║
║                       ║      ║                          ║
║                       ║  🤖  ║  ← Spinner rotating     ║
║                       ║      ║                          ║
║                       ╚══════╝                          ║
║                                                         ║
║                  AI is Thinking...                      ║
║                                                         ║
║          Analyzing your backlog and team capacity      ║
║                                                         ║
║                  This may take a few seconds           ║
║                                                         ║
║                                                         ║
╠═════════════════════════════════════════════════════════╣
║                              [Skip AI Suggestions]      ║
╚═════════════════════════════════════════════════════════╝
```

**What's Happening:**

1. 🔄 Sprint created via `POST /api/sprints`
2. 🔄 AI analyzing backlog via `POST /api/sprints/projects/{id}/ai-plan`
3. ⏱️ Average wait: 2-4 seconds

**Options:**

- Wait for AI suggestions
- Click **[Skip AI Suggestions]** to close immediately

---

## ✅ Section 3: AI Results Display

### AI Suggestions Ready

```
╔═════════════════════════════════════════════════════════╗
║ ✓ AI Sprint Plan Ready                                 ║
║ Review and add suggested issues to your sprint         ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║ ┌─────────────────────────────────────────────────────┐ ║
║ │ 📝 AI Summary                                       │ ║
║ │ Sprint plan focuses on critical authentication      │ ║
║ │ features including login, registration, and         │ ║
║ │ profile management. Balanced workload across team.  │ ║
║ └─────────────────────────────────────────────────────┘ ║
║                                                         ║
║ ┌─────────────────────────────────────────────────────┐ ║
║ │ 📋 Suggested Issues (5)      Total Story Points: 38 │ ║
║ ├─────────────────────────────────────────────────────┤ ║
║ │                                                     │ ║
║ │ ┌─ PHX-201 ──────────────────────────── 8 pts ─ 🗑 │ ║
║ │ │ CRITICAL priority authentication feature        │ ║
║ │ │ Suggested Assignee: #5                          │ ║
║ │ └─────────────────────────────────────────────────┘ ║
║ │                                                     │ ║
║ │ ┌─ PHX-202 ──────────────────────────── 5 pts ─ 🗑 │ ║
║ │ │ Implement user registration flow               │ ║
║ │ │ Suggested Assignee: #3                          │ ║
║ │ └─────────────────────────────────────────────────┘ ║
║ │                                                     │ ║
║ │ ┌─ PHX-203 ──────────────────────────── 8 pts ─ 🗑 │ ║
║ │ │ Build profile management page                   │ ║
║ │ │ Suggested Assignee: #5                          │ ║
║ │ └─────────────────────────────────────────────────┘ ║
║ │                                                     │ ║
║ │ ┌─ PHX-204 ──────────────────────────── 5 pts ─ 🗑 │ ║
║ │ │ Add password reset functionality               │ ║
║ │ │ Suggested Assignee: #2                          │ ║
║ │ └─────────────────────────────────────────────────┘ ║
║ │                                                     │ ║
║ │ ┌─ PHX-205 ──────────────────────────── 12 pts ─ 🗑│ ║
║ │ │ Integrate OAuth providers (Google, GitHub)     │ ║
║ │ │ Suggested Assignee: #4                          │ ║
║ │ └─────────────────────────────────────────────────┘ ║
║ │                                                     │ ║
║ └─────────────────────────────────────────────────────┘ ║
║                                                         ║
╠═════════════════════════════════════════════════════════╣
║           [Discard Suggestions]  [➕ Add 5 Issues...] ║
╚═════════════════════════════════════════════════════════╝
```

**User Actions Available:**

1. **Delete Issue** - Click 🗑 to remove from list
2. **Discard All** - Close without adding issues
3. **Add Issues** - Create all suggested issues

---

## 🎨 User Interaction: Delete Issue

### Removing PHX-205

```
╔═════════════════════════════════════════════════════════╗
║ ✓ AI Sprint Plan Ready                                 ║
╠═════════════════════════════════════════════════════════╣
║ ┌─────────────────────────────────────────────────────┐ ║
║ │ 📋 Suggested Issues (4)      Total Story Points: 26 │ ║
║ ├─────────────────────────────────────────────────────┤ ║
║ │ PHX-201 - 8 pts                                    │ ║
║ │ PHX-202 - 5 pts                                    │ ║
║ │ PHX-203 - 8 pts                                    │ ║
║ │ PHX-204 - 5 pts                                    │ ║
║ └─────────────────────────────────────────────────────┘ ║
╠═════════════════════════════════════════════════════════╣
║           [Discard Suggestions]  [➕ Add 4 Issues...] ║
╚═════════════════════════════════════════════════════════╝
```

**Updated:**

- Issue count: 5 → 4
- Total story points: 38 → 26
- Button text: "Add 5 Issues" → "Add 4 Issues"

---

## 🎯 Final Action: Add Issues

### User Clicks "Add 4 Issues to Sprint"

```
╔═════════════════════════════════════════════════════════╗
║ Creating issues...                                      ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║                   [Loading Spinner]                     ║
║                                                         ║
║              Adding issues to sprint...                 ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

**Backend Requests:**

```
POST /api/Issue  (Issue 1: PHX-201)
POST /api/Issue  (Issue 2: PHX-202)
POST /api/Issue  (Issue 3: PHX-203)
POST /api/Issue  (Issue 4: PHX-204)
```

---

## 🎉 Success State

### Issues Created, Modal Closes

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│        ✅ 4 issues added to sprint successfully!       │
│                                                         │
└─────────────────────────────────────────────────────────┘

╔═════════════════════════════════════════════════════════╗
║ Backlog Page                                            ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  ┌─────────────────────────────────────────────┐      │
║  │ Planned Sprints                              │      │
║  │                                              │      │
║  │  ✨ Sprint 15 (NEW!)                         │      │
║  │     • PHX-201 - Authentication (8 pts)      │      │
║  │     • PHX-202 - Registration (5 pts)        │      │
║  │     • PHX-203 - Profile Page (8 pts)        │      │
║  │     • PHX-204 - Password Reset (5 pts)      │      │
║  │     Total: 26 story points                  │      │
║  │                                              │      │
║  └─────────────────────────────────────────────┘      │
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

---

## 🔀 Alternative Flows

### Flow 1: Skip AI During Loading

```
[Form Section]
    ↓ (Click "Create Sprint")
[AI Loading Section]
    ↓ (Click "Skip AI Suggestions")
Toast: "Sprint created without AI suggestions"
Modal Closes
```

**Result:** Sprint created, no issues added

---

### Flow 2: Discard AI Results

```
[Form Section]
    ↓
[AI Loading Section]
    ↓
[AI Results Section]
    ↓ (Click "Discard Suggestions")
Toast: "Sprint created without adding suggested issues"
Modal Closes
```

**Result:** Sprint created, no issues added

---

### Flow 3: Remove All Issues

```
[AI Results Section]
    ↓ (Delete all 5 issues)
[AI Results Section - Empty State]
┌───────────────────────────────────────┐
│ No issues to display.                 │
│ All suggestions have been removed.    │
└───────────────────────────────────────┘
[Add Issues] button is disabled
```

**Action:** User must click "Discard Suggestions" to close

---

## 📱 Responsive Design

### Desktop View (> 640px)

```
┌─────────────────────────────────┐
│          Modal (700px)          │
│  ┌────────────┬───────────────┐ │
│  │ Sprint Name│ (2 columns)   │ │
│  │ Sprint Goal│               │ │
│  ├────────────┼───────────────┤ │
│  │ Start Date │ End Date      │ │
│  │ Status     │ Story Points  │ │
│  └────────────┴───────────────┘ │
│  [Cancel]          [Submit]     │
└─────────────────────────────────┘
```

### Mobile View (< 640px)

```
┌──────────────────┐
│  Modal (100%)    │
│  ┌─────────────┐ │
│  │ Sprint Name │ │
│  │ Sprint Goal │ │
│  │ Start Date  │ │
│  │ End Date    │ │
│  │ Status      │ │
│  │ Story Pts   │ │
│  │ Team        │ │
│  └─────────────┘ │
│  [Cancel]        │
│  [Submit]        │
└──────────────────┘
```

---

## 🎨 Color & Icon Guide

### Colors

- **Primary Blue:** `#3D62A8` (buttons, headers)
- **AI Purple:** `#8b5cf6` (AI sections, animations)
- **Success Green:** `#10b981` (success states)
- **Error Red:** `#ef4444` (validation, delete)
- **Gray Shades:** Various (text, borders, backgrounds)

### Icons

- 🚀 Create Sprint
- 💡 AI Thinking
- ✓ Success
- 📝 Summary
- 📋 Issues List
- 🗑️ Delete Issue
- ⚡ Quick Action
- ➕ Add Issues

---

## 🎬 Animation Sequences

### Modal Open

```
1. Backdrop fades in (200ms)
2. Modal slides up + fades in (300ms)
3. Content renders
```

### State Transitions

```
Form → Loading
  - Fade out form
  - Fade in loading section
  - Start spinner animation

Loading → Results
  - Fade out loading
  - Fade in results
  - Stagger issue cards (50ms each)
```

### Delete Issue

```
1. Issue card shrinks (200ms)
2. Card fades out (150ms)
3. Story points update (smooth)
4. List re-flows
```

---

## 💬 Toast Messages Timeline

```
Time    Event                        Toast Message
─────────────────────────────────────────────────────────
0:00    Click "Create Sprint"        (none)
0:01    Teams loaded                 (none)
0:05    Sprint created              ✅ "Sprint created successfully!"
0:08    AI suggestions received      (none - auto-transition)
0:12    Issue deleted               (none)
0:15    Click "Add Issues"          (loading)
0:18    Issues created              ✅ "4 issues added to sprint successfully!"
```

---

## 📊 Performance Metrics

### Timing Breakdown

```
┌─────────────────────────────────────────────────────────┐
│ Action                   │ Time      │ User Sees        │
├─────────────────────────────────────────────────────────┤
│ Modal Open              │ <100ms    │ Form appears     │
│ Teams API               │ ~300ms    │ Dropdown loads   │
│ Form Fill               │ ~30sec    │ User typing      │
│ Sprint Creation API     │ ~500ms    │ Loading screen   │
│ AI Planning API         │ 2-4sec    │ "AI Thinking..." │
│ Results Render          │ <100ms    │ Issues list      │
│ Delete Issue            │ <50ms     │ Card removes     │
│ Create Issues API       │ ~800ms    │ Loading          │
│ Success & Close         │ <100ms    │ Toast + close    │
└─────────────────────────────────────────────────────────┘

Total Time (Complete Flow): ~35-40 seconds
```

---

## 🎯 User Goals Achieved

✅ **Goal 1:** Create a sprint with all necessary details  
✅ **Goal 2:** Select appropriate team for sprint  
✅ **Goal 3:** Get AI-powered issue recommendations  
✅ **Goal 4:** Review and customize suggested issues  
✅ **Goal 5:** Quickly add issues to sprint  
✅ **Goal 6:** Skip AI if needed  
✅ **Goal 7:** Validate input before submission

---

## 📝 Developer Notes

### Customization Points

1. **Team Count Display:**

   ```html
   {{ team.name }} ({{ team.members.length }} members)
   ```

2. **Story Points Badge:**

   ```html
   <span class="issue-points">{{ issue.storyPoints }} pts</span>
   ```

3. **AI Summary:**

   ```html
   <p class="summary-text">{{ aiSummary }}</p>
   ```

4. **Loading Message:**
   ```html
   <h3 class="loading-title">AI is Thinking...</h3>
   ```

---

## 🚀 Next Steps

After this implementation:

1. **Test the complete flow**

   - Create sprint → AI → Add issues
   - Test skip and discard flows
   - Verify all validations

2. **Integrate with backend**

   - Ensure API endpoints are ready
   - Test with real project data
   - Verify token authentication

3. **Update project ID**

   - Replace static ID with dynamic value
   - Extract from route params

4. **Enhance UX**
   - Add issue type selection
   - Display user avatars
   - Show real-time team capacity

---

**Last Updated:** November 1, 2025
