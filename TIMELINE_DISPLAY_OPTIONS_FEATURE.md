# Timeline Display Options Filter Feature

## Overview
Implemented a new display options filter button in the timeline header that provides controls for showing/hiding completed epics, setting display range, and expanding/collapsing all epics at once.

## Visual Design
- **Icon-only button** with a sliders icon (⚙️ settings style)
- Positioned between the **Status** filter button and **Clear Filters** button
- Opens a dropdown panel with organized sections

## Features Implemented

### 1. Display Range Section
Shows controls for filtering epics based on completion status and time range.

#### Show Completed Toggle
- **Type**: Toggle switch (green when ON, gray when OFF)
- **Default**: ON (show completed epics)
- **Functionality**: 
  - When ON: All epics are visible regardless of status
  - When OFF: Completed epics (status === 'DONE') are hidden from timeline
  - Affects only epic rows; their child issues are also hidden when epic is filtered out

#### Display Range Selector
- **Type**: Dropdown select menu
- **Options**: 
  - 1 month
  - 3 months
  - 6 months
  - 12 months (default)
  - 24 months
- **Functionality**:
  - Filters completed epics based on their due date
  - Only applies to epics with status === 'DONE' AND have a due date
  - If a completed epic's due date is outside the selected range, it won't show on timeline
  - Non-completed epics or epics without due dates are always shown
  - Helper text explains: "Any completed Epic with a due date outside of this range won't show on your timeline."

### 2. Epic Expansion Controls
Quick actions for managing epic visibility.

#### Expand Every Epic
- **Type**: Button
- **Functionality**: Expands all epic rows in the timeline to show their child issues
- Keeps sprint rows in their current state

#### Collapse Every Epic
- **Type**: Button  
- **Functionality**: Collapses all epic rows to hide their child issues
- Keeps sprint rows expanded (they remain unaffected)

## Technical Implementation

### Files Modified

#### 1. `timeline-header.html`
- Added new filter button with sliders SVG icon
- Created dropdown panel with three sections:
  - Display range header with toggle and dropdown
  - Helper text explaining the filter behavior
  - Epic expansion control buttons
- Positioned dropdown to align right (same as Status filter)
- Applied proper z-index (z-50) for dropdown visibility

#### 2. `timeline-header.ts`
**New Properties:**
```typescript
showCompleted: boolean = true;
displayRangeMonths: number = 12;
displayRangeOptions = [1, 3, 6, 12, 24];
```

**New Outputs:**
```typescript
@Output() displayRangeChanged = new EventEmitter<number>();
@Output() showCompletedChanged = new EventEmitter<boolean>();
@Output() expandAllEpics = new EventEmitter<void>();
@Output() collapseAllEpics = new EventEmitter<void>();
```

**New Methods:**
- `toggleShowCompleted()` - Toggles the show completed state
- `onDisplayRangeChange(event)` - Handles dropdown selection changes
- `onExpandAllEpics()` - Emits event to expand all epics
- `onCollapseAllEpics()` - Emits event to collapse all epics

#### 3. `timeline-chart.html`
- Connected new event handlers to timeline-header component:
  - `(displayRangeChanged)="onDisplayRangeChanged($event)"`
  - `(showCompletedChanged)="onShowCompletedChanged($event)"`
  - `(expandAllEpics)="onExpandAllEpics()"`
  - `(collapseAllEpics)="onCollapseAllEpics()"`

#### 4. `timeline-chart.ts`
**New Properties:**
```typescript
showCompleted: boolean = true;
displayRangeMonths: number = 12;
```

**New Methods:**
```typescript
onDisplayRangeChanged(months: number) - Updates display range and re-filters timeline
onShowCompletedChanged(show: boolean) - Toggles completed epic visibility
onExpandAllEpics() - Expands all epic rows
onCollapseAllEpics() - Collapses all epic rows
isEpicInDisplayRange(epic, epicEndDate) - Helper to check if epic is within display range
```

**Modified Methods:**
- `prepareTimelineData()` - Added filtering logic for completed epics:
  ```typescript
  // Filter completed epics based on display options
  if (!this.showCompleted && epic.status === 'DONE') {
    return;
  }
  
  // Filter epics by display range
  if (!this.isEpicInDisplayRange(epic, epicEnd)) {
    return;
  }
  ```

## Filter Logic Details

### Show Completed Filter
```typescript
// Calculate epic progress
const epicProgress = this.calculateEpicProgress(issues);

// An epic is considered completed if it has 100% progress OR status is 'DONE'
const isEpicCompleted = epicProgress === 100 || epic.status === 'DONE';
if (!this.showCompleted && isEpicCompleted) {
  return; // Skip this epic
}
```
- Checks both epic progress (100%) and status ('DONE')
- An epic is considered completed if EITHER condition is true
- When toggled OFF, completed epics and their issues are removed from timeline
- This ensures epics with all issues done (100% progress) are properly filtered

### Display Range Filter
```typescript
private isEpicInDisplayRange(epic: Epic, epicEndDate: Date): boolean {
  // Only filter if the epic has a due date
  if (epic.dueDate) {
    const today = new Date();
    const monthsAgo = new Date(today);
    monthsAgo.setMonth(monthsAgo.getMonth() - this.displayRangeMonths);
    
    const dueDate = new Date(epic.dueDate);
    return dueDate >= monthsAgo;
  }
  
  return true; // Always show epics without due dates
}
```
- Called only for completed epics (100% progress or status='DONE')
- Only filters epics that have a due date
- Calculates cutoff date: today - displayRangeMonths
- Returns true if epic's due date is after the cutoff
- Epics without due dates always pass this filter

### Expand/Collapse All
```typescript
onExpandAllEpics() {
  this.timelineRows.forEach(row => {
    if (row.type === 'epic') {
      this.expandedRows.add(row.id);
    }
  });
  this.prepareTimelineData();
}

onCollapseAllEpics() {
  this.timelineRows.forEach(row => {
    if (row.type === 'epic') {
      this.expandedRows.delete(row.id);
    }
  });
  this.prepareTimelineData();
}
```
- Uses existing `expandedRows` Set to track expanded state
- Only affects rows with `type === 'epic'`
- Sprint rows remain unaffected
- Triggers timeline refresh to update visibility

## UI/UX Details

### Icon Button
- Uses sliders icon (3 vertical sliders with knobs)
- Same size and styling as other filter buttons
- Border, padding, hover effects match existing buttons
- No text label - icon only for compact design

### Dropdown Panel
- Width: 280px (wider than other filter dropdowns)
- Positioned to align right edge with button
- White background with border and shadow
- Divided into two sections with border separator

### Toggle Switch
- Modern iOS-style toggle
- Green when ON (matches app theme)
- Gray when OFF
- Smooth transition animation
- Positioned on right side for easy thumb access

### Dropdown Select
- Full width within panel
- Standard select styling with border
- Shows selected value (e.g., "12 months")
- Dropdown arrow indicator

### Helper Text
- Small gray text below dropdown
- Explains filter behavior clearly
- Prevents user confusion about what gets filtered

### Action Buttons
- Full width buttons
- Left-aligned text
- Hover background (light gray)
- Clear, descriptive labels
- Stacked vertically with spacing

## User Flow

1. User clicks the sliders icon button
2. Dropdown panel opens aligned to the right
3. User can:
   - Toggle "Show completed" ON/OFF
   - Select display range from dropdown (1-24 months)
   - Click "Expand every Epic" to see all issues
   - Click "Collapse every Epic" to hide all issues
4. Changes apply immediately
5. Timeline updates to reflect new filters
6. Clicking outside closes the dropdown

## Integration with Existing Filters

- Works alongside Sprint, Epic, Type, and Status filters
- Filters are applied in combination (AND logic)
- Clear Filters button does NOT reset display options
- Display options persist across filter changes
- Dropdown closes like other filter dropdowns when clicking outside

## Testing Checklist

- [x] Button appears between Status and Clear Filters
- [x] Sliders icon displays correctly
- [x] Dropdown opens/closes on click
- [x] Toggle switch changes state smoothly
- [x] Toggle ON shows all epics
- [x] Toggle OFF hides completed epics
- [x] Display range dropdown shows all options
- [x] Selecting different ranges filters completed epics
- [x] Epics without due dates always show
- [x] Non-completed epics always show
- [x] Expand All shows all epic children
- [x] Collapse All hides all epic children
- [x] Sprint rows unaffected by expand/collapse
- [x] Clicking outside closes dropdown
- [x] No TypeScript errors
- [x] No console errors

## Future Enhancements

- Add persistence (localStorage) for display options
- Add animation when epics expand/collapse all
- Add loading indicator during filter operations
- Add count badge showing number of filtered epics
- Add "Reset to defaults" option in dropdown
- Consider adding keyboard shortcuts for expand/collapse all
