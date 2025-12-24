import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, existingTables } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert SQL database architect. Your task is to generate a comprehensive database schema based on user descriptions.

RESPONSE FORMAT - You MUST respond with ONLY valid JSON in this exact structure:
{
  "tables": [
    {
      "name": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "uuid|text|varchar(255)|integer|boolean|timestamp with time zone|jsonb|numeric(10,2)|text[]|uuid[]",
          "nullable": true|false,
          "primaryKey": true|false,
          "defaultValue": "gen_random_uuid()|now()|'default_value'|0|true|false|''",
          "foreignKey": "other_table.column_name" or null,
          "unique": true|false,
          "index": true|false
        }
      ]
    }
  ],
  "explanation": "Brief explanation of the schema design decisions"
}

SCHEMA DESIGN RULES:
1. ALWAYS use UUID for primary keys with gen_random_uuid() default
2. ALWAYS include created_at (timestamp with time zone, default now())
3. ALWAYS include updated_at for mutable tables (timestamp with time zone, default now())
4. Use snake_case for all table and column names
5. Include proper foreign key references where relationships exist
6. Add user_id (uuid) column with foreign key to users.id for user-owned data
7. Use appropriate types: varchar(255) for short text, text for long content, jsonb for structured data
8. Mark important columns as unique (email, username, slug, sku, etc.)
9. Add index: true for frequently queried columns
10. Consider soft deletes (is_deleted boolean) for important data
11. Use meaningful default values (0 for counters, 'pending' for status, etc.)

EXISTING TABLES TO CONSIDER:
${existingTables && existingTables.length > 0 ? JSON.stringify(existingTables, null, 2) : "No existing tables"}

Generate a complete, production-ready schema. Be thorough but practical.`;

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
          { role: "user", content: `Generate a database schema for: ${description}` }
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

    // Parse the JSON response - handle potential markdown code blocks
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    try {
      const schema = JSON.parse(jsonContent);
      return new Response(JSON.stringify(schema), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse schema response", 
          raw: content 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Generate SQL error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
