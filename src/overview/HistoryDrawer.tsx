import { Button } from '@syn/design-system';
import { PanelDrawer } from '../shared/PanelDrawer';
import { HistoryItem } from './widgets';
import { historyLog } from '../data/equipment';
import './Drawers.css';

/**
 * "Recent actions from History" (Figma 16127:6470): the full history list. Figma draws a Discard text button
 * and a disabled Submit in the footer; the list has nothing to submit yet, so Submit stays disabled.
 */
export function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <PanelDrawer
      open={open}
      onClose={onClose}
      title="Recent actions from History"
      className="ep-history-drawer"
      footer={(
        <>
          <Button variant="text" onClick={onClose}>Discard</Button>
          <Button className="ep-panel-drawer__submit" disabled>Submit</Button>
        </>
      )}
    >
      <ol className="ep-history ep-history-drawer__list">
        {historyLog.map((e, i) => <HistoryItem key={i} entry={e} />)}
      </ol>
    </PanelDrawer>
  );
}
