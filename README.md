# PWABOX

Save any website as an app: PWABOX reads the site's web app manifest for its name, icon and
colors, puts it on a home grid, and opens it full screen in a WebView like an installed PWA.
Also: a Browser tab with your choice of search engine that offers to add installable sites,
bookmarks with previews, fullscreen video that rotates to fit, app lock (Face ID /
fingerprint / PIN), and ad, pop-up and redirect blocking.

Built with Expo SDK 57 and Expo Router.

```bash
npm install
npx expo start      # then open in Expo Go or a development build
npx tsc --noEmit    # typecheck
npx expo lint       # lint
```

## Project structure

```
src/
  app/        Routes only (Expo Router). Thin screens that compose features and ui.
  ui/         The design system: tokens, theme and reusable components. Knows nothing about sites.
  features/   The app's areas, each self-contained:
    sites/      saved sites store, manifest lookup, icon, home tile, add dialog
    browser/    SiteView (a saved app) and BrowserView (the Browser tab): address bar,
                search engines, install offer, navigation guard, fullscreen video, and
                scripts/ injected into pages (ad/pop-up blocking, fullscreen, manifest detector)
    bookmarks/  bookmarks store actions, preview screenshots, bookmarks sheet
    lock/       app lock (biometrics + inactivity) and lock screen
    settings/   persisted settings
    splash/     hand-over from the native splash screen
  lib/        Small shared helpers (orientation, tab bar visibility).
```

Dependencies point one way: `app → features → ui`. `ui` never imports from `features`.

## Design system (`src/ui`)

Import everything from `@/ui`.

**Tokens** (`ui/theme/tokens.ts`) are the only place values live:

- `useTheme().colors`: semantic colors that follow light/dark mode (`background`, `surface`,
  `text`, `textSecondary`, `accent`, `danger`, ...). Components also accept these names directly,
  e.g. `<Text color="textSecondary">`.
- `space` (`xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `xxl` 32), `radius`, `typography`,
  and `layout` (`gutter`, `maxContentWidth`, `minTouch`, ...).
- `BRAND`: the app icon's blue, used for the splash and lock screens.

**Components**

| Component | Use it for |
| --- | --- |
| `Screen` | The frame of every screen: background, side gutter, spacing between sections, max width, safe areas, scrolling |
| `Text` | All text: `variant` from the type scale, `color` from the theme |
| `Icon` / `IconButton` | Icons by meaning (`"close"`, `"bookmark"`, ...). Add new ones to the list in `ui/icon.tsx` |
| `Button` | `primary` · `secondary` · `destructive` · `plain` · `inverse`, `sm`/`md`, optional icon and loading |
| `TextField` | Text inputs |
| `ListSection` + `ListRow` | Settings-style groups; rows take a `switch`, `check` or `value` accessory, separators are automatic |
| `Surface` / `Separator` | Cards and hairlines |
| `Dialog` | Centered pop-ups (e.g. Add website) |
| `Sheet` | Pages that slide up (e.g. Bookmarks) |
| `BottomBar` | Actions pinned to the bottom; pair with `<Screen bottomInset={BOTTOM_BAR_HEIGHT}>` |
| `Toast` | Short notices with an optional action |
| `EmptyState` | "Nothing here yet" messages with an action |
| `haptic(event)` | Haptic feedback by meaning (`tap`, `selection`, `toggleOn`, `success`, ...). Buttons, icon buttons, switches and list rows already play one |

A new screen is usually just:

```tsx
<Screen>
  <ListSection title="Section">
    <ListRow icon="lock" title="Something" accessory={{ type: 'switch', value, onValueChange }} />
  </ListSection>
</Screen>
```
