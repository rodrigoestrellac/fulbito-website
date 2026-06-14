/* ════════════════════════════════════════════════════════════════
   FULBITO — Pelota Teamgeist 3D del hero

   En reposo: rebota al lado de FULBITO. Al scrollear (desktop): pega un
   tiro en diagonal hacia abajo-derecha a un arquito en el espacio libre
   del hero, achicándose por perspectiva (queda proporcional al arco); la
   red se infla y todo se desvanece. El tiro baja a la par del scroll, así
   se queda a la vista. En mobile la pelota solo rebota y se desvanece.
   Sin WebGL queda el icono 2D (fallback CSS).

   Modelo: «Adidas Teamgeist Ball (Germany 2006)» de Armellino Raffaele
   (Sketchfab), CC-BY-4.0. Texturas editadas.
   ════════════════════════════════════════════════════════════════ */

import {
  WebGLRenderer, PerspectiveCamera, Scene, Group, Mesh,
  DirectionalLight, PMREMGenerator, Box3, Vector3,
  CylinderGeometry, MeshStandardMaterial, BufferGeometry,
  LineSegments, LineBasicMaterial, Float32BufferAttribute,
  ACESFilmicToneMapping, MathUtils,
} from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

const FOV = 30, CAM_Z = 4.4;
const PERIOD = 1.2;

export function initBounceBall(stage) {
  const isMobile = window.matchMedia('(max-width: 860px)').matches;
  // rebote contenido: en desktop la pelota queda dentro del alto de FULBITO,
  // en mobile bajo y suave para no llegar al texto de arriba.
  const BOUNCE = isMobile ? 0.5 : 0.55;

  // canvas: chico/centrado en mobile (solo rebote); grande y ALTO en desktop
  // para que el tiro baje hasta el arquito en el espacio libre del hero.
  const CW = isMobile ? 110 : 340;
  const CH = isMobile ? 150 : 420;
  // offset del canvas respecto del anchor de 72px (px)
  const offLeft = isMobile ? (72 - CW) / 2 : -8;
  // mobile: la pelota va DEBAJO de FULBITO, así que centramos el canvas
  // sobre el anchor (lejos del header). desktop: extendido hacia arriba.
  const offTop = isMobile ? (72 - CH) / 2 : -30;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(CW, CH, false);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const canvas = renderer.domElement;
  Object.assign(canvas.style, {
    position: 'absolute', left: offLeft + 'px', top: offTop + 'px',
    width: CW + 'px', height: CH + 'px', opacity: '0',
    transition: 'opacity 0.5s ease', pointerEvents: 'none',
  });
  stage.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, CW / CH, 0.1, 30);
  camera.position.z = CAM_Z;

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xfff0d8, 2.2); key.position.set(2, 3, 3); scene.add(key);
  const rim = new DirectionalLight(0xbfd8a8, 1.0); rim.position.set(-2, -1, -2); scene.add(rim);

  const pivot = new Group();
  const ball = new Group();
  pivot.add(ball);
  scene.add(pivot);

  // frustum visible y conversores fracción→mundo (en z=0)
  const halfH = Math.tan(MathUtils.degToRad(FOV / 2)) * CAM_Z;
  const halfW = halfH * (CW / CH);
  const wx = (fx) => (fx * 2 - 1) * halfW;
  const wy = (fy) => (1 - fy * 2) * halfH;

  // diámetro de la pelota en reposo (~70px) ÷ alto del canvas
  const R = (70 / CH) * halfH;

  // posición de reposo (fracción del canvas)
  const restX = isMobile ? wx(0.5) : wx(0.135);
  const restY = isMobile ? wy(0.70) : wy(0.19);

  /* ── Arquito (solo desktop) al espacio libre abajo-derecha ── */
  const goal = new Group();
  const gw = halfW * 0.5, gh = gw * 0.78, gDepth = gh * 0.6;
  const goalPos = new Vector3(wx(0.49), wy(0.93), -1.7);  // espacio libre del hero (a la altura de los CTA), empujado al fondo
  goal.position.copy(goalPos);
  goal.rotation.y = -0.34;
  scene.add(goal);
  const frameMat = new MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4, transparent: true, opacity: 0 });
  const netMat = new LineBasicMaterial({ color: 0xeae6da, transparent: true, opacity: 0 });

  let net = null, netBase = null, lastBulge = -1;
  const impact = new Vector3(gw / 2 - R * 0.6, gh - R * 0.6, 0);

  (function buildGoal() {
    const r = Math.max(0.02, gw * 0.02);
    const post = new CylinderGeometry(r, r, gh, 8);
    const ml = new Mesh(post, frameMat); ml.position.set(-gw / 2, gh / 2, 0);
    const mr = new Mesh(post, frameMat); mr.position.set(gw / 2, gh / 2, 0);
    const bar = new Mesh(new CylinderGeometry(r, r, gw, 8), frameMat);
    bar.rotation.z = Math.PI / 2; bar.position.set(0, gh, 0);
    const back = new CylinderGeometry(r * 0.8, r * 0.8, gDepth, 6);
    const gl = new Mesh(back, frameMat); gl.rotation.x = Math.PI / 2; gl.position.set(-gw / 2, r, -gDepth / 2);
    const gr2 = new Mesh(back, frameMat); gr2.rotation.x = Math.PI / 2; gr2.position.set(gw / 2, r, -gDepth / 2);
    goal.add(ml, mr, bar, gl, gr2);

    const pts = [], COLS = 9, ROWS = 6;
    const zAt = (y) => -gDepth * (1 - y / gh) ** 0.85;
    for (let i = 0; i <= COLS; i++) {
      const x = -gw / 2 + (gw * i) / COLS;
      for (let j = 0; j < ROWS; j++) { const y0 = (gh * j) / ROWS, y1 = (gh * (j + 1)) / ROWS; pts.push(x, y0, zAt(y0), x, y1, zAt(y1)); }
    }
    for (let j = 0; j <= ROWS; j++) { const y = (gh * j) / ROWS, z = zAt(y); for (let i = 0; i < COLS; i++) pts.push(-gw / 2 + (gw * i) / COLS, y, z, -gw / 2 + (gw * (i + 1)) / COLS, y, z); }
    for (const sx of [-gw / 2, gw / 2]) for (let j = 0; j <= ROWS; j++) { const y = (gh * j) / ROWS; pts.push(sx, y, 0, sx, y, zAt(y)); }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    net = new LineSegments(g, netMat);
    goal.add(net);
    netBase = Float32Array.from(g.getAttribute('position').array);
  })();

  function inflateNet(b) {
    if (!net || Math.abs(b - lastBulge) < 0.01) return;
    lastBulge = b;
    const arr = net.geometry.getAttribute('position').array;
    const sigma2 = 2 * (gh * 0.3) ** 2, amp = gh * 0.7 * b;
    for (let i = 0; i < arr.length; i += 3) {
      const dx = netBase[i] - impact.x, dy = netBase[i + 1] - impact.y;
      const df = MathUtils.clamp(-netBase[i + 2] / gDepth, 0, 1);
      const gg = Math.exp(-(dx * dx + dy * dy) / sigma2) * df;
      arr[i] = netBase[i] - dx * gg * b * 0.18;
      arr[i + 1] = netBase[i + 1] - dy * gg * b * 0.14;
      arr[i + 2] = netBase[i + 2] - amp * gg;
    }
    net.geometry.getAttribute('position').needsUpdate = true;
  }

  // bezier del tiro: reposo → ángulo del arco (mundo)
  const P0 = new Vector3(restX, restY, 0);
  const P3 = impact.clone().applyAxisAngle(new Vector3(0, 1, 0), goal.rotation.y).add(goalPos);
  const P1 = new Vector3(restX + (P3.x - restX) * 0.35, restY + halfH * 0.25, -0.4);
  const P2 = new Vector3(P3.x - halfW * 0.15, P3.y + halfH * 0.18, P3.z + 0.6);
  const tmp = new Vector3();
  function bezier(t, out) {
    const u = 1 - t;
    out.set(0, 0, 0).addScaledVector(P0, u * u * u).addScaledVector(P1, 3 * u * u * t)
      .addScaledVector(P2, 3 * u * t * t).addScaledVector(P3, t * t * t);
    return out;
  }
  // escala extra del balón en vuelo (además de la perspectiva por z):
  // bien chico al clavarse, proporcional al arco
  const END_SCALE = 0.4;

  let loaded = false, running = false, rafId = 0;
  const t0 = performance.now();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scrollP = 0, ticking = false;
  const hero = document.getElementById('hero');
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const h = (hero && hero.offsetHeight) || window.innerHeight;
      scrollP = MathUtils.clamp(window.scrollY / h, 0, 1);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load('assets/ball/teamgeist.glb', (gltf) => {
    const model = gltf.scene;
    const box = new Box3().setFromObject(model);
    const c = box.getCenter(new Vector3());
    const rad = box.getSize(new Vector3()).length() / (2 * Math.sqrt(3));
    model.position.sub(c);
    model.scale.setScalar(1 / rad);
    model.traverse((o) => { if (o.isMesh && o.material) { o.material.envMapIntensity = 1.05; if (o.material.map) o.material.map.anisotropy = 4; } });
    ball.add(model);
    ball.rotation.set(0.3, -0.5, 0.05);
    pivot.scale.setScalar(R);
    pivot.position.set(restX, restY, 0);
    loaded = true;
    canvas.style.opacity = '1';
    stage.classList.add('is-3d');
    if (reduceMotion) renderer.render(scene, camera);
    start();
  });

  const vBounce = new Vector3();
  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (!loaded) { renderer.render(scene, camera); return; }
    const elapsed = (now - t0) / 1000;

    const shotT = (isMobile || reduceMotion) ? 0 : MathUtils.smoothstep(scrollP, 0.0, 0.16);
    const fade = 1 - MathUtils.smoothstep(scrollP, isMobile ? 0.16 : 0.22, isMobile ? 0.36 : 0.45);
    canvas.style.opacity = String(reduceMotion ? 1 : fade);

    const bp = (elapsed % PERIOD) / PERIOD;
    const hN = 1 - Math.pow(2 * bp - 1, 2);
    vBounce.set(restX, restY + BOUNCE * R * hN, 0);

    if (shotT <= 0.001) {
      pivot.position.copy(vBounce);
      const contact = Math.max(0, 1 - hN * 4), s = 0.12 * contact;
      pivot.scale.set(R * (1 + s * 0.6), R * (1 - s), R * (1 + s * 0.6));
      ball.rotation.y = -0.5 + elapsed * 1.2;
      ball.rotation.z = 0.05 + elapsed * 0.5;
    } else {
      bezier(shotT, tmp);
      const blend = MathUtils.smoothstep(shotT, 0, 0.14);
      pivot.position.copy(vBounce).lerp(tmp, blend);
      // achica el balón al viajar (perspectiva + escala) → proporcional al arco
      pivot.scale.setScalar(R * MathUtils.lerp(1, END_SCALE, shotT));
      if (shotT < 0.97) { ball.rotation.y += 0.16 + shotT * 0.4; ball.rotation.z -= 0.07; }
    }

    const goalOp = MathUtils.smoothstep(shotT, 0.0, 0.2);
    frameMat.opacity = goalOp;
    inflateNet(MathUtils.smoothstep(shotT, 0.82, 1.0));
    netMat.opacity = goalOp * (0.5 + lastBulge * 0.18);

    renderer.render(scene, camera);
  }

  function start() { if (running || reduceMotion) return; running = true; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  const io = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) start(); else stop(); }); });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
}
