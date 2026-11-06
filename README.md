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
  Figma's footer has Discard and a disabled Submit; Submit stays disabled, as there is nothing to submit.
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

## Manage Widgets

The gear at the end of the profile tabs (Overview only) opens *Manage Widgets*, laid out after the Figma
[Mail Notifications](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=11612-41869) drawer:
one group per category (Overview, Specifications, Documents, Connected entities, Telemetry), a switch per widget,
"Show all" per group and "All widgets" at the top. Drag a row by its handle (or focus the handle and press
Arrow Up/Down) to change its place on the Overview; a widget moves only among the widgets of its own category.
Changes apply on **Submit**; Discard and Close drop them, and the arrow icon resets to the Figma defaults.
The layout is saved in the browser (`localStorage`, key `ep-overview-widgets-v1`), not per user yet.

- `src/widgets/registry.tsx` lists every widget: category, label, width on the grid, default visibility.
- `src/widgets/layout.ts` holds the order and hidden list, the reorder rule and the storage.
- Connected entities are the rows of the Dependance card, which sits where the first of them is.
- Equipment Details, Calculation type, BGL Information and the Documents widgets have no Figma design yet:
  their content in `src/overview/moreWidgets.tsx` is a placeholder.

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
| `src/widgets/` | Manage Widgets: registry, layout state, drawer |
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
