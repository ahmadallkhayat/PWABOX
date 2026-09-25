This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## This project's structure and design system

See README.md for the full map. In short:

- `src/app/` holds routes only; put logic and UI in `src/features/<area>/` and reusable UI in `src/ui/`. Imports go one way: app → features → ui (ui never imports features).
- Build UI from `@/ui` (`Screen`, `Text`, `Button`, `IconButton`, `Icon`, `ListSection`/`ListRow`, `Dialog`, `Sheet`, `BottomBar`, `Toast`, `EmptyState`, `TextField`, `Surface`). Don't style raw `Text`/`Pressable` for things these cover.
- Never hard-code colors, spacing, radii or font sizes: use `useTheme().colors` / color names, `space`, `radius`, `typography`, `layout` from `@/ui`. New icons go in the list in `src/ui/icon.tsx`.
- Give interactions feedback with `haptic(event)` from `@/ui` (buttons, switches and list rows already do).
- Every screen's content goes in `<Screen>` so padding and safe areas stay consistent.
- Don't give views that contain buttons an entering/exiting animation that moves them (`SlideIn*`, `FadeInDown`, etc.): on Android with the New Architecture their buttons stop receiving taps (react-native-reanimated#6676). Fades are fine.
- Use `Pressable` from `@/ui` (react-native-gesture-handler's), never React Native's: RN's Pressable misses taps on Android inside native screens (react-navigation#12039). Inside a RN `<Modal>`, wrap content in `ModalGestureRoot` (Dialog, Sheet and the lock screen already do).
