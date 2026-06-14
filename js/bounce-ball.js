/* ════════════════════════════════════════════════════════════════
   FULBITO — Pelota Teamgeist 3D del hero

   En reposo: rebota al lado de FULBITO. Al scrollear: pega un tiro
   corto a un arquito chico que aparece al lado, la red se infla y todo
   se desvanece al dejar el hero (mini-gol no invasivo). Sin WebGL queda
   el icono 2D con su bounce CSS (fallback).

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

const CW = 190, CH = 150;    // canvas más ancho: deja lugar al arquito a la derecha
const FOV = 30, CAM_Z = 4.4;
const BALL_FRAC = 0.46;      // diámetro de la pelota ÷ alto del canvas (≈70px)
const BOUNCE = 0.95;
const PERIOD = 1.2;

export function initBounceBall(stage) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(CW, CH, false);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const canvas = renderer.domElement;
  canvas.style.width = CW + 'px';
  canvas.style.height = CH + 'px';
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 0.5s ease';
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

  // frustum visible y radio de la pelota
  const halfH = Math.tan(MathUtils.degToRad(FOV / 2)) * CAM_Z;
  const halfW = halfH * (CW / CH);
  const R = BALL_FRAC * halfH;
  // reposo: centrado en mobile; en desktop apenas a la izquierda para
  // dejar lugar al arquito a la derecha.
  const restX = window.matchMedia('(max-width: 860px)').matches ? 0 : -halfW * 0.12;
  const groundY = -halfH + R + 0.04;

  /* ── Arquito chico al rincón superior-derecho ── */
  const goal = new Group();
  const gw = halfW * 0.62, gh = gw * 0.76, gDepth = gh * 0.6;
  goal.position.set(halfW * 0.46, -halfH * 0.06, -0.4);  // a la derecha, misma altura
  goal.rotation.y = -0.34;              // 3/4 leve para ver adentro
  scene.add(goal);
  const frameMat = new MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4, transparent: true, opacity: 0 });
  const netMat = new LineBasicMaterial({ color: 0xeae6da, transparent: true, opacity: 0 });

  let net = null, netBase = null;
  const impact = new Vector3(gw / 2 - R * 1.2, gh - R * 1.2, 0);
  let lastBulge = -1;

  (function buildGoal() {
    const r = Math.max(0.018, gw * 0.018);
    const post = new CylinderGeometry(r, r, gh, 8);
    const ml = new Mesh(post, frameMat); ml.position.set(-gw / 2, gh / 2, 0);
    const mr = new Mesh(post, frameMat); mr.position.set(gw / 2, gh / 2, 0);
    const bar = new Mesh(new CylinderGeometry(r, r, gw, 8), frameMat);
    bar.rotation.z = Math.PI / 2; bar.position.set(0, gh, 0);
    const gl = new Mesh(new CylinderGeometry(r * 0.8, r * 0.8, gDepth, 6), frameMat);
    gl.rotation.x = Math.PI / 2; gl.position.set(-gw / 2, r, -gDepth / 2);
    const gr2 = new Mesh(new CylinderGeometry(r * 0.8, r * 0.8, gDepth, 6), frameMat);
    gr2.rotation.x = Math.PI / 2; gr2.position.set(gw / 2, r, -gDepth / 2);
    goal.add(ml, mr, bar, gl, gr2);

    // red trasera inclinada (grilla) + laterales, deformable
    const pts = [];
    const COLS = 9, ROWS = 6;
    const zAt = (y) => -gDepth * (1 - y / gh) ** 0.85;
    for (let i = 0; i <= COLS; i++) {
      const x = -gw / 2 + (gw * i) / COLS;
      for (let j = 0; j < ROWS; j++) {
        const y0 = (gh * j) / ROWS, y1 = (gh * (j + 1)) / ROWS;
        pts.push(x, y0, zAt(y0), x, y1, zAt(y1));
      }
    }
    for (let j = 0; j <= ROWS; j++) {
      const y = (gh * j) / ROWS, z = zAt(y);
      for (let i = 0; i < COLS; i++) pts.push(-gw / 2 + (gw * i) / COLS, y, z, -gw / 2 + (gw * (i + 1)) / COLS, y, z);
    }
    for (const sx of [-gw / 2, gw / 2]) {
      for (let j = 0; j <= ROWS; j++) { const y = (gh * j) / ROWS; pts.push(sx, y, 0, sx, y, zAt(y)); }
    }
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

  // bezier del tiro: del reposo al ángulo del arquito (mundo)
  const P0 = new Vector3(restX, groundY, 0);
  const P3 = impact.clone().applyAxisAngle(new Vector3(0, 1, 0), goal.rotation.y).add(goal.position);
  const P1 = new Vector3(restX + (P3.x - restX) * 0.4, groundY + halfH * 0.22, -0.05);  // arco corto
  const P2 = new Vector3(P3.x - halfW * 0.1, P3.y + halfH * 0.12, P3.z + 0.4);
  const tmp = new Vector3();
  function bezier(t, out) {
    const u = 1 - t;
    out.set(0, 0, 0).addScaledVector(P0, u * u * u).addScaledVector(P1, 3 * u * u * t)
      .addScaledVector(P2, 3 * u * t * t).addScaledVector(P3, t * t * t);
    return out;
  }

  let loaded = false, running = false, rafId = 0;
  const t0 = performance.now();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // el mini-gol es un detalle de desktop: en mobile la pelota está muy
  // arriba y al scrollear se mete bajo el header → solo rebota y se va.
  const mqMobile = window.matchMedia('(max-width: 860px)');
  let isMobile = mqMobile.matches;
  mqMobile.addEventListener('change', (e) => { isMobile = e.matches; });

  // progreso de scroll del hero (0 arriba → crece al bajar)
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
    model.traverse((o) => {
      if (o.isMesh && o.material) { o.material.envMapIntensity = 1.05; if (o.material.map) o.material.map.anisotropy = 4; }
    });
    ball.add(model);
    ball.rotation.set(0.3, -0.5, 0.05);
    pivot.scale.setScalar(R);
    pivot.position.set(restX, groundY, 0);
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

    // shotT: 0 = reposo (rebote) ; 1 = pelota clavada. Rápido: completa
    // ni bien arranca el scroll (antes de que la pelota deje el hero).
    const shotT = isMobile ? 0 : MathUtils.smoothstep(scrollP, 0.0, 0.08);
    const fade = 1 - MathUtils.smoothstep(scrollP, 0.13, 0.34);
    canvas.style.opacity = String(reduceMotion ? 1 : fade);

    // posición rebote
    const bp = (elapsed % PERIOD) / PERIOD;
    const hN = 1 - Math.pow(2 * bp - 1, 2);
    vBounce.set(restX, groundY + BOUNCE * R * hN, 0);

    if (shotT <= 0.001 || reduceMotion) {
      pivot.position.copy(vBounce);
      const contact = Math.max(0, 1 - hN * 4), s = 0.12 * contact;
      pivot.scale.set(R * (1 + s * 0.6), R * (1 - s), R * (1 + s * 0.6));
      ball.rotation.y = -0.5 + elapsed * 1.2;
      ball.rotation.z = 0.05 + elapsed * 0.5;
    } else {
      // vuelo: blend del rebote al bezier para no saltar
      bezier(shotT, tmp);
      const blend = MathUtils.smoothstep(shotT, 0, 0.14);
      pivot.position.copy(vBounce).lerp(tmp, blend);
      pivot.scale.setScalar(R);
      if (shotT < 0.97) { ball.rotation.y += 0.18 + shotT * 0.4; ball.rotation.z -= 0.08; }
    }

    // arquito aparece con el tiro; red se infla al clavar
    const goalOp = MathUtils.smoothstep(shotT, 0.0, 0.18);
    frameMat.opacity = goalOp;
    inflateNet(MathUtils.smoothstep(shotT, 0.82, 1.0));
    netMat.opacity = goalOp * (0.46 + lastBulge * 0.16);

    renderer.render(scene, camera);
  }

  function start() { if (running || reduceMotion) return; running = true; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) start(); else stop(); });
  });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
}
