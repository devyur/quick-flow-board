# Quick Flow Board

Create a system design for simple kanban board application.

# Mini Kanban Board App — Specifications

## 1. Purpose

A small, simple Kanban-style task board for quickly organizing tasks visually.

The app should prioritize:
- Simple and fast task management
- Easy drag-and-drop organization
- Small visual notes and sketches
- Minimal UI and low complexity
- Features that are straightforward to implement and extend later

---

## 2. Core Concepts

### Board
A board contains multiple columns.

### Column
A column represents a stage, category, or type of work.

Examples:
- Backlog
- To Do
- In Progress
- Done
- Ideas

Users should be able to create, rename, reorder, and delete columns.

### Card
A card represents a task, note, idea, or small piece of information.

A card can be moved between columns.

---

## 3. Card Specifications

Each card should support:

### Required
- Title
- Column assignment

### Optional
- Description / notes
- Small image
- Drawing / sketch
- Tags
- Priority
- Due date
- Checklist
- Color
- Creation date
- Last modified date

### Card actions
- Add card
- Edit card
- Delete card
- Duplicate card
- Move card to another column
- Move card up/down within a column
- Archive card
- Mark as completed
- Add/remove tags
- Add/remove image
- Open drawing editor

---

## 4. Images

Cards should support adding a small picture.

Possible sources:
- Upload from computer
- Drag and drop an image onto a card
- Paste an image from clipboard

Basic functionality:
- Display a small thumbnail on the card
- Open the image in a larger view
- Remove/replace image

Keep image functionality simple initially. Advanced image editing is not required.

---

## 5. Drawing / Sketching

Each card can contain a simple drawing.

The drawing tool should support:
- Freehand drawing
- Eraser
- Brush size
- Basic color selection
- Clear canvas
- Undo
- Redo
- Save drawing to card

Optional easy additions:
- Straight line
- Rectangle
- Circle
- Arrow
- Text

The drawing should be stored as an image associated with the card.

---

## 6. Columns

Users should be able to:

- Add a column
- Rename a column
- Delete a column
- Reorder columns
- Change column color
- Add cards to a column
- Collapse/expand a column

When deleting a column, the app should ask what to do with its cards:
- Delete cards
- Move cards to another column

---

## 7. Drag and Drop

Drag-and-drop should be the main way to organize the board.

Support:
- Move cards within a column
- Move cards between columns
- Reorder columns

The card position should be saved after moving it.

---

## 8. Tags

Cards can have simple tags.

Examples:
- Work
- Personal
- Urgent
- Idea
- Coding

Features:
- Add tag
- Remove tag
- Create/edit tag
- Assign multiple tags to a card
- Filter board by tag

Tags can have optional colors.

---

## 9. Priority

Cards can optionally have a priority:

- None
- Low
- Medium
- High

Priority should be visually recognizable but should not dominate the card design.

---

## 10. Checklist

Cards can optionally contain a simple checklist.

Example:

- [x] Create database
- [x] Create UI
- [ ] Add authentication
- [ ] Test application

Features:
- Add checklist item
- Edit checklist item
- Delete checklist item
- Mark item complete/incomplete
- Show completion progress on the card

Example:
`3 / 5 completed`

---

## 11. Due Dates

Cards can optionally have a due date.

Features:
- Set due date
- Change due date
- Remove due date
- Show date on card
- Visually indicate overdue cards

No complex calendar system is required initially.

---

## 12. Search and Filtering

Simple board search should be available.

Search by:
- Card title
- Description
- Tags

Basic filters:
- Column
- Tag
- Priority
- Completed / incomplete
- Due date

The filtering system should be simple enough to extend later.

---

## 13. Card Colors

Cards can optionally have a small color indicator or background color.

Suggested options:
- Default
- Red
- Orange
- Yellow
- Green
- Blue
- Purple
- Gray

Colors should be used primarily for quick visual organization.

---

## 14. Board Features

A board should support:

- Create board
- Rename board
- Delete board
- Duplicate board
- Change board background
- Add/remove/reorder columns
- Search cards
- Filter cards
- Archive old cards

Possible later feature:
- Board templates

Examples:
- Basic To Do / Doing / Done
- Project planning
- Personal tasks
- Study board

---

## 15. Archive

Instead of permanently deleting everything, cards can optionally be archived.

Archive features:
- Archive card
- View archived cards
- Restore card
- Permanently delete card

This keeps the main board clean.

---

## 16. Undo / Redo

A lightweight undo/redo system would be useful.

Possible actions:
- Card creation
- Card deletion
- Card editing
- Card movement
- Column creation/deletion
- Column reordering

This can initially be limited to the most recent actions.

---

## 17. Keyboard Shortcuts

Simple shortcuts can make the app faster to use.

Suggested shortcuts:

- `N` — New card
- `C` — New column
- `Ctrl/Cmd + F` — Search
- `Ctrl/Cmd + Z` — Undo
- `Ctrl/Cmd + Shift + Z` — Redo
- `Esc` — Close dialog
- `Delete` — Delete selected card/column

Shortcuts can be added gradually.

---

## 18. Quick Add

A quick-add interaction should make creating cards very fast.

Example:

`+ Add card`

The user enters a title and presses Enter.

Optional:
- `#tag` automatically creates/adds a tag
- `!high` sets priority
- `@column` chooses a column

These text commands are optional and can be implemented later.

---

## 19. Card Details View

Clicking a card should open a larger detail view/modal.

The detail view can contain:

- Title
- Description
- Image
- Drawing
- Checklist
- Tags
- Priority
- Due date
- Card color
- Activity/history
- Delete/archive buttons

The board itself should remain visually compact.

---

## 20. Activity / History

A simple activity log can record important changes.

Examples:
- Card created
- Card moved to another column
- Title changed
- Priority changed
- Card completed
- Card archived

This does not need to be a full audit system.

Example:

`Today 14:32 — Card moved from "To Do" to "In Progress"`

---

## 21. Persistence

The application should save board data so it survives closing/reopening the app.

At minimum save:
- Boards
- Columns
- Cards
- Card positions
- Tags
- Checklists
- Dates
- Images/drawings

The exact storage technology can be chosen separately.

---

## 22. Import / Export

Simple data portability would be useful.

Possible features:
- Export board to JSON
- Import board from JSON
- Export board as an image/PDF later

JSON import/export is particularly useful for backups and testing.

---

## 23. Responsive Layout

The board should work reasonably well on:

- Desktop
- Laptop
- Tablet
- Smaller screens

On narrow screens, columns may become horizontally scrollable instead of being forced into a tiny layout.

---

## 24. UI Principles

The UI should be:

- Clean
- Compact
- Fast
- Easy to understand
- Visually organized
- Not overloaded with buttons

Important actions should be immediately visible.

Less frequently used actions can be placed in:
- Context menus
- `...` menus
- Card detail view

---

## 25. Suggested Main Layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Mini Kanban       Search...       Filter    + Board Settings│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BACKLOG          TO DO          IN PROGRESS       DONE     │
│  ────────         ──────         ───────────       ────     │
│                                                             │
│  ┌───────────┐    ┌───────────┐  ┌───────────┐    ┌──────┐ │
│  │ Task A    │    │ Task B    │  │ Task C    │    │Task D│ │
│  │ 🖼        │    │            │  │ ✏ sketch │    │  ✓   │ │
│  │ #work     │    │ High       │  │ #coding   │    │      │ │
│  └───────────┘    └───────────┘  └───────────┘    └──────┘ │
│                                                             │
│  + Add card        + Add card      + Add card       + Add   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# MVP — First Version

To keep development manageable, the first version should focus on the following:

### Must have
1. Create board
2. Create columns
3. Rename/delete/reorder columns
4. Create cards
5. Edit/delete cards
6. Drag-and-drop cards
7. Card title
8. Card description
9. Small image attachment
10. Simple drawing canvas
11. Persistent storage
12. Basic responsive UI

### Good to have
13. Tags
14. Priority
15. Checklist
16. Due dates
17. Search
18. Card colors
19. Archive

### Later
20. Undo/redo
21. Activity history
22. Import/export
23. Keyboard shortcuts
24. Board templates
25. Advanced filtering
26. Collaboration / sharing
27. Real-time synchronization
28. Notifications
29. User accounts

---

# Design Goal

The app should feel like a **small personal visual workspace**, rather than a full project-management system.

The key interaction should be:

**Create → Write → Draw/attach → Drag → Organize**

Avoid adding complicated enterprise features unless they become necessary. The main advantage of the app should be that a user can open it and organize thoughts/tasks in seconds.

Centralize every backend call in one services layer, and create a mock
implementation of it so the whole app runs without a real backend.

Add tests.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/784fd976-c83f-4b22-89cb-6b2dfa589ac6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
