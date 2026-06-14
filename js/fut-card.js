/* ════════════════════════════════════════════════════════════════
   FULBITO — La Card del Crack en 3D (objeto físico)

   Carta como objeto real: cuerpo dorado biselado con grosor (los
   cantos atrapan la luz), cara con la data del jugador (CanvasTexture),
   y un foil holográfico que cambia de color con el ángulo de vista
   (shader fresnel + banda diagonal). Tilt al puntero / giroscopio.
   Si no hay WebGL, queda la card CSS de fallback.
   ════════════════════════════════════════════════════════════════ */

import {
  WebGLRenderer, PerspectiveCamera, Scene, Group, Mesh,
  Shape, ExtrudeGeometry, ShapeGeometry,
  MeshStandardMaterial, ShaderMaterial, CanvasTexture,
  DirectionalLight, PMREMGenerator, Vector3, MathUtils,
  AdditiveBlending, SRGBColorSpace, DoubleSide,
} from 'three';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

// dimensiones de la carta en unidades de mundo (relación ~ 0.72)
const H = 3.2, W = H * 0.72, T = 0.13, R = 0.20;
const FOV = 26, CAM_Z = 8.2;

const PLAYER = {
  name: 'RODRI', pos: 'MED', photo: 'assets/stickers/nahitan-nandez.webp',
  stats: [
    ['28', 'PJ'], ['64%', 'EFECTIVIDAD'], ['17', 'GOLES'],
    ['12', 'ASISTENCIAS'], ['4', 'MVPS'], ['3', 'CAUDILLOS'],
  ],
};

const GOLD = 0xC9A94E;

export function initFutCard(stage, wrap) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = 4; // ACESFilmic
  renderer.toneMappingExposure = 1.1;
  const canvas = renderer.domElement;
  canvas.style.opacity = '0';
  canvas.style.transition = 'opacity 0.6s ease';
  stage.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 30);
  camera.position.z = CAM_Z;

  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();
  const key = new DirectionalLight(0xfff2da, 2.6); key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new DirectionalLight(0xbfe0ff, 1.2); rim.position.set(-4, 1, 2); scene.add(rim);

  const card = new Group();
  scene.add(card);

  /* ── forma redondeada reutilizable ── */
  function roundedRect(w, h, r) {
    const s = new Shape();
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  /* ── cuerpo: dorado metálico, biselado, con grosor ── */
  const bodyGeo = new ExtrudeGeometry(roundedRect(W, H, R), {
    depth: T, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05,
    bevelSegments: 3, curveSegments: 24,
  });
  bodyGeo.center();
  const bodyMat = new MeshStandardMaterial({
    color: GOLD, metalness: 1.0, roughness: 0.28, envMapIntensity: 1.4,
  });
  card.add(new Mesh(bodyGeo, bodyMat));

  /* ── cara: plano con la data (CanvasTexture), inset para que el marco
        dorado quede de borde ── */
  const FW = W * 0.9, FH = H * 0.93;
  const faceGeo = new ShapeGeometry(roundedRect(FW, FH, R * 0.7), 24);
  normalizeUV(faceGeo, FW, FH);
  const faceTex = new CanvasTexture(makeFaceCanvas());
  faceTex.colorSpace = SRGBColorSpace;
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const faceMat = new MeshStandardMaterial({
    map: faceTex, metalness: 0.0, roughness: 0.55, envMapIntensity: 0.5,
  });
  const faceMesh = new Mesh(faceGeo, faceMat);
  faceMesh.position.z = T / 2 + 0.052;
  card.add(faceMesh);

  /* ── foil holográfico: encima de la cara, aditivo, dependiente del
        ángulo (fresnel + banda diagonal) ── */
  const foilGeo = new ShapeGeometry(roundedRect(FW, FH, R * 0.7), 24);
  const foilMat = new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      uniform float uTime;
      vec3 hue(float h){ return clamp(abs(mod(h*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); }
      void main() {
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
        float band = sin((vUv.x + vUv.y) * 7.0 - uTime * 1.1) * 0.5 + 0.5;
        float h = fract(fres * 1.1 + band * 0.38 + uTime * 0.03);
        vec3 col = hue(h);
        float a = fres * 0.55 + band * 0.08;
        gl_FragColor = vec4(col, a);
      }`,
  });
  const foilMesh = new Mesh(foilGeo, foilMat);
  foilMesh.position.z = T / 2 + 0.06;
  card.add(foilMesh);

  /* ── interacción: tilt al puntero / giroscopio + float idle ── */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  if (window.matchMedia('(pointer: fine)').matches) {
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.active = true;
    });
    wrap.addEventListener('pointerleave', () => { pointer.active = false; });
  }

  let running = false, rafId = 0;
  const t0 = performance.now();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function layout() {
    const r = (wrap.querySelector('.fut-card') || wrap).getBoundingClientRect();
    const w = Math.max(180, r.width), h = Math.max(260, r.height);
    renderer.setSize(w, h, false);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  layout();
  new ResizeObserver(layout).observe(wrap);

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    foilMat.uniforms.uTime.value = t;

    // idle: leve vaivén; con puntero: sigue al puntero
    const idleX = Math.sin(t * 0.6) * 0.12;
    const idleY = Math.cos(t * 0.45) * 0.06;
    pointer.x = MathUtils.lerp(pointer.x, pointer.active ? pointer.tx : 0, 0.08);
    pointer.y = MathUtils.lerp(pointer.y, pointer.active ? pointer.ty : 0, 0.08);
    const tiltY = pointer.active ? pointer.x * 0.5 : idleX;
    const tiltX = pointer.active ? -pointer.y * 0.4 : idleY;
    card.rotation.y = MathUtils.lerp(card.rotation.y, tiltY, 0.12);
    card.rotation.x = MathUtils.lerp(card.rotation.x, tiltX, 0.12);
    card.position.y = Math.sin(t * 0.8) * 0.06;

    renderer.render(scene, camera);
  }
  function start() { if (running) return; running = true; cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  // arranca cuando la card entra en viewport
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) start(); else stop(); });
  });
  io.observe(wrap);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

  canvas.style.opacity = '1';
  wrap.classList.add('has-3d');
  if (reduce) { layout(); renderer.render(scene, camera); } // estático

  /* ── helpers ── */
  function normalizeUV(geo, w, h) {
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
    }
    uv.needsUpdate = true;
  }

  // cara de la carta dibujada en un canvas 2D (alta resolución)
  function makeFaceCanvas() {
    const TWp = 600, THp = Math.round(TWp * (FH / FW));
    const cv = document.createElement('canvas');
    cv.width = TWp; cv.height = THp;
    const c = cv.getContext('2d');
    drawFace(c, TWp, THp, null);
    // foto async: cuando carga, redibuja y refresca la textura
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { drawFace(c, TWp, THp, img); faceTex.needsUpdate = true; };
    img.src = PLAYER.photo;
    return cv;
  }

  function drawFace(c, w, h, img) {
    c.clearRect(0, 0, w, h);
    // fondo verde
    const g = c.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, '#123316'); g.addColorStop(0.5, '#1d4d22'); g.addColorStop(1, '#0a1e0c');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // brillo diagonal
    const sh = c.createLinearGradient(0, 0, w, h * 0.7);
    sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)');
    c.fillStyle = sh; c.fillRect(0, 0, w, h);

    const gold = '#C9A94E', cal = '#F0EDE4';
    const pad = w * 0.07;

    // pos badge
    c.font = `700 ${w * 0.052}px Oswald, sans-serif`;
    c.textBaseline = 'middle';
    roundRect(c, pad, h * 0.045, w * 0.18, h * 0.05, 6);
    c.fillStyle = 'rgba(201,169,78,0.18)'; c.fill();
    c.strokeStyle = 'rgba(201,169,78,0.6)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = gold; c.textAlign = 'center';
    c.fillText(PLAYER.pos, pad + w * 0.09, h * 0.072);

    // brand
    c.font = `700 ${w * 0.04}px Oswald, sans-serif`;
    c.textAlign = 'right'; c.fillStyle = 'rgba(201,169,78,0.7)';
    c.fillText('FULBITO', w - pad, h * 0.07);

    // foto circular
    const cx = w / 2, cy = h * 0.31, rad = w * 0.21;
    c.save();
    c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.closePath(); c.clip();
    c.fillStyle = '#1a3a1c'; c.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    if (img) {
      // contain dentro del círculo + zoom, anclado arriba (como la card CSS)
      const box = rad * 2, ar = img.width / img.height;
      let dw, dh;
      if (ar >= 1) { dw = box; dh = box / ar; } else { dh = box; dw = box * ar; }
      const z = 1.45; dw *= z; dh *= z;
      c.drawImage(img, cx - dw / 2, cy - rad, dw, dh);
    }
    c.restore();
    c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2);
    c.strokeStyle = gold; c.lineWidth = w * 0.012; c.stroke();

    // nombre
    c.font = `700 ${w * 0.085}px Oswald, sans-serif`;
    c.textAlign = 'center'; c.fillStyle = cal;
    c.fillText(PLAYER.name, cx, h * 0.50);

    // divisor
    c.strokeStyle = 'rgba(201,169,78,0.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(w * 0.18, h * 0.55); c.lineTo(w * 0.82, h * 0.55); c.stroke();

    // stats (2 filas × 3)
    const cols = 3, x0 = w * 0.16, dx = (w * 0.68) / (cols - 1);
    const rows = [h * 0.63, h * 0.78];
    PLAYER.stats.forEach((s, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = x0 + dx * col, y = rows[row];
      c.textAlign = 'center';
      c.font = `700 ${w * 0.062}px Oswald, sans-serif`; c.fillStyle = cal;
      c.fillText(s[0], x, y);
      c.font = `600 ${w * 0.026}px 'DM Sans', sans-serif`; c.fillStyle = gold;
      c.fillText(s[1], x, y + h * 0.045);
    });
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r); c.closePath();
  }
}
