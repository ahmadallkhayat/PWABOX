import type { SiteInfo } from '@/features/sites/site-info';
import { SitePreviewForm } from '@/features/sites/site-preview-form';
import { useSites } from '@/features/sites/sites-store';
import { Dialog, haptic, Text } from '@/ui';

type InstallSiteDialogProps = {
  /** The site to install; the dialog is hidden while this is null. */
  info: SiteInfo | null;
  onClose: () => void;
  onInstalled?: () => void;
};

/** "Add as app" for a site found while browsing: preview its icon and name, then save it. */
export function InstallSiteDialog({ info, onClose, onInstalled }: InstallSiteDialogProps) {
  const { addSite } = useSites();
  return (
    <Dialog visible={!!info} title="Add as app" onClose={onClose}>
      {info && (
        <>
          <Text color="textSecondary">
            Opens from your Apps, full screen, like an installed app.
          </Text>
          <SitePreviewForm
            info={info}
            onSave={(name) => {
              haptic('success');
              addSite({ ...info, name });
              onClose();
              onInstalled?.();
            }}
          />
        </>
      )}
    </Dialog>
  );
}
