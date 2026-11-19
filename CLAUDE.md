# EquipmentProfile — working rules

## Syn design system (vendor/syn-design-system)

- Do not change, commit to or push the Syn repository (`vendor/syn-design-system`) without the owner's explicit
  go-ahead in the conversation. Changes made for this project stay in this project until the owner says otherwise.
- When a change looks like it belongs in Syn (a component, token or global style), build it in this app instead
  (e.g. a component in `packages/shared/` when several apps use it, or in the app's own `src/`, or a scoped override stylesheet) and say that it could move to Syn
  later; or ask first.
- Never open a pull request, merge, or move the submodule pointer of Syn without being asked.
- Syn's `main` and default branch are never touched from here.
