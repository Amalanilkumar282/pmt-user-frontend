# AI Sprint Planning Feature - Implementation Guide

## 🎯 Overview

The AI Sprint Planning feature uses Google's Gemini AI to automatically suggest which backlog issues should be included in the next sprint based on team velocity, capacity, and priorities.

## 📂 Files Created/Modified

### New Files Created:

1. **`src/app/shared/services/ai-sprint-planning.service.ts`**

   - Core service that handles AI sprint planning logic
   - Fetches sprint context from backend API
   - Communicates with Gemini API
   - Parses and validates AI responses

2. **`src/app/shared/services/toast.service.ts`**

   - Toast notification service for user feedback
   - Supports success, error, info, and warning messages

3. **`src/app/backlog/ai-sprint-modal/ai-sprint-modal.ts`**

   - Modal component for displaying AI suggestions
   - Shows loading state, suggestions, and error states

4. **`src/app/backlog/ai-sprint-modal/ai-sprint-modal.html`**

   - Template for the AI suggestions modal
   - Displays summary and recommended issues table

5. **`src/app/backlog/ai-sprint-modal/ai-sprint-modal.css`**
   - Styling for the AI modal including animations

### Modified Files:

1. **`src/app/backlog/backlog-page/backlog-page.ts`**

   - Added AI Sprint Planning imports
   - Added modal state management
   - Implemented `handleAISprintSuggestion()` method
   - Added `closeAIModal()` and `handleCommitAISuggestions()` methods

2. **`src/app/backlog/backlog-page/backlog-page.html`**

   - Added "AI Sprint Suggestion" button
   - Integrated AI modal component

3. **`src/app/backlog/backlog-page/backlog-page.css`**
   - Added styling for AI Sprint button
   - Updated responsive design

## 🔧 Technical Architecture

### API Flow

```
1. User clicks "AI Sprint Suggestion" button
   ↓
2. Fetch context from: http://localhost:3000/api/ai/sprint-planning/context
   ↓
3. Construct Gemini prompt with context data
   ↓
4. Send request to Gemini API
   ↓
5. Parse and validate AI response
   ↓
6. Display results in modal
```

### Expected API Response Format

**Sprint Context API Response:**

```json
{
  "current_sprint": {
    "name": "Sprint 5",
    "goal": "Improve user experience",
    "start_date": "2025-10-01",
    "end_date": "2025-10-14",
    "velocity": 42
  },
  "team_capacity": {
    "total_developers": 5,
    "available_story_points": 45
  },
  "average_velocity": 38,
  "product_backlog": [
    {
      "key": "ISS-501",
      "summary": "Add dark mode support",
      "priority": "High",
      "story_points": 8,
      "epic": "UX Improvements"
    }
  ]
}
```

**Gemini AI Response:**

```json
{
  "recommended_issues": [
    {
      "key": "ISS-501",
      "summary": "Add dark mode support",
      "story_points": 8
    },
    {
      "key": "ISS-503",
      "summary": "Improve analytics dashboard",
      "story_points": 13
    }
  ],
  "summary": "These stories align with the sprint goal of improving UX and front-end responsiveness."
}
```

## 🎨 UI Components

### AI Sprint Suggestion Button

- **Location:** Left of "Create Sprint" button in backlog page header
- **Style:** Green background (#10b981) with lightbulb icon
- **Behavior:** Opens modal and triggers AI analysis on click

### AI Suggestions Modal

**Components:**

- **Header:** Title with AI icon and close button
- **Loading State:** Spinner with "Analyzing Sprint Context..." message
- **Content:**
  - AI Summary section with explanation
  - Recommended Issues table (Key, Summary, Story Points)
  - Total story points calculation
- **Footer:** Close and "Commit Changes" buttons

## 🔑 Key Features

### 1. Loading State

- Displays animated spinner
- Shows informative message during AI processing
- Disables close button during loading

### 2. AI Summary

- Displays AI-generated explanation
- Explains why specific issues were recommended
- Uses friendly, readable formatting

### 3. Issues Table

- Shows recommended issues with details
- Color-coded issue keys
- Story point badges
- Calculates total story points

### 4. Error Handling

- Catches API failures gracefully
- Shows toast notifications for errors
- Displays error state in modal

## 🚀 Usage Instructions

### For Developers:

1. **Start the backend API** (if available):

   ```bash
   # Backend should expose:
   # GET http://localhost:3000/api/ai/sprint-planning/context
   ```

2. **Ensure Gemini API Key is configured**:

   - Check `src/environments/environment.ts`
   - Verify `geminiApiKey` is set

3. **Run the application**:

   ```bash
   ng serve
   ```

4. **Navigate to Backlog page**:
   - Go to any project's backlog
   - Look for the green "AI Sprint Suggestion" button

### For Users:

1. Click the **"AI Sprint Suggestion"** button
2. Wait for AI analysis (shows loading spinner)
3. Review the AI's recommendations:
   - Read the summary explanation
   - Check the recommended issues table
   - Note the total story points
4. Click **"Close"** to dismiss or **"Commit Changes"** (future feature)

## 📝 Environment Configuration

**`src/environments/environment.ts`:**

```typescript
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE',
};
```

Replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.

## 🎯 Acceptance Criteria

✅ **Completed:**

- [x] "AI Sprint Suggestion" button appears left of "Create Sprint" button
- [x] Button has green background with AI icon
- [x] Clicking button opens modal
- [x] Modal shows loading state during AI processing
- [x] Fetches context from backend API
- [x] Sends structured prompt to Gemini API
- [x] Parses and validates Gemini response
- [x] Displays AI summary and recommended issues
- [x] Shows total story points calculation
- [x] Handles API failures gracefully
- [x] Shows toast notifications for success/errors
- [x] "Commit Changes" button present (non-functional)
- [x] Responsive design for mobile

## 🧪 Testing Guide

### Manual Testing:

1. **Test Button Visibility:**

   - Navigate to backlog page
   - Verify AI button is visible and styled correctly
   - Check button positioning relative to "Create Sprint"

2. **Test Loading State:**

   - Click AI Sprint Suggestion button
   - Verify modal opens immediately
   - Check loading spinner animation
   - Confirm loading message displays

3. **Test API Integration:**

   - Monitor network tab for API calls
   - Verify context API is called first
   - Verify Gemini API is called second
   - Check request/response payloads

4. **Test Success State:**

   - Wait for AI response
   - Verify modal shows summary
   - Check issues table displays correctly
   - Confirm total story points are calculated

5. **Test Error Handling:**

   - Disable network connection
   - Click AI button
   - Verify error toast appears
   - Check modal shows error state

6. **Test Modal Controls:**
   - Click backdrop to close
   - Click X button to close
   - Click "Close" button
   - Verify modal state resets

### Error Scenarios:

1. **Backend API unavailable:**

   - Expected: Toast error message
   - Modal shows error state

2. **Invalid Gemini API key:**

   - Expected: Toast error message
   - Check console for API error

3. **Malformed AI response:**
   - Expected: Parsing error caught
   - Toast notification shown

## 🔄 Future Enhancements

### Phase 2 - Commit Functionality:

- Implement "Commit Changes" button
- Add issues to sprint automatically
- Show confirmation dialog
- Update sprint issues in real-time

### Phase 3 - Advanced Features:

- Allow manual editing of AI suggestions
- Save AI recommendations history
- Compare multiple AI suggestions
- Provide feedback on AI accuracy
- Fine-tune AI prompts based on user preferences

### Phase 4 - Analytics:

- Track AI suggestion acceptance rate
- Show accuracy metrics over time
- Generate reports on AI effectiveness

## 🐛 Troubleshooting

### Issue: Modal not opening

- **Check:** Console for errors
- **Verify:** Component is imported in backlog-page.ts
- **Solution:** Ensure all imports are correct

### Issue: API call failing

- **Check:** Backend is running on port 3000
- **Verify:** CORS is configured correctly
- **Solution:** Check network tab for specific error

### Issue: Gemini API error

- **Check:** API key in environment.ts
- **Verify:** API key is valid and has quota
- **Solution:** Test API key with curl/Postman

### Issue: Parsing errors

- **Check:** Gemini response format in console
- **Verify:** Response matches expected JSON structure
- **Solution:** Update parsing logic if Gemini format changes

## 📚 Code Examples

### Calling the AI Service:

```typescript
async handleAISprintSuggestion(): Promise<void> {
  this.isAIModalOpen = true;
  this.isLoadingAISuggestions = true;

  try {
    this.aiSuggestions = await this.aiSprintPlanningService.generateSprintSuggestions();
    this.toastService.success('AI suggestions generated successfully!');
  } catch (error) {
    console.error('Failed to generate AI suggestions:', error);
  } finally {
    this.isLoadingAISuggestions = false;
  }
}
```

### Custom Prompt Example:

```typescript
const prompt = `You are an Agile Sprint Planning AI.
Given the sprint context JSON below, identify which issues from the product backlog
should be included in the next sprint.

Respond ONLY with valid JSON in the following format:
{
  "recommended_issues": [ 
    { "key": "ISS-123", "summary": "Issue description", "story_points": 5 }
  ],
  "summary": "Brief summary explaining why these issues were selected"
}

Sprint context JSON:
${JSON.stringify(context, null, 2)}`;
```

## 🎓 Best Practices

1. **Always validate AI responses** before displaying to users
2. **Handle errors gracefully** with user-friendly messages
3. **Show loading states** for better UX
4. **Keep prompts concise** but clear for better AI responses
5. **Log errors** for debugging and monitoring
6. **Use TypeScript interfaces** for type safety
7. **Test with various data** scenarios

## 📞 Support

For issues or questions:

- Check console logs for detailed errors
- Review network tab for API call details
- Verify all dependencies are installed
- Ensure environment variables are configured

---

**Implementation Date:** October 17, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete and Ready for Testing
