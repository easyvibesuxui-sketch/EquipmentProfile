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
- [Board / List](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=7919-48115) floats at the bottom (Syn `Segmented`).
  List is the [List View](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=8757-19037): a collapsible group per
  status (the first open), each a table of Ticket ID, Title, Equipment, Priority, Condition, Reported by, Assigned to, Created Date,
  Due date, Tags and Recourse total, with the round checkbox and the "..." menu; a row opens the ticket. Search, filters and sort
  apply to both views; on narrow screens the table scrolls inside its group.
- A moment after opening, a colleague's ticket arrives and the toast (Syn `Notification`) says so, as in the frame.
- `#empty` shows [No Board Yet](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=1459-10561); Create Board opens the board.

Files: `src/werkstatt/` and `src/data/werkstatt.ts`; the shell, the "..." menu and the form parts come from `@sam/shared`. The Figma images could not be downloaded (figma.com is blocked here), so the
icons are Syn's and the photos are Syn's playground damage photos (`src/assets/werkstatt/`). Copy to confirm: "Hight" is written
"High", "(Due 2 day)" "(Due 2 days)", and Filters' second "Assigned" field was dropped.


## Tickets (second Figma batch)

- **Create ticket** ([946:12390](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=946-12390)): Add Task (or a list group's
  "..." → Add task) opens the empty ticket: Name and Additional information, every property on "Choose", empty Details, Template,
  Custom fields, Checklist ("Add New") and Recources. Submit needs a name, then adds the card, the toast and a bell notification.
- **Mark complete** ([946:15885](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=946-15885)): the drawer header toggles
  "Mark complete" / the Mantis "Completed" pill; the card checkbox ([908:11126](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=908-11126))
  shows the double check. Both fit phones.
- **Editable head**: the name ([1270:10373](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=1270-10373)) and the description
  ([4728:45878](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=4728-45878)) show Cultured on hover and edit in place
  (Enter or leaving keeps, Escape drops). Condition, Priority, Insurance case, Due date (5318:21638 / 21685 / 21713 / 21738), Assignee,
  Collaborators and Tags open a choice on click and show an X on hover that clears them; a past due date turns Eerie Black with "(Overdue)".
  Update keeps the changes, Discard drops them.
- **Cards** ([943:2627](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=943-2627)): "Nothing Assigned" when no equipment;
  assignee and collaborators stacked ([943:1044](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=943-1044)).
- **Sort by** ([963:11801](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=963-11801)): Creation date or Due date.
- **Archived**: a ticket of the Archived panel opens read only ([8378:31073](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=8378-31073)),
  with Archived by / Archived Date and Restore; the list ends with the Archived line
  ([7877:29034](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=7877-29034)); empty groups show "Nothing yet".
- **Bell** (in `@sam/shared`, both apps): the Notifications panel (13147:57773, empty 13207:36438, kinds 17097:18601, 16686:65458,
  15926:55884) with the on/off switch, unread Snow cards with a red dot, a click marks one read, "Mark all as read".
