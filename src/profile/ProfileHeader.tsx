import { useState } from 'react';
import { Grid, GridItem, Icon, Switch, Tag } from '@syn/design-system';
import { MaskIcon } from '../layout/AppShell';
import { ColorDot } from '../shared/ColorDot';
import { ActionMenu } from '../shared/ActionMenu';
import { TrackerDrawer } from './TrackerDrawer';
import { requestDashcamPlay } from '../shared/dashcamBus';
import cabFrame from '../assets/telemetry/dashcam-cab.jpg';
import { equipment, type HeaderFact } from '../data/equipment';
import photo from '../assets/equipment-photo.png';
import trackerPhoto from '../assets/tracker-photo.png';
import qrCode from '../assets/qr-code.png';
import customTag from '../assets/custom-tag.png';
import statusIcon from '../assets/icons/profile-status.png';
import assigningIcon from '../assets/icons/profile-assigning.png';
import garageIcon from '../assets/icons/profile-garage.png';
import operatorIcon from '../assets/icons/profile-operator.png';
import './ProfileHeader.css';

const factIcons: Record<HeaderFact['id'], string> = {
  status: statusIcon, assigning: assigningIcon, garage: garageIcon, operator: operatorIcon,
};

function Fact({ fact }: { fact: HeaderFact }) {
  return (
    <div className={`ep-header__fact ep-header__fact--${fact.id}`}>
      <dt>
        <MaskIcon src={factIcons[fact.id]} size={14} />
        {fact.label}
      </dt>
      <dd><ColorDot color={fact.dot} /><span className="syn-title-text" title={fact.value}>{fact.value}</span></dd>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ep-header__copy"
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      onClick={() => {
        navigator.clipboard?.writeText(value).catch(() => undefined);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      <Icon name={copied ? 'check' : 'copy'} size={10} />
    </button>
  );
}

/** Figma "Frame 1": the equipment card (8 columns) and the Tracker and Tag cards (2 columns each). */
export function ProfileHeader() {
  const [as4u, setAs4u] = useState(equipment.as4uEnabled);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const { tag } = equipment;
  const tracker = typeof window !== 'undefined' && window.location.hash === '#no-camera' ? equipment.plainTracker : equipment.tracker;
  return (
    <Grid gap={24} className="ep-header">
      <GridItem span={8} className="ep-header__col-main">
        <section className="ep-header__main" aria-labelledby="ep-title">
          <img className="ep-header__photo" src={photo} alt={equipment.title} width={133} height={133} />
          <div className="ep-header__content">
            <div className="ep-header__top">
              <div className="ep-header__heading">
                <h1 id="ep-title" className="ep-header__title">{equipment.title}</h1>
                <div className="ep-header__labels">
                  <span className="ep-header__category">
                    <Icon name="categories" size={12} />
                    <span className="ep-header__category-label syn-title-text">Category:</span>
                    <span className="syn-title-text">{equipment.category}</span>
                  </span>
                  <ul className="ep-header__tags" aria-label="Tags">
                    {equipment.tags.map((t) => (
                      <li key={t}><Tag variant="soft" className="ep-header__tag"><ColorDot color="info" size={10} /><span className="ep-header__tag-name" title={t}>{t}</span></Tag></li>
                    ))}
                    <li><Tag variant="soft" className="ep-header__tag ep-header__tag--more">+{equipment.moreTags}</Tag></li>
                  </ul>
                </div>
              </div>
              <ActionMenu
                label="Equipment actions"
                actions={[
                  { id: 'status', label: 'Update Status', icon: 'refresh-change' },
                  { id: 'archive', label: 'Archive equipment', icon: 'archive' },
                ]}
                note="To delete equipment, archive it first."
              />
            </div>
            <div className="ep-header__bottom">
              <dl className="ep-header__facts">
                <div className="ep-header__fact ep-header__fact--inventory">
                  <dt>Inventory Number</dt>
                  <dd><span className="syn-title-text">{equipment.inventoryNumber}</span></dd>
                </div>
                {equipment.facts.map((f) => <Fact key={f.id} fact={f} />)}
                {/* AS4U is the last fact, at the right end of the row as in Figma. */}
                <div className="ep-header__as4u">
                  <dt id="ep-as4u" className="ep-header__muted" title={equipment.as4uLabel}>{equipment.as4uLabel}</dt>
                  <dd>
                    <Switch
                      label={equipment.as4uLabel}
                      aria-labelledby="ep-as4u"
                      size={20}
                      checked={as4u}
                      onChange={(e) => setAs4u(e.currentTarget.checked)}
                      className="ep-switch-success"
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </GridItem>

      <GridItem span={2} className="ep-header__col-device">
        <section className="ep-header__device ep-header__device--link" aria-label="Tracker">
          <button type="button" className="ep-header__device-open" aria-label="Open tracking information" onClick={() => setTrackerOpen(true)} />
          {tracker.camera ? (
            // Figma camera tracker: the last frame under a 45% shade, Play in the middle, the live dot and a 32px QR.
            <div className="ep-header__device-media ep-header__device-media--camera">
              <img src={cabFrame} alt="Last dashcam frame" />
              <span className="ep-header__shade" aria-hidden />
              {tracker.online && <span className="ep-header__live" aria-hidden />}
              <button type="button" className="ep-header__play" aria-label="Play dashcam" onClick={requestDashcamPlay}>
                <Icon name="play" size={20} />
              </button>
              <img className="ep-header__qr ep-header__qr--camera" src={qrCode} alt="Tracker QR code" width={32} height={32} />
            </div>
          ) : (
            <div className="ep-header__device-media">
              <img src={trackerPhoto} alt="Tracker device" width={96} height={133} />
              <img className="ep-header__qr" src={qrCode} alt="Tracker QR code" width={40} height={40} />
            </div>
          )}
          <dl className="ep-header__device-info">
            <div><dt>Tracker</dt><dd className="ep-header__strong"><span className="syn-title-text">{tracker.name}</span></dd></div>
            <div>
              <dt>IMEI Number</dt>
              <dd className="ep-header__imei">{tracker.imei}<CopyButton value={tracker.imei} label="Copy IMEI number" /></dd>
            </div>
            <div>
              <dt>Last Update</dt>
              <dd className="ep-header__update">
                {tracker.camera ? <ColorDot color="amber" size={8} /> : <ColorDot color="success" />}
                <span>{tracker.lastUpdate}</span>
                <span className="ep-header__muted">{tracker.ago}</span>
              </dd>
            </div>
          </dl>
        </section>
        <TrackerDrawer open={trackerOpen} onClose={() => setTrackerOpen(false)} />
      </GridItem>

      <GridItem span={2} className="ep-header__col-device">
        <section className="ep-header__device" aria-label="Tag">
          <div className="ep-header__device-media ep-header__device-media--custom">
            <span className="ep-header__muted">Custom</span>
            <img src={customTag} alt="" width={48} height={30} />
            <img className="ep-header__qr ep-header__qr--custom" src={qrCode} alt="Tag QR code" width={40} height={40} />
          </div>
          <dl className="ep-header__device-info ep-header__device-info--tag">
            <div><dt>Tag</dt><dd className="ep-header__strong"><span className="syn-title-text">{tag.name}</span></dd></div>
            <div><dt>Tag ID</dt><dd>{tag.id}</dd></div>
          </dl>
        </section>
      </GridItem>
    </Grid>
  );
}
