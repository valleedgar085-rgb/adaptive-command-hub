import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Generate a concise title from the first message
const generateTitle = (message: string): string => {
  // Remove code blocks and special characters
  let cleaned = message
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#*`]/g, "")
    .trim();

  // If message is too short after cleaning, use original
  if (cleaned.length < 5) {
    cleaned = message.replace(/[#*`]/g, "").trim();
  }

  // Get first meaningful sentence or phrase
  const firstLine = cleaned.split(/[.!?\n]/)[0].trim();

  // Capitalize first letter
  const capitalized = firstLine.charAt(0).toUpperCase() + firstLine.slice(1);

  // Truncate to reasonable length
  if (capitalized.length > 50) {
    return capitalized.substring(0, 47) + "...";
  }

  return capitalized || "New Chat";
};

export const useAutoNaming = () => {
  const updateConversationTitle = useCallback(async (
    conversationId: string,
    firstMessage: string
  ) => {
    const title = generateTitle(firstMessage);

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId);

      if (error) {
        console.error("Error updating conversation title:", error);
        return null;
      }

      return title;
    } catch (err) {
      console.error("Failed to auto-name conversation:", err);
      return null;
    }
  }, []);

  return {
    updateConversationTitle,
    generateTitle,
  };
};
