import { useState } from 'react';
import { Card } from '@syn/design-system';
import { FileRow, UploadField, type PickedFile } from '../shared/forms';
import { BglWidget, CalculationTypeWidget, EquipmentDetailsWidget, InfoCard } from '../overview/moreWidgets';
import { identifications, otherDocuments, specList } from '../data/equipment';
import './Specifications.css';

/** Specific machine information as in the owner's screenshot: the identifiers, and Special Information (F/B/S). */
const machineInfo: Array<[string, string | null]> = [
  ['Inventory Number', identifications[0][1]],
  ...identifications.slice(1, 4),
  ['Special Information (F/B/S)', null],
];

/**
 * Specifications tab (Figma 9275:39423, in progress): every technical specification in four columns (each other
 * row Cultured), then Technical documents (two upload slots) and Other documents (the uploaded files).
 */
export function SpecificationsTab() {
  const [technical, setTechnical] = useState<Array<PickedFile | null>>([null, null]);
  const [others, setOthers] = useState(otherDocuments);
  return (
    <div className="ep-specs">
      <Card
        className="ep-specs-card"
        title={<>Technical specifications <span className="ep-specs__count">{specList.length} Specifications</span></>}
      >
        <dl className="ep-specs__grid">
          {specList.map((s) => (
            <div key={s.label} className="ep-spec">
              <dt className="ep-spec__label">{s.label}</dt>
              <dd className="ep-spec__value">{s.value}{s.unit && <span className="ep-spec__unit">{s.unit}</span>}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Owner's screenshot: four info cards; the chevron at the top right shows on hover and opens the values. */}
      <div className="ep-specs__cards">
        <EquipmentDetailsWidget />
        <InfoCard title="Specific machine information" rows={machineInfo} open="Open specific machine information" />
        <CalculationTypeWidget />
        <BglWidget />
      </div>

      <div className="ep-specs__docs">
        <Card title="Technical documents" className="ep-specs-card ep-docs">
          <div className="ep-docs__slots">
            {technical.map((f, i) => (
              <UploadField
                key={i} file={f} className="ep-docs__slot"
                onChange={(next) => setTechnical((t) => t.map((x, j) => (j === i ? next : x)))}
              />
            ))}
          </div>
        </Card>
        <Card title="Other documents" className="ep-specs-card ep-docs">
          {others.length ? (
            <ul className="ep-docs__list">
              {others.map((d) => (
                <li key={d.name}><FileRow file={d} onRemove={() => setOthers((o) => o.filter((x) => x.name !== d.name))} /></li>
              ))}
            </ul>
          ) : <p className="ep-docs__empty">No other documents</p>}
        </Card>
      </div>
    </div>
  );
}
