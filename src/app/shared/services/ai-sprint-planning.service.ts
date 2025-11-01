import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export interface SprintContextResponse {
  current_sprint?: {
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    velocity: number;
  };
  team_capacity: {
    total_developers: number;
    available_story_points: number;
  };
  average_velocity: number;
  product_backlog: Array<{
    key: string;
    summary: string;
    priority: string;
    story_points: number;
    epic?: string;
  }>;
}

export interface RecommendedIssue {
  key: string;
  summary: string;
  story_points: number;
}

export interface AISuggestionResponse {
  recommended_issues: RecommendedIssue[];
  summary: string;
}

@Injectable({ providedIn: 'root' })
export class AiSprintPlanningService {
  private toastService = inject(ToastService);
  private readonly CONTEXT_API_URL = 'http://localhost:3000/api/ai/sprint-planning/context';
  private readonly GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${environment.geminiApiKey}`;

  /**
   * Fetch sprint context from backend API
   */
  async fetchSprintContext(): Promise<SprintContextResponse> {
    try {
      const response = await fetch(this.CONTEXT_API_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch sprint context: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sprint context:', error);
      throw error;
    }
  }

  /**
   * Generate AI sprint suggestions using Gemini API
   */
  async generateSprintSuggestions(): Promise<AISuggestionResponse> {
    try {
      // Step 1: Fetch context from backend
      const context = await this.fetchSprintContext();

      // Step 2: Construct prompt for Gemini
      const prompt = this.buildGeminiPrompt(context);

      // Step 3: Call Gemini API
      const geminiResponse = await fetch(this.GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: 'user', 
            parts: [{ text: prompt }] 
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      }

      const geminiData = await geminiResponse.json();

      // Step 4: Parse Gemini's response
      const aiOutput = this.parseGeminiResponse(geminiData);
      
      return aiOutput;
    } catch (error) {
      console.error('AI Sprint Suggestion Error:', error);
      this.toastService.error('Unable to generate AI sprint suggestion.');
      throw error;
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildGeminiPrompt(context: SprintContextResponse): string {
    return `You are an Agile Sprint Planning AI.

Given the sprint context JSON below, identify which issues from the product backlog
should be included in the next sprint. 

Consider:
- Current sprint velocity and average velocity
- Team capacity
- Issue priority and story points
- Logical grouping of related backlog items

Respond ONLY with valid JSON in the following format (no markdown, no code blocks):
{
  "recommended_issues": [ 
    { "key": "ISS-123", "summary": "Issue description", "story_points": 5 }
  ],
  "summary": "Brief summary explaining why these issues were selected"
}

Sprint context JSON:
${JSON.stringify(context, null, 2)}`;
  }

  /**
   * Parse Gemini's response and extract the JSON
   */
  private parseGeminiResponse(geminiData: any): AISuggestionResponse {
    try {
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Clean up response - remove markdown code blocks if present
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      const parsed = JSON.parse(cleanedText);
      
      // Validate response structure
      if (!parsed.recommended_issues || !Array.isArray(parsed.recommended_issues)) {
        throw new Error('Invalid response structure: missing recommended_issues array');
      }
      if (!parsed.summary) {
        throw new Error('Invalid response structure: missing summary');
      }
      
      return parsed as AISuggestionResponse;
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', geminiData);
      throw new Error('Failed to parse AI response');
    }
  }
}
