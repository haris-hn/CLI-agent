/**
 *  Tavily Search Tool
 * 
 * This file handles web searching using Tavily API
 * ONLY the Researcher Agent should call this
 * 
 * Key Rules:
 *  Can be used by: Researcher Agent ONLY
 * ❌ Cannot be used by: Manager, Writer
 * ❌ Never expose raw Tavily output to user
 */

import fetch from "node-fetch";

class TavilySearchTool {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.tavily.com/search";
  }

  /**
   * Search for information using Tavily
   * @param {string} query - What to search for
   * @returns {object} - { success, findings, sources, query }
   */
  async search(query) {
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: "Query cannot be empty",
      };
    }

    try {
      console.log(`\n  Tavily Searching: "${query}"`);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: query,
          include_answer: true,
          max_results: 5,
          include_raw_content: true,
          search_depth: "advanced",
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract findings and sources
      const findings = [];
      const sources = [];

      // Add the direct answer if available
      if (data.answer) {
        findings.push(`Summary: ${data.answer}`);
      }

      // Extract from search results
      data.results.forEach((result) => {
        findings.push(`- ${result.title}: ${result.content}`);
        sources.push(result.url);
      });

      return {
        success: true,
        query: query,
        findings: findings,
        sources: [...new Set(sources)], // Remove duplicates
        rawData: data,
      };
    } catch (error) {
      console.error(`❌ Tavily search failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        query: query,
      };
    }
  }

  /**
   * Multiple searches with a delay between them
   * @param {array} queries - Array of search queries
   * @returns {array} - Results for each query
   */
  async searchMultiple(queries, delayMs = 1000) {
    const results = [];

    for (const query of queries) {
      const result = await this.search(query);
      results.push(result);

      // Delay between requests to avoid rate limits
      if (query !== queries[queries.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}

export default TavilySearchTool;