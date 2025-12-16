# SQL Query Patterns and Best Practices

## Overview

This document describes the SQL query patterns and best practices used in the Adaptive Command Hub application.

## Supabase Query Helpers

All database operations are centralized in `/src/lib/supabase-helpers.ts` to provide:

- **Type Safety**: All queries use TypeScript types from the database schema
- **Error Handling**: Consistent error handling across all operations
- **Code Reusability**: Avoid code duplication across components
- **Maintainability**: Single source of truth for database operations

## Available Helper Functions

### Authentication

- `getCurrentUser()` - Get the currently authenticated user
- `getCurrentSession()` - Get the current session with token

### Conversations

- `fetchUserConversations(userId, limit?)` - Fetch all conversations for a user
- `fetchConversationMessages(conversationId)` - Fetch all messages in a conversation
- `createConversation(userId, type, title?)` - Create a new conversation
- `saveMessage(conversationId, role, content)` - Save a message to a conversation
- `deleteConversation(conversationId, userId)` - Delete a conversation

### Memories

- `fetchUserMemories(userId, limit?)` - Fetch all memories for a user
- `deleteMemory(memoryId, userId)` - Delete a memory

### Integrations

- `fetchUserIntegrations(userId)` - Fetch all integrations for a user
- `createIntegration(userId, name, type, config?)` - Create a new integration
- `updateIntegrationStatus(integrationId, enabled)` - Toggle integration status
- `deleteIntegration(integrationId)` - Delete an integration

## Usage Examples

### Fetching Data

```typescript
import { fetchUserConversations, getCurrentUser } from "@/lib/supabase-helpers";

// In your component
const loadData = async () => {
  try {
    const user = await getCurrentUser();
    const conversations = await fetchUserConversations(user.id, 20);
    setConversations(conversations);
  } catch (err) {
    console.error("Error:", err);
    // Handle error
  }
};
```

### Creating Data

```typescript
import { createConversation, getCurrentUser } from "@/lib/supabase-helpers";

const handleCreateConversation = async () => {
  try {
    const user = await getCurrentUser();
    const conversation = await createConversation(user.id, "chat", "My Chat");
    console.log("Created:", conversation);
  } catch (err) {
    console.error("Error:", err);
    // Handle error
  }
};
```

### Deleting Data

```typescript
import { deleteConversation, getCurrentUser } from "@/lib/supabase-helpers";

const handleDelete = async (conversationId: string) => {
  try {
    const user = await getCurrentUser();
    await deleteConversation(conversationId, user.id);
    // Refresh data
  } catch (err) {
    console.error("Error:", err);
    // Handle error
  }
};
```

## Best Practices

### 1. Always Use Helper Functions

✅ **Good:**

```typescript
const conversations = await fetchUserConversations(user.id);
```

❌ **Bad:**

```typescript
const { data } = await supabase.from("conversations").select("*").eq("user_id", user.id);
```

### 2. Handle Errors Properly

✅ **Good:**

```typescript
try {
  const data = await fetchUserConversations(user.id);
  setData(data);
} catch (err) {
  console.error("Error:", err);
  toast({
    title: "Error",
    description: getErrorMessage(err),
    variant: "destructive",
  });
}
```

❌ **Bad:**

```typescript
const data = await fetchUserConversations(user.id);
setData(data);
```

### 3. Use TypeScript Types

All helper functions return properly typed data from the database schema:

```typescript
import type { Tables } from "@/integrations/supabase/types";

type Conversation = Tables<"conversations">;
type Message = Tables<"messages">;
type Memory = Tables<"memories">;
```

### 4. Row Level Security (RLS)

All database tables have Row Level Security enabled. The helper functions automatically:

- Verify user authentication
- Filter results by `user_id`
- Enforce ownership checks for updates/deletes

### 5. Optimistic Updates

For better UX, implement optimistic updates:

```typescript
const handleDelete = async (id: string) => {
  // Optimistically remove from UI
  setConversations((prev) => prev.filter((c) => c.id !== id));

  try {
    await deleteConversation(id, user.id);
    toast({ title: "Success", description: "Deleted" });
  } catch (err) {
    // Revert on error
    loadConversations();
    toast({ title: "Error", description: "Failed to delete" });
  }
};
```

## Database Schema

### Tables

- **profiles**: User profile information
- **conversations**: Chat/code conversation records
- **messages**: Individual messages in conversations
- **memories**: AI learning/memory storage
- **code_sessions**: Collaborative coding sessions
- **code_chunks**: Code generation chunks
- **integrations**: User integration settings

### Key Relationships

```
profiles (1) ←→ (many) conversations
conversations (1) ←→ (many) messages
conversations (1) ←→ (many) code_sessions
code_sessions (1) ←→ (many) code_chunks
profiles (1) ←→ (many) memories
profiles (1) ←→ (many) integrations
```

## Performance Tips

1. **Limit Results**: Always use `limit()` for large datasets
2. **Select Specific Columns**: Only fetch needed columns
3. **Use Indexes**: Database has indexes on foreign keys and commonly queried fields
4. **Cache Where Appropriate**: Use React Query for caching and automatic refetching

## Security Considerations

1. **Never Bypass RLS**: Always use authenticated queries
2. **Validate User Ownership**: Helper functions check `user_id` automatically
3. **Sanitize Input**: Supabase client handles SQL injection prevention
4. **Use Service Role Key Carefully**: Only use in Edge Functions with proper auth checks

## Migration and Evolution

When adding new database operations:

1. Add the helper function to `/src/lib/supabase-helpers.ts`
2. Add proper TypeScript types
3. Include error handling
4. Document the function with JSDoc comments
5. Update this documentation

## Testing

Test your database operations:

```typescript
import { describe, it, expect } from "vitest";
import { fetchUserConversations } from "@/lib/supabase-helpers";

describe("Database Helpers", () => {
  it("should fetch conversations", async () => {
    const conversations = await fetchUserConversations("user-id");
    expect(Array.isArray(conversations)).toBe(true);
  });
});
```

## Troubleshooting

### Common Issues

1. **"Not authenticated" error**: Ensure user is logged in before calling helpers
2. **"Failed to load" error**: Check network connection and Supabase config
3. **Empty results**: Verify RLS policies and user ownership

### Debugging

Enable detailed logging:

```typescript
// In supabase-helpers.ts
console.log("Fetching conversations for user:", userId);
const { data, error } = await query;
console.log("Result:", { data, error });
```

## Resources

- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
