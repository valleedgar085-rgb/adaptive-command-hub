# Main Menu and Navigation

This document describes the main menu and navigation features added to the Elite Code Assistant application.

## Overview

The application now includes a comprehensive main menu system with navigation to multiple pages.

## Main Menu

The main menu is implemented using the Menubar component from shadcn/ui and includes the following sections:

### File Menu

- **New Chat** (⌘N): Start a new conversation
- **Home**: Navigate to the main chat interface
- **History**: View conversation history
- **Memories**: View the AI's learned patterns and preferences
- **Sign Out**: Log out of the application

### View Menu

- **Chat**: Navigate to the main chat interface
- **Conversation History**: View all past conversations
- **Memory Dashboard**: View AI memories

### Settings Menu

- **Preferences** (⌘,): Open settings dialog for integrations and configuration

### Help Menu

- **About**: Learn more about the application
- **Documentation**: Open GitHub repository

## New Pages

### History Page (`/history`)

Displays all past conversations with the following features:

- Grid layout of conversation cards
- Delete conversations
- Click to open a conversation
- Shows last updated time
- Empty state with call-to-action

### Memories Page (`/memories`)

Displays the AI's learned patterns and preferences:

- Grid layout of memory cards
- Shows confidence levels with color coding:
  - Green: 80%+ confidence
  - Yellow: 50-79% confidence
  - Red: Below 50% confidence
- Delete memories
- Shows category badges
- Empty state with call-to-action

### About Page (`/about`)

Information about the application:

- Feature highlights with icons
- Technology stack details
- Application description
- Navigation back to home

## Implementation Details

### Components

#### MainMenu Component

Location: `src/components/MainMenu.tsx`

Props:

- `onNewChat`: Callback for creating a new chat
- `onOpenSettings`: Callback for opening settings
- `onSignOut`: Callback for signing out

### Pages

All new pages are located in `src/pages/`:

- `History.tsx`: Conversation history page
- `Memories.tsx`: Memory dashboard page
- `About.tsx`: About page

### Routing

Routes are defined in `src/App.tsx`:

```tsx
<Route path="/history" element={<History />} />
<Route path="/memories" element={<Memories />} />
<Route path="/about" element={<About />} />
```

## Usage

### Desktop

The main menu is visible in the header on desktop screens (md and above).

### Mobile

On mobile devices, the main menu is hidden and users can access navigation through the sidebar menu button.

## Testing

Tests are included in `src/components/MainMenu.test.tsx` to verify:

- Menu triggers are rendered correctly
- Menubar component is present

## Future Enhancements

Potential improvements:

- Add keyboard shortcuts functionality
- Add recent items to File menu
- Add theme switching in View menu
- Add export/import functionality
- Add more detailed statistics in History and Memories pages
