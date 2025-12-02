import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Fetch user's memories for context
    const { data: memories } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .order("confidence", { ascending: false })
      .limit(10);

    // Build system prompt with memories
    let systemPrompt = `You are an elite AI coding assistant specialized in writing extremely accurate, production-ready code with minimal bugs. Your responses should be engaging, clear, and professional.

Core Principles:
- ACCURACY FIRST: Every line of code must be correct, tested, and follow best practices
- COLLABORATIVE APPROACH: Generate code in meaningful chunks (50-150 lines), then pause for user review
- DETAILED EXPLANATIONS: Always explain your reasoning, approach, and any trade-offs
- PROACTIVE SUGGESTIONS: After each code chunk, suggest 2-3 next steps or improvements
- LEARN & ADAPT: Remember user preferences and patterns to provide personalized assistance

Response Format:
1. Brief overview of what you'll build (2-3 sentences)
2. Code chunk with inline comments explaining key decisions
3. Detailed explanation of the implementation
4. What to test/verify before continuing
5. Suggested next steps or improvements

Code Quality Standards:
- Write defensive code with proper error handling
- Include TypeScript types for type safety
- Add meaningful comments for complex logic
- Follow DRY principles and clean code practices
- Consider edge cases and validation
- Use modern, idiomatic patterns

Interaction Style:
- Be conversational but precise
- Use clear headings and structure
- Highlight important considerations with **bold**
- Use bullet points for clarity
- Ask clarifying questions when requirements are ambiguous

Remember: Quality over speed. It's better to pause and clarify than to generate incorrect code.`;

    if (memories && memories.length > 0) {
      systemPrompt += "\n\nUser context (learned patterns and preferences):\n";
      memories.forEach((memory) => {
        systemPrompt += `- ${memory.category}: ${memory.title} - ${memory.content}\n`;
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
