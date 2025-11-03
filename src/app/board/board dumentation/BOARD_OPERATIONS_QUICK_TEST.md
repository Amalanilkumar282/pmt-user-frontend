# Board Operations - Quick Test Guide

## 🚀 Quick Start

### Prerequisites
1. Backend running at `https://localhost:7117` (or via proxy)
2. Frontend dev server running: `npm run start`
3. User logged in with valid auth token

### Test 1: Drag-and-Drop (30 seconds)
```bash
# Steps:
1. Open board: http://localhost:4201/projects/{projectId}/board
2. Drag any issue card from one column to another
3. Check browser console - should see:
   ✓ "[BoardColumnsContainer] Drag-drop: Updating issue status"
   ✓ "[BoardStore] Issue status updated successfully"
4. Refresh page - issue should stay in new column

# Expected Result: Issue moves and persists
```

### Test 2: Edit Issue Title (45 seconds)
```bash
# Steps:
1. Click on any issue card
2. Click "Edit" button in modal
3. Change the title
4. Click "Save Changes"
5. Modal should close
6. Card title updates in board

# Expected Result: Title changes and persists
```

### Test 3: Change Assignee (60 seconds)
```bash
# Steps:
1. Click on issue card
2. Click "Edit"
3. Click "Assignee" dropdown
4. Verify dropdown shows project members (not dummy data)
5. Select different assignee
6. Save
7. Check card shows new assignee initials

# Expected Result: Assignee updates with real project member
```

## 🔍 Quick Debug

### Check API Calls
Open browser DevTools > Network tab:
- Look for `PUT` requests to `/api/Issue`
- Status should be `200`
- Response should have `"status": 200`

### Check Console Logs
Filter by:
- `[BoardStore]` - for store operations
- `[BoardColumnsContainer]` - for drag-and-drop
- `[IssueDetailedView]` - for modal updates

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Card reverts after drag | Backend error - check console |
| Assignee dropdown empty | Check `/api/User/by-project/{id}` endpoint |
| Changes don't persist | Verify auth token and project ID |
| Modal doesn't close | Check for API errors in console |

## ✅ Success Indicators

✓ Console logs show successful API calls  
✓ Network tab shows 200 responses  
✓ Changes persist after page refresh  
✓ No error alerts displayed  
✓ Assignee dropdown shows project members  

## 📋 Full Test Checklist

- [ ] Drag issue to "To Do" column
- [ ] Drag issue to "In Progress" column
- [ ] Drag issue to "Done" column
- [ ] Edit issue title
- [ ] Edit issue description
- [ ] Change assignee from dropdown
- [ ] Change due date
- [ ] Verify changes persist after refresh
- [ ] Test with backend offline (should show error + rollback)

## 🎯 Key Endpoints

```
PUT /api/Issue                                    # Update issue
GET /api/User/by-project/{projectId}             # Get assignees
GET /api/Issue/project/{projectId}/issues        # Get issues
```

## 📦 Next Steps After Testing

1. If all tests pass: Deploy to staging ✅
2. If tests fail: Check BOARD_OPERATIONS_BACKEND_INTEGRATION.md for detailed debugging
3. Add loading spinners for better UX
4. Replace alert() with toast notifications

---

**Total test time:** ~5 minutes  
**Critical tests:** Drag-and-drop, Title edit, Assignee change
