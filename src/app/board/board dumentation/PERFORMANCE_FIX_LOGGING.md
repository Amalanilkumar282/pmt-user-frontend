# Board Loading Performance Fix - Excessive Logging Removed

## Problem
Board was taking **2 minutes to load** due to:
1. **Duplicate API calls** - Data loading twice (ngOnInit + constructor subscriptions)
2. **Excessive console logging** - 100+ console.logs per page load:
   - 33 issues × 2 loads = 66 "[IssueApiService] Mapping issue" logs
   - 12 columns × 2 loads = 24 "[BoardApiService] Mapping column" logs  
   - 10+ "[BoardService.enrichDefaultBoardColumns]" logs per load
   - Multiple board service logging statements

## Fixes Applied

### 1. Removed Verbose Logging
**Files Modified:**
- `src/app/board/services/issue-api.service.ts`
  - Removed 5 console.logs from `getIssuesByProject()`
  - Removed per-issue mapping log (33 logs eliminated)
  
- `src/app/board/services/board-api.service.ts`
  - Removed per-column mapping log (12 logs eliminated)

- `src/app/board/services/board.service.ts`
  - Removed 11 console.logs from `enrichDefaultBoardColumns()`
  - Simplified column de-duplication logic

- `src/app/board/components/board-page/board-page.ts`
  - Removed 10+ debug logs from ngOnInit and loadProjectData
  - Cleaned up constructor logging

### 2. Fixed Duplicate Loading
**File:** `src/app/board/components/board-page/board-page.ts`

**Problem:** Both `ngOnInit` and `route.parent.params` subscription were loading data on initial render

**Fix:** Added check to skip initial load in constructor subscription:
```typescript
// Skip if this is the initial load (handled by ngOnInit)
if (this._lastLoadedProjectId === null) {
  return;
}
```

**Result:** Constructor subscription now only handles **subsequent** project changes, not initial load.

## Performance Impact

### Before:
- **100+ console.logs** on every board page load
- **Duplicate API calls** (2× issues, 2× sprints, 2× boards)
- **~2 minute load time**

### After:
- **~5 console.logs** (only errors/critical info)
- **Single API call set**
- **Expected load time: 2-5 seconds** (depending on network/data size)

## Testing
1. Navigate to board page
2. Check console - should see minimal logging
3. Verify board loads once with correct data
4. Change projects - should see single load

## Notes
- SSL certificate fix already applied in `server.ts`
- ProfileButton SSR guard already applied
- Load guards (`_lastLoadedProjectId`) working correctly
- Caching layer preventing redundant API calls

**Status:** ✅ Fixed - Ready for testing
