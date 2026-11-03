import { useRef, useState, type FormEvent } from 'react';
import { Button, Drawer, Icon, Section, Select, TextField } from '@syn/design-system';
import { equipment } from '../data/equipment';
import trackerPhoto from '../assets/tracker-photo.png';
import './TrackerDrawer.css';

const trackerModels = [
  { value: 'sbox-gen3', label: 'syniotec S-Box Gen.3' },
  { value: 'sbox-gen2', label: 'syniotec S-Box Gen.2' },
  { value: 'link3', label: 'Link 3' },
];
const people = [
  { value: 'max', label: 'Max Mustermann' },
  { value: 'erika', label: 'Erika Mustermann' },
];

/** "Tracking information": the tracker, its tag and the installation record, opened from the Tracker card. */
export function TrackerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [files, setFiles] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const formId = 'ep-tracker-form';

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      label="Tracking information"
      width={588}
      className="ep-tracker"
      headerStart={<h2 className="ep-tracker__title">Tracking information</h2>}
      footer={(
        <>
          <Button variant="text" size="md" onClick={onClose}>Discard</Button>
          <Button variant="primary" size="md" type="submit" form={formId} className="ep-tracker__submit">Submit</Button>
        </>
      )}
    >
      <form id={formId} className="ep-tracker__form" onSubmit={submit} noValidate>
        <div className="ep-tracker__group">
          <fieldset className="ep-tracker__card">
            <legend className="ep-tracker__legend">Tracker</legend>
            <Select label="Tracker model" options={trackerModels} defaultValue="sbox-gen3" />
            <TextField label="IMEI Number" labelPosition="outside" size="md" defaultValue={equipment.tracker.imei} name="imei" />
            <TextField label="Working Hours" labelPosition="outside" size="md" name="hours" inputMode="decimal" />
          </fieldset>
          <div className="ep-tracker__media">
            <img src={trackerPhoto} alt="Tracker device" />
          </div>
        </div>

        <div className="ep-tracker__group">
          <fieldset className="ep-tracker__card">
            <legend className="ep-tracker__legend">Tag</legend>
            <TextField label="TAG ID" labelPosition="outside" size="md" defaultValue={equipment.tag.id} name="tag" />
          </fieldset>
          <div className="ep-tracker__media ep-tracker__media--icon">
            <Icon name="tracking" size={40} />
          </div>
        </div>

        <Section title="Installation Info">
          <TextField label="Installation Date" labelPosition="outside" size="md" type="date" name="installed" defaultValue="2001-01-01" />
          <div className="ep-tracker__field">
            <span className="ep-tracker__label" aria-hidden>Responsible Person</span>
            <Select label="Responsible Person" options={people} placeholder="Select a person" />
          </div>
          <TextField label="Action by *" labelPosition="outside" size="md" name="actionBy" required defaultValue="Max Mustermann" />
          <div className="ep-tracker__field">
            <span className="ep-tracker__label">Installation Images</span>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => setFiles([...(e.currentTarget.files ?? [])].map((f) => f.name))}
            />
            <Button variant="secondary" size="md" iconEnd="cloud-upload" className="ep-tracker__upload" onClick={() => fileInput.current?.click()}>
              Upload images
            </Button>
            {files.length > 0 && <p className="ep-tracker__files">{files.join(', ')}</p>}
          </div>
        </Section>
      </form>
    </Drawer>
  );
}
