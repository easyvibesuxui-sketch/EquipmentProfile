# Equipment Profile (SAM)

The equipment profile screen of SAM, built with the [Syn design system](https://github.com/easyvibesuxui-sketch/Syn-Design-System).
The **Overview** tab is from the Figma frame
[Equipment Profile Home](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=13767-3742);
the **Telemetry** tab from [Equipment Accessories](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=14571-18707).

## Live site

https://easyvibesuxui-sketch.github.io/EquipmentProfile/ — GitHub Pages, served from the `gh-pages` branch.
To update it, build and push `dist/` to that branch:

```bash
npm run build && touch dist/.nojekyll
npx gh-pages -d dist --dotfiles   # or commit dist/ to gh-pages by hand
```

## Empty states

Open the page with `#empty` (for example https://easyvibesuxui-sketch.github.io/EquipmentProfile/#empty) to see the
widgets with nothing linked: the map "No tracker" view and Dependance with "Not linked yet". `src/shared/useEmptyDemo.ts`
is the switch; replace it with real data checks once the API exists.

## Tracker card

A tracker with a camera (`tracker.camera`, the syniotec DASHCAM in the mock data) gets the Figma player card: the last
frame, Play (opens the Dashcam Player on Telemetry, full screen) and the live dot. Open the page with `#no-camera` to see
the plain tracker card.

## Widget drawers

Clicking the *Recent actions from History*, *Check ins / Charging*, *Dependance*, *Technical specifications*, *Specific machine information* or *Current Location* widget (anywhere on the card, or its chevron)
opens its drawer:

- [Recent actions from History](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=16127-6470): the full history list.
  It is read-only, so it has no footer (Figma's Discard and Submit were dropped on review).
- Check ins and charging ([check in](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=16625-22238),
  [empty](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=16631-8886),
  [charging](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=16625-23303),
  [stopped](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=16631-9378)): Check in to a project
  or warehouse (the button turns into Check out while checked in), Continue or Stop charging, and the full log.
  The drawer opens on the view the widget shows, and the widget shows the first four entries of the same log.
  Figma titles it "Dummy text Details"; the build uses "Check ins and charging". `#empty` shows "List is empty".

- Technical specifications (no Figma frame yet): every specification, grouped (Engine, Performance, Dimensions
  and weight). The card has no chevron in Figma, so its "+3 Specifications listed" line is the keyboard way in.
- Specific machine information (no Figma frame yet): Identification, Codes and Specific info. The card has no
  control of its own, so the card itself takes focus and opens on Enter or Space.
- Current Location (no Figma frame yet): the position (address, coordinates, last update, tracker, source),
  recent positions, Open in Google Maps and Open full map. Panning the map or using its buttons does not open it,
  and neither does a click on the full map; double-click zoom works on the full map only.
- Dependance (no Figma frame yet): every connected entity, the ones on the card first and then the rest under
  "Not shown on the card", each with its linked items; `#empty` shows "Not linked yet". Content is a placeholder.

Rule (in Syn): a widget's open chevron (`syn-card__open`) shows only while the card is hovered or has focus;
touch screens always show it.

## Edit Mode (widgets)

The gear at the end of the profile tabs (Overview only) opens Edit Mode, built from the Figma frames
[Edit mode](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=17068-71648),
[selected widget](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=17107-58944),
[resizing](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=17107-61363) and
[Manage Widgets](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=17064-71031):

- The tabs give way to the dashed "Edit Mode" banner; a floating bar at the bottom holds **Discard**, icon-only **Undo** and **Redo** in the middle
  (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z or Ctrl+Y; the names show as tooltips) and **Save**. Undo steps back one edit at a
  time, a whole drag or resize being one step; a new edit clears Redo.
  Everything is a draft until Save; Discard drops it.
- The banner's **Section** is the main action (filled Eerie Black); **Reset to default** next to it is Syn's outlined
  secondary button.
- **Reset to default** in the banner (not in Figma) puts the draft back to the Figma Overview: widgets, order and
  widths. Save keeps it, Discard drops it.
- Every card is in its edit outline at once, no click needed: a dashed border, a bar with the move grip,
  **1/3 · 2/3 · Full width** (3, 6 or 12 columns, as the Figma names them: four 1/3 cards fit in a row) and the round **remove** button, and the resize handles.
- **Resize:** the bar on the right edge changes the width on the 12 columns, the labelled handle on the bottom edge
  (↕ Auto, 1 row, 2 rows, 3 rows) the height in rows of the 450px card (450, 924, 1398px), and the corner grip at
  the bottom right both. Nothing reflows while dragging: a Dodger Blue outline shows the size the card will snap to,
  with its columns marked and a label ("6 / 12 columns · 2 rows"; dashed with "moves to the next row" when it no
  longer fits its row), and the size applies on release. Double-click the bottom handle or the grip to restore the
  designed height.
- **Move:** drag a card anywhere (or by its grip): it follows the pointer, and, as with resizing, nothing reflows
  while dragging: a Dodger Blue outline ("Move here") shows exactly where it will land, and the move applies on
  release. The landing spot is found by laying the new order out in a hidden copy of the grid.
- **Add Widget** (the dashed tile after the last card, a 1/3 card as high as an edit card; with no widgets left it
  spans the row as the empty state) and the banner's **Section** button open *Manage Widgets*:
  a collapsible group per category with a switch per widget. A widget switched on is added at the end of the page.
- Keyboard: Tab to a card, Arrow Left/Right moves it, Shift+Left/Right changes its width, Shift+Up/Down its height
  by a row, Delete removes it.
- The widgets are inert while editing (no drawers, no map panning). The Dependance card moves and resizes as one
  card; its rows are the connected entities switched on in Manage Widgets.
- Maps on the page (Current Location card, Telemetry) are click to activate, so scrolling the page past them never
  zooms them: asleep they sit under a grey veil (the pin stays red) with a hand and "Click to activate map", and the
  wheel and one-finger drag stay with the page. A click, a tap or Enter activates one: the veil clears in a circle
  from the click point, then the wheel zooms and the map drags, and clicks on it no longer open the card's drawer.
  It sleeps again 0.6s after the pointer leaves its frame, on a click elsewhere or on Escape. Ctrl/⌘ + wheel zooms
  even asleep; the full map is always active (`src/shared/mapGestures.ts`).
- The header keeps Figma's one row (equipment card, Tracker, Tag) down to 1024px: the Tracker and Tag cards keep
  Figma's two columns but at least 256px, and from 1024 to 1439px show their details only. Everything keeps its
  Figma place and one line, and the cards stay 157px: under ~1760px the photo is 96px and the facts' gaps tighten;
  text that does not fit ends in "…" (AS4U's long label first; a value's tooltip shows it in full). The profile tabs stay on one row too and scroll sideways, with a fade, when they
  do not fit.
- Widths and heights are stored per card in the layout (`spans`, `heights`); below 1024px a card of up to 4 columns
  takes half the row and a wider one the full row. Phones keep the designed heights.
- The layout is saved in the browser (`localStorage`, key `ep-overview-widgets-v1`), not per user yet. While editing,
  the draft is kept too (`ep-overview-widgets-draft-v1`): after a refresh Edit Mode reopens with "Unsaved changes
  restored" and a Discard link; Save or Discard clears it.
- Icon buttons (remove, Undo, Redo, the gear, the widgets' open chevrons) have real tooltips on hover and focus
  (shortcuts as ⌘ on Apple, Ctrl elsewhere) and 44px hit areas. Syn's `IconButton` and map controls have no
  native `title`: they draw the Syn tooltip themselves (`tooltip`, `tooltipPlacement`), kept inside the viewport.

`src/widgets/registry.tsx` lists the widgets, `src/widgets/layout.ts` holds the order, visibility, widths and the
move/resize rules, `src/widgets/EditMode.tsx` the banner, the edit grid and the bottom bar.

## Getting started

```bash
git clone --recurse-submodules https://github.com/easyvibesuxui-sketch/EquipmentProfile.git
cd EquipmentProfile
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + dist/
npm run build:single # one self-contained HTML file in dist-single/ (used for review)
```

If you cloned without `--recurse-submodules`, run `git submodule update --init`.

## How the design system is used

Syn lives in `vendor/syn-design-system` as a git submodule, pinned to a commit. Vite and TypeScript map
`@syn/design-system` to its source (`vendor/syn-design-system/src/index.ts`), so components, tokens and icons come
straight from the library and no build step is needed there. To take a newer Syn:

```bash
cd vendor/syn-design-system && git fetch && git checkout <commit-or-branch> && cd ../..
git add vendor/syn-design-system && git commit -m "Update Syn"
```

Every colour, space, radius and type style is a `--syn-*` token. The few values Figma uses that Syn has no token
for are named constants in `src/styles/app.css` (`--ep-*`).

## Structure

| Path | What |
| --- | --- |
| `src/layout/AppShell.tsx` | Sidebar (Figma *Side bar*) and top bar (*TopNavigation*) |
| `src/profile/ProfileHeader.tsx` | Equipment card, Tracker card, Tag card |
| `src/profile/ProfileTabs.tsx` | The profile tabs, on Syn `Segmented` |
| `src/overview/LocationWidget.tsx` | Current location map: Leaflet inside Syn `MapView`; Map Button opens the full map |
| `src/overview/widgets.tsx` | Specifications, Location, Identifications, Dependence, Check ins / Charging, History |
| `src/overview/moreWidgets.tsx` | Widgets added from Manage Widgets: Equipment Details, Calculation type, BGL, documents, checks, workshop, maintenance |
| `src/overview/HistoryDrawer.tsx`, `CheckInsDrawer.tsx`, `DependenceDrawer.tsx`, `InfoDrawer.tsx`, `LocationDrawer.tsx` | Drawers opened from the Overview widgets |
| `src/shared/OpensDrawer.tsx` | Makes a whole widget open its drawer (ignores its controls and drags) |
| `src/shared/PanelDrawer.tsx` | The 640px side panel (Syn Drawer) all profile drawers use |
| `src/widgets/` | Edit Mode and Manage Widgets: registry, layout state, edit grid, drawer |
| `src/overview/charts.tsx` | Operating Hours, Operation Hours by hour, Distance travelled |
| `src/telemetry/` | Telemetry tab: speed gauge, last known location and map, status tiles, Tracker sensors, Digital and Analogue inputs, Dashcam |
| `src/data/equipment.ts` | Mock data taken from the design, to be replaced by the API |
| `src/assets` | Photos, map and QR codes exported from Figma; `icons/` holds Figma icons Syn does not have, used as CSS masks |

### Syn components used

`Grid`/`GridItem`, `Card`, `Property`, `Segmented`, `Tag`, `Switch`, `Button`, `IconButton`, `Tooltip`, `Icon`, `Drawer`, `Section`,
`TextField`, `Select`, `FileItem`, `StatusBadge`, `EmptyState`, and the map set (`MapView`, `MapControls`, `MapZoomControls`, `MapLayerSwitch`, `MapExpandButton`,
`MapStreetViewButton`).

## Open points from the design

- Copy as in Figma, to confirm: "Dependance", "?Dependence?", "Montly", "AS4U-Gereteversetsung", "Max Musterman",
  "H" as the unit of *Distance travelled*, and weekdays in *Operation Hours by hour* (Aug 10, 11, 13, 14 all "Mon").
- *Operation Hours by hour*: Figma labels noon "12 AM" and stops at 10 PM; the build labels all 24 hours (… 12 PM … 12 AM).
- The AS4U toggle is Mantis in Figma; Syn's switch is Dark Sienna. The page sets the switch's token to Mantis.
- The top bar "Create" button follows Figma (Cultured border), overriding Syn's secondary button (Eerie Black border).
- The location map is live (Leaflet with OpenStreetMap, Esri imagery for Hybrid). Inside the claude.ai review artifact the tile servers are blocked, so it shows a link to the live site there.
