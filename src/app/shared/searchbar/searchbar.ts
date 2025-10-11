import { Component, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface GeminiActionResponse {
  action?: string;
  route?: string;
  modal?: string;
  fields?: {
    issueType?: string;
    summary?: string;
    description?: string;
    priority?: string;
    [key: string]: any;
  };
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

  @Output() openCreateModal = new EventEmitter<any>();

  constructor(private router: Router) {}

  /**
   * Triggered when user presses Enter in the search bar
   * Sends the query to Gemini and processes the structured response
   */
  async searchGemini() {
    const prompt = this.query.trim();
    if (!prompt) return;

    this.isLoading = true;

    try {
      const API_KEY = environment.geminiApiKey;
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + API_KEY;

      // Enhanced prompt to guide Gemini to return structured JSON
      const structuredPrompt = `You are an intelligent assistant for a project management application. 
Parse the user's request and return ONLY a JSON object (no markdown, no code blocks, just raw JSON) with the following structure:

{
  "action": "create_issue" | "navigate" | "search",
  "route": "/projects" | "/backlog" | "/board" | "/timeline" | "/report-dashboard" | "/summary" | "/dashboard",
  "modal": "create-issue" (if action is create_issue),
  "fields": {
    "issueType": "Task" | "Bug" | "Story" | "Epic",
    "summary": "brief title",
    "description": "optional description",
    "priority": "High" | "Medium" | "Low"
  }
}

User request: "${prompt}"

Return only the JSON object, nothing else.`;

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
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Parse and process the Gemini response
   * Handles navigation and modal triggering
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
      console.log("Parsed Gemini response:", geminiResponse);

      // Handle routing
      if (geminiResponse.route) {
        console.log(`Navigating to: ${geminiResponse.route}`);
        this.router.navigate([geminiResponse.route]);
      }

      // Handle modal opening for create_issue action
      if (geminiResponse.action === 'create_issue' && geminiResponse.fields) {
        console.log("Emitting openCreateModal event with fields:", geminiResponse.fields);
        // Emit event with delay to allow navigation to complete first
        setTimeout(() => {
          this.openCreateModal.emit(geminiResponse.fields);
        }, 300);
      }

      // Clear the search query after processing
      this.query = '';

    } catch (error) {
      console.error('❌ Error parsing Gemini response:', error);
      console.log('Response text was:', responseText);
    }
  }
}
