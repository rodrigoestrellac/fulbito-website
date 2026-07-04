// Fulbito website — Pelota Teamgeist 3D de la mascota del hero (jueguitos en loop).
//
// Portado TAL CUAL del onboarding de la app (fulbito/src/js/onboarding-ball.js):
// la pelota rebota en parábola sobre el pie y, en cada contacto, dispara la patada
// de la pierna vía el callback onFrame(hN, contact).
// Modelo: «Adidas Teamgeist Ball (Germany 2006)» de Armellino Raffaele (Sketchfab),
// CC-BY-4.0. Texturas editadas.
//
// three.js se sirve vendoreado (importmap "three" en index.html, sin esm.sh).
// Se carga vía dynamic import DESPUÉS del LCP para no pesar en el critical path.
import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

const FOV = 30, CAM_Z = 4.2, PERIOD = 1.25;
const GLB = 'assets/ball/teamgeist.glb';

// El modelo se carga una sola vez por sesión y se clona en cada mount.
let _modelPromise = null;
function loadModel() {
  if (!_modelPromise) {
    _modelPromise = (async () => {
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync(GLB);
      return gltf.scene;
    })();
  }
  return _modelPromise;
}

/**
 * Monta la pelota 3D dentro de `holder` (el contenedor sobre el pie de la mascota).
 * @param {HTMLElement} holder
 * @param {{ onFrame?: (hN:number, contact:number) => void }} [opts]
 * @returns {Promise<{kick:Function, celebrate:Function, resize:Function, dispose:Function}>}
 */
export async function mountOnboardingBall(holder, opts = {}) {
  const onFrame = opts.onFrame;
  const source = await loadModel();

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const cv = renderer.domElement;
  Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', opacity: '0', transition: 'opacity .55s ease' });
  holder.appendChild(cv);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 30);
  camera.position.z = CAM_Z;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff0d8, 2.4); key.position.set(2, 3, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe0a0, 1.1); rim.position.set(-2, -1, -2); scene.add(rim);

  const pivot = new THREE.Group(), ball = new THREE.Group();
  pivot.add(ball); scene.add(pivot);

  const model = source.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const c = box.getCenter(new THREE.Vector3());
  const rad = box.getSize(new THREE.Vector3()).length() / (2 * Math.sqrt(3));
  model.position.sub(c);
  model.scale.setScalar(1 / rad);
  model.traverse((o) => { if (o.isMesh && o.material) { o.material.envMapIntensity = 1.1; if (o.material.map) o.material.map.anisotropy = 4; } });
  ball.add(model);
  ball.rotation.set(0.32, -0.5, 0.06);
  // Eje de giro inclinado hacia el pie (abajo-izquierda): backspin natural de la patada.
  const SPIN_AXIS = new THREE.Vector3(1, -0.22, 0).normalize();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let halfH = 1, yLow = -1, yHigh = 1, scl = 0.3;
  function resize() {
    const w = holder.clientWidth || 110, h = holder.clientHeight || 240;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
    const diaPx = w * 0.82, pxPerWorld = h / (2 * halfH);
    scl = (diaPx / pxPerWorld) / 2;
    yLow = -halfH + scl * 1.02; yHigh = halfH - scl * 1.04;
  }
  resize();
  const ro = new ResizeObserver(resize); ro.observe(holder);

  let speed = 1, boost = 0, rafId = 0, disposed = false, paused = false, pauseStart = 0;
  let t0 = performance.now();
  function renderOnce(now) {
    if (disposed) return;
    const t = (now - t0) / 1000;
    if (boost > 0) boost = Math.max(0, boost - 0.016);
    const sp = speed * (1 + boost * 1.0), per = PERIOD / sp;
    let hN, contact;
    if (reduce) { hN = 0.5; contact = 0; }
    else { const bp = (t % per) / per; hN = 1 - Math.pow(2 * bp - 1, 2); contact = Math.max(0, 1 - hN * 5); }
    if (onFrame) onFrame(hN, contact);
    const range = (yHigh - yLow) * (1 + boost * 0.3);
    pivot.position.set(reduce ? 0 : Math.sin(t * 1.7) * scl * 0.08, yLow + range * hN, 0);
    const s = 0.14 * contact;
    pivot.scale.set(scl * (1 + s * 0.55), scl * (1 - s), scl * (1 + s * 0.55));
    // Backspin hacia el jugador, con el eje levemente inclinado hacia el pie.
    if (!reduce) ball.rotateOnWorldAxis(SPIN_AXIS, -0.072 * sp);
    renderer.render(scene, camera);
  }
  function loop(now) { if (disposed || paused) return; renderOnce(now); rafId = requestAnimationFrame(loop); }
  rafId = requestAnimationFrame(loop);

  // En tabs ocultos el navegador pausa rAF; renderizamos por intervalo de respaldo.
  const onVis = () => { if (!document.hidden && !disposed && !paused) { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', onVis);
  const bgTimer = setInterval(() => { if (document.hidden && !disposed && !paused) renderOnce(performance.now()); }, 120);
  setTimeout(() => { if (!disposed) cv.style.opacity = '1'; }, 60);

  return {
    kick() { boost = Math.min(1, boost + 0.55); },
    celebrate() { boost = 1; },
    pause() { if (paused || disposed) return; paused = true; pauseStart = performance.now(); cancelAnimationFrame(rafId); },
    resume() { if (!paused || disposed) return; paused = false; t0 += performance.now() - pauseStart; rafId = requestAnimationFrame(loop); },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(rafId);
      clearInterval(bgTimer);
      document.removeEventListener('visibilitychange', onVis);
      try { ro.disconnect(); } catch (e) { /* noop */ }
      try { renderer.dispose(); } catch (e) { /* noop */ }
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    },
  };
}
