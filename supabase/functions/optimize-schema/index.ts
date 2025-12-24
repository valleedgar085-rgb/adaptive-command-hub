import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue: string;
  foreignKey?: string;
  unique?: boolean;
  index?: boolean;
}

interface Table {
  name: string;
  columns: Column[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tables } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!tables || tables.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], summary: "No tables to analyze" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert database architect and performance consultant. Analyze the provided database schema and provide actionable optimization suggestions.

RESPONSE FORMAT - You MUST respond with ONLY valid JSON in this exact structure:
{
  "summary": "Brief overall assessment of the schema (1-2 sentences)",
  "score": 85,
  "suggestions": [
    {
      "id": "unique_id",
      "type": "performance|security|structure|naming|indexing|normalization",
      "severity": "critical|warning|info",
      "title": "Short descriptive title",
      "description": "Detailed explanation of the issue and why it matters",
      "table": "affected_table_name",
      "column": "affected_column_name or null",
      "recommendation": "Specific actionable recommendation",
      "impact": "Expected impact if fixed (performance improvement, security enhancement, etc.)",
      "sql_fix": "Optional SQL code to fix the issue or null"
    }
  ],
  "best_practices": [
    "List of things done correctly in the schema"
  ]
}

ANALYSIS CRITERIA:

1. PERFORMANCE OPTIMIZATION:
   - Missing indexes on foreign keys
   - Missing indexes on frequently queried columns
   - Inefficient data types (TEXT vs VARCHAR, etc.)
   - Missing composite indexes for common query patterns
   - Large TEXT/JSONB columns that could benefit from separate tables

2. SECURITY ANALYSIS:
   - Tables missing user_id for RLS
   - Sensitive data without proper access control
   - Missing audit columns (created_at, updated_at)
   - Public data exposure risks

3. STRUCTURAL IMPROVEMENTS:
   - Normalization issues (repeated data, etc.)
   - Missing junction tables for many-to-many relationships
   - Circular foreign key dependencies
   - Missing cascade delete rules

4. NAMING CONVENTIONS:
   - Inconsistent naming (camelCase vs snake_case)
   - Unclear or ambiguous column names
   - Reserved word usage

5. DATA INTEGRITY:
   - Missing NOT NULL constraints on required fields
   - Missing UNIQUE constraints where appropriate
   - Missing default values for status fields
   - Orphan prevention (foreign keys)

6. SCALABILITY:
   - UUID vs SERIAL for primary keys
   - Partition-ready design for large tables
   - Archive strategy considerations

Be thorough but practical. Focus on actionable improvements with clear ROI.`;

    console.log("Analyzing schema with tables:", tables.map((t: Table) => t.name));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this database schema and provide optimization suggestions:\n\n${JSON.stringify(tables, null, 2)}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    try {
      const analysis = JSON.parse(jsonContent);
      console.log("Successfully parsed analysis with", analysis.suggestions?.length || 0, "suggestions");
      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse optimization response", 
          raw: content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Optimize schema error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
