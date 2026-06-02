/**
 *  MANAGER AGENT
 * 
 * Responsibilities:
 * - Understand user query
 * - Break it into subtasks
 * - Delegate to Researcher and Writer
 * - Coordinate between agents
 * - Return final report
 * 
 * ❌ CANNOT do:
 * - Call Tavily directly
 * - Invent facts
 * - Write final answer (Writer does that)
 */

export class ManagerAgent {
  constructor(llmClient, model = "gpt-4o-mini") {
    this.llmClient = llmClient;
    this.model = model;
    this.name = "Manager Agent";
    this.conversationHistory = [];
  }

  /**
   * Main orchestration method
   * Takes user query and coordinates entire workflow
   */
  async orchestrate(userQuery, researcherAgent, writerAgent) {
    console.log("\n" + "=".repeat(60));
    console.log(" MANAGER AGENT - Starting Orchestration");
    console.log("=".repeat(60));
    console.log(` User Query: "${userQuery}"\n`);

    // Step 1: Analyze and create subtasks
    console.log(" Step 1: Analyzing query and creating subtasks...");
    const subtasks = await this.analyzQuery(userQuery);
    console.log(` Created ${subtasks.length} subtasks:\n`);
    subtasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task}`);
    });

    // Step 2: Send to Researcher
    console.log("\n Step 2: Delegating to RESEARCHER AGENT...");
    const researchData = await researcherAgent.research(subtasks, userQuery);

    if (!researchData || !researchData.success) {
      console.error("❌ Research failed!");
      return {
        success: false,
        error: "Research phase failed",
      };
    }

    console.log(" Research data received:");
    console.log(`   - Total findings: ${researchData.totalFindings}`);
    console.log(`   - Total sources: ${researchData.uniqueSources.length}`);

    // Step 3: Send to Writer
    console.log("\n Step 3: Delegating to WRITER AGENT...");
    const finalReport = await writerAgent.write(researchData, userQuery);

    if (!finalReport || !finalReport.success) {
      console.error("❌ Writing failed!");
      return {
        success: false,
        error: "Writing phase failed",
      };
    }

    console.log(" Final report generated!");

    // Step 4: Return structured response
    return {
      success: true,
      originalQuery: userQuery,
      subtasks: subtasks,
      researchData: researchData,
      finalReport: finalReport,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Analyze user query and break into subtasks
   * Uses LLM to intelligently decompose the question
   */
  async analyzQuery(userQuery) {
    const systemPrompt = `You are a research manager. Your job is to break down a user's research question into 3-5 specific, actionable subtasks that a researcher can investigate.

IMPORTANT RULES:
1. Return ONLY a JSON array of strings
2. Each subtask should be specific and searchable
3. No explanations, just the array
4. Tasks should NOT require opinions - only facts

Example:
User: "Compare Stripe vs Razorpay for Pakistan SaaS"
Output: [
  "What are the pricing plans for Stripe in Pakistan?",
  "What are the pricing plans for Razorpay in Pakistan?",
  "What payment methods does Stripe support in Pakistan?",
  "What payment methods does Razorpay support in Pakistan?"
]`;

    const message = await this.llmClient.chat.completions.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Break down this research query into subtasks:\n\n"${userQuery}"`,
        },
      ],
    });

    const response = message.choices[0].message.content;

    try {
      // Extract JSON from response (handle cases where LLM wraps it)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.log("  Could not parse subtasks, using manual breakdown");
      return [
        `Get information about the main topic: ${userQuery}`,
        `Find comparisons and differences`,
        `Look for pros and cons`,
        `Find pricing and features`,
      ];
    }
  }

  /**
   * Log message in conversation history
   */
  addToHistory(role, content) {
    this.conversationHistory.push({
      role: role,
      content: content,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return this.conversationHistory;
  }
}