import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';

import { useTheme } from '@/hooks/use-theme';
import { TabBarContext } from '@/lib/tab-bar';

export default function TabsLayout() {
  const theme = useTheme();
  const [hidden, setHidden] = useState(false);

  return (
    <TabBarContext value={{ setTabBarHidden: setHidden }}>
      <NativeTabs
        hidden={hidden}
        backgroundColor={theme.background}
        indicatorColor={theme.backgroundSelected}
        labelStyle={{ selected: { color: theme.text } }}>
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Apps</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md="apps" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext>
  );
}
