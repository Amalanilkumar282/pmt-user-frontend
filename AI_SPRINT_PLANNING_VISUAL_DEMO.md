# AI Sprint Planning - Visual Demo Guide

## 🎬 Feature Walkthrough

### 1️⃣ Initial State - Backlog Page

```
┌─────────────────────────────────────────────────────────┐
│  Backlog                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Filters Section]                                      │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ 💡 AI Sprint         │  │ + Create Sprint      │   │
│  │    Suggestion        │  │                      │   │
│  └──────────────────────┘  └──────────────────────┘   │
│           ↑                                             │
│      NEW BUTTON!                                        │
└─────────────────────────────────────────────────────────┘
```

**Description:**

- Green "AI Sprint Suggestion" button with lightbulb icon
- Positioned to the left of "Create Sprint" button
- Stands out with distinct green color (#10b981)

---

### 2️⃣ Loading State

```
┌──────────────────────────────────────────────────────┐
│  ✨ AI Sprint Suggestions                      [×]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│                     ⌛ [Spinner]                     │
│                                                      │
│              Analyzing Sprint Context...             │
│                                                      │
│     Our AI is evaluating your backlog and            │
│            team capacity                             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Description:**

- Modal opens immediately upon button click
- Animated spinner rotates continuously
- Informative loading message
- User cannot close while loading

---

### 3️⃣ Success State - AI Suggestions Displayed

```
┌──────────────────────────────────────────────────────────────┐
│  ✨ AI Sprint Suggestions                              [×]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📄 AI Summary                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ These stories align with the sprint goal of improving  │ │
│  │ UX and front-end responsiveness. The selected issues   │ │
│  │ total 42 story points, matching your team's average    │ │
│  │ velocity.                                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📋 Recommended Issues (5)                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Key       │ Summary                    │ Story Points  │ │
│  ├───────────┼────────────────────────────┼───────────────┤ │
│  │ ISS-501   │ Add dark mode support      │      8        │ │
│  │ ISS-503   │ Improve analytics dash...  │     13        │ │
│  │ ISS-507   │ Fix responsive layout      │      5        │ │
│  │ ISS-510   │ Update user profile UI     │      8        │ │
│  │ ISS-512   │ Add export functionality   │      8        │ │
│  ├───────────┴────────────────────────────┴───────────────┤ │
│  │                      Total Story Points │     42        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                           [Close]  [Commit Changes]          │
└──────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**

- ✨ Sparkle icon in header
- 📄 Document icon for Summary section
- 📋 Clipboard icon for Issues section
- Color-coded issue keys in blue badges
- Story points in circular badges
- Total highlighted at bottom
- Two action buttons in footer

---

### 4️⃣ Error State

```
┌──────────────────────────────────────────────────────┐
│  ✨ AI Sprint Suggestions                      [×]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│                      ⚠️                              │
│                                                      │
│            Unable to generate suggestions            │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
│                                                      │
│                           [Close]                    │
└──────────────────────────────────────────────────────┘
```

**Description:**

- Warning icon displayed
- Clear error message
- Only Close button available
- Toast notification also appears

---

## 🎨 Color Scheme

### Button Colors:

```
AI Sprint Suggestion Button:
  - Background: #10b981 (Emerald Green)
  - Hover: #059669 (Dark Emerald)
  - Icon: White lightbulb

Create Sprint Button:
  - Background: #3D62A8 (Blue)
  - Hover: #2e5390 (Dark Blue)
```

### Modal Elements:

```
Issue Key Badge:
  - Background: #eff6ff (Light Blue)
  - Text: #1e40af (Navy Blue)

Story Points Badge:
  - Background: #3D62A8 (Blue)
  - Text: White

Total Points Badge:
  - Background: #2563eb (Bright Blue)
  - Text: White
```

---

## 📱 Responsive Design

### Desktop (> 768px)

```
┌─────────────────────────────────────────┐
│                                         │
│  [AI Sprint Suggestion] [Create Sprint] │
│                                         │
│  Wide modal (900px)                     │
│  Table with full width                  │
└─────────────────────────────────────────┘
```

### Mobile (< 768px)

```
┌───────────────────┐
│                   │
│ [AI Sprint Sug.] │
│ [Create Sprint]   │
│                   │
│  Narrow modal     │
│  (95% width)      │
│  Scrollable table │
└───────────────────┘
```

---

## 🔄 User Flow Diagram

```
Start
  │
  ├─→ User clicks "AI Sprint Suggestion" button
  │
  ├─→ Modal opens with loading spinner
  │
  ├─→ Service fetches context from backend API
  │        │
  │        ├─→ Success
  │        │     │
  │        │     ├─→ Service calls Gemini API with prompt
  │        │     │        │
  │        │     │        ├─→ Success
  │        │     │        │     │
  │        │     │        │     ├─→ Parse JSON response
  │        │     │        │     │
  │        │     │        │     ├─→ Display AI summary
  │        │     │        │     │
  │        │     │        │     └─→ Show issues table
  │        │     │        │
  │        │     │        └─→ Error
  │        │     │              │
  │        │     │              └─→ Show error state
  │        │     │                   + Toast notification
  │        │
  │        └─→ Error
  │              │
  │              └─→ Show error state + Toast notification
  │
  └─→ User reviews suggestions
        │
        ├─→ Click "Close" → Modal closes
        │
        └─→ Click "Commit Changes" → Toast: "Coming soon!"
```

---

## 🎯 Interactive Elements

### Hover Effects:

1. **AI Sprint Button:** Darkens to #059669
2. **Close Button (×):** Gray background appears
3. **Table Rows:** Light gray highlight on hover
4. **Footer Buttons:** Darken on hover

### Click Actions:

1. **AI Sprint Button:** Opens modal, starts API call
2. **Modal Backdrop:** Closes modal
3. **Close (×) Button:** Closes modal
4. **Close Button:** Closes modal
5. **Commit Changes:** Shows "Coming soon" toast (disabled)

### Animations:

1. **Modal Appear:** Slide up + fade in (0.3s)
2. **Backdrop:** Fade in (0.2s)
3. **Spinner:** Continuous rotation (0.8s)
4. **Buttons:** Transform down 1px on click

---

## 📊 Sample AI Response

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
    },
    {
      "key": "ISS-507",
      "summary": "Fix responsive layout issues",
      "story_points": 5
    },
    {
      "key": "ISS-510",
      "summary": "Update user profile UI",
      "story_points": 8
    },
    {
      "key": "ISS-512",
      "summary": "Add data export functionality",
      "story_points": 8
    }
  ],
  "summary": "These stories align with the sprint goal of improving UX and front-end responsiveness. The selected issues total 42 story points, matching your team's average velocity and ensuring a balanced sprint workload."
}
```

---

## 🎭 Edge Cases Handled

1. ✅ **No backend response** → Error state + toast
2. ✅ **Invalid Gemini API key** → Error state + toast
3. ✅ **Malformed JSON** → Error caught, error state shown
4. ✅ **Empty recommendations** → Displays empty table
5. ✅ **Very long summaries** → Scrollable text area
6. ✅ **Many issues** → Scrollable table
7. ✅ **Network timeout** → Error handling catches it

---

## 🌟 User Experience Highlights

- **Fast feedback:** Modal opens immediately
- **Clear loading:** Spinner with descriptive message
- **Readable results:** Well-formatted table and summary
- **Easy to scan:** Color-coded badges and clear hierarchy
- **Graceful errors:** Friendly messages, no crashes
- **Mobile-friendly:** Responsive design adapts to screen size

---

**Visual Demo Created:** October 17, 2025
