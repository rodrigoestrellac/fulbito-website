/* ════════════════════════════════════════════════════════════════
   FULBITO — Pelota Teamgeist 3D que rebota (hero, reemplaza al icono)

   Modelo: «Adidas Teamgeist Ball (Germany 2006 Match Ball)» de
   Armellino Raffaele (Sketchfab), CC-BY-4.0. Texturas editadas.
   Render chico (≈72px) con rebote parabólico + rotación. Si no hay
   WebGL, queda el icono 2D con su bounce CSS (fallback).
   ════════════════════════════════════════════════════════════════ */

import {
  WebGLRenderer, PerspectiveCamera, Scene, Group,
  DirectionalLight, PMREMGenerator, Box3, Vector3,
  ACESFilmicToneMapping, MathUtils,
} from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

const CW = 90, CH = 118;     // tamaño lógico del canvas (px) — deja lugar al rebote
const FOV = 30, CAM_Z = 4.4;
const BALL_FRAC = 0.60;      // diámetro de la pelota ÷ alto del canvas (≈72px)
const BOUNCE = 1.35;         // amplitud del rebote (en radios)
const PERIOD = 1.15;         // segundos por rebote

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

  // radio en mundo para que el diámetro ≈ BALL_FRAC del alto visible
  const halfH = Math.tan(MathUtils.degToRad(FOV / 2)) * CAM_Z;
  const R = BALL_FRAC * halfH;
  const groundY = -halfH + R + 0.05;  // piso del rebote, cerca del fondo del canvas

  let loaded = false, running = false, reduceMotion = false;
  const clock = { last: 0, t: 0 };

  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      if (o.isMesh && o.material) {
        o.material.envMapIntensity = 1.05;
        if (o.material.map) o.material.map.anisotropy = 4;
      }
    });
    ball.add(model);
    ball.rotation.set(0.3, -0.5, 0.05);
    pivot.scale.setScalar(R);
    pivot.position.y = reduceMotion ? groundY + BOUNCE * R * 0.5 : groundY;
    loaded = true;
    canvas.style.opacity = '1';
    stage.classList.add('is-3d');
    if (reduceMotion) renderer.render(scene, camera); // estático
    start();
  });

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min((now - clock.last) / 1000 || 0.016, 0.05);
    clock.last = now;
    clock.t += dt;
    if (!loaded || reduceMotion) { renderer.render(scene, camera); return; }

    // rebote parabólico (toca el piso una vez por período → reversa seca)
    const bp = (clock.t % PERIOD) / PERIOD;
    const hN = 1 - Math.pow(2 * bp - 1, 2);
    pivot.position.y = groundY + BOUNCE * R * hN;

    // squash sutil al tocar el piso
    const contact = Math.max(0, 1 - hN * 4);
    const s = 0.12 * contact;
    pivot.scale.set(R * (1 + s * 0.6), R * (1 - s), R * (1 + s * 0.6));

    // gira mientras rebota
    ball.rotation.y += dt * 1.2;
    ball.rotation.z += dt * 0.5;

    renderer.render(scene, camera);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    clock.last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  // pausa el RAF cuando el hero no está a la vista / pestaña oculta
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) start(); else stop(); });
  });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });
}
