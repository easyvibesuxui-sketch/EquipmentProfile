import { Dialog, Icon } from '@syn/design-system';
import { ruleKinds, type RuleKind } from '../data/rules';

/**
 * "Choose rule type": the "Rule" button's popup, laid out like SAM's "Choose alert type" (Figma 14085:94424) on the
 * Syn Dialog: a card per kind with its round icon, title and a short description. The Daily booking job is one per
 * organization, so its card is off while one exists.
 */
export function RuleTypeDialog({ open, onClose, onChoose, dailyExists }: {
  open: boolean;
  onClose: () => void;
  onChoose: (kind: RuleKind) => void;
  dailyExists: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Choose rule type" icon={null} className="ep-kind-dialog">
      <div className="ep-kind-dialog__grid">
        {ruleKinds.map((k) => {
          const taken = k.kind === 'daily' && dailyExists;
          return (
            <button
              key={k.kind}
              type="button"
              className="ep-kind"
              disabled={taken}
              aria-describedby={`ep-kind-${k.kind}-d`}
              onClick={() => onChoose(k.kind)}
            >
              <span className={`ep-kind__icon is-${k.tone}`} aria-hidden><Icon name={k.icon} size={28} /></span>
              <span className="ep-kind__title syn-title-text">{k.title}</span>
              <span className="ep-kind__text" id={`ep-kind-${k.kind}-d`}>
                {taken ? 'Already set up. Edit it from its row in the list.' : k.description}
              </span>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
