import { PanelDrawer } from '../shared/PanelDrawer';
import { HistoryItem } from './widgets';
import { historyLog } from '../data/equipment';
import './Drawers.css';

/**
 * "Recent actions from History" (Figma 16127:6470): the full history list. It is read-only, so it has no
 * footer: Figma's Discard and Submit were dropped on review (closing is the header X, Escape or the backdrop).
 */
export function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <PanelDrawer open={open} onClose={onClose} title="Recent actions from History" className="ep-history-drawer">
      <ol className="ep-history ep-history-drawer__list">
        {historyLog.map((e, i) => <HistoryItem key={i} entry={e} />)}
      </ol>
    </PanelDrawer>
  );
}
