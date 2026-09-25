import Constants from 'expo-constants';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppLock } from '@/lib/app-lock';
import { useSettings, type LockTimeout } from '@/lib/settings';
import { useSites } from '@/lib/sites';

const ACCENT = '#208AEF';

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
  const theme = useTheme();

  const lockSupported = Platform.OS !== 'web';
  const methodLabel = method?.label ?? 'screen lock';

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

  const bookmarkCount = sites.reduce((total, site) => total + (site.bookmarks?.length ?? 0), 0);

  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <Section
          title="App lock"
          footer={
            lockSupported
              ? `Uses ${methodLabel}. Inactivity means not touching the screen, including time spent outside the app. Watching a fullscreen video counts as activity.`
              : 'App lock is only available in the phone app.'
          }>
          <View style={styles.row}>
            <SymbolView
              name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
              tintColor={theme.text}
              size={20}
            />
            <View style={styles.flex}>
              <ThemedText>Lock PWABOX</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {lockSupported ? `Unlock with ${methodLabel}` : 'Not available here'}
              </ThemedText>
            </View>
            <Switch
              value={settings.lockEnabled}
              onValueChange={toggleLock}
              disabled={!lockSupported}
              trackColor={{ true: ACCENT }}
            />
          </View>
        </Section>

        {lockSupported && settings.lockEnabled && (
          <Section title="Lock">
            {LOCK_TIMEOUTS.map((option, index) => {
              const selected = settings.lockTimeout === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => updateSettings({ lockTimeout: option.value })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && [styles.divider, { borderTopColor: theme.backgroundSelected }],
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.flex}>
                    <ThemedText>{option.title}</ThemedText>
                    {option.subtitle && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {option.subtitle}
                      </ThemedText>
                    )}
                  </View>
                  {selected && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      tintColor={ACCENT}
                      size={20}
                    />
                  )}
                </Pressable>
              );
            })}
          </Section>
        )}

        <Section
          title="Blocking"
          footer="When a pop-up or redirect is blocked, a message at the bottom of the site lets you open it anyway. Changes apply the next time you open a site.">
          <SwitchRow
            icon={{ ios: 'nosign', android: 'block', web: 'block' }}
            title="Block ads"
            subtitle="Hides ads and stops ad networks from loading"
            value={settings.blockAds}
            onValueChange={(blockAds) => updateSettings({ blockAds })}
          />
          <SwitchRow
            icon={{ ios: 'macwindow.badge.plus', android: 'open_in_new_off', web: 'open_in_new_off' }}
            title="Block pop-ups"
            subtitle="Stops sites opening new windows to other websites"
            value={settings.blockPopups}
            onValueChange={(blockPopups) => updateSettings({ blockPopups })}
            divider
          />
          <SwitchRow
            icon={{ ios: 'arrow.triangle.turn.up.right.circle', android: 'alt_route', web: 'alt_route' }}
            title="Block redirects"
            subtitle="Stops pages sending you to other websites unless you tap a link"
            value={settings.blockRedirects}
            onValueChange={(blockRedirects) => updateSettings({ blockRedirects })}
            divider
          />
        </Section>

        <Section title="About">
          <InfoRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
          <InfoRow label="Apps" value={String(sites.length)} divider />
          <InfoRow label="Bookmarks" value={String(bookmarkCount)} divider />
        </Section>
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.card}>
        {children}
      </ThemedView>
      {footer && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          {footer}
        </ThemedText>
      )}
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  divider,
}: {
  icon: ComponentProps<typeof SymbolView>['name'];
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  divider?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.row, divider && [styles.divider, { borderTopColor: theme.backgroundSelected }]]}>
      <SymbolView name={icon} tintColor={theme.text} size={20} />
      <View style={styles.flex}>
        <ThemedText>{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: ACCENT }} />
    </View>
  );
}

function InfoRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, divider && [styles.divider, { borderTopColor: theme.backgroundSelected }]]}>
      <ThemedText style={styles.flex}>{label}</ThemedText>
      <ThemedText themeColor="textSecondary">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 12,
    paddingHorizontal: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: Spacing.three,
  },
});
