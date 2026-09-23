import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SiteTopBar } from '@/components/site-top-bar';
import type { Site } from '@/lib/sites';

/**
 * Web has no WebView, so the site loads in an iframe. Many sites refuse to be framed
 * (X-Frame-Options / CSP); the phone apps don't have that limitation.
 */
export function SiteView({ site }: { site: Site }) {
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const [progress, setProgress] = useState(0);

  return (
    <View style={styles.container}>
      <SiteTopBar
        title={site.name}
        themeColor={site.themeColor}
        progress={progress}
        onClose={() => router.back()}
        onReload={() => {
          setProgress(0);
          if (frame.current) frame.current.src = site.url;
        }}
      />
      <iframe
        ref={frame}
        src={site.url}
        title={site.name}
        onLoad={() => setProgress(1)}
        allowFullScreen
        style={{ flex: 1, border: 'none', width: '100%', backgroundColor: site.backgroundColor }}
        allow="clipboard-read; clipboard-write; fullscreen; geolocation; camera; microphone"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
