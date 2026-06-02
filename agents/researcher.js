/**
 * 🔬 RESEARCHER AGENT
 * 
 * Responsibilities:
 * - Perform factual research only
 * - Call Tavily Search API
 * - Return structured findings with sources
 * - NEVER give opinions or final answers
 * 
 *  CAN do:
 * - Use Tavily Search
 * - Return raw data + sources
 * 
 * ❌ CANNOT do:
 * - Invent facts
 * - Write final answer
 * - Call Writer agent
 * - Give opinions or recommendations
 */

export class ResearcherAgent {
  constructor(tavilyTool, llmClient, model = "gpt-4o-mini") {
    this.tavilyTool = tavilyTool;
    this.llmClient = llmClient;
    this.model = model;
    this.name = "Researcher Agent";
    this.searchCount = 0;
    this.allFindings = [];
    this.allSources = new Set();
  }

  /**
   * Main research method
   * Takes subtasks and performs web searches
   */
  async research(subtasks, originalQuery) {
    console.log("\n" + "=".repeat(60));
    console.log(" RESEARCHER AGENT - Starting Research");
    console.log("=".repeat(60));

    this.searchCount = 0;
    this.allFindings = [];
    this.allSources.clear();

    // Limit searches to avoid API quota issues
    const maxSearches = 5;
    const tasksToSearch = subtasks.slice(0, maxSearches);

    console.log(`\n Will search for ${tasksToSearch.length} subtasks:\n`);

    // Search for each subtask
    for (let i = 0; i < tasksToSearch.length; i++) {
      const subtask = tasksToSearch[i];
      console.log(`\n[${i + 1}/${tasksToSearch.length}] Researching: "${subtask}"`);

      try {
        const result = await this.tavilyTool.search(subtask);

        if (result.success) {
          // Store findings
          this.allFindings.push({
            query: subtask,
            findings: result.findings,
            sources: result.sources,
          });

          // Collect unique sources
          result.sources.forEach((source) => {
            this.allSources.add(source);
          });

          this.searchCount++;
          console.log(`       Found ${result.findings.length} findings`);
          console.log(`       Sources: ${result.sources.length}`);
        } else {
          console.log(`      ❌ Search failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`      ❌ Error during search: ${error.message}`);
      }

      // Small delay between searches
      if (i < tasksToSearch.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Organize findings
    const organizedData = await this.organizeFindings();

    return {
      success: true,
      searchCount: this.searchCount,
      originalQuery: originalQuery,
      subtasks: tasksToSearch,
      findings: this.allFindings,
      organizedData: organizedData,
      uniqueSources: Array.from(this.allSources),
      totalFindings: this.allFindings.reduce(
        (sum, f) => sum + f.findings.length,
        0
      ),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Organize raw findings into structured data
   * Uses LLM to categorize and summarize
   */
  async organizeFindings() {
    console.log("\n Organizing findings...");

    if (this.allFindings.length === 0) {
      return {
        categories: {},
        summary: "No findings were returned from searches",
      };
    }

    const findingsText = this.allFindings
      .map(
        (f) =>
          `Topic: ${f.query}\n${f.findings.slice(0, 3).map((fd) => `- ${fd.slice(0, 200)}`).join("\n")}`
      )
      .join("\n\n");

    const systemPrompt = `You are a research data organizer. Take the raw research findings below and organize them into logical categories. Return ONLY a JSON object with this structure:
{
  "categories": {
    "category1": ["finding1", "finding2"],
    "category2": ["finding3"]
  },
  "summary": "Brief summary of all findings"
}`;

    try {
      const message = await this.llmClient.chat.completions.create({
        model: this.model,
        max_tokens: 800,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Organize these research findings:\n\n${findingsText}`,
          },
        ],
      });

      const response = message.choices[0].message.content;
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        categories: { "Raw Findings": this.allFindings.map((f) => f.findings) },
        summary: "Research findings organized",
      };
    } catch (error) {
      console.error("  Could not organize findings:", error.message);
      return {
        categories: {
          "Raw Findings": this.allFindings.map((f) => f.findings),
        },
        summary: "Research findings (unorganized)",
      };
    }
  }

  /**
   * Get search statistics
   */
  getStats() {
    return {
      searchCount: this.searchCount,
      findingsCount: this.allFindings.length,
      sourcesCount: this.allSources.size,
      totalDataPoints: this.allFindings.reduce(
        (sum, f) => sum + f.findings.length,
        0
      ),
    };
  }
}