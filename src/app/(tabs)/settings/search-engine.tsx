import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomEngineDialog } from '@/features/browser/custom-engine-dialog';
import { BUILT_IN_ENGINES, DEFAULT_ENGINE_ID } from '@/features/browser/search-engines';
import { useSettings } from '@/features/settings/settings-store';
import { Button, IconButton, ListRow, ListSection, Screen, space } from '@/ui';

export default function SearchEngineScreen() {
  const { settings, updateSettings } = useSettings();
  const [adding, setAdding] = useState(false);
  const custom = settings.customSearchEngines;

  function removeCustom(id: string) {
    updateSettings({
      customSearchEngines: custom.filter((engine) => engine.id !== id),
      // Deleting the engine in use falls back to the default.
      ...(settings.searchEngineId === id ? { searchEngineId: DEFAULT_ENGINE_ID } : {}),
    });
  }

  return (
    <Screen>
      <ListSection footer="Used by the Browser tab when what you type isn't a web address.">
        {BUILT_IN_ENGINES.map((engine) => (
          <ListRow
            key={engine.id}
            title={engine.name}
            accessibilityRole="radio"
            accessory={{ type: 'check', checked: settings.searchEngineId === engine.id }}
            onPress={() => updateSettings({ searchEngineId: engine.id })}
          />
        ))}
      </ListSection>

      {custom.length > 0 && (
        <ListSection title="Your search engines">
          {custom.map((engine) => (
            <View key={engine.id} style={styles.customRow}>
              <View style={styles.flex}>
                <ListRow
                  title={engine.name}
                  subtitle={engine.url}
                  accessibilityRole="radio"
                  accessory={{ type: 'check', checked: settings.searchEngineId === engine.id }}
                  onPress={() => updateSettings({ searchEngineId: engine.id })}
                />
              </View>
              <IconButton
                icon="delete"
                color="danger"
                accessibilityLabel={`Delete ${engine.name}`}
                onPress={() => removeCustom(engine.id)}
                haptic="warning"
              />
            </View>
          ))}
        </ListSection>
      )}

      <Button title="Add a search engine" icon="add" variant="secondary" onPress={() => setAdding(true)} />

      <CustomEngineDialog
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(engine) => {
          const id = `custom-${Date.now().toString(36)}`;
          // A newly added engine is usually the one you want to use.
          updateSettings({ customSearchEngines: [...custom, { ...engine, id }], searchEngineId: id });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: space.sm,
  },
});
