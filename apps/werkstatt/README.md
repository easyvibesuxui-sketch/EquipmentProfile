# Werkstatt

The sidebar's Werkstatt item opens the workshop board (`npm run dev:werkstatt`, http://localhost:5174), from the Figma frames
[Equipment Database](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=946-13850),
[Werkstatt full](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=8757-17722) and
[WK](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=17013-52604):

- Header: the board name with its switcher, **Add Task** (adds a card to Initial and opens it) and the archive button,
  which opens the [Archived](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=8384-41961) panel
  (search, Restore, Delete; [empty](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=9593-30399): "Nothing Archived yet").
- Toolbar: the filter button opens [Filters](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=10909-24466)
  (the main button counts the results and applies them; a badge shows how many are set), Search, Priority, Reset filters and Sort by.
- Columns (Initial, In Progress, Done, Finished) take equal widths, at least 278px; more than fit scroll sideways (the six-column frame).
  Cards drag between and within columns (a Dodger Blue line shows where they land), or move with Alt + Left/Right;
  a done column ticks the round checkbox. The "..." menu opens, moves to the next column or archives.
- A card opens the ticket drawer ([Edit Ticket](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=17013-50919)),
  built after Syn's `playground/RecordDrawer.tsx` plus the equipment card and Working Hours; Status moves the card, Update keeps it.
- [Board / List](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=7919-48115) floats at the bottom (Syn `Segmented`);
  List is the Syn `Table` (not in Figma).
- A moment after opening, a colleague's ticket arrives and the toast (Syn `Notification`) says so, as in the frame.
- `#empty` shows [No Board Yet](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=1459-10561); Create Board opens the board.

Files: `src/werkstatt/` and `src/data/werkstatt.ts`; the shell, the "..." menu and the form parts come from `@sam/shared`. The Figma images could not be downloaded (figma.com is blocked here), so the
icons are Syn's and the photos are Syn's playground damage photos (`src/assets/werkstatt/`). Copy to confirm: "Hight" is written
"High", "(Due 2 day)" "(Due 2 days)", and Filters' second "Assigned" field was dropped.

