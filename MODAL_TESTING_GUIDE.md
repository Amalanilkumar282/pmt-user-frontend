# 🧪 Create Issue Modal - Testing Guide

## Quick Test Scenarios

### ✅ Test 1: AI Auto-fill with All Fields Visible

**Objective:** Verify all fields appear when AI auto-fills the modal

**Steps:**

1. Navigate to any project page (e.g., `/projects/1/board`)
2. In the search bar, type: `"Create a task for user authentication"`
3. Press Enter
4. Modal should open immediately

**Expected Results:**

```
✅ Modal opens instantly (no navigation)
✅ Issue Type: Task
✅ Summary: "user authentication" (FULL WIDTH - spans 2 columns)
✅ Description: Auto-filled
✅ Priority: Medium
✅ Assignee: Unassigned
✅ Start Date: Empty field but VISIBLE ⭐
✅ Due Date: Empty field but VISIBLE
✅ Sprint: "Sprint 1" selected (DEFAULT - no "Backlog") ⭐
✅ Story Point: Empty field but VISIBLE
✅ Parent Epic: Empty field but VISIBLE ⭐
✅ Reporter: User selected (VISIBLE and REQUIRED) ⭐
✅ Attachments: Empty but VISIBLE
```

**Visual Checklist:**

- [ ] Summary field spans full width (2 columns)
- [ ] Start Date field is visible
- [ ] Parent Epic field is visible
- [ ] Reporter field is visible
- [ ] Sprint dropdown does NOT show "Backlog"

---

### ✅ Test 2: Sprint Dropdown Verification

**Objective:** Confirm "Backlog" is NOT in Sprint options

**Steps:**

1. Open modal (AI or manual create button)
2. Click on Sprint dropdown
3. Check available options

**Expected Options:**

```
✅ Sprint 1
✅ Sprint 2
✅ Sprint 3
❌ NO "Backlog" option
```

**Screenshot Check:**

```
┌─────────────────────┐
│ Sprint         ▼    │
├─────────────────────┤
│ Sprint 1            │ ← Default selected
│ Sprint 2            │
│ Sprint 3            │
└─────────────────────┘
```

---

### ✅ Test 3: Summary Field Width Test

**Objective:** Verify Summary field doesn't shrink after auto-fill

**Steps:**

1. Use AI: `"Create a task with a very long summary that should span the entire width of the modal without shrinking or breaking the layout"`
2. Observe Summary field width

**Expected Results:**

- ✅ Summary field maintains full width (100% of container)
- ✅ Spans 2 columns in the grid
- ✅ Text doesn't overflow or break layout
- ✅ Input box doesn't shrink when filled
- ✅ Width matches Description field below it

**Visual Check:**

```
┌────────────────────────────────────────────┐
│ Issue Type  ▼  │                          │
├────────────────┴──────────────────────────┤
│ Summary [Long text here spanning full...] │ ← FULL WIDTH
├────────────────────────────────────────────┤
│ Description [                            ] │ ← SAME WIDTH
└────────────────────────────────────────────┘
```

---

### ✅ Test 4: Manual Create Button

**Objective:** Verify manual creation also has all fields

**Steps:**

1. Click "Create" button in navbar
2. Check all fields are present
3. Verify Sprint dropdown

**Expected Results:**

- ✅ All 12 fields visible
- ✅ Reporter field is marked as required (red asterisk \*)
- ✅ Sprint options: Sprint 1, 2, 3 only
- ✅ Summary field: Full width

---

### ✅ Test 5: Issue Type = Epic (Conditional Hiding)

**Objective:** Verify Story Point and Parent Epic hide when Issue Type is Epic

**Steps:**

1. Open modal
2. Change Issue Type dropdown to "Epic"
3. Observe field visibility changes

**Expected Results:**

- ✅ Story Point field: HIDDEN
- ✅ Parent Epic field: HIDDEN
- ✅ Start Date: Still VISIBLE ⭐
- ✅ Reporter: Still VISIBLE ⭐
- ✅ All other fields: Still VISIBLE

**Then:** 4. Change Issue Type back to "Task" 5. Story Point and Parent Epic should reappear

---

### ✅ Test 6: Field Data Persistence

**Objective:** Ensure fields don't disappear when switching between issue types

**Steps:**

1. Open modal
2. Fill in Start Date: "2025-10-20"
3. Fill in Reporter: "John Doe"
4. Change Issue Type from Task → Epic → Task
5. Check if Start Date and Reporter values persist

**Expected Results:**

- ✅ Start Date: "2025-10-20" (persisted)
- ✅ Reporter: "John Doe" (persisted)
- ✅ Fields don't reset or disappear

---

### ✅ Test 7: Multiple AI Creations

**Objective:** Test consistency across multiple AI-triggered modals

**Steps:**

1. Create Task 1: `"Create a high priority task"`
2. Close modal
3. Create Task 2: `"Add a bug for login issue"`
4. Close modal
5. Create Task 3: `"Create an epic for Q1 roadmap"`

**Expected Results (Each Time):**

- ✅ All fields visible
- ✅ Summary field full width
- ✅ Sprint shows no "Backlog"
- ✅ Reporter field visible
- ✅ Start Date field visible

---

## 🔍 Visual Regression Testing

### Compare Before & After

#### Before Fixes ❌

```
Fields Missing:
✗ Start Date: MISSING
✗ Parent Epic: MISSING
✗ Reporter: MISSING

Sprint Dropdown:
✗ Shows: Backlog, Sprint 1, Sprint 2, Sprint 3

Summary Field:
✗ Width: SHRINKS after auto-fill
```

#### After Fixes ✅

```
Fields Present:
✅ Start Date: VISIBLE
✅ Parent Epic: VISIBLE
✅ Reporter: VISIBLE and REQUIRED

Sprint Dropdown:
✅ Shows: Sprint 1, Sprint 2, Sprint 3 ONLY

Summary Field:
✅ Width: MAINTAINS full width
```

---

## 🎯 Acceptance Criteria

### Must Pass All:

- [ ] **Test 1**: AI auto-fill shows all 12 fields
- [ ] **Test 2**: Sprint dropdown has NO "Backlog"
- [ ] **Test 3**: Summary field maintains full width
- [ ] **Test 4**: Manual create shows all fields
- [ ] **Test 5**: Epic type hides only Story Point & Parent Epic
- [ ] **Test 6**: Field data persists across issue type changes
- [ ] **Test 7**: Multiple AI creations work consistently

---

## 🐛 Known Issues (Should Be Fixed)

| Issue                 | Status   | Test      |
| --------------------- | -------- | --------- |
| Start Date missing    | ✅ Fixed | Test 1, 4 |
| Parent Epic missing   | ✅ Fixed | Test 1, 4 |
| Reporter missing      | ✅ Fixed | Test 1, 4 |
| "Backlog" in Sprint   | ✅ Fixed | Test 2    |
| Summary field shrinks | ✅ Fixed | Test 3    |

---

## 📊 Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## 🔧 Debug Tools

### Console Commands

```javascript
// Check form data structure
angular.getComponent($0).formData;

// Check field definitions
angular.getComponent($0).fields;

// Check which fields are hidden
angular.getComponent($0).fields.filter((f) => f.hidden);
```

### Expected Console Output (AI Create)

```
Navbar received openCreateModal event with fields: {
  issueType: "Task",
  summary: "user authentication",
  description: "...",
  priority: "Medium"
}
```

---

## 🎨 Visual Validation

### Field Layout (2-column grid)

```
┌─────────────────┬─────────────────┐
│ Issue Type ▼    │                 │
├─────────────────┴─────────────────┤
│ Summary [........................]│ ← FULL WIDTH (colSpan: 2)
├───────────────────────────────────┤
│ Description [...................]│ ← FULL WIDTH (colSpan: 2)
├─────────────────┬─────────────────┤
│ Priority ▼      │ Assignee ▼      │
├─────────────────┼─────────────────┤
│ Start Date      │ Due Date        │ ← START DATE VISIBLE ⭐
├─────────────────┼─────────────────┤
│ Sprint ▼        │ Story Point     │ ← NO "Backlog" ⭐
├─────────────────┼─────────────────┤
│ Parent Epic ▼   │ Reporter ▼      │ ← BOTH VISIBLE ⭐
├─────────────────┴─────────────────┤
│ Attachments [📎 Upload files]   │
└───────────────────────────────────┘
```

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] All 7 test scenarios pass
- [ ] No console errors
- [ ] No visual glitches
- [ ] Fields don't disappear
- [ ] Summary maintains width
- [ ] Sprint has no "Backlog"
- [ ] Reporter is visible and required
- [ ] Start Date is visible
- [ ] Parent Epic is visible

---

## 📝 Test Report Template

```markdown
## Test Report - Create Issue Modal Fixes

**Date:** [Date]
**Tester:** [Name]
**Build:** [Version]

### Test Results

| Test ID | Description             | Status  | Notes                 |
| ------- | ----------------------- | ------- | --------------------- |
| T1      | AI auto-fill all fields | ✅ Pass | All fields visible    |
| T2      | Sprint dropdown         | ✅ Pass | No "Backlog"          |
| T3      | Summary field width     | ✅ Pass | Full width maintained |
| T4      | Manual create           | ✅ Pass | All fields present    |
| T5      | Epic type hiding        | ✅ Pass | Correct fields hide   |
| T6      | Data persistence        | ✅ Pass | Values persist        |
| T7      | Multiple creations      | ✅ Pass | Consistent behavior   |

**Overall Result:** ✅ All Tests Passed

**Recommendation:** Ready for deployment
```

---

**Status:** ✅ Ready for QA Testing  
**Priority:** High  
**Estimated Time:** 20 minutes  
**Required:** Before production deployment

🎉 **Happy Testing!** 🧪✨
