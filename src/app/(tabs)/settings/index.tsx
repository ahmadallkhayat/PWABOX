import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

import { useAppLock } from '@/features/lock/app-lock';
import { useSettings, type LockTimeout } from '@/features/settings/settings-store';
import { useSites } from '@/features/sites/sites-store';
import { ListRow, ListSection, Screen } from '@/ui';

const LOCK_TIMEOUTS: { value: LockTimeout; title: string; subtitle?: string }[] = [
  { value: 0, title: 'When I leave the app', subtitle: 'Including when the screen turns off' },
  { value: 30_000, title: 'After 30 seconds of inactivity' },
  { value: 60_000, title: 'After 1 minute of inactivity' },
  { value: 300_000, title: 'After 5 minutes of inactivity' },
];

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { method, authenticate } = useAppLock();
  const { sites } = useSites();

  const lockSupported = Platform.OS !== 'web';
  const methodLabel = method?.label ?? 'screen lock';
  const bookmarkCount = sites.reduce((total, site) => total + (site.bookmarks?.length ?? 0), 0);

  async function toggleLock(on: boolean) {
    if (on && !method?.available) {
      Alert.alert(
        'No screen lock set up',
        'To lock PWABOX, first set up a fingerprint, face unlock or PIN in your phone’s settings.'
      );
      return;
    }
    // Proving it works before turning it on means nobody gets locked out.
    const ok = await authenticate(on ? 'Turn on app lock' : 'Turn off app lock');
    if (ok) updateSettings({ lockEnabled: on });
  }

  return (
    <Screen>
      <ListSection
        title="App lock"
        footer={
          lockSupported
            ? `Uses ${methodLabel}. Inactivity means not touching the screen, including time spent outside the app. Watching a fullscreen video counts as activity.`
            : 'App lock is only available in the phone app.'
        }>
        <ListRow
          icon="lock"
          title="Lock PWABOX"
          subtitle={lockSupported ? `Unlock with ${methodLabel}` : 'Not available here'}
          accessory={{
            type: 'switch',
            value: settings.lockEnabled,
            onValueChange: toggleLock,
            disabled: !lockSupported,
          }}
        />
      </ListSection>

      {lockSupported && settings.lockEnabled && (
        <ListSection title="Lock">
          {LOCK_TIMEOUTS.map((option) => (
            <ListRow
              key={option.value}
              title={option.title}
              subtitle={option.subtitle}
              accessibilityRole="radio"
              accessory={{ type: 'check', checked: settings.lockTimeout === option.value }}
              onPress={() => updateSettings({ lockTimeout: option.value })}
            />
          ))}
        </ListSection>
      )}

      <ListSection
        title="Blocking"
        footer="When a pop-up or redirect is blocked, a message at the bottom of the site lets you open it anyway. Changes apply the next time you open a site.">
        <ListRow
          icon="block"
          title="Block ads"
          subtitle="Hides ads and stops ad networks from loading"
          accessory={{
            type: 'switch',
            value: settings.blockAds,
            onValueChange: (blockAds) => updateSettings({ blockAds }),
          }}
        />
        <ListRow
          icon="popup"
          title="Block pop-ups"
          subtitle="Stops sites opening new windows to other websites"
          accessory={{
            type: 'switch',
            value: settings.blockPopups,
            onValueChange: (blockPopups) => updateSettings({ blockPopups }),
          }}
        />
        <ListRow
          icon="redirect"
          title="Block redirects"
          subtitle="Stops pages sending you to other websites unless you tap a link"
          accessory={{
            type: 'switch',
            value: settings.blockRedirects,
            onValueChange: (blockRedirects) => updateSettings({ blockRedirects }),
          }}
        />
      </ListSection>

      {Platform.OS !== 'web' && (
        <ListSection title="General">
          <ListRow
            icon="haptics"
            title="Haptic feedback"
            subtitle="Vibrations for taps, toggles, drags and confirmations"
            accessory={{
              type: 'switch',
              value: settings.haptics,
              onValueChange: (haptics) => updateSettings({ haptics }),
            }}
          />
        </ListSection>
      )}

      <ListSection title="About">
        <ListRow title="Version" accessory={{ type: 'value', text: Constants.expoConfig?.version ?? '1.0.0' }} />
        <ListRow title="Apps" accessory={{ type: 'value', text: String(sites.length) }} />
        <ListRow title="Bookmarks" accessory={{ type: 'value', text: String(bookmarkCount) }} />
      </ListSection>
    </Screen>
  );
}
