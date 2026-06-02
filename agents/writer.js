/**
 *  WRITER AGENT
 * 
 * Responsibilities:
 * - Take research data from Researcher
 * - Organize and reason over it
 * - Create final formatted report
 * - Add proper citations and sources
 * 
 * CAN do:
 * - Reason over data
 * - Write clearly
 * - Organize information
 * - Add analysis (based on research only)
 * 
 *  CANNOT do:
 * - Call Tavily
 * - Invent facts
 * - Call other agents
 * - Make up sources
 */

export class WriterAgent {
  constructor(llmClient, model = "gpt-4o-mini") {
    this.llmClient = llmClient;
    this.model = model;
    this.name = "Writer Agent";
  }

  /**
   * Main writing method
   * Takes organized research data and creates final report
   */
  async write(researchData, userQuery) {
    console.log("\n" + "=".repeat(60));
    console.log("  WRITER AGENT - Creating Final Report");
    console.log("=".repeat(60));

    if (
      !researchData ||
      !researchData.findings ||
      researchData.findings.length === 0
    ) {
      console.error("❌ No research data provided");
      return {
        success: false,
        error: "No research data to write about",
      };
    }

    // Prepare data for writing
    const findingsText = this.prepareFindingsText(researchData);

    // Generate report
    console.log("\n Generating report...");
    const report = await this.generateReport(userQuery, findingsText);

    if (!report) {
      return {
        success: false,
        error: "Failed to generate report",
      };
    }

    // Format final output
    const formattedReport = this.formatReport(
      report,
      researchData.uniqueSources
    );

    return {
      success: true,
      originalQuery: userQuery,
      report: report,
      formattedReport: formattedReport,
      sources: researchData.uniqueSources,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Prepare research data into readable text (trimmed to avoid token limits)
   */
  prepareFindingsText(researchData) {
    let text = "";

    researchData.findings.forEach((section) => {
      text += `\nTopic: ${section.query}\n`;
      // Limit to first 3 findings per topic to reduce tokens
      section.findings.slice(0, 3).forEach((finding) => {
        // Trim each finding to 300 chars
        text += `- ${finding.slice(0, 300)}\n`;
      });
      text += "\n";
    });

    return text;
  }

  /**
   * Generate report using LLM
   * LLM only reasons over provided data, never invents
   */
  async generateReport(userQuery, findingsText) {
    const systemPrompt = `You are a professional research report writer. Your job is to:
1. Read research data provided to you
2. Organize it logically
3. Write a clear, structured report

CRITICAL RULES:
- NEVER invent facts not in the research data
- ONLY use information provided
- Always base claims on the findings
- If something isn't mentioned in research, say "insufficient data"
- No opinions, only facts from research

Report Structure (use these exact headings):
## Overview
## Key Findings
## Comparison / Analysis
## Pros & Cons
## Recommendation
## Sources`;

    try {
      const message = await this.llmClient.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Create a professional research report for this query: "${userQuery}"\n\nResearch Data:\n${findingsText}\n\nWrite a well-organized report based ONLY on the data above. Do not invent any facts.`,
          },
        ],
      });

      return message.choices[0].message.content;
    } catch (error) {
      console.error(`❌ Report generation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Format report with markdown and sources
   */
  formatReport(report, sources) {
    let formatted = "";

    formatted += "# Research Report\n\n";
    formatted += "---\n\n";

    // Main report
    formatted += report;

    formatted += "\n\n---\n\n";

    // Sources section
    formatted += "## Sources\n\n";
    if (sources && sources.length > 0) {
      sources.forEach((source, index) => {
        formatted += `${index + 1}. [${source}](${source})\n`;
      });
    } else {
      formatted += "No sources available.\n";
    }

    formatted += "\n---\n";
    formatted += `*Report generated at ${new Date().toLocaleString()}*\n`;

    return formatted;
  }

  /**
   * Alternative: Create comparison table (useful for comparisons)
   */
  async createComparisonTable(researchData, userQuery) {
    console.log("\n Creating comparison table...");

    const findingsText = this.prepareFindingsText(researchData);

    const systemPrompt = `You are an expert at creating comparison tables. Given research data, create a clear comparison table in markdown format.

Rules:
- Only include information from the provided research data
- Use | | table format
- Don't invent facts
- Return ONLY the table, no other text`;

    try {
      const message = await this.llmClient.chat.completions.create({
        model: this.model,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Create a comparison table for: "${userQuery}"\n\nData:\n${findingsText}`,
          },
        ],
      });

      return message.choices[0].message.content;
    } catch (error) {
      console.error(`❌ Table creation failed: ${error.message}`);
      return null;
    }
  }
}