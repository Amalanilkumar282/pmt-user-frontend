# AI Sprint Planning - Testing Checklist

## Pre-Testing Setup

- [ ] Backend API running on `http://localhost:3000`
- [ ] Gemini API key configured in `environment.ts`
- [ ] Angular dev server running (`ng serve`)
- [ ] Browser DevTools open (Console + Network tabs)

---

## 🧪 Test Cases

### 1. Button Visibility & Placement

- [ ] **TC-01:** Navigate to Backlog page
- [ ] **TC-02:** Verify "AI Sprint Suggestion" button is visible
- [ ] **TC-03:** Confirm button is GREEN (#10b981)
- [ ] **TC-04:** Confirm button is LEFT of "Create Sprint" button
- [ ] **TC-05:** Verify lightbulb icon is present
- [ ] **TC-06:** Hover over button - color darkens to #059669

**Expected Result:** ✅ Button displays correctly with proper styling

---

### 2. Modal Opening

- [ ] **TC-07:** Click "AI Sprint Suggestion" button
- [ ] **TC-08:** Modal opens immediately
- [ ] **TC-09:** Backdrop appears with blur effect
- [ ] **TC-10:** Modal animation (slide up) is smooth
- [ ] **TC-11:** Loading spinner appears
- [ ] **TC-12:** "Analyzing Sprint Context..." message displays

**Expected Result:** ✅ Modal opens with loading state

---

### 3. API Calls

- [ ] **TC-13:** Open Network tab in DevTools
- [ ] **TC-14:** Click AI button
- [ ] **TC-15:** Verify call to `localhost:3000/api/ai/sprint-planning/context`
- [ ] **TC-16:** Check response status is 200
- [ ] **TC-17:** Verify call to Gemini API
- [ ] **TC-18:** Check Gemini response structure

**Expected Result:** ✅ Both API calls succeed with valid responses

---

### 4. Success State - AI Summary

- [ ] **TC-19:** Wait for AI response (2-5 seconds)
- [ ] **TC-20:** Loading spinner disappears
- [ ] **TC-21:** "AI Summary" section appears
- [ ] **TC-22:** Summary text is readable and relevant
- [ ] **TC-23:** Document icon (📄) is visible
- [ ] **TC-24:** Text wraps properly in container

**Expected Result:** ✅ AI summary displays correctly

---

### 5. Success State - Issues Table

- [ ] **TC-25:** "Recommended Issues" section appears
- [ ] **TC-26:** Table header shows: Key | Summary | Story Points
- [ ] **TC-27:** Issue rows display with correct data
- [ ] **TC-28:** Issue keys are in blue badges
- [ ] **TC-29:** Story points are in circular blue badges
- [ ] **TC-30:** Issue count in header is correct (e.g., "5")
- [ ] **TC-31:** Hover over rows - background highlights

**Expected Result:** ✅ Issues table renders with all data

---

### 6. Success State - Total Calculation

- [ ] **TC-32:** Table footer shows "Total Story Points"
- [ ] **TC-33:** Total is calculated correctly
- [ ] **TC-34:** Total badge is highlighted (bright blue)
- [ ] **TC-35:** Total matches sum of individual story points

**Expected Result:** ✅ Total story points calculated accurately

---

### 7. Modal Controls

- [ ] **TC-36:** Click backdrop - modal closes
- [ ] **TC-37:** Click X button - modal closes
- [ ] **TC-38:** Click "Close" button - modal closes
- [ ] **TC-39:** Press ESC key (if implemented) - modal closes
- [ ] **TC-40:** Modal state resets after closing

**Expected Result:** ✅ All close methods work

---

### 8. Commit Changes Button

- [ ] **TC-41:** "Commit Changes" button is visible
- [ ] **TC-42:** Button is enabled (not grayed out)
- [ ] **TC-43:** Click "Commit Changes"
- [ ] **TC-44:** Toast appears: "Commit functionality coming soon!"
- [ ] **TC-45:** Console logs: "Commit AI suggestions: ..."

**Expected Result:** ✅ Button shows placeholder functionality

---

### 9. Error Handling - Backend Unavailable

- [ ] **TC-46:** Stop backend server
- [ ] **TC-47:** Click AI button
- [ ] **TC-48:** Modal opens with loading
- [ ] **TC-49:** After timeout, error toast appears
- [ ] **TC-50:** Modal shows error state with warning icon
- [ ] **TC-51:** Console logs error details

**Expected Result:** ✅ Graceful error handling

---

### 10. Error Handling - Invalid API Key

- [ ] **TC-52:** Set invalid Gemini API key in `environment.ts`
- [ ] **TC-53:** Restart dev server
- [ ] **TC-54:** Click AI button
- [ ] **TC-55:** Context API succeeds, Gemini fails
- [ ] **TC-56:** Error toast appears
- [ ] **TC-57:** Modal shows error state

**Expected Result:** ✅ API key error handled

---

### 11. Error Handling - Malformed Response

- [ ] **TC-58:** Mock Gemini to return invalid JSON
- [ ] **TC-59:** Click AI button
- [ ] **TC-60:** Parsing error caught
- [ ] **TC-61:** Error toast appears
- [ ] **TC-62:** Console logs parsing error

**Expected Result:** ✅ Parsing errors handled

---

### 12. Toast Notifications

- [ ] **TC-63:** Success toast appears on successful AI response
- [ ] **TC-64:** Toast message: "AI suggestions generated successfully!"
- [ ] **TC-65:** Toast is green (success color)
- [ ] **TC-66:** Toast auto-dismisses after 3 seconds
- [ ] **TC-67:** Error toast appears on failures
- [ ] **TC-68:** Error toast is red

**Expected Result:** ✅ Toast notifications work correctly

---

### 13. Responsive Design - Desktop

- [ ] **TC-69:** View on desktop (> 1024px width)
- [ ] **TC-70:** Buttons display horizontally
- [ ] **TC-71:** Modal is centered and 900px wide
- [ ] **TC-72:** Table columns are readable
- [ ] **TC-73:** No horizontal scrolling

**Expected Result:** ✅ Desktop layout is optimal

---

### 14. Responsive Design - Tablet

- [ ] **TC-74:** Resize browser to 768px width
- [ ] **TC-75:** Buttons still horizontal
- [ ] **TC-76:** Modal adjusts to 90% width
- [ ] **TC-77:** Table may scroll horizontally
- [ ] **TC-78:** Text remains readable

**Expected Result:** ✅ Tablet layout adapts

---

### 15. Responsive Design - Mobile

- [ ] **TC-79:** Resize browser to 375px width (mobile)
- [ ] **TC-80:** Buttons stack vertically
- [ ] **TC-81:** Modal is 95% width
- [ ] **TC-82:** Table scrolls horizontally
- [ ] **TC-83:** All content is accessible

**Expected Result:** ✅ Mobile layout works

---

### 16. Performance

- [ ] **TC-84:** Click AI button multiple times quickly
- [ ] **TC-85:** No duplicate API calls made
- [ ] **TC-86:** Modal doesn't flicker or crash
- [ ] **TC-87:** Network requests complete in < 5 seconds
- [ ] **TC-88:** No memory leaks after 10 open/close cycles

**Expected Result:** ✅ Performance is acceptable

---

### 17. Accessibility

- [ ] **TC-89:** Tab through page - AI button is focusable
- [ ] **TC-90:** Button has visible focus indicator
- [ ] **TC-91:** Modal close buttons are keyboard accessible
- [ ] **TC-92:** Screen reader announces modal opening
- [ ] **TC-93:** Color contrast meets WCAG AA standards

**Expected Result:** ✅ Accessibility requirements met

---

### 18. Browser Compatibility

- [ ] **TC-94:** Test in Chrome - all features work
- [ ] **TC-95:** Test in Firefox - all features work
- [ ] **TC-96:** Test in Edge - all features work
- [ ] **TC-97:** Test in Safari - all features work

**Expected Result:** ✅ Cross-browser compatibility

---

### 19. Edge Cases

- [ ] **TC-98:** Empty backlog - AI handles gracefully
- [ ] **TC-99:** Very long issue summaries - truncate/wrap properly
- [ ] **TC-100:** 0 story points total - displays "0"
- [ ] **TC-101:** 100+ recommended issues - scrollable table
- [ ] **TC-102:** Special characters in summary - renders correctly

**Expected Result:** ✅ Edge cases handled

---

### 20. Integration with Existing Features

- [ ] **TC-103:** "Create Sprint" button still works
- [ ] **TC-104:** Sprint creation modal opens correctly
- [ ] **TC-105:** No conflicts with other modals
- [ ] **TC-106:** Sidebar toggle works with AI modal open
- [ ] **TC-107:** Epic panel works with AI modal

**Expected Result:** ✅ No conflicts with existing features

---

## 📊 Test Results Summary

| Category        | Total Tests | Passed | Failed | Skipped |
| --------------- | ----------- | ------ | ------ | ------- |
| UI/UX           | 20          | -      | -      | -       |
| Functionality   | 30          | -      | -      | -       |
| API Integration | 15          | -      | -      | -       |
| Error Handling  | 17          | -      | -      | -       |
| Responsive      | 15          | -      | -      | -       |
| Performance     | 5           | -      | -      | -       |
| Accessibility   | 5           | -      | -      | -       |
| **TOTAL**       | **107**     | -      | -      | -       |

---

## 🐛 Bug Report Template

If any test fails, use this template:

```
**Test Case ID:** TC-XX
**Test Description:** [Description]
**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Steps to Reproduce:**
1.
2.
3.

**Environment:**
- Browser: [Chrome/Firefox/etc.]
- Screen Size: [Desktop/Tablet/Mobile]
- Backend Status: [Running/Stopped]

**Console Errors:** [Paste errors]
**Network Tab:** [Relevant info]
**Screenshots:** [If applicable]

**Severity:** [Critical/High/Medium/Low]
**Priority:** [Urgent/High/Normal/Low]
```

---

## ✅ Sign-Off

**Tester Name:** **********\_\_\_**********  
**Test Date:** **********\_\_\_**********  
**Overall Result:** [ ] PASS [ ] FAIL  
**Notes:** **********\_\_\_**********

---

**Testing Checklist Version:** 1.0  
**Last Updated:** October 17, 2025
