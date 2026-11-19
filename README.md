# SAM front ends

The SAM screens built with the [Syn design system](https://github.com/easyvibesuxui-sketch/Syn-Design-System), as one
repository with several apps (npm workspaces):

| Path | What |
| --- | --- |
| `apps/equipment-profile` | Equipment Profile (`@sam/equipment-profile`), see its [README](apps/equipment-profile/README.md) |
| `apps/werkstatt` | Werkstatt boards (`@sam/werkstatt`), see its [README](apps/werkstatt/README.md) |
| `packages/shared` | `@sam/shared`: the shell (sidebar and top bar), the "..." action menu, the drawer form parts, the date range picker, fonts and shell constants |
| `vendor/syn-design-system` | Syn, as a git submodule |
| `vite.shared.ts`, `tsconfig.base.json` | The Vite and TypeScript setup every app extends |

## Getting started

```bash
git clone --recurse-submodules https://github.com/easyvibesuxui-sketch/EquipmentProfile.git
cd EquipmentProfile
npm install                 # installs every workspace
npm run dev:profile         # Equipment Profile, http://localhost:5173
npm run dev:werkstatt       # Werkstatt, http://localhost:5174
npm run typecheck           # every workspace
npm run build               # every app: typecheck + apps/*/dist
npm run build:single        # one self-contained HTML file per app in apps/*/dist-single (used for review)
```

One app alone: `npm run build -w @sam/werkstatt`. If you cloned without `--recurse-submodules`, run `git submodule update --init`.

The sidebar links the apps: Planner opens the Equipment Profile, Werkstatt the board. In development they run on their
own ports; a deployment sets `VITE_PROFILE_URL` and `VITE_WERKSTATT_URL` (`packages/shared/src/links.ts`).

## Adding an app

1. `apps/<name>/` with `package.json` (`"@sam/shared": "*"`, react, react-dom; scripts as the other apps), `index.html`,
   `tsconfig.json` (extends `../../tsconfig.base.json`) and `vite.config.ts` (`samApp({ port })` from `../../vite.shared`).
2. `src/main.tsx` imports `@sam/shared/setup` first (fonts, Syn, shell constants), then renders inside `AppShell`.
3. Give it a sidebar item and a link in `packages/shared` if other apps should open it, then `npm install`.

Code used by more than one app goes to `packages/shared`; code of one app stays in that app.

## How the design system is used

Syn lives in `vendor/syn-design-system` as a git submodule, pinned to a commit. `vite.shared.ts` and `tsconfig.base.json` map
`@syn/design-system` to its source (`vendor/syn-design-system/src/index.ts`), so components, tokens and icons come
straight from the library and no build step is needed there. To take a newer Syn:

```bash
cd vendor/syn-design-system && git fetch && git checkout <commit-or-branch> && cd ../..
git add vendor/syn-design-system && git commit -m "Update Syn"
```

Every colour, space, radius and type style is a `--syn-*` token. The few values Figma uses that Syn has no token
for are named constants (`--ep-*`): the shell's in `packages/shared/src/styles/base.css`, each app's in its own stylesheet.

