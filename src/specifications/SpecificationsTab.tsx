import { useState } from 'react';
import { Card, EmptyState } from '@syn/design-system';
import { FileRow, UploadField, type PickedFile } from '../shared/forms';
import { OpenLink } from '../shared/OpenLink';
import { InfoCard } from '../overview/moreWidgets';
import { bglInformation, otherDocuments, specList } from '../data/equipment';
import { BglDrawer, BglSpecList, TechSpecsDrawer, type BglValue, type Dimensions, type SpecParam } from './SpecDrawers';
import { CalculationDrawer, EquipmentDetailsDrawer, MachineInfoDrawer } from './InfoDrawers';
import { basisLabels, initialCalculation, initialDetails, initialMachineInfo } from './infoData';
import './Specifications.css';

/** A Calculation type row: the label in Eerie Black, the value with its unit in Silver Chalice. */
const calcRow = (label: string, value: string, unit?: string) => (
  <div key={label} className="ep-info__row">
    <dt className="is-strong">{label}</dt>
    <dd className={value ? undefined : 'is-empty'}>{value || '--'}{value && unit && <span className="ep-info__unit"> {unit}</span>}</dd>
  </div>
);

/** Dimensions and weight are edited apart (Enter Dimensions of equipment); every other specification is a parameter. */
const DIMENSION_LABELS = ['Dimensions', 'Operating weight'];
const initialParams: SpecParam[] = specList
  .filter((s) => !DIMENSION_LABELS.includes(s.label))
  .map((s, i) => ({ id: `p${i}`, label: s.label, value: s.value, unit: s.unit ?? '' }));
const initialDims: Dimensions = { weight: '34500', weightUnit: 'kg', length: '5.3', width: '2.41', height: '2.44' };
// The BGL specifications load in the drawer once the year or number changes (owner's card shows "Count 0" at first).
const initialBgl: BglValue = { year: bglInformation[1][1] ?? '2020', number: bglInformation[0][1] ?? '', specs: [] };

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
  const [details, setDetails] = useState(initialDetails);
  const [machine, setMachine] = useState(initialMachineInfo);
  const [calc, setCalc] = useState(initialCalculation);
  const [editing, setEditing] = useState<'specs' | 'bgl' | 'details' | 'machine' | 'calc' | null>(null);

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

      {/* Owner's screenshots: four info cards; the chevron at the top right shows on hover and opens the edit drawer. */}
      <div className="ep-specs__cards">
        <InfoCard
          title="Equipment Details" open="Edit equipment details" onOpen={() => setEditing('details')}
          rows={[
            ['Manufacturer', details.manufacturer], ['Model', details.model], ['Production year', details.year],
            ['Category', details.category || null], ['Title', details.title || null], ['Subtitle', details.subtitle],
          ]}
        />
        <InfoCard
          title="Specific machine information" open="Edit specific machine information" onOpen={() => setEditing('machine')}
          rows={[
            ['Inventory Number', machine.inventory || null], ['UEID/TOID', (machine.sameAsInventory ? machine.inventory : machine.ueid) || null],
            ['Serial number', machine.serial || null], ['Numberplate', machine.numberplate || null], ['Special Information (F/B/S)', machine.special || null],
          ]}
        />
        <InfoCard title="Calculation type" open="Edit calculation type" onOpen={() => setEditing('calc')} rows={[]}>
          <dl className="ep-info">
            {calcRow('Operating hours', calc.hourPrice, 'Euro')}
            {calcRow('Daily price', calc.dailyPrice, 'Euro')}
            {calcRow('Calculation basis', calc.basis ? basisLabels[calc.basis] : '')}
            <div className="ep-info__row ep-info__heading" role="presentation"><dt>Optional</dt></div>
            {calcRow('if less than', calc.lessThan, 'h')}
            {calcRow('Charge with', calc.chargeWith, 'Euro')}
          </dl>
        </InfoCard>
        <InfoCard title="BGL Information" className="ep-bgl-card" open="Edit BGL information" onOpen={() => setEditing('bgl')} rows={[]}>
          <dl className="ep-info ep-bgl-card__facts">
            <div className="ep-info__row"><dt>BGL number</dt><dd className={bgl.number ? undefined : 'is-empty'}>{bgl.number || '--'}</dd></div>
            <div className="ep-info__row"><dt>BGL Year</dt><dd className={bgl.year ? undefined : 'is-empty'}>{bgl.year || '--'}</dd></div>
          </dl>
          <p className="ep-bgl-card__head"><span className="syn-title-text">BGL Specifications</span><span className="ep-specd__count">Count {bgl.specs.length}</span></p>
          {bgl.specs.length
            ? <div className="ep-bgl-card__list"><BglSpecList specs={bgl.specs} compact /></div>
            : <EmptyState icon="report" className="ep-bgl-card__empty">No BGL information yet</EmptyState>}
        </InfoCard>
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
      <EquipmentDetailsDrawer open={editing === 'details'} value={details} onClose={() => setEditing(null)} onUpdate={setDetails} />
      <MachineInfoDrawer open={editing === 'machine'} value={machine} onClose={() => setEditing(null)} onUpdate={setMachine} />
      <CalculationDrawer open={editing === 'calc'} value={calc} onClose={() => setEditing(null)} onUpdate={setCalc} />
    </div>
  );
}
