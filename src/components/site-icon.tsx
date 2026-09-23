import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type SiteIconProps = {
  name: string;
  iconUrl?: string;
  themeColor?: string;
  size?: number;
};

/** The site's icon, or its first letter on the site's theme color when the icon can't load. */
export function SiteIcon({ name, iconUrl, themeColor, size = 64 }: SiteIconProps) {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const radius = size * 0.22;

  if (iconUrl && !failed) {
    return (
      <View
        style={[
          styles.frame,
          { width: size, height: size, borderRadius: radius, backgroundColor: theme.backgroundElement },
        ]}>
        <Image
          source={{ uri: iconUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  const background = themeColor ?? theme.backgroundSelected;
  return (
    <View
      style={[
        styles.frame,
        styles.letterFrame,
        { width: size, height: size, borderRadius: radius, backgroundColor: background },
      ]}>
      <Text style={[styles.letter, { fontSize: size * 0.45, color: readableTextOn(background) }]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

/** Black or white, whichever reads better on the given hex color. */
export function readableTextOn(color: string) {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  if ([r, g, b].some(Number.isNaN)) return '#ffffff';
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  letterFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: 700,
  },
});
