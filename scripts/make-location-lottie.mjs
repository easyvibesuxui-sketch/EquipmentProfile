// Builds src/widgets/previews/current-location.json: the Lottie animation that the Manage Widgets preview of
// "Current location" plays instead of the live map (the same for every user, no real position).
// 560 x 320 (the preview card), 30 fps: the map settles (0-24), the pin drops and bounces (18-36), the address card
// slides up (30-42), then the pin pulses; frames 36-96 loop.
// Run: node scripts/make-location-lottie.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 560; const H = 320; const FR = 30; const OP = 96;
// Syn colours (0-1): Candy Apple, Cultured, White, map greys.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1);
const C = { brand: hex('#FF1900'), ground: hex('#F1F1F1'), block: hex('#E5E8E9'), water: hex('#DCE3E6'), road: hex('#FFFFFF'), bar: hex('#E1E4E5'), ink: hex('#151515') };

const v = (k) => ({ a: 0, k });
const ease = { i: { x: [0.2], y: [1] }, o: { x: [0.4], y: [0] } };
const anim = (frames) => ({ a: 1, k: frames.map(([t, s], n) => (n < frames.length - 1 ? { t, s, ...ease } : { t, s })) });
const tr = () => ({ ty: 'tr', p: v([0, 0]), a: v([0, 0]), s: v([100, 100]), r: v(0), o: v(100), sk: v(0), sa: v(0) });
const fill = (c, o = 100) => ({ ty: 'fl', c: v(c), o: v(o), r: 1 });
const stroke = (c, w, o = 100) => ({ ty: 'st', c: v(c), o: v(o), w: v(w), lc: 2, lj: 2 });
const rect = (x, y, w, h, r = 0) => ({ ty: 'rc', d: 1, p: v([x, y]), s: v([w, h]), r: v(r) });
const ellipse = (x, y, w, h) => ({ ty: 'el', d: 1, p: v([x, y]), s: v([w, h]) });
/** A smooth open path through points (Catmull-Rom to cubic). */
const curve = (pts) => {
  const vtx = pts; const iT = []; const oT = [];
  pts.forEach((p, n) => {
    const a = pts[Math.max(0, n - 1)]; const b = pts[Math.min(pts.length - 1, n + 1)];
    const d = [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
    iT.push([-d[0], -d[1]]); oT.push([d[0], d[1]]);
  });
  return { ty: 'sh', d: 1, ks: v({ i: iT, o: oT, v: vtx, c: false }) };
};
const poly = (pts, closed = true) => ({ ty: 'sh', d: 1, ks: v({ i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]), v: pts, c: closed }) });
const group = (nm, ...it) => ({ ty: 'gr', nm, it: [...it, tr()] });
const layer = (ind, nm, shapes, ks = {}, ip = 0) => ({
  ddd: 0, ind, ty: 4, nm, sr: 1, ao: 0, ip, op: OP, st: 0, bm: 0,
  ks: { o: v(100), r: v(0), p: v([0, 0, 0]), a: v([0, 0, 0]), s: v([100, 100, 100]), ...ks },
  shapes,
});

// Map: ground, blocks, the river, main and minor roads (a neutral town, no real place).
const blocks = [];
for (let gx = 0; gx < 8; gx += 1) {
  for (let gy = 0; gy < 5; gy += 1) {
    const x = -10 + gx * 80 + (gy % 2) * 18; const y = 10 + gy * 72;
    if ((gx + gy) % 3 === 0) continue;
    blocks.push(rect(x + 30, y + 24, 52 + ((gx * 7) % 14), 38 + ((gy * 11) % 12), 4));
  }
}
// Lottie draws the first item of a list on top: main roads over minor roads over the river, blocks and ground.
const map = layer(50, 'Map', [
  group('Main roads', curve([[-20, 118], [180, 128], [380, 118], [600, 132]]), curve([[300, -20], [290, 140], [318, 360]]), curve([[380, -20], [430, 180], [470, 360]]), stroke(C.road, 10)),
  group('Minor roads', curve([[-20, 60], [200, 70], [600, 52]]), curve([[-20, 300], [260, 286], [600, 300]]), curve([[120, -20], [110, 160], [140, 360]]), curve([[520, -20], [500, 170], [530, 360]]), stroke(C.road, 4)),
  group('River', curve([[-30, 238], [140, 214], [300, 236], [460, 206], [600, 222]]), stroke(C.water, 30)),
  group('Blocks', ...blocks, fill(C.block)),
  group('Ground', rect(W / 2, H / 2, W + 80, H + 80), fill(C.ground)),
], {
  a: v([W / 2, H / 2, 0]), p: v([W / 2, H / 2, 0]),
  s: anim([[0, [108, 108, 100]], [24, [100, 100, 100]]]),
  o: anim([[0, [0]], [10, [100]]]),
});

const PX = 296; const PY = 150; // where the pin points
const pin = layer(10, 'Pin', [
  group('Dot', ellipse(0, -24, 10, 10), fill(C.road)),
  // Head and tail in their own groups: in one group their opposite windings would cut a hole.
  group('Head', ellipse(0, -24, 30, 30), fill(C.brand)),
  group('Tail', poly([[-11, -17], [0, 0], [11, -17]]), fill(C.brand)),
], {
  p: anim([[16, [PX, 40, 0]], [28, [PX, PY, 0]], [32, [PX, PY - 10, 0]], [36, [PX, PY, 0]]]),
  o: anim([[16, [0]], [19, [100]]]),
});
const shadow = layer(20, 'Shadow', [group('Shadow', ellipse(0, 0, 24, 8), fill(C.ink, 18))], {
  p: v([PX, PY + 1, 0]), s: anim([[16, [0, 0, 100]], [28, [100, 100, 100]]]),
});
const ring = (ind, start) => layer(ind, `Pulse ${ind}`, [group('Ring', ellipse(0, 0, 18, 18), stroke(C.brand, 2))], {
  p: v([PX, PY, 0]),
  s: anim([[start, [100, 100, 100]], [start + 44, [520, 520, 100]]]),
  o: anim([[start - 1, [0]], [start, [70]], [start + 44, [0]]]),
});
// Address card (no real address: two blank lines), sliding up at the lower left.
const card = layer(5, 'Address card', [
  group('Lines', rect(60, -6, 96, 8, 4), rect(48, 10, 72, 6, 3), fill(C.bar)),
  group('Marker', ellipse(-2, 2, 10, 10), fill(C.brand)),
  group('Card', rect(46, 2, 132, 50, 10), fill(C.road)),
  group('Card shadow', rect(47, 5, 134, 52, 11), fill(C.ink, 8)),
], {
  p: anim([[30, [36, H - 26, 0]], [42, [36, H - 46, 0]]]),
  o: anim([[30, [0]], [38, [100]]]),
});

const lottie = {
  v: '5.7.4', fr: FR, ip: 0, op: OP, w: W, h: H, nm: 'Current location preview', ddd: 0, assets: [],
  // Markers: "intro" plays once, "loop" repeats (the pulse).
  markers: [{ tm: 0, cm: 'intro', dr: 36 }, { tm: 36, cm: 'loop', dr: 60 }],
  layers: [card, pin, ring(15, 36), shadow, map],
};
mkdirSync('src/widgets/previews', { recursive: true });
writeFileSync('src/widgets/previews/current-location.json', JSON.stringify(lottie));
console.log('wrote src/widgets/previews/current-location.json', JSON.stringify(lottie).length, 'bytes');
