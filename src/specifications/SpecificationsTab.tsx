import { useState } from 'react';
import { Card } from '@syn/design-system';
import { FileRow, UploadField, type PickedFile } from '../shared/forms';
import { OpenLink } from '../shared/OpenLink';
import { CalculationTypeWidget, EquipmentDetailsWidget, InfoCard } from '../overview/moreWidgets';
import { bglInformation, identifications, otherDocuments, specList } from '../data/equipment';
import { BglDrawer, TechSpecsDrawer, type BglValue, type Dimensions, type SpecParam } from './SpecDrawers';
import './Specifications.css';

/** Specific machine information as in the owner's screenshot: the identifiers, and Special Information (F/B/S). */
const machineInfo: Array<[string, string | null]> = [
  ['Inventory Number', identifications[0][1]],
  ...identifications.slice(1, 4),
  ['Special Information (F/B/S)', null],
];

/** Dimensions and weight are edited apart (Enter Dimensions of equipment); every other specification is a parameter. */
const DIMENSION_LABELS = ['Dimensions', 'Operating weight'];
const initialParams: SpecParam[] = specList
  .filter((s) => !DIMENSION_LABELS.includes(s.label))
  .map((s, i) => ({ id: `p${i}`, label: s.label, value: s.value, unit: s.unit ?? '' }));
const initialDims: Dimensions = { weight: '34500', weightUnit: 'kg', length: '5.3', width: '2.41', height: '2.44' };
const initialBgl: BglValue = { year: bglInformation[1][1] ?? '2020', number: bglInformation[0][1] ?? '' };

/**
 * Specifications tab (Figma 9275:39423, in progress, and the owner's screenshots): every technical specification in
 * four columns (each other row Cultured); the info cards; Technical documents and Other documents. The chevrons (on
 * hover) open the edit drawers of Technical specifications and BGL information.
 */
export function SpecificationsTab() {
  const [technical, setTechnical] = useState<Array<PickedFile | null>>([null, null]);
  const [others, setOthers] = useState(otherDocuments);
  const [params, setParams] = useState(initialParams);
  const [dims, setDims] = useState(initialDims);
  const [bgl, setBgl] = useState(initialBgl);
  const [editing, setEditing] = useState<'specs' | 'bgl' | null>(null);

  const specs = [
    ...params.map((p) => ({ label: p.label, value: p.value, unit: p.unit })),
    { label: 'Dimensions', value: `${dims.width} × ${dims.height} × ${dims.length}`, unit: 'm' },
    { label: 'Operating weight', value: dims.weight, unit: dims.weightUnit === 'kg' ? 'kg' : 't' },
  ];

  return (
    <div className="ep-specs">
      <Card
        className="ep-specs-card"
        title={<>Technical specifications <span className="ep-specs__count">{specs.length} Specifications</span></>}
        actions={<OpenLink label="Edit technical specifications" onClick={() => setEditing('specs')} />}
      >
        <dl className="ep-specs__grid">
          {specs.map((s, i) => (
            <div key={`${s.label}-${i}`} className="ep-spec">
              <dt className="ep-spec__label">{s.label}</dt>
              <dd className="ep-spec__value">{s.value}{s.unit && <span className="ep-spec__unit">{s.unit}</span>}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Owner's screenshot: four info cards; the chevron at the top right shows on hover. */}
      <div className="ep-specs__cards">
        <EquipmentDetailsWidget />
        <InfoCard title="Specific machine information" rows={machineInfo} open="Open specific machine information" />
        <CalculationTypeWidget />
        <InfoCard
          title="BGL Information" className="ep-info-card--short" open="Edit BGL information" onOpen={() => setEditing('bgl')}
          rows={[['BGL Number', bgl.number || null], ['BGL Year', bgl.year || null]]}
        />
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

      <TechSpecsDrawer
        open={editing === 'specs'} dims={dims} params={params} onClose={() => setEditing(null)}
        onUpdate={(d, p) => { setDims(d); setParams(p); }}
      />
      <BglDrawer open={editing === 'bgl'} value={bgl} onClose={() => setEditing(null)} onUpdate={setBgl} />
    </div>
  );
}
