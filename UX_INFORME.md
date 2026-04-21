# Informe UX/UI — Fulbito Landing Page
> Análisis de conversión y experiencia de usuario  
> Fecha: 2026-04-21  
> Sitio auditado: https://web.fulbito.futbol/

---

## TL;DR ejecutivo

El sitio tiene una base sólida: buen design system, paleta con identidad, copy rioplatense auténtico y estructura lógica de secciones. Pero hay un problema central que mata la conversión: **el usuario no ve la app en ningún momento**. Llega, lee texto sobre un algoritmo mágico, y tiene que irse ciego a probarla. Para una app de nicho con cero brand awareness, eso es demasiado que pedir.

El resto son problemas reales pero secundarios. Si resolvés los primeros dos puntos de la sección crítica, la landing pasa de "funcional" a "convierte".

**Nota general del sitio actual: 6/10.** El potencial está ahí; falta ejecución visual.

---

## Lo que está bien (no tocar)

- **Estructura de secciones**: el orden Hero → Cómo funciona → Features → Emocional → FAQ → CTA es correcto. No está roto, solo incompleto.
- **Copy**: "el arma secreta del que organiza el fulbito semanal" es perfecto. Tono barrial auténtico, no corporativo. El FAQ en rioplatense funciona muy bien.
- **Design system**: los tokens CSS están bien extraídos de la app. La paleta noche/césped/oro/cal tiene identidad propia.
- **Performance base**: webp en hero, lazy loading en imágenes secundarias, scroll reveal con IntersectionObserver (no jQuery), prefers-reduced-motion respetado.
- **Accesibilidad técnica**: skip link, aria-labels, focus-visible, semantic HTML. Está bien hecho.
- **El "30 segundos"** en el copy es el único número concreto y hace mucho trabajo de conversión. Mantenerlo en todo lugar posible.

---

## Hallazgos críticos (P0 — showstoppers de conversión)

### C1. No hay ningún mockup de la app — el usuario se va ciego

**El problema más grave del sitio.**

El usuario llega, lee "el algoritmo arma equipos justos", y tiene que irse a `fulbito.futbol` SIN HABER VISTO NI UNA SOLA PANTALLA de cómo se ve eso. No sabe si la app es un formulario de texto, si tiene una UI linda o es una calculadora de Excel glorificada.

En conversión, esto se llama "promesa sin prueba". Para una app con cero brand awareness, la promesa sin evidencia visual genera fricción enorme.

**Lo que hay que hacer:**
- Agregar al menos 2-3 mockups de teléfono mostrando pantallas clave de la app:
  1. La pantalla de convocatoria (donde pegás la lista de WhatsApp)
  2. El resultado del armado de equipos (los dos equipos balanceados)
  3. La Card del Crack / pantalla de votaciones (la más visual y "wow")
- Los mockups pueden ser capturas reales en un iPhone frame CSS (sin Photoshop), o screenshots directos. No tienen que ser perfectos, tienen que ser reales.
- **Dónde ponerlos**: en la sección "Cómo funciona" (un mockup por paso), y opcionalmente uno grande en el Hero.

**Impacto estimado en conversión: muy alto.** Un usuario que ve la app antes de probarla convierte 2-4x más que uno que no la ve.

---

### C2. El hero no tiene proof visual — es puro texto

El hero actual tiene: logo + texto grande + subheadline + dos botones + ilustración del potrero. La ilustración del potrero es bonita pero es **decorativa**, no muestra la app.

**El problema**: cuando el usuario llega, en 5 segundos sabe el nombre de la app y que "arma equipos". Pero no sabe si es una app seria, si tiene buena UI, si vale la pena registrarse.

**Lo que hay que hacer (dos opciones, elegir una):**

Opción A (más rápida): agregar un mockup de teléfono al lado derecho del hero, mostrando la pantalla del resultado de equipos. El mockup puede convivir con la ilustración del potrero o reemplazarla.

Opción B (sin mockups): agregar un "social proof badge" al hero, debajo del subheadline y antes de los CTAs: algo como `⚽ +500 partidos organizados` o `⚽ Usado por grupos de Buenos Aires, Mendoza, Córdoba y más`. Aunque los números sean modestos, generan confianza inmediata.

---

## Hallazgos importantes (P1 — mejoras significativas)

### I1. La sección "La Previa" necesita reenfocarse o eliminarse

En su estado actual la sección tiene: una ilustración del potrero + dos líneas de copy. El problema es que está desconectada del flujo narrativo de la app — el usuario que llegó hasta ahí ya entendió qué hace Fulbito, y esta sección no le suma información ni evidencia.

**Opciones:**
- **Eliminarla**: el flujo Features → FAQ → CTA es más limpio y directo. La ilustración del potrero puede moverse al hero como elemento decorativo.
- **Reemplazarla con social proof real**: convertirla en una sección de testimonios o stats de uso. "X partidos organizados. Y ciudades. El fulbito de los jueves, digitalizado." Con ese enfoque la sección tiene razón de ser.
- **Mantenerla solo si hay contenido genuino**: si en algún momento hay quotes reales, video, o capturas de momentos reales de grupos usando la app, acá encajan perfecto.

---

### I2. La sección Tutoriales corta el momentum de conversión

La sección de guías rápidas (cómo instalar en iOS/Android, cómo crear un grupo, cómo funciona el armado) está ubicada entre Features y FAQ. Tiene contenido útil pero **está en el lugar equivocado**.

**El problema**: el usuario que llega a la landing está en modo "¿lo necesito?", no en modo "¿cómo lo instalo?". Una sección de instrucciones técnicas corta el ritmo narrativo justo cuando el usuario está acumulando interés. Es información para después de la conversión, no antes.

**Opciones:**
- Moverla al final, después del FAQ y antes del CTA final (para el usuario que ya decidió y quiere saber cómo empezar).
- O directamente eliminarla de la landing y reservarla para un onboarding in-app o una página de ayuda separada.

---

### I3. Feature cards con emojis en lugar de stickers de la app

Las feature cards usan emojis grandes (🧬📲⚖️✏️🏆👑📊🤖⭐) como íconos. Los emojis son genéricos y no comunican identidad de marca.

Los stickers de la app (`messi_mode.png`, `mufa.png`, `archirrival.png`, `jogo-bonito.png`, etc.) son visuales únicos que solo Fulbito tiene. Usarlos como íconos de las feature cards comunica inmediatamente "esto tiene personalidad propia", diferencia del resto.

El CSS `.feature-card__icon img` ya está preparado para recibir una imagen. Es solo cuestión de cambiar el contenido del div.

Mapeo sugerido:
- Tu ADN Futbolístico → `messi_mode.png` 
- Convocatoria inteligente → `charla-tecnica.png`
- Equipos balanceados → `jogo-bonito.png`
- Editá los equipos → `a-jugar.png`
- Votaciones → `win_streak_3.png`
- Rankings y stats → `archirrival.png`
- Resumen IA → `mufa.png` (o `superclasico.png`)
- La Card de los Cracks → `padre_hijo.png`

---

### I4. "Pro gratis para todos los que se registren ahora" no está visible

El HANDOFF dice que todos los que se registren ahora tienen Pro automáticamente. Este es un **hook de conversión enorme** que solo aparece enterrado en la respuesta del FAQ "¿Es gratis?".

Si esto sigue siendo verdad y es una oferta de tiempo limitado (early adopters), tiene que estar en lugares prominentes:
- Como un badge en el CTA del hero: `⚽ Probar Fulbito — Pro gratis por tiempo limitado`
- Como copy en el CTA final: "Registrate gratis. Los que entran ahora tienen acceso Pro automáticamente."
- Opcionalmente, un mini-banner bajo el header o sobre el hero.

Una oferta de tiempo limitado aumenta la urgencia y reduce el "lo pruebo después" (que casi siempre es nunca).

---

### I5. Sin social proof de ningún tipo

No hay testimonios, no hay conteo de usuarios, no hay nombres de ciudades/grupos que usan la app. Para una app nueva con cero awareness, el social proof es crítico.

**Opciones viables sin necesitar mucho:**

**Opción mínima**: Agregar una sección pequeña con 2-3 quotes reales de usuarios (aunque sean amigos/testers). Basta con el nombre, ciudad y un emoji. Ejemplo:
> *"Fin de las peleas por los equipos. El jueves organizamos en 2 minutos."*  
> — Matías R., Buenos Aires

**Opción sin quotes**: Un contador de "X partidos organizados con Fulbito" o "X grupos activos esta semana". Si tenés acceso a la base de datos de la app, un número real (aunque sea 50 partidos) es mejor que nada.

---

### I6. Footer demasiado vacío — genera desconfianza

El footer actual tiene: logo + tagline + "Hecho con ♥️⚽ en Mendoza". Es encantador pero le falta credibilidad mínima.

Los usuarios antes de registrarse buscan inconscientemente señales de que el proyecto es serio. Un footer sin ningún link de privacidad o términos genera duda.

**Agregar (mínimo):**
- Link a Política de Privacidad (aunque sea una página simple)
- Link a la app principal: `fulbito.futbol`
- Email de contacto o link a Instagram/Twitter si existen
- El año actual: "© 2026 Fulbito"

---

## Hallazgos menores (P2 — polish)

### M1. Hero image flotando sin contexto visual

La imagen del hero (`hero.webp`) está como imagen libre sin marco. El plan original hablaba de una "glass card" envolviendo la imagen. Un marco glass card le daría profundidad y continuidad con el design system. CSS mínimo: aplicar `.glass-card` al `.hero__image-wrap` y ajustar el border-radius y overflow.

---

### M2. Dividers entre secciones son casi invisibles

Los `<hr class="divider">` tienen un gradiente de oro al 25% de opacidad sobre 1px. En la práctica son invisibles. El propósito de los dividers es dar respiro visual y separar secciones — si no se ven, no sirven. Dos opciones:
- Subirles la opacidad a 40-50%
- Reemplazarlos por dividers con más presencia: una franja de 32-48px con el pattern del césped, o una línea de cancha estilizada

---

### M3. Contraste del `--color-tierra` (#8B7355) sobre fondos oscuros

El `--color-tierra` se usa para texto de descripción en feature cards, step cards, y el párrafo de La Previa. Su ratio de contraste sobre `--color-noche` (#0D1B0F) probablemente no pasa WCAG AA (4.5:1 para texto normal). Verificar con una herramienta de contraste. Si falla, subir la luminosidad del `--color-tierra` en variables.css.

---

### M4. OG image apunta a hero.png de 4.2MB

La meta `og:image` apunta a `assets/images/hero.png`, que según el HANDOFF pesa 4.2MB. Los crawlers de redes sociales tienen timeouts ajustados y pueden fallar en cargar la imagen OG. Crear una imagen OG dedicada de 1200×630px en formato webp/jpg optimizado (< 200KB).

---

### M5. El header no tiene navegación por secciones

El header solo tiene Logo + CTA. En desktop, unos 3-4 anchor links serían útiles para orientar al usuario que ya está en la página: `Cómo funciona | Features | FAQ | Probar`. Esto también mejora el SEO interno y da señales a Google de la estructura del contenido.

---

### M6. Sección "durante el partido" ausente en Features

El plan original incluía un grupo "DURANTE" entre Pre-Partido y Post-Partido. Si la feature de registro de goles en tiempo real existe en la app, falta representarla. Si no existe todavía, el salto de Pre-Partido a Post-Partido se siente abrupto narrativamente — vale la pena al menos una card puente.

---

### M7. Copy del hero demasiado largo en mobile

La headline "Armá los equipos de tu fulbito semanal en 30 segundos." tiene 53 caracteres. En mobile puede cortar raro. Evaluar una versión más corta: "Armá los equipos del jueves. En 30 segundos."

---

### M8. El botón "Ver cómo funciona" lleva a texto, no a demo visual

El CTA secundario del hero es prometedor pero al hacer clic lleva a 3 cards de texto con emojis. Cuando el usuario hace clic en "Ver cómo funciona", espera VER algo — un mockup, una animación, una demo. Si los mockups se agregan a esa sección, el CTA queda justificado y cobra sentido.

---

## Roadmap priorizado de mejoras

| Prioridad | Mejora | Esfuerzo estimado | Impacto en conversión |
|---|---|---|---|
| P0 | **C1. Mockups de la app** (3 pantallas en el flujo "Cómo funciona") | Alto | Muy alto |
| P0 | **C2. Social proof/mockup en el Hero** | Medio | Alto |
| P1 | **I1. Redefinir o eliminar "La Previa"** | Bajo | Medio |
| P1 | **I2. Mover/eliminar Tutoriales** del flujo principal | Bajo | Medio |
| P1 | **I3. Reemplazar emojis por stickers** en feature cards | Bajo | Medio |
| P1 | **I4. Visibilizar el "Pro gratis"** en CTA y hero | Bajo | Alto |
| P1 | **I5. Agregar social proof** (quotes o contador) | Medio | Alto |
| P1 | **I6. Completar footer** con privacy, contacto, año | Muy bajo | Bajo-Medio |
| P2 | **M1. Glass card en hero image** | Muy bajo | Bajo |
| P2 | **M2. Subir opacidad de dividers** | Muy bajo | Bajo |
| P2 | **M3. Verificar contraste** de --color-tierra | Muy bajo | Medio |
| P2 | **M4. Crear imagen OG dedicada** (1200×630) | Medio | Bajo |
| P2 | **M5. Navegación anchor en header** (desktop) | Bajo | Bajo |

---

## Siguiente paso recomendado

En una sola sesión de trabajo se pueden resolver todos los P1 y P2 **excepto los mockups** (que dependen de capturas de la app real). 

El orden de ataque sugerido:
1. **Cambiar emojis por stickers** en feature cards (15 min)
2. **Visibilizar el "Pro gratis"** en CTAs (10 min)
3. **Mover Tutoriales** al final del flujo (5 min)
4. **Completar footer** (10 min)
5. **Integrar mockups de la app** → máximo impacto, requiere pantallas reales

---

*Informe generado desde análisis del código fuente en `website/` + revisión del plan en `PLAN.md` + `WEBSITE_HANDOFF.md`.*
