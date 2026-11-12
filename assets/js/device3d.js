/* =====================================================================
   device3d.js — Water Guard cinematic intro (three.js r170)
   ---------------------------------------------------------------------
   Obsidian studio, warm bronze key light, cold silver rim, floating dust.
   Story (window.__heroP 0..1, smoothed in main.js):
     0.00–0.18  hero still: slow breathing orbit + entrance (time-based)
     0.22–0.58  anatomy: parts float apart with labels (gentle)
     0.62–1.00  infinite zoom: camera glides into the OLED screen;
                main.js dissolves the veil into the landing section.
   Everything is procedural (no model download) → fast first paint.
   ===================================================================== */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Water Guard palette (jade primary · gold accent) — shared with style.css tokens
const C = { bronze: 0x2EC4A0, bronzeL: 0xA6F0DA, violet: 0xF4C430, silver: 0xCAD5D2, mint: 0x8BE38F, ember: 0xFF6A55 };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (x, a, b) => clamp((x - a) / (b - a));
const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // cubic in-out: calm, never bouncy
const lerp = (a, b, t) => a + (b - a) * t;

export function initDevice(canvas, labelsEl, opts = {}) {
  if (!canvas || !window.WebGLRenderingContext) throw new Error('no webgl');
  const isMobile = matchMedia('(max-width: 900px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMappingExposure = 0;                       // fades up in the entrance
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060C0B, 0.035);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 120);

  /* ---------- lights: warm key, cold rim, low fill ---------- */
  const key = new THREE.SpotLight(0xF2FFF9, 150, 40, Math.PI / 6, 0.6, 1.4); key.position.set(6, 10, 8); scene.add(key); scene.add(key.target);
  const rim = new THREE.DirectionalLight(0xFFE3A6, 2.0); rim.position.set(-8, 4, -7); scene.add(rim);
  const fill = new THREE.HemisphereLight(0x1A3530, 0x030706, 0.45); scene.add(fill);
  const glow = new THREE.PointLight(C.bronze, 5, 10, 2); glow.position.set(0, -2.2, 2); scene.add(glow);
  const inner = new THREE.PointLight(0xF2FFF8, 4.5, 4.5, 1.6); inner.position.set(0, 1.0, 0.35); scene.add(inner);   // lights the electronics + wiring inside the case

  /* ---------- materials ---------- */
  const M = {
    shell: new THREE.MeshPhysicalMaterial({ color: 0x1A2321, roughness: 0.38, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.18 }),
    trim: new THREE.MeshStandardMaterial({ color: C.violet, metalness: 1, roughness: 0.32, emissive: C.violet, emissiveIntensity: 0.05 }),
    smoked: new THREE.MeshPhysicalMaterial({ color: 0xE8ECF0, roughness: 0.04, transmission: 0.97, thickness: 0.2, ior: 1.45, transparent: true }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 1, thickness: 0.3, ior: 1.5, transparent: true }),
    water: new THREE.MeshStandardMaterial({ color: 0xC6F5E6, emissive: C.bronze, emissiveIntensity: 0.12, roughness: 0.2, transparent: true, opacity: 0.16 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xA9B2C6, metalness: 1, roughness: 0.24 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xC2A05A, metalness: 1, roughness: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xC9CED6, metalness: 1, roughness: 0.22 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x0C1C17, roughness: 0.55, metalness: 0.2 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xD8B26A, metalness: 1, roughness: 0.3 }),
    black: new THREE.MeshStandardMaterial({ color: 0x08080A, roughness: 0.45 }),
    actuator: new THREE.MeshPhysicalMaterial({ color: 0x1B2422, roughness: 0.35, clearcoat: 0.8, metalness: 0.3 }),
  };

  /* ---------- device ---------- */
  const root = new THREE.Group(); scene.add(root);
  const box = new THREE.Group(); box.position.set(0, 0.95, 0); root.add(box);
  const W = 3.6, H = 3.1, D = 1.4, t = 0.12;
  const back = new THREE.Mesh(new RoundedBoxGeometry(W, H, t, 4, 0.06), M.shell); back.position.z = -D / 2; box.add(back);
  [[0, H / 2, W, t], [0, -H / 2, W, t]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, D, 4, 0.05), M.shell); m.position.set(x, y, 0); box.add(m); });
  [W / 2, -W / 2].forEach(x => { const m = new THREE.Mesh(new RoundedBoxGeometry(t, H, D, 4, 0.05), M.shell); m.position.set(x, 0, 0); box.add(m); });
  [[0, H / 2 + 0.005, W + 0.02, 0.025], [0, -H / 2 - 0.005, W + 0.02, 0.025]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), M.trim); m.position.set(x, y, D / 2); box.add(m); });
  [W / 2 + 0.005, -W / 2 - 0.005].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.025, H + 0.02, 0.03), M.trim); m.position.set(x, 0, D / 2); box.add(m); });
  [-0.8, 0.2, 1.0].forEach(x => { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 20), M.black); g.position.set(x, -H / 2 - 0.08, 0); box.add(g); });

  const lid = new THREE.Group(); box.add(lid);
  lid.add(new THREE.Mesh(new RoundedBoxGeometry(W + 0.06, H + 0.06, 0.08, 4, 0.08), M.smoked));
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy]) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 20), M.steel); s.rotation.x = Math.PI / 2; s.position.set(sx * (W / 2 - 0.22), sy * (H / 2 - 0.22), 0.05); lid.add(s); });

  const esp = new THREE.Group(); box.add(esp);
  esp.add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.05, 0.06), M.pcb));
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.58, 0.09), M.steel); shield.position.set(-0.2, 0.02, 0.07); esp.add(shield);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.05), M.black); chip.position.set(0.55, 0.12, 0.06); esp.add(chip);
  const dm = new THREE.Object3D();
  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 0.1), M.gold, 30); let k = 0;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 15; i++) { dm.position.set(-0.85 + i * 0.12, r ? -0.44 : 0.44, 0.07); dm.updateMatrix(); pins.setMatrixAt(k++, dm.matrix); }
  esp.add(pins);

  const oled = new THREE.Group(); box.add(oled);
  oled.add(new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 0.05), M.pcb));
  const oc = document.createElement('canvas'); oc.width = 1024; oc.height = 512; const octx = oc.getContext('2d');
  const otex = new THREE.CanvasTexture(oc); otex.colorSpace = THREE.SRGBColorSpace; otex.anisotropy = 4;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.57), new THREE.MeshBasicMaterial({ map: otex, toneMapped: false }));
  screen.position.z = 0.03; oled.add(screen);

  const ledPanel = new THREE.Group(); box.add(ledPanel);
  ledPanel.add(new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.85, 0.06, 3, 0.03), M.pcb));
  const ledMat = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.3 });
  const leds = [ledMat(C.mint), ledMat(C.silver), ledMat(C.ember)];
  leds.forEach((m, i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 16), m); l.position.set(0.12, 0.25 - i * 0.25, 0.06); ledPanel.add(l); });
  leds[2].emissiveIntensity = 0.08;

  const bat = new THREE.Group(); box.add(bat);
  const bb = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 24), M.steel); bb.rotation.z = Math.PI / 2; bat.add(bb);

  /* ---------- pipe line ---------- */
  const PY = -1.6; const pipe = new THREE.Group(); pipe.position.y = PY; root.add(pipe);
  const glassTube = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6.8, 40, 1, true), M.glass); glassTube.rotation.z = Math.PI / 2; pipe.add(glassTube);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 6.8, 32), M.water); core.rotation.z = Math.PI / 2; pipe.add(core);
  [-1, 1].forEach(s => { const L = s < 0 ? 1.15 : 8; const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, L, 40), M.copper); cp.rotation.z = Math.PI / 2; cp.position.x = s * (3.4 + L / 2); pipe.add(cp);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.42, 40), M.copper); ring.rotation.z = Math.PI / 2; ring.position.x = s * 3.4; pipe.add(ring); });
  const NP = isMobile ? 60 : 120;
  const parts = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xDDFBF1, transparent: true, opacity: 0.7 }), NP);
  const pData = [...Array(NP)].map(() => ({ x: Math.random() * 6.6 - 3.3, r: Math.random() * 0.17, a: Math.random() * 6.28, s: 0.015 + Math.random() * 0.03, v: 0.7 + Math.random() * 0.6 }));
  pipe.add(parts);

  /* ---------- a real place: plastered wall behind the line + concrete floor ---------- */
  const noiseTex = (base, n = 9000, rep = 4) => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < n; i++) { g.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${Math.random() * 0.045})` : `rgba(0,0,0,${Math.random() * 0.11})`; const r = Math.random() * 2.4; g.fillRect(Math.random() * 512, Math.random() * 512, r, r); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(34, 17), new THREE.MeshStandardMaterial({ map: noiseTex('#3A4441', 12000, 5), roughness: 0.92 }));
  backWall.position.set(-2, 2.4, -2.3); root.add(backWall);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, 18), new THREE.MeshStandardMaterial({ map: noiseTex('#232A28', 9000, 6), roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(-2, -4.22, 4.5); root.add(ground);
  // wall-mounted pipe brackets (the line is fixed to the wall like a real installation)
  [2.9, -3.0].forEach(x => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.3), M.steel); arm.position.set(x, PY - 0.34, -1.15); root.add(arm);
    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.045, 10, 36, Math.PI), M.steel); clamp.rotation.set(0, Math.PI / 2, Math.PI); clamp.position.set(x, PY, 0); root.add(clamp); });

  /* ---------- the water tank the main line comes from (ribbed polyethylene, like a real ground/roof tank) ---------- */
  const TANK_R = 1.9, TANK_H = 6.4, TANK_X = -4.45 - TANK_R, TANK_Y = -4.2 + TANK_H / 2, OUT_X = TANK_X + TANK_R;
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xD8D2C4, roughness: 0.6, metalness: 0 });
  const tank = new THREE.Group(); tank.position.set(TANK_X, TANK_Y, -0.2); root.add(tank);   // stands in front of the back wall
  tank.add(new THREE.Mesh(new THREE.CylinderGeometry(TANK_R, TANK_R * 1.02, TANK_H, 72), tankMat));
  for (let k = 0; k < 9; k++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(TANK_R + 0.03, 0.06, 10, 72), tankMat); rib.rotation.x = Math.PI / 2; rib.position.y = -TANK_H / 2 + 0.45 + k * 0.66; tank.add(rib); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(TANK_R, 72, 18, 0, Math.PI * 2, 0, Math.PI / 2), tankMat); dome.scale.y = 0.22; dome.position.y = TANK_H / 2; tank.add(dome);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.22, 48), new THREE.MeshStandardMaterial({ color: 0x2F6F8A, roughness: 0.45 })); cap.position.y = TANK_H / 2 + 0.48; tank.add(cap);
  // outlet: socket on the tank wall → nipple → brass union (the leak shows up under it)
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.3, 40), tankMat); sock.rotation.z = Math.PI / 2; sock.position.set(OUT_X + 0.05, PY, 0); root.add(sock);
  const union = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 6), M.brass); union.rotation.z = Math.PI / 2; union.position.set(OUT_X + 0.38, PY, 0); root.add(union);
  const wetMat = new THREE.MeshPhysicalMaterial({ color: 0x9FE3D3, transparent: true, opacity: 0, roughness: 0, clearcoat: 1, depthWrite: false });
  const film = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.435, 0.31, 6, 1, true, Math.PI * 0.75, Math.PI * 0.5), wetMat);   // wet film on the union's underside
  film.rotation.z = Math.PI / 2; film.position.copy(union.position); root.add(film);

  const sensor = new THREE.Group(); pipe.add(sensor);
  const sb = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 40), M.brass); sb.rotation.z = Math.PI / 2; sensor.add(sb);
  [-0.6, 0.6].forEach(x => { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.22, 6), M.brass); n.rotation.z = Math.PI / 2; n.position.x = x; sensor.add(n); });
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.32, 24), M.black); boss.position.y = 0.48; sensor.add(boss);

  const valve = new THREE.Group(); pipe.add(valve);
  const vb = new THREE.Mesh(new THREE.SphereGeometry(0.48, 40, 28), M.brass); vb.scale.set(1.25, 1, 1); valve.add(vb);
  [-0.62, 0.62].forEach(x => { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.22, 6), M.brass); n.rotation.z = Math.PI / 2; n.position.x = x; valve.add(n); });
  const act = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.62, 0.62, 4, 0.08), M.actuator); act.position.y = 0.78; valve.add(act);
  const lever = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.08, 0.15, 3, 0.04), M.trim); lever.position.y = 1.12; valve.add(lever);

  /* ---------- wiring: real pin map, Dupont jumpers, relay + glands — readable up close ----------
     Colours follow the usual convention and match the wiring diagram on the page:
     red = power · dark = GND · sky = SDA · amber = SCL · jade = signal                         */
  const WCOL = { vcc: 0xFF5A4A, gnd: 0x2B3836, sda: 0x5BC0FF, scl: 0xFFC94A, sig: 0x2EC4A0, led: 0xE4ECE9 };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wireMat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, metalness: 0.15, emissive: c, emissiveIntensity: 0.12 });
  const wires = [], inWires = [], pulses = [], groups = {}, hs = [];

  // external harness: pipe parts → cable glands under the case
  const GY = 0.95 - H / 2 - 0.15;
  const mkWire = (from, to, c, bend) => {
    const curve = new THREE.CatmullRomCurve3([from, V(lerp(from.x, to.x, .5) + bend, Math.min(from.y, to.y) - 0.06, 0.22), to], false, 'centripetal');
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.026, 8), wireMat(c)); root.add(m); wires.push(m);
  };
  [WCOL.sig, WCOL.vcc, WCOL.gnd].forEach((c, i) => mkWire(V(1.55 + (i - 1) * 0.06, PY + 0.62, 0), V(1.0 + (i - 1) * 0.05, GY, 0), c, 0.25));
  [WCOL.vcc, WCOL.gnd].forEach((c, i) => mkWire(V(-1.75 + (i - .5) * 0.08, PY + 1.05, 0), V(-0.8 + (i - .5) * 0.06, GY, 0), c, -0.3));

  // relay module that switches the valve (left of the ESP32)
  const relay = new THREE.Group(); box.add(relay);
  relay.add(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.84, 0.05), M.pcb));
  const rc = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.34, 0.3, 3, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x1F5C78, roughness: 0.35, clearcoat: 0.6 })); rc.position.set(0, 0.02, 0.18); relay.add(rc);
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.15, 0.17), new THREE.MeshStandardMaterial({ color: 0x1E8A6A, roughness: 0.5 })); tb.position.set(0, 0.32, 0.11); relay.add(tb);
  [-0.1, 0.1].forEach(x => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), M.steel); s.rotation.x = Math.PI / 2; s.position.set(x, 0.32, 0.205); relay.add(s); });
  const rLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), new THREE.MeshStandardMaterial({ color: C.ember, emissive: C.ember, emissiveIntensity: 1.2 })); rLed.position.set(0.2, -0.22, 0.05); relay.add(rLed);

  // header pins on OLED / LED panel / relay (tips face the lid, like the ESP32 header)
  const hdr = (parent, xs, y, len = 0.08) => { const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), M.gold, xs.length);
    xs.forEach((x, i) => { dm.position.set(x, y, 0.02 + len / 2); dm.rotation.set(Math.PI / 2, 0, 0); dm.updateMatrix(); im.setMatrixAt(i, dm.matrix); }); dm.rotation.set(0, 0, 0); parent.add(im); };
  hdr(oled, [-0.27, -0.15, -0.03, 0.09], 0.36);          // GND VCC SCL SDA
  hdr(ledPanel, [-0.12, 0, 0.12], 0.36);                  // G W R
  hdr(relay, [-0.12, 0, 0.12], -0.34);                    // VCC IN GND

  // a Dupont jumper: straight out of the header, soft arc, straight into the next header
  const jumper = (a, b, c, grp, via = [], dir = 1) => {
    const A = V(...a), B = V(...b); [A, B].forEach(p => { if (p.z > -0.26 && p.z < -0.15) hs.push(p.clone()); });
    const curve = new THREE.CatmullRomCurve3([A, A.clone().add(V(0, 0, 0.14)), ...via.map(p => V(...p)), B.clone().add(V(0, 0, 0.14)), B], false, 'centripetal');
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 72, 0.019, 8), wireMat(c)); box.add(m); inWires.push(m);
    (groups[grp] = groups[grp] || []).push(curve);
    const pm = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 10), new THREE.MeshBasicMaterial({ color: c === WCOL.gnd ? 0x9AA3C7 : c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    box.add(pm); pulses.push({ m: pm, curve, u: Math.random(), dir });
  };
  // ESP32 bottom header (box space): pin i → x, housing ends at z = -0.22
  const PX = i => -0.9 + i * 0.12, PYb = 0.18, HZ = -0.22;
  // 0 5V · 1 G26 · 2 GND → relay  |  3 G15 · 4 G2 · 5 G4 → LEDs  |  6 GND · 7 3V3 · 8 SCL · 9 SDA → OLED
  // 10 G27 · 11 5V · 12 GND → flow sensor  |  13 VIN · 14 GND → battery
  [[0, -1.48, WCOL.vcc], [1, -1.36, WCOL.sig], [2, -1.24, WCOL.gnd]].forEach(([i, x, c]) => jumper([PX(i), PYb, HZ], [x, 0.26, HZ], c, 'relay', [[lerp(PX(i), x, .5), 0.02, -0.02]]));
  [[3, -1.37, C.mint], [4, -1.25, WCOL.led], [5, -1.13, C.ember]].forEach(([i, x, c]) => jumper([PX(i), PYb, HZ], [x, -0.42, -0.2], c, 'led', [[lerp(PX(i), x, .45), -0.14, 0.0]]));
  [[6, -0.07, WCOL.gnd], [7, 0.05, WCOL.vcc], [8, 0.17, WCOL.scl], [9, 0.29, WCOL.sda]].forEach(([i, x, c]) => jumper([PX(i), PYb, HZ], [x, -0.42, -0.2], c, 'i2c', [[lerp(PX(i), x, .5), -0.12, -0.04]]));
  [[10, WCOL.sig], [11, WCOL.vcc], [12, WCOL.gnd]].forEach(([i, c], k) => jumper([PX(i), PYb, HZ], [1.0 + (k - 1) * 0.05, -1.36, 0.0], c, 'flow',
    [[0.95 + k * 0.04, -0.16, -0.02], [1.08 + (k - 1) * 0.05, -0.95, 0.02]], -1));
  jumper([PX(13), PYb, HZ], [1.67, -0.62, -0.42], WCOL.vcc, 'pwr', [[1.25, -0.2, -0.12], [1.72, -0.45, -0.3]], -1);
  jumper([PX(14), PYb, HZ], [0.93, -0.62, -0.42], WCOL.gnd, 'pwr', [[0.95, -0.25, -0.14]], -1);
  // relay screw terminal → valve gland, along the left wall
  [[-0.1, WCOL.vcc], [0.1, WCOL.gnd]].forEach(([x, c], k) => jumper([-1.36 + x, 0.92, -0.12], [-0.8 + (k - .5) * 0.06, -1.36, 0.0], c, 'valve',
    [[-1.6 + k * 0.05, 0.55, 0.05], [-1.58 + k * 0.05, -0.75, 0.08], [-1.1 + k * 0.05, -1.25, 0.05]]));
  // Dupont housings at every header end
  const hous = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.17), new THREE.MeshStandardMaterial({ color: 0x0B0E16, roughness: 0.55 }), hs.length);
  hs.forEach((p, i) => { dm.position.set(p.x, p.y, p.z - 0.085); dm.updateMatrix(); hous.setMatrixAt(i, dm.matrix); }); box.add(hous); inWires.push(hous);

  // silkscreen: printed pin names on each board, so close-ups read like the real thing
  const silk = (w, h, draw) => { const S = 640, c = document.createElement('canvas'); c.width = Math.round(w * S); c.height = Math.round(h * S);
    const g = c.getContext('2d'); g.fillStyle = '#E9EEF8'; g.strokeStyle = 'rgba(233,238,248,.55)'; g.textAlign = 'center'; g.textBaseline = 'middle'; draw(g, S);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, alphaTest: 0.35 })); };
  const BOT = ['5V', 'G26', 'GND', 'G15', 'G2', 'G4', 'GND', '3V3', 'SCL', 'SDA', 'G27', '5V', 'GND', 'VIN', 'GND'];
  const TOP = ['EN', 'VP', 'VN', '34', '35', '32', '33', '25', '14', '12', '13', 'D2', 'D3', 'CMD', '3V3'];
  const espSilk = silk(1.9, 1.05, (g, S) => {
    g.font = `600 ${0.042 * S}px Manrope, Arial`;
    for (let i = 0; i < 15; i++) { const x = (0.1 + i * 0.12) * S; g.fillText(BOT[i], x, 0.885 * S); g.fillText(TOP[i], x, 0.165 * S); }
    g.lineWidth = 0.004 * S; g.strokeRect(0.03 * S, 0.03 * S, 1.84 * S, 0.99 * S);
    g.font = `700 ${0.05 * S}px Manrope, Arial`; g.textAlign = 'left'; g.fillText('ESP32-DEVKIT V1', 1.25 * S, 0.72 * S);
    g.font = `500 ${0.034 * S}px "JetBrains Mono", monospace`; g.fillText('WATER GUARD · REV 2.1', 1.25 * S, 0.79 * S);
    g.strokeStyle = 'rgba(201,170,90,.45)'; g.lineWidth = 0.006 * S;                       // a few gold traces
    for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo((0.22 + k * 0.12) * S, 0.84 * S); g.lineTo((0.22 + k * 0.12) * S, 0.76 * S); g.lineTo((0.9 + k * 0.03) * S, 0.62 * S); g.stroke(); }
  });
  espSilk.position.z = 0.032; esp.add(espSilk);
  const oSilk = silk(1.35, 0.07, (g, S) => { g.font = `600 ${0.045 * S}px Manrope, Arial`; ['GND', 'VCC', 'SCL', 'SDA'].forEach((t, i) => g.fillText(t, (0.675 - 0.27 + i * 0.12) * S, 0.035 * S)); });
  oSilk.position.set(0, 0.318, 0.027); oled.add(oSilk);
  const lSilk = silk(0.62, 0.06, (g, S) => { g.font = `600 ${0.042 * S}px Manrope, Arial`; ['G', 'W', 'R'].forEach((t, i) => g.fillText(t, (0.31 - 0.12 + i * 0.12) * S, 0.03 * S)); });
  lSilk.position.set(0, 0.398, 0.032); ledPanel.add(lSilk);
  const rSilk = silk(0.56, 0.12, (g, S) => { g.font = `600 ${0.045 * S}px Manrope, Arial`; ['VCC', 'IN', 'GND'].forEach((t, i) => g.fillText(t, (0.28 - 0.12 + i * 0.12) * S, 0.06 * S)); });
  rSilk.position.set(0, -0.265, 0.027); relay.add(rSilk);

  /* ---------- atmosphere: floor glow + light cone + dust ---------- */
  const radial = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(46,196,160,.34)'], [0.45, 'rgba(244,196,48,.05)'], [1, 'rgba(244,196,48,0)']]), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -4.19; root.add(floor);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.2, 11, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xE6FFF6, transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  cone.position.set(0, 3.2, -0.4); scene.add(cone);
  const ND = isMobile ? 350 : 800; const dg = new THREE.BufferGeometry(); const dp = new Float32Array(ND * 3);
  for (let i = 0; i < ND; i++) { dp[i * 3] = (Math.random() - 0.5) * 22; dp[i * 3 + 1] = (Math.random() - 0.5) * 12; dp[i * 3 + 2] = (Math.random() - 0.5) * 26; }
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ size: 0.035, color: 0xF2D27A, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, map: radial([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]) }));
  scene.add(dust);

  /* ---------- labels ---------- */
  const LABELS = [
    { obj: lid, txt: 'صندوق حماية IP65', n: '01', off: [2.0, -0.2, 0] },
    { obj: esp, txt: 'معالج ESP32', n: '02', off: [0.2, 0.85, 0] },
    { obj: oled, txt: 'شاشة OLED', n: '03', off: [0.25, -0.6, 0] },
    { obj: sensor, txt: 'حساس التدفق YF-S201', n: '04', off: [0.45, -0.8, 0] },
    { obj: valve, txt: 'صمام القطع الذكي', n: '05', off: [-0.25, -0.85, 0] },
    { obj: relay, txt: 'مرحّل الصمام', n: '06', off: [-0.95, 0.1, 0] },
  ];
  LABELS.forEach(l => { const d = document.createElement('div'); d.className = 'lbl3d'; d.innerHTML = `<b>${l.n}</b>${l.txt}`; labelsEl && labelsEl.appendChild(d); l.el = d; });

  /* ---------- OLED: live readout → brand mark as the camera arrives ---------- */
  let oledKey = '';
  function drawOLED(flow, total, brand) {
    const key = (brand > 0.5 ? 'B' : flow.toFixed(1) + total.toFixed(0)) + Math.round(brand * 20);
    if (key === oledKey) return; oledKey = key;
    const g = octx; g.fillStyle = '#020605'; g.fillRect(0, 0, 1024, 512);
    g.globalAlpha = 1 - brand; g.fillStyle = '#A6F0DA'; g.font = '500 58px "JetBrains Mono", monospace'; g.textBaseline = 'top';
    g.fillText(`FLOW : ${flow.toFixed(1)} L/m`, 60, 70); g.fillText(`TOTAL: ${total.toFixed(1)} L`, 60, 190); g.fillText('STATUS: MONITOR', 60, 310);
    g.globalAlpha = 1; otex.needsUpdate = true;   // screen goes dark → the page's water drop takes over
  }

  /* ---------- end of the intro: a real water drop forms under the sensor joint, pinches off and falls ---------- */
  // see-through water without relying on transmission (works the same on every phone GPU): tinted, glossy, bright rims
  const dropMat = new THREE.MeshPhysicalMaterial({ color: 0x9FE3D3, roughness: 0, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.6, specularIntensity: 1, ior: 1.33, sheen: 0.4, sheenColor: 0xE8FFF8 });
  let dropLanded = false;
  const DROP_X = 0.95, DROP_TOP = PY - 0.42;                       // under the device: the sensor's hex nut
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), dropMat);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1, 1, 32, 1, true), dropMat);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), dropMat);
  // specular glints that ride on the drop (what makes water read as water on a dark stage)
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
  const glint = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), glintMat), glint2 = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), glintMat.clone());
  glint2.material.opacity = 0.35;
  const dropRim = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshBasicMaterial({ color: 0xCFFBF0, transparent: true, opacity: 0.22, side: THREE.BackSide, depthWrite: false }));
  const dropLight = new THREE.PointLight(0xE8FFF7, 0, 3.2, 2); dropLight.position.set(DROP_X + 0.5, DROP_TOP - 0.1, 0.9);
  [bulb, neck, bead, dropLight, glint, glint2, dropRim].forEach(m => { m.visible = false; root.add(m); });
  const FLOOR_Y = -4.2;
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 48), dropMat); puddle.rotation.x = -Math.PI / 2;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0xCFFBF0, transparent: true, opacity: 0, depthWrite: false })); ring.rotation.x = -Math.PI / 2;
  const specks = [...Array(5)].map((_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), dropMat); m.userData.a = i / 5 * Math.PI * 2 + 0.4; return m; });
  [puddle, ring, ...specks].forEach(m => { m.visible = false; root.add(m); });
  let dropFollowY = 0;
  function updateDrop(t) {
    const on = t >= 0; [bulb, neck, bead, dropLight, glint, glint2, dropRim, puddle, ring, ...specks].forEach(m => m.visible = on); if (!on) { dropFollowY = 0; return; }
    const grow = ease(clamp(t / 1.5)), pinch = P(t, 1.5, 1.85), fall = Math.max(0, t - 1.85), R = 0.04 + 0.095 * grow;
    dropLight.intensity = 2.4 * grow * (1 - P(fall, 0.5, 1.0));
    bead.position.set(DROP_X, DROP_TOP, 0); bead.scale.set(0.055, 0.03 + 0.02 * grow, 0.055);
    if (fall === 0) {                                              // hanging: swells, neck stretches, then thins
      const L = 0.015 + 0.08 * grow + 0.07 * pinch, nb = R * (0.6 - 0.48 * pinch);
      neck.visible = nb > 0.004; neck.scale.set(nb, L, nb); neck.position.set(DROP_X, DROP_TOP - L / 2, 0);
      bulb.scale.set(R * (1 - 0.06 * pinch), R * (1.12 + 0.14 * pinch), R * (1 - 0.06 * pinch));
      bulb.position.set(DROP_X + Math.sin(t * 6) * 0.003 * grow, DROP_TOP - L - R * 0.95, 0);
    } else {                                                       // free fall (gravity) with a slight stretch
      neck.visible = false; const v = 5 * fall, st = Math.min(0.32, v * 0.045);
      bulb.position.set(DROP_X, DROP_TOP - 0.165 - R * 0.95 - 0.5 * 5 * fall * fall, 0);
      bulb.scale.set(R * (1 - st * 0.3), R * (1.05 + st), R * (1 - st * 0.3));
      bead.scale.set(0.05, 0.028, 0.05);                            // a small bead stays on the joint
    }
    // splash: the drop hits the floor → puddle + ripple + a few specks
    const yHit = FLOOR_Y + bulb.scale.y * 0.9, hit = fall > 0 && bulb.position.y <= yHit;
    const tHit = Math.sqrt(2 * Math.max(0, DROP_TOP - 0.165 - R * 0.95 - yHit) / 5), sp = fall - tHit;
    if (hit) { bulb.visible = glint.visible = glint2.visible = dropRim.visible = false; }
    dropLanded = hit;                                              // read by the page: open the site the instant it lands
    puddle.visible = ring.visible = sp > 0; specks.forEach(m => m.visible = sp > 0 && sp < 0.6);
    if (sp > 0) {
      const k = ease(clamp(sp / 0.5)); puddle.position.set(DROP_X, FLOOR_Y + 0.004, 0); puddle.scale.setScalar(0.06 + 0.22 * k);
      ring.position.set(DROP_X, FLOOR_Y + 0.006, 0); ring.scale.setScalar(0.1 + 1.1 * clamp(sp / 0.9)); ring.material.opacity = 0.7 * (1 - clamp(sp / 0.9));
      specks.forEach(m => { const a = m.userData.a, r = 0.05 + sp * 0.7, h = Math.max(0, sp * 2.2 - sp * sp * 5.5); m.position.set(DROP_X + Math.cos(a) * r, FLOOR_Y + 0.02 + h, Math.sin(a) * r); m.scale.setScalar(0.022 * (1 - clamp(sp / 0.6))); });
    }
    dropFollowY = fall > 0 ? Math.max(FLOOR_Y + 0.35, hit ? FLOOR_Y + 0.35 : bulb.position.y) : DROP_TOP - 0.3;
    // glints + rim follow the bulb
    const b = bulb.position, sc = bulb.scale;
    glint.position.set(b.x - sc.x * 0.38, b.y + sc.y * 0.42, b.z + sc.z * 0.62); glint.scale.set(sc.x * 0.16, sc.y * 0.24, sc.z * 0.1);
    glint2.position.set(b.x + sc.x * 0.3, b.y - sc.y * 0.5, b.z + sc.z * 0.7); glint2.scale.set(sc.x * 0.28, sc.y * 0.12, sc.z * 0.08);
    dropRim.position.copy(b); dropRim.scale.set(sc.x * 1.06, sc.y * 1.06, sc.z * 1.06);
  }

  /* ---------- camera path ---------- */
  const KF = [
    { p: 0.00, pos: [8.2, 2.8, 16.2], tg: [0, -0.3, 0], off: 1, c: 1 },   // c = centred title shot (device + light mid-screen, title under it)
    { p: 0.20, pos: [5.6, 1.6, 12.6], tg: [0, -0.2, 0], off: 1 },
    { p: 0.42, pos: [2.0, 1.5, 15.5], tg: [0, -0.1, 0.9], off: 1 },
    { p: 0.62, pos: [3.2, 0.8, 10.5], tg: [0.1, -0.2, 0], off: 0.6 },
    { p: 0.80, pos: [0.55, 1.0, 2.9], tg: [0.05, 0.82, -0.35], off: 0 },    // inside: the wiring between ESP32 and OLED
    { p: 0.90, pos: [0.35, 0.92, 2.4], tg: [0.05, 0.8, -0.35], off: 0 },
    { p: 1.00, pos: [2.2, -0.8, 5.0], tg: [0.8, -1.8, 0], off: 0 },   // final shot: the device + sensor joint where the drop forms   // final shot: the sensor joint where the drop forms
  ];
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), tA = new THREE.Vector3(), tB = new THREE.Vector3(), look = new THREE.Vector3();
  let viewOff = 1, viewC = 1;
  function camAt(p) {
    let i = 0; while (i < KF.length - 2 && p > KF[i + 1].p) i++;
    const a = KF[i], b = KF[i + 1], k = ease(P(p, a.p, b.p));
    vA.fromArray(a.pos); vB.fromArray(b.pos); tA.fromArray(a.tg); tB.fromArray(b.tg);
    camera.position.lerpVectors(vA, vB, k); look.lerpVectors(tA, tB, k); viewOff = lerp(a.off, b.off, k); viewC = lerp(a.c || 0, b.c || 0, k);
  }

  /* ---------- sizing: device weighted left on desktop, up on mobile ---------- */
  let Wd = 1, Hd = 1, distScale = 1, desktop = true;
  function resize() {
    const r = canvas.getBoundingClientRect(); Wd = Math.max(1, r.width); Hd = Math.max(1, r.height);
    renderer.setSize(Wd, Hd, false); camera.aspect = Wd / Hd; desktop = Wd / Hd > 1.05;
    distScale = desktop ? 1 : (Wd / Hd < 0.7 ? 1.7 : 1.3);
  }
  function applyOffset() {
    // title shot (viewC=1): device centred, lifted a little so the title sits under it; chapters: device weighted aside
    if (desktop) camera.setViewOffset(Wd, Hd, Wd * 0.24 * viewOff * (1 - viewC), Hd * 0.07 * viewC, Wd, Hd);
    else camera.setViewOffset(Wd, Hd, 0, Hd * (0.18 * viewOff * (1 - viewC) + 0.05 * viewC), Wd, Hd);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);   // the explorer box can change height (wiring panel opens under it)

  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!isMobile) addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
  let visible = true; new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  /* ---------- loop ---------- */
  const clock = new THREE.Clock(); let total = 125.4; const tmp = new THREE.Vector3(); const offV = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const d = window.__drip, dripT = d && d.state ? (performance.now() - d.t0) / 1000 : -1;
    step(clock.elapsedTime, dt, clamp(window.__heroP || 0), { drip: dripT, leak: dripT >= 0 ? 1 : 0 });
    if (d && d.state === 1 && dropLanded) d.landed = true;
  }
  // step() is pure in (time, p, x) apart from particle integration → also used to render video frames
  function step(time, dt, p, x = {}) {
    const enter = x.enter ?? (reduced ? 1 : ease(P(time, 0.2, 3.6)));          // cinematic entrance on load
    renderer.toneMappingExposure = lerp(0, 1.05, enter);

    const explode = 0;                                              // intro stays a clean, real-world shot (explode lives in the explorer)
    lid.position.set(0, explode * 0.35, D / 2 + 0.05 + explode * 2.6);
    esp.position.set(-0.05, 0.62 + explode * 0.35, -0.5 + explode * 1.0);
    relay.position.set(-1.36 - explode * 0.3, 0.6 + explode * 0.3, -0.5 + explode * 1.2);
    oled.position.set(0.2, -0.78 - explode * 0.22, -0.42 + explode * 1.7);
    ledPanel.position.set(-1.25 - explode * 0.2, -0.78, -0.42 + explode * 1.5);
    bat.position.set(1.3 + explode * 0.5, -0.72, -0.42 + explode * 0.85);
    sensor.position.set(1.55 + explode * 0.35, -explode * 0.7, 0);
    valve.position.set(-1.75 - explode * 0.35, -explode * 0.7, 0);
    wires.forEach(w => { w.visible = explode < 0.35; });
    inWires.forEach(w => { w.visible = explode < 0.25; });
    lid.visible = true;
    wetMat.opacity = 0.35 * clamp(((x.drip ?? -1) + 0.3) / 1.2);

    const close = x.close || 0, leak = x.leak || 0;
    lever.rotation.y = close * Math.PI / 2;
    const flow = (2.4 + leak * 5.2 + Math.sin(time * 1.1) * 0.08) * (1 - close); total += (flow / 60) * dt * 6;
    for (let i = 0; i < NP; i++) { const d = pData[i]; d.x += dt * 1.4 * d.v * (1 - close) * (1 + leak * 1.5); if (d.x > 3.3) d.x -= 6.6;
      dm.position.set(d.x, Math.sin(d.a + time * 0.8) * d.r, Math.cos(d.a + time * 0.8) * d.r); dm.scale.setScalar(d.s); dm.updateMatrix(); parts.setMatrixAt(i, dm.matrix); }
    parts.instanceMatrix.needsUpdate = true;
    leds[0].emissiveIntensity = (1.4 + Math.sin(time * 1.6) * 0.3) * (1 - leak) + close * 2; leds[1].emissiveIntensity = 0.8 + Math.sin(time * 0.9) * 0.2;
    leds[2].emissiveIntensity = 0.08 + leak * (Math.sin(time * 9) > 0 ? 3.5 : 0.6);
    drawOLED(flow, total, 0);
    updateDrop(x.drip ?? -1);

    const zoom = ease(P(p, 0.62, 1));
    dust.position.z = (time * 0.15 + zoom * 14) % 26 - 6; dust.rotation.y = time * 0.01;
    dust.material.opacity = 0.5 * enter * (1 - P(p, 0.9, 1));
    cone.material.opacity = 0.035 * enter * (1 - zoom);

    const calm = 1 - zoom;
    root.rotation.y = (Math.sin(time * 0.22) * 0.07 + mouse.sx * 0.18) * calm * (1 - explode * 0.6);
    root.position.y = Math.sin(time * 0.6) * 0.04 * calm;

    mouse.sx = lerp(mouse.sx, mouse.x, 0.035); mouse.sy = lerp(mouse.sy, mouse.y, 0.035);
    camAt(p); viewOff *= (x.offMul ?? 1);
    offV.copy(camera.position).sub(look).multiplyScalar(distScale * lerp(1.9, 1, enter)).add(look); camera.position.copy(offV);
    camera.position.x += mouse.sx * 0.6 * calm; camera.position.y -= mouse.sy * 0.35 * calm;
    // once the drop falls, the camera tracks it down (and eases in a little)
    const dT = x.drip ?? -1;
    if (dT > 1.85) { const fy = Math.min(0, dropFollowY - (DROP_TOP - 0.3)) * 0.92, k = ease(P(dT, 1.85, 2.4));
      camera.position.y += fy * k; look.y += fy * k; camera.position.z -= Math.min(1.1, (dT - 1.85) * 0.7) * k; }
    camera.lookAt(look); applyOffset();
    renderer.render(scene, camera);

    const lk = x.labels === false ? 0 : ease(P(explode, 0.6, 0.95));
    LABELS.forEach(l => {
      l.obj.getWorldPosition(tmp); tmp.add(new THREE.Vector3(...l.off)); tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * Wd, y = (-tmp.y * 0.5 + 0.5) * Hd;
      l.el.style.opacity = lk; l.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    });
  }
  if (opts.interactive) return initExplorer();
  if (!opts.manual) frame();
  return { renderer, scene, resize, renderAt: (t, p, x) => step(t, 1 / 30, p, x) };

  /* =================== interactive explorer: drag / zoom / explode / hotspots =================== */
  async function initExplorer() {
    const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
    renderer.toneMappingExposure = 1.05; scene.fog.density = 0.02; cone.visible = false;
    camera.position.set(6.5, 2.6, 12.5); camera.clearViewOffset();
    const ctl = new OrbitControls(camera, canvas);
    ctl.target.set(0, -0.2, 0); ctl.enableDamping = true; ctl.dampingFactor = 0.06; ctl.enablePan = false;
    ctl.minDistance = 1.6; ctl.maxDistance = 22; ctl.rotateSpeed = 0.6; ctl.zoomSpeed = 0.7;
    ctl.enableZoom = false;                                   // wheel zoom only after the visitor engages (no scroll trap)
    canvas.addEventListener('pointerdown', () => { ctl.enableZoom = true; });
    canvas.addEventListener('pointerleave', () => { ctl.enableZoom = matchMedia('(pointer: coarse)').matches; });
    if (matchMedia('(pointer: coarse)').matches) ctl.enableZoom = true;
    const st = { explode: 0, target: 0, fly: null, wire: 0, w: 0 };
    M.shell.transparent = true; M.shell.needsUpdate = true;             // lets the case turn to glass in wiring mode
    const api = {
      zoom(f) { const d = camera.position.clone().sub(ctl.target); const len = clamp(d.length() * f, ctl.minDistance, ctl.maxDistance); st.fly = { pos: ctl.target.clone().add(d.setLength(len)), tg: ctl.target.clone(), k: 0 }; },
      toggleExplode() { st.target = st.target ? 0 : 1; return !!st.target; },
      wiring(on) { st.wire = on ? 1 : 0; if (on) { st.target = 0; const far = Wd / Hd < 1 ? 1.7 : 1;
        st.fly = { pos: new THREE.Vector3(0.7 * far, 1.2, 5.4 * far), tg: new THREE.Vector3(-0.15, 0.85, -0.45), k: 0 }; } return !!st.wire; },
      reset() { st.target = 0; st.wire = 0; st.fly = { pos: new THREE.Vector3(6.5, 2.6, 12.5), tg: new THREE.Vector3(0, -0.2, 0), k: 0 }; },
      focus(i) { const l = LABELS[i]; l.obj.getWorldPosition(tmp); const dir = camera.position.clone().sub(tmp).setLength(i === 0 ? 7 : 3.4); st.fly = { pos: tmp.clone().add(dir), tg: tmp.clone(), k: 0 }; },
      labels: LABELS.map(l => l.el),
    };
    LABELS.forEach((l, i) => { l.el.style.pointerEvents = 'auto'; l.el.style.cursor = 'pointer'; l.el.addEventListener('click', () => { api.focus(i); opts.onSelect && opts.onSelect(i); }); });
    let vis = true; new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(canvas);
    const ck = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop); if (!vis) return;
      const dt = Math.min(ck.getDelta(), 0.05), time = ck.elapsedTime;
      st.explode += (st.target - st.explode) * (1 - Math.exp(-dt * 3)); const e = ease(clamp(st.explode));
      lid.position.set(0, e * 0.35, D / 2 + 0.05 + e * 2.6); esp.position.set(-0.05, 0.62 + e * 0.35, -0.5 + e * 1.0); relay.position.set(-1.36 - e * 0.3, 0.6 + e * 0.3, -0.5 + e * 1.2);
      oled.position.set(0.2, -0.78 - e * 0.22, -0.42 + e * 1.7); ledPanel.position.set(-1.25 - e * 0.2, -0.78, -0.42 + e * 1.5);
      bat.position.set(1.3 + e * 0.5, -0.72, -0.42 + e * 0.85); sensor.position.set(1.55 + e * 0.35, -e * 0.7, 0); valve.position.set(-1.75 - e * 0.35, -e * 0.7, 0);
      wires.forEach(w => { w.visible = e < 0.35; }); inWires.forEach(w => { w.visible = e < 0.25; });
      for (let i = 0; i < NP; i++) { const d = pData[i]; d.x += dt * 1.4 * d.v; if (d.x > 3.3) d.x -= 6.6;
        dm.position.set(d.x, Math.sin(d.a + time * 0.8) * d.r, Math.cos(d.a + time * 0.8) * d.r); dm.scale.setScalar(d.s); dm.updateMatrix(); parts.setMatrixAt(i, dm.matrix); }
      // wiring mode: case turns to glass, lid lifts away, every jumper glows and carries a travelling pulse
      st.w += (st.wire - st.w) * (1 - Math.exp(-dt * 3.2)); const w = ease(clamp(st.w));
      lid.position.y += w * 4.2; lid.position.z += w * 0.5; lid.visible = w < 0.6;     // lid slides up and out of frame
      M.shell.opacity = 1 - 0.76 * w; M.shell.depthWrite = w < 0.5;
      inWires.forEach(m => { if (m.material.emissive) m.material.emissiveIntensity = 0.12 + w * 0.65; });
      pulses.forEach(q => { q.u = (q.u + dt * 0.45) % 1; q.curve.getPointAt(q.dir > 0 ? q.u : 1 - q.u, q.m.position);
        q.m.material.opacity = w * (0.3 + 0.7 * Math.sin(q.u * Math.PI)); q.m.visible = w > 0.02 && e < 0.4; });
      parts.instanceMatrix.needsUpdate = true; total += (2.4 / 60) * dt * 6; drawOLED(2.4 + Math.sin(time) * 0.08, total, 0);
      leds[0].emissiveIntensity = 1.4 + Math.sin(time * 1.6) * 0.3;
      dust.position.z = (time * 0.15) % 26 - 6;
      if (st.fly) { st.fly.k = Math.min(1, st.fly.k + dt * 1.1); const k = ease(st.fly.k); camera.position.lerp(st.fly.pos, k * 0.18); ctl.target.lerp(st.fly.tg, k * 0.18); if (st.fly.k >= 1 && camera.position.distanceTo(st.fly.pos) < 0.02) st.fly = null; }
      ctl.update(); camera.aspect = Wd / Hd; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      LABELS.forEach(l => { l.obj.getWorldPosition(tmp); tmp.add(new THREE.Vector3(...l.off).multiplyScalar(0.6)); tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * Wd, y = (-tmp.y * 0.5 + 0.5) * Hd; l.el.style.opacity = tmp.z < 1 ? 1 - 0.55 * w : 0; l.el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
    })();
    return api;
  }
}
