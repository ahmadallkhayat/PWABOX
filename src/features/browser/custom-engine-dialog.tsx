import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { QUERY_PLACEHOLDER, validateEngineUrl, type SearchEngine } from '@/features/browser/search-engines';
import { Button, Dialog, haptic, space, Text, TextField } from '@/ui';

type CustomEngineDialogProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (engine: Omit<SearchEngine, 'id'>) => void;
};

/** Add a search engine by name and search address (with %s where the search words go). */
export function CustomEngineDialog({ visible, onClose, onSave }: CustomEngineDialogProps) {
  return (
    <Dialog visible={visible} title="Add a search engine" onClose={onClose}>
      <CustomEngineForm onClose={onClose} onSave={onSave} />
    </Dialog>
  );
}

function CustomEngineForm({ onClose, onSave }: Omit<CustomEngineDialogProps, 'visible'>) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  function save() {
    const problem = !name.trim() ? 'Give it a name.' : validateEngineUrl(url);
    if (problem) {
      haptic('error');
      setError(problem);
      return;
    }
    haptic('success');
    onSave({ name: name.trim(), url: url.trim() });
    onClose();
  }

  return (
    <>
      <View style={styles.field}>
        <Text variant="footnoteStrong" color="textSecondary">
          Name
        </Text>
        <TextField value={name} onChangeText={setName} placeholder="e.g. Kagi" autoFocus accessibilityLabel="Name" />
      </View>
      <View style={styles.field}>
        <Text variant="footnoteStrong" color="textSecondary">
          Search address
        </Text>
        <TextField
          value={url}
          onChangeText={(text) => {
            setUrl(text);
            setError(null);
          }}
          onSubmitEditing={save}
          placeholder={`https://kagi.com/search?q=${QUERY_PLACEHOLDER}`}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          accessibilityLabel="Search address"
        />
        <Text variant="caption" color={error ? 'danger' : 'textTertiary'}>
          {error ??
            `Search for anything on the site, copy the address of the results page, and replace your search words with ${QUERY_PLACEHOLDER}.`}
        </Text>
      </View>
      <Button title="Add search engine" onPress={save} stretch haptic={false} />
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: space.sm,
  },
});
