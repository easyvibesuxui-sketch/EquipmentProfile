# Equipment Profile (SAM)

The equipment profile screen of SAM, built with the [Syn design system](https://github.com/easyvibesuxui-sketch/Syn-Design-System).
This first version is the **Overview** tab, from the Figma frame
[Equipment Profile Home](https://www.figma.com/design/Y9mIWBhREjY2aJotdjw3YQ/SAM--Design-?node-id=13767-3742).

## Live site

https://easyvibesuxui-sketch.github.io/EquipmentProfile/ — GitHub Pages, served from the `gh-pages` branch.
To update it, build and push `dist/` to that branch:

```bash
npm run build && touch dist/.nojekyll
npx gh-pages -d dist --dotfiles   # or commit dist/ to gh-pages by hand
```

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
| `src/overview/widgets.tsx` | Specifications, Location, Identifications, Dependence, Check ins / Charging, History |
| `src/overview/charts.tsx` | Operating Hours, Operation Hours by hour, Distance travelled |
| `src/data/equipment.ts` | Mock data taken from the design, to be replaced by the API |
| `src/assets` | Photos, map and QR codes exported from Figma; `icons/` holds Figma icons Syn does not have, used as CSS masks |

### Syn components used

`Grid`/`GridItem`, `Card`, `Property`, `Segmented`, `Tag`, `Switch`, `Button`, `IconButton`, `Tooltip`, `Icon`.

## Open points from the design

- Copy as in Figma, to confirm: "Dependance", "?Dependence?", "Montly", "AS4U-Gereteversetsung", "Max Musterman",
  "H" as the unit of *Distance travelled*, and weekdays in *Operation Hours by hour* (Aug 10, 11, 13, 14 all "Mon").
- *Operation Hours by hour*: Figma labels noon "12 AM" and stops at 10 PM; the build labels all 24 hours (… 12 PM … 12 AM).
- The AS4U toggle is Mantis in Figma; Syn's switch is Dark Sienna. The page sets the switch's token to Mantis.
- The top bar "Create" button follows Figma (Cultured border), overriding Syn's secondary button (Eerie Black border).
- Map, satellite and photos are static images from Figma; the map is not interactive beyond zoom.
