# AI Sprint Planning - Quick Reference

## 🚀 Quick Start

### Click the AI Button

1. Go to Backlog page
2. Look for green **"AI Sprint Suggestion"** button (left of Create Sprint)
3. Click it
4. Wait for AI analysis
5. Review suggestions in modal

## 📋 What You'll See

### Modal Sections:

1. **AI Summary** - Why these issues were chosen
2. **Recommended Issues Table** - Issues with story points
3. **Total Story Points** - Sum of all recommendations

## 🔧 API Requirements

### Backend Endpoint:

```
GET http://localhost:3000/api/ai/sprint-planning/context
```

### Environment Config:

```typescript
// src/environments/environment.ts
geminiApiKey: 'YOUR_API_KEY';
```

## 📁 Files Modified

- `backlog-page.ts` - Added AI methods
- `backlog-page.html` - Added AI button & modal
- `backlog-page.css` - Styled AI button

## 📁 Files Created

- `ai-sprint-modal/` - Modal component (3 files)
- `services/ai-sprint-planning.service.ts` - AI logic
- `services/toast.service.ts` - Notifications

## ✨ Key Methods

```typescript
// In backlog-page.ts
handleAISprintSuggestion(); // Opens modal, calls AI
closeAIModal(); // Closes modal
handleCommitAISuggestions(); // Future: commits issues
```

## 🎨 Styling

- AI Button: Green (#10b981)
- Create Sprint: Blue (#3D62A8)
- Modal: Responsive, animated

## 🐛 Common Issues

1. **Modal not opening?** → Check console errors
2. **API failing?** → Verify backend is running
3. **Gemini error?** → Check API key in environment.ts
4. **No suggestions?** → Check network tab for response

## ✅ Testing Checklist

- [ ] Button appears correctly
- [ ] Modal opens on click
- [ ] Loading spinner shows
- [ ] AI response displays
- [ ] Table shows issues
- [ ] Total points calculated
- [ ] Close button works
- [ ] Error handling works

## 🎯 Feature Status

- ✅ UI Implementation
- ✅ API Integration
- ✅ Error Handling
- ✅ Loading States
- ⏳ Commit Functionality (Phase 2)

---

**Quick Tip:** The "Commit Changes" button is currently non-functional (future feature).
