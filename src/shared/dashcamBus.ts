/** The header's camera Play opens the Telemetry tab with the Dashcam Player full screen and playing. */
let pending = false;
export const DASHCAM_PLAY_EVENT = 'ep:play-dashcam';
export function requestDashcamPlay() {
  pending = true;
  window.dispatchEvent(new Event(DASHCAM_PLAY_EVENT));
}
export function consumeDashcamPlay() {
  const p = pending;
  pending = false;
  return p;
}
