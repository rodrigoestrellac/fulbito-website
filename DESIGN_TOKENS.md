# DESIGN_TOKENS.md — Extracción del Design System de Fulbito App

> **Fuente:** `fulbito/src/css/variables.css`, `base.css`, `components.css`, `screens.css`, `DESIGN.md`  
> **Fecha de extracción:** 2026-04-17  
> **Propósito:** Input canónico para el diseño del sitio web. Todo lo que se defina en el sitio debe heredar de estos tokens salvo justificación explícita.

---

## 1. Paleta de colores

### Primarios
| Token | Hex | Uso en la app |
|---|---|---|
| `--color-cesped` | `#2D5016` | Verde césped oscuro. Headers, fondo principal |
| `--color-cesped-light` | `#4A7A2E` | Verde claro. Hover, acentos secundarios |
| `--color-noche` | `#0D1B0F` | Negro verdoso. Fondo oscuro, texto principal |
| `--color-oro` | `#C9A94E` | Dorado. CTA, acento principal, elementos destacados |
| `--color-oro-light` | `#E8D48B` | Dorado claro. Hover del dorado, detalles |

### Neutros
| Token | Hex | Uso en la app |
|---|---|---|
| `--color-cal` | `#F0EDE4` | Blanco cálido (cal de cancha). Texto sobre fondo oscuro |
| `--color-tierra` | `#8B7355` | Marrón tierra. Texto secundario, bordes sutiles |
| `--color-sombra` | `rgba(0,0,0,0.4)` | Sombras generales |

### Feedback
| Token | Hex | Uso |
|---|---|---|
| `--color-roja` | `#c0392b` | Error, tarjeta roja |
| `--color-success` | `#27ae60` | Éxito, confirmación |

### Posiciones (badges)
| Token | Hex | Posición |
|---|---|---|
| `--color-pos-arc` | `#FFD700` | Arquero |
| `--color-pos-def` | `#4A90D9` | Defensor |
| `--color-pos-med` | `#4CAF50` | Mediocampista |
| `--color-pos-del` | `#FF5252` | Delantero |

### Fondo principal de la app
```css
background: linear-gradient(180deg, var(--color-noche) 0%, var(--color-cesped) 100%);
```

---

## 2. Glassmorphism

| Token | Valor | Uso |
|---|---|---|
| `--glass-bg` | `rgba(13, 27, 15, 0.6)` | Fondo de cards glass |
| `--glass-border` | `rgba(201, 169, 78, 0.15)` | Borde sutil dorado en glass |
| `--glass-blur` | `blur(16px)` | Backdrop filter |

### Patrón típico de card glass:
```css
.card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg); /* 12px */
  box-shadow: var(--shadow-card);
  padding: var(--space-md) 20px;
}
```

---

## 3. Tipografía

### Familias
| Token | Valor | Carga | Uso |
|---|---|---|---|
| `--font-display` | `'Oswald', sans-serif` | Google Fonts, wght 400-700 | Títulos, apodos, nombres de equipo, headers. Siempre uppercase + letter-spacing: 0.05em |
| `--font-body` | `'DM Sans', sans-serif` | Google Fonts, wght 400-700 | Body, botones, labels, UI general |

### URL de carga
```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Escala tipográfica
| Token | Valor | px equiv. | Uso típico |
|---|---|---|---|
| `--text-xs` | `0.75rem` | 12px | Labels menores, tags |
| `--text-sm` | `0.875rem` | 14px | Texto secundario, descripciones |
| `--text-base` | `1rem` | 16px | Body text |
| `--text-lg` | `1.25rem` | 20px | Subtítulos |
| `--text-xl` | `1.5rem` | 24px | Títulos de sección |
| `--text-2xl` | `2rem` | 32px | Nombre de equipo, headers grandes |
| `--text-3xl` | `2.5rem` | 40px | Splash, hero |

### Estilos de heading
```css
h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
}
h1 { font-size: var(--text-3xl); }  /* 40px */
h2 { font-size: var(--text-2xl); }  /* 32px */
h3 { font-size: var(--text-xl); }   /* 24px */
```

---

## 4. Spacing

| Token | Valor |
|---|---|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |

---

## 5. Border radius

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `4px` | Tags, elementos pequeños |
| `--radius-md` | `8px` | Botones, inputs |
| `--radius-lg` | `12px` | Cards (el radius canónico de figurita) |
| `--radius-full` | `50%` | Avatares, dots |

---

## 6. Sombras

| Token | Valor | Uso |
|---|---|---|
| `--shadow-card` | `0 8px 32px rgba(0,0,0,0.3)` | Cards en reposo |
| `--shadow-elevated` | `0 16px 48px rgba(0,0,0,0.4)` | Cards hover, elementos arrastrados |

---

## 7. Transiciones

| Token | Valor | Uso |
|---|---|---|
| `--transition-fast` | `150ms ease` | Hover, border-color, scale |
| `--transition-normal` | `250ms ease` | Pantallas, fades |
| `--transition-slow` | `400ms ease` | Revelación, animaciones lentas |

---

## 8. Z-index

| Token | Valor |
|---|---|
| `--z-base` | `1` |
| `--z-dropdown` | `100` |
| `--z-modal` | `200` |
| `--z-toast` | `300` |

---

## 9. Componentes clave (patrones a replicar en el sitio)

### Botón primario (CTA dorado)
```css
.btn-primary {
  background: var(--color-oro);
  color: var(--color-noche);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: none;
  border-radius: var(--radius-md);
  padding: 14px 28px;
  min-height: 44px;
}
/* Hover: lighten + glow */
.btn-primary:hover {
  background: var(--color-oro-light);
  box-shadow: 0 0 24px rgba(201, 169, 78, 0.3);
}
/* Active: press */
.btn-primary:active { transform: scale(0.97); }
```

### Botón secundario (outline)
```css
.btn-secondary {
  background: transparent;
  color: var(--color-oro);
  border: 1px solid var(--color-oro);
  /* Mismo sizing que primario */
}
.btn-secondary:hover {
  background: rgba(201, 169, 78, 0.1);
  color: var(--color-oro-light);
}
```

### Glass card
```
background: var(--glass-bg) + backdrop-filter: var(--glass-blur)
border: 1px solid var(--glass-border)
border-radius: var(--radius-lg)
box-shadow: var(--shadow-card)
hover: border-color → var(--color-oro), transform: scale(1.02)
```

### Badge de posición
```css
.badge-pos {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}
/* Dot de color antes del texto */
.badge-pos::before {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-pos-[posición]);
}
```

---

## 10. Fondos y texturas

### Gradiente base
```css
html {
  background: linear-gradient(180deg, var(--color-noche) 0%, var(--color-cesped) 100%);
}
```

### Textura de césped
```css
body::before {
  background: url('/assets/textures/grass-texture.png') repeat;
  background-size: 300px;
  opacity: 0.035;
  /* position: fixed, inset: 0, pointer-events: none */
}
```
**Asset:** `grass-texture.png` (~1.2MB) → necesita optimización o reemplazo CSS para el sitio.

### Césped stripes (CSS, sin imagen)
La app usa `repeating-linear-gradient` para las franjas de césped en la cancha del share screen. Patrón liviano, puede replicarse.

### Líneas decorativas de cancha
```css
/* Semicírculo central decorativo */
body::after {
  width: 280px; height: 280px;
  border: 2px solid var(--color-cal);
  border-radius: 50%;
  opacity: 0.04;
}
```

---

## 11. Animaciones existentes

### fadeSlideUp (revelación de cards)
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### ballBounce (pelota en splash)
```css
@keyframes ballBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-12px) rotate(5deg); }
}
```

### Revelación staggered de equipos
```css
.card-team .reveal-card {
  opacity: 0;
  animation: fadeSlideUp 400ms ease-out forwards;
  animation-delay: calc(var(--reveal-i, 0) * 150ms);
}
```

### Brillo tipo figurita Panini
```css
.screen-onboarding__crack-item::after {
  background: linear-gradient(90deg, transparent, rgba(201, 169, 78, 0.08), transparent);
  /* Slide left→right on hover */
}
```

---

## 12. Assets disponibles para copiar al sitio

### Vectoriales
| Asset | Ruta en la app | Tamaño | Uso en el sitio |
|---|---|---|---|
| Teamgeist ball SVG | `assets/teamgeist.svg` | 2.6KB | Logo/ícono animado, hero |
| Teamgeist ball PNG | `assets/teamgeist.png` | 26KB | Fallback, favicon |
| Ball classic SVG | `assets/ball.svg` | 0.9KB | Ícono alternativo |
| Teamgeist noun SVG | `assets/noun-teamgeist-1677302.svg` | 4.6KB | Pattern decorativo |

### Ilustraciones
| Asset | Ruta | Tamaño | Uso potencial |
|---|---|---|---|
| Login hero (WhatsApp → cancha) | `assets/login-hero1.png` | 4.2MB | **Hero del sitio — necesita optimización/webp** |
| Potrero Teamgeist 2006 | `assets/badges/potrero_fulbito2.webp` | 961KB | Hero alternativo |
| Potrero pequeño | `assets/badges/potrero_fulbito3.webp` | 307KB | Background o feature card |
| Potrero 4 | `assets/badges/potrero_fulbito4.webp` | 318KB | Decorativo |

### Stickers / Badges (compartibles, con humor)
| Asset | Ruta | Descripción |
|---|---|---|
| `a-jugar.png` | `assets/badges/` | Call to action visual |
| `charla-tecnica.png` | `assets/badges/` | Charla técnica |
| `jogo-bonito.png` | `assets/badges/` | Estilo brasileño |
| `messi_mode.png` | `assets/badges/` | Racha ganadora extrema |
| `mufa.png` | `assets/badges/` | Racha perdedora |
| `win_streak_3.png` | `assets/badges/` | Racha ganadora |
| `padre_hijo.png` | `assets/badges/` | Relación padre-hijo |
| `compadre.png` | `assets/badges/` | Dupla letal |
| `archirrival.png` | `assets/badges/` | Rivalidad |
| `superclasico.png` | `assets/badges/` | Clásico |
| `descenso.png` | `assets/badges/` | Descenso por racha |
| `el_regreso.png` | `assets/badges/` | Vuelta post-ausencia |

### Iconos PWA
| Asset | Ruta | Uso |
|---|---|---|
| `fulbito-icon.png` | `assets/icons/` | Ícono de la app (512x512 aprox) |
| `icon-512.png` | `assets/icons/` | PWA icon |

### Cancha SVG
| Asset | Ruta | Tamaño | Nota |
|---|---|---|---|
| `cancha-fulbito-light.svg` | `assets/` | 26KB | Cancha completa SVG |
| `cancha-fulbito-light - copia.svg` | `assets/` | 3.6KB | Versión simplificada |

---

## 13. PWA & meta tags de referencia

```html
<meta name="theme-color" content="#2D5016">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### Open Graph de la app (para referenciar)
```html
<meta property="og:title" content="Fulbito — Armá los equipos del fútbol en 30 segundos" />
<meta property="og:description" content="Pegá la lista del grupo de WhatsApp, hacé el sorteo y compartí los equipos. El arma secreta del capitán del fulbito semanal." />
<meta property="og:locale" content="es_AR" />
```

---

## 14. Tono de voz (microcopy)

La app habla en **rioplatense informal**, como un amigo del grupo:
- "Armá tu perfil" (no "Complete su registro")
- "¿Qué tan crack sos?" (no "Autoevaluación de habilidades")
- "Pegá la lista del grupo" (no "Importe participantes")
- "¡Equipos listos!" (no "Generación de equipos completada")
- "Tirá de nuevo" (no "Re-generar")
- "Mandar al grupo" (no "Compartir resultado")

### Frases de badges (referencia de tono humor):
- "Le dijo a {{loser}}: 'Pedí que te cambien de equipo'"
- "Activó modo Messi 🐐"
- "Cuidado, trae la mufa encima"
- "Volvió del Mundial 🇦🇷"
- "River-Boca les queda chico a estos dos"

---

## 15. Deploy pattern de referencia

La app Fulbito usa Docker Compose con:
- **Nginx** sirviendo estáticos (puerto 80 interno)
- **Container name:** `fulbito-web`
- **Network:** `proxy-network` (external, compartida con Caddy central)
- **Caddy central** en `/opt/caddy-proxy/Caddyfile` maneja SSL y ruteo

El sitio web debería seguir el mismo patrón: nginx en Docker Compose, conectado a `proxy-network`, con el Caddy central ruteando.
