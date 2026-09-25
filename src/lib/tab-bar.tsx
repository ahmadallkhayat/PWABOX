import { createContext, use } from 'react';

type TabBarContextValue = {
  /** Hides the bottom tab bar, e.g. while the home screen shows its own edit bar there. */
  setTabBarHidden: (hidden: boolean) => void;
};

export const TabBarContext = createContext<TabBarContextValue>({ setTabBarHidden: () => {} });

export function useTabBar() {
  return use(TabBarContext);
}
