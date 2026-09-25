import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useState } from 'react';

import { TabBarContext } from '@/lib/tab-bar';
import { useTheme } from '@/ui';

export default function TabsLayout() {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(false);

  return (
    <TabBarContext value={{ setTabBarHidden: setHidden }}>
      <NativeTabs
        hidden={hidden}
        backgroundColor={colors.background}
        indicatorColor={colors.surfaceSelected}
        tintColor={colors.accent}
        labelStyle={{ selected: { color: colors.text } }}>
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Apps</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
            md="apps"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="browser">
          <NativeTabs.Trigger.Label>Browser</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="travel_explore" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext>
  );
}
