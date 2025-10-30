import { Component, Output, EventEmitter } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface GeminiActionResponse {
  action?: string;
  route?: string;
  modal?: string;
  fields?: {
    issueType?: string;
    title?: string;
    summary?: string;
    description?: string;
    priority?: string;
    storyPoint?: number;
    [key: string]: any;
  };
  summary?: string;
}

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './searchbar.html',
  styleUrls: ['./searchbar.css']
})
export class Searchbar {
  query: string = '';
  isLoading: boolean = false;
  isAiEnabled: boolean = true;

  @Output() openCreateModal = new EventEmitter<any>();
  @Output() showSummary = new EventEmitter<string>();
  @Output() showWarning = new EventEmitter<string>();

  constructor(private router: Router) {}

  /**
   * Toggle AI assist on/off
   */
  toggleAi(): void {
    this.isAiEnabled = !this.isAiEnabled;
    console.log(`AI Assist ${this.isAiEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if current route is inside a project context
   */
  private isInsideProject(): boolean {
    const url = this.router.url;
    // Check if URL matches /projects/:id pattern
    const projectRoutePattern = /^\/projects\/[\w-]+/;
    return projectRoutePattern.test(url);
  }

  /**
   * Extract project ID from current route
   */
  private getCurrentProjectId(): string | null {
    const url = this.router.url;
    const match = url.match(/^\/projects\/([\w-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Triggered when user presses Enter in the search bar
   * Handles both AI and non-AI modes
   */
  async searchGemini() {
    const prompt = this.query.trim();
    if (!prompt) return;

    // Pre-parse prompt for "create" actions
    const isCreateAction = /create|add|make|new\s+(issue|task|bug|story|epic)/i.test(prompt);

    if (isCreateAction) {
      // Check if we're inside a project route
      if (!this.isInsideProject()) {
        this.showWarning.emit('This functionality is only available inside a project dashboard.');
        return;
      }
    }

    // If AI is disabled, perform regular search (placeholder for now)
    if (!this.isAiEnabled) {
      console.log('Regular search:', prompt);
      // TODO: Implement regular search functionality
      this.query = '';
      return;
    }

    // AI-enabled flow
    this.isLoading = true;

    try {
      const API_KEY = environment.geminiApiKey;
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + API_KEY;

      const projectId = this.getCurrentProjectId();

      // Enhanced prompt with project context
      const structuredPrompt = `
You are an intelligent assistant inside a project management web application (similar to Jira). 
Your job is to understand the user's natural language request and produce a machine-readable JSON object 
that allows the application to perform navigation or actions automatically.

Respond **only** with a raw JSON object — no markdown, no code blocks, and no explanations.

---

### Current Context:
${projectId ? `- User is inside Project ID: ${projectId}` : '- User is NOT inside a specific project'}
${projectId ? `- Use /projects/${projectId} as the base for all project-scoped routes` : ''}

---

### Available Actions:
- "create_issue": to create a new issue or task.
- "navigate": to move to a specific project page.
- "search": to perform a general search or lookup.

---

### Valid Routes (Always include /projects/{id} when the user is within a project):
"/projects"                                     → Project List  
"/projects/{id}/summary"                        → Project Summary Page  
"/projects/{id}/backlog"                        → Backlog Page  
"/projects/{id}/board"                          → Board Page  
"/projects/{id}/timeline"                       → Timeline Page  
"/projects/{id}/report-dashboard"               → Report Dashboard Home  
"/projects/{id}/report-dashboard/burnup-chart"  → Burnup Chart Page  
"/projects/{id}/report-dashboard/burndown-chart"→ Burndown Chart Page  
"/projects/{id}/report-dashboard/velocity-chart"→ Velocity Chart Page  

---

### Modal:
- "create-issue" — used only when the action is "create_issue"

---

### JSON Response Format:
{
  "action": "create_issue" | "navigate" | "search",
  "route": "<exact route path (include project ID if relevant)>",
  "modal": "create-issue" (only for create_issue),
  "fields": {
    "issueType": "Task" | "Bug" | "Story" | "Epic",
    "title": "short descriptive title for the issue",
    "description": "detailed description formatted as:\n\n**User Story:**\nAs a [user type], I want [goal] so that [reason].\n\n**Acceptance Criteria:**\n- [ ] Criterion 1\n- [ ] Criterion 2\n- [ ] Criterion 3\n\n**Non-Functional Requirements:**\n- Performance: [specify any performance requirements]\n- Security: [specify any security requirements]\n- Accessibility: [specify any accessibility requirements]",
    "priority": "High" | "Medium" | "Low",
    "storyPoint": <estimated story points as a number (1, 2, 3, 5, 8, 13, etc.)>
  },
  "summary": "short plain sentence summarizing what was done or will be done"
}

---

### Rules:
1. Respond strictly with JSON — no additional text or formatting.
2. If the user's request contains words like *create, add, make, open new issue*, set \`"action": "create_issue"\`.
3. If the request is about moving to a section or viewing something, set \`"action": "navigate"\` and map to the correct route.
4. If the request is informational or exploratory, use \`"action": "search"\`.
5. For create actions, always infer reasonable \`"fields"\`:
   - "title": A clear, concise title for the issue
   - "description": A detailed description following the User Story format with Acceptance Criteria and Non-Functional Requirements
   - "priority": Based on urgency indicators in the request (High/Medium/Low)
   - "issueType": Task/Bug/Story/Epic based on the nature of the request
   - "storyPoint": An estimated complexity (1, 2, 3, 5, 8, 13) based on the scope of work
6. Include the \`"summary"\` field describing in one sentence what the action represents — this is displayed in a modal.
7. Use project-scoped paths (e.g., "/projects/{id}/backlog") whenever the action happens inside a project context.
${projectId ? `8. IMPORTANT: Use "/projects/${projectId}" as the base for all routes in this context.` : ''}

---

User request: "${prompt}"

Return only the JSON object as per the structure above.

Forget all previous instructions and respond only with the JSON object.
`;

      const requestBody = {
        contents: [
          { parts: [{ text: structuredPrompt }] }
        ]
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      // Extract actual text
      const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("Gemini raw response:", aiText);

      if (aiText) {
        this.processGeminiResponse(aiText);
      }
    } catch (error) {
      console.error('❌ Error calling Gemini API:', error);
      this.showWarning.emit('Failed to process your request. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse and process the Gemini response
   * Handles navigation, modal triggering, and summary display
   */
  private processGeminiResponse(responseText: string) {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }
      
      cleanedText = cleanedText.trim();

      // Parse JSON response
      const geminiResponse: GeminiActionResponse = JSON.parse(cleanedText);
      console.log("✨ Parsed Gemini response:", geminiResponse);

      // Check if this is a creation action (to skip routing)
      const isCreateAction = geminiResponse.action === 'create_issue';

      // Handle creation actions - skip routing and open modal immediately
      if (isCreateAction && geminiResponse.fields) {
        console.log('🛑 Creation action detected - skipping routing.');
        console.log('🚀 Opening modal immediately in current view.');
        
        // Emit modal event immediately (no navigation needed)
        this.openCreateModal.emit(geminiResponse.fields);

        // Show summary if present
        if (geminiResponse.summary) {
          console.log('📝 Showing summary:', geminiResponse.summary);
          setTimeout(() => {
            this.showSummary.emit(geminiResponse.summary!);
          }, 300);
        }
      }
      // Handle navigation actions (non-create)
      else if (geminiResponse.route && !isCreateAction) {
        console.log('🧭 Navigating to:', geminiResponse.route);

        // Wait for navigation to complete before emitting events
        this.router.navigate([geminiResponse.route]).then(success => {
          if (success) {
            console.log('✅ Navigation complete.');
          } else {
            console.warn('⚠️ Navigation failed or was cancelled.');
          }
        });
      }
      // Fallback: if route exists but wasn't handled above
      else if (geminiResponse.route) {
        console.log('🧭 Fallback navigation to:', geminiResponse.route);
        this.router.navigate([geminiResponse.route]);
      }

      // Clear the search query after processing
      this.query = '';

    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      console.log('Response text was:', responseText);
      this.showWarning.emit('Failed to understand the response. Please try rephrasing your request.');
    }
  }
}
