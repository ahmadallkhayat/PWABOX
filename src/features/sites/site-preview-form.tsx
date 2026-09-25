import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SiteInfo } from '@/features/sites/site-info';
import { SiteIcon } from '@/features/sites/site-icon';
import { Button, space, Surface, Text, TextField } from '@/ui';

/** A found site's icon and editable name, with the button that saves it as an app. */
export function SitePreviewForm({ info, onSave }: { info: SiteInfo; onSave: (name: string) => void }) {
  const [name, setName] = useState(info.name);

  return (
    <Surface padding="xl" radius="xl" style={styles.preview}>
      <SiteIcon name={name || info.name} iconUrl={info.iconUrl} themeColor={info.themeColor} size={72} />
      <View style={styles.field}>
        <Text variant="footnoteStrong" color="textSecondary">
          Name
        </Text>
        <TextField
          onSurface
          value={name}
          onChangeText={setName}
          placeholder={info.name}
          returnKeyType="done"
          maxLength={40}
          accessibilityLabel="Name"
        />
        <Text variant="caption" color="textTertiary" numberOfLines={2}>
          {info.url}
        </Text>
      </View>
      {/* The caller plays the success feedback once the app is actually saved. */}
      <Button title="Add to PWABOX" onPress={() => onSave(name.trim() || info.name)} stretch haptic={false} />
    </Surface>
  );
}

const styles = StyleSheet.create({
  preview: {
    alignItems: 'center',
    gap: space.lg,
  },
  field: {
    alignSelf: 'stretch',
    gap: space.sm,
  },
});
