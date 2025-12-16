/**
 * Supabase Query Helpers
 * Provides type-safe query builders and error handling for database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

/**
 * Fetch conversations for the current user
 */
export async function fetchUserConversations(userId: string, limit?: number) {
  const query = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching conversations:", error);
    throw new Error("Failed to load conversations");
  }

  return data;
}

/**
 * Fetch messages for a conversation
 */
export async function fetchConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to load messages");
  }

  return data;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  type: "chat" | "code" = "chat",
  title?: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      type,
      title,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }

  return data;
}

/**
 * Save a message to a conversation
 */
export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });

  if (error) {
    console.error("Error saving message:", error);
    throw new Error("Failed to save message");
  }
}

/**
 * Delete a conversation and all its messages
 */
export async function deleteConversation(conversationId: string, userId: string) {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting conversation:", error);
    throw new Error("Failed to delete conversation");
  }
}

/**
 * Fetch memories for the current user
 */
export async function fetchUserMemories(userId: string, limit?: number) {
  const query = supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("confidence", { ascending: false });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching memories:", error);
    throw new Error("Failed to load memories");
  }

  return data;
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string, userId: string) {
  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting memory:", error);
    throw new Error("Failed to delete memory");
  }
}

/**
 * Fetch integrations for the current user
 */
export async function fetchUserIntegrations(userId: string) {
  const { data, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching integrations:", error);
    throw new Error("Failed to load integrations");
  }

  return data;
}

/**
 * Create a new integration
 */
export async function createIntegration(
  userId: string,
  name: string,
  type: string,
  config?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("integrations")
    .insert({
      user_id: userId,
      name,
      type,
      config: config || {},
      enabled: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating integration:", error);
    throw new Error("Failed to create integration");
  }

  return data;
}

/**
 * Update integration status
 * @param integrationId - The ID of the integration to update
 * @param enabled - Whether the integration should be enabled
 */
export async function updateIntegrationStatus(integrationId: string, enabled: boolean) {
  // Get current user to ensure ownership
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("integrations")
    .update({ enabled })
    .eq("id", integrationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating integration:", error);
    throw new Error("Failed to update integration");
  }
}

/**
 * Delete an integration
 * @param integrationId - The ID of the integration to delete
 */
export async function deleteIntegration(integrationId: string) {
  // Get current user to ensure ownership
  const user = await getCurrentUser();

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("id", integrationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting integration:", error);
    throw new Error("Failed to delete integration");
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("Session expired. Please log in again.");
  }

  return session;
}
