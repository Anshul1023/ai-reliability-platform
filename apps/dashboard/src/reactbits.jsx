/* Adapted ReactBits components (https://reactbits.dev) — MaskedHeading,
   FoldText, ScrollExpand, AccordionGallery, CircularGallery.
   Kept close to the originals; CSS lives in styles.css. */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";

gsap.registerPlugin(ScrollTrigger);

/* ============================= MaskedHeading ============================= */
const clampMH = (v, a, b) => (v < a ? a : v > b ? b : v);

export function MaskedHeading({
  text = "Designed in the details",
  tag = "h2",
  mediaType = "image",
  src = "",
  fill = "",
  fillScale = 1.25,
  parallax = 26,
  drift = 18,
  brightness = 1,
  saturation = 1,
  grayscale = false,
  reveal = "rise",
  duration = 1.1,
  stagger = 0.09,
  trigger = "view",
  align = "center",
  weight = 700,
  tracking = -0.03,
  lineHeight = 1.06,
  textScale = 0.115,
  className = "",
  style,
  ...rest
}) {
  const rootRef = useRef(null);
  const measureRef = useRef(null);
  const revealRef = useRef(null);
  const mediaRef = useRef(null);
  const wordRefs = useRef([]);
  const baseRefs = useRef([]);
  const glyphRefs = useRef([]);
  const tweenRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const clipId = `mh-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const words = useMemo(() => String(text).split(/\s+/).filter(Boolean), [text]);

  const settingsRef = useRef({});
  settingsRef.current = { fillScale, parallax, drift, brightness, saturation, grayscale, textScale };

  const place = useCallback(() => {
    const root = rootRef.current;
    const media = mediaRef.current;
    if (!root || !media) return;
    const s = settingsRef.current;
    const W = root.clientWidth;
    const H = root.clientHeight;
    const off = offsetRef.current;
    const maxX = Math.max(0, ((s.fillScale - 1) / 2) * W);
    const maxY = Math.max(0, ((s.fillScale - 1) / 2) * H);
    media.style.transform = `translate3d(${clampMH(off.x, -maxX, maxX).toFixed(2)}px, ${clampMH(off.y, -maxY, maxY).toFixed(2)}px, 0) scale(${s.fillScale})`;
    media.style.filter = `brightness(${s.brightness}) saturate(${s.saturation})${s.grayscale ? " grayscale(1)" : ""}`;
  }, []);

  const sync = useCallback(() => {
    const root = rootRef.current;
    const measure = measureRef.current;
    if (!root || !measure) return;
    const s = settingsRef.current;
    root.style.fontSize = `${clampMH(root.clientWidth * s.textScale, 20, 200).toFixed(1)}px`;
    const cs = window.getComputedStyle(measure);
    for (let i = 0; i < wordRefs.current.length; i += 1) {
      const box = wordRefs.current[i];
      const base = baseRefs.current[i];
      const glyph = glyphRefs.current[i];
      if (!box || !base || !glyph) continue;
      glyph.setAttribute("x", `${box.offsetLeft}`);
      glyph.setAttribute("y", `${base.offsetTop}`);
      glyph.style.fontFamily = cs.fontFamily;
      glyph.style.fontSize = cs.fontSize;
      glyph.style.fontWeight = cs.fontWeight;
      glyph.style.fontStyle = cs.fontStyle;
      glyph.style.letterSpacing = cs.letterSpacing;
    }
    place();
  }, [place]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(root);
    if (document.fonts?.ready) document.fonts.ready.then(sync).catch(() => {});

    let raf = 0;
    let last = performance.now();
    let clock = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const s = settingsRef.current;
      const off = offsetRef.current;
      const dx = Math.sin(clock * 0.21) * s.drift;
      const dy = Math.cos(clock * 0.17) * s.drift * 0.6;
      const ease = 1 - Math.exp(-dt / 0.18);
      off.x += (off.tx + dx - off.x) * ease;
      off.y += (off.ty + dy - off.y) * ease;
      place();
      raf = requestAnimationFrame(frame);
    };
    const onMove = (e) => {
      const s = settingsRef.current;
      if (s.parallax <= 0) return;
      const r = root.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / (r.width || 1)) * 2 - 1;
      const ny = ((e.clientY - r.top) / (r.height || 1)) * 2 - 1;
      offsetRef.current.tx = clampMH(nx, -1, 1) * -s.parallax;
      offsetRef.current.ty = clampMH(ny, -1, 1) * -s.parallax;
    };
    const onLeave = () => {
      offsetRef.current.tx = 0;
      offsetRef.current.ty = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [place, sync]);

  useEffect(() => { sync(); }, [sync, words, tag, align, weight, tracking, lineHeight, textScale]);

  useEffect(() => {
    const root = rootRef.current;
    const layer = revealRef.current;
    if (!root || !layer) return;
    const glyphs = glyphRefs.current.filter(Boolean);
    if (!glyphs.length) return;
    const riseDistance = () => (parseFloat(window.getComputedStyle(root).fontSize) || 48) * 1.15;
    const settle = () => {
      gsap.set(glyphs, { y: 0 });
      gsap.set(layer, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" });
    };
    const rest = () => {
      if (reveal === "rise") gsap.set(glyphs, { y: riseDistance() });
      else if (reveal === "wipe") gsap.set(layer, { clipPath: "inset(0% 100% 0% 0%)" });
      else if (reveal === "fade") gsap.set(layer, { opacity: 0, scale: 1.08 });
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reveal === "none" || reduce) { settle(); return; }
    const play = () => {
      tweenRef.current?.kill();
      if (reveal === "rise") {
        gsap.set(layer, { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" });
        tweenRef.current = gsap.fromTo(glyphs, { y: riseDistance() }, { y: 0, duration, stagger, ease: "power4.out", overwrite: "auto" });
      } else if (reveal === "wipe") {
        gsap.set(glyphs, { y: 0 });
        const state = { p: 100 };
        tweenRef.current = gsap.to(state, {
          p: 0, duration, ease: "power3.inOut", overwrite: "auto",
          onUpdate: () => { layer.style.clipPath = `inset(0% ${state.p}% 0% 0%)`; }
        });
      } else {
        gsap.set(glyphs, { y: 0 });
        tweenRef.current = gsap.fromTo(layer, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration, ease: "power3.out", overwrite: "auto" });
      }
    };
    if (trigger === "hover") {
      settle();
      root.addEventListener("pointerenter", play);
      return () => { root.removeEventListener("pointerenter", play); tweenRef.current?.kill(); };
    }
    if (trigger === "view") {
      settle();
      rest();
      const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { play(); io.disconnect(); } }, { threshold: 0.25 });
      io.observe(root);
      return () => { io.disconnect(); tweenRef.current?.kill(); };
    }
    play();
    return () => tweenRef.current?.kill();
  }, [reveal, trigger, duration, stagger, words]);

  const Tag = tag;
  return (
    <Tag ref={rootRef} className={`masked-heading ${className}`.trim()}
      style={{ textAlign: align, fontWeight: weight, letterSpacing: `${tracking}em`, lineHeight, ...style }} {...rest}>
      <span ref={measureRef} className="masked-heading__measure">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} ref={(el) => { wordRefs.current[i] = el; }} className="masked-heading__word">
            {word}
            <i ref={(el) => { baseRefs.current[i] = el; }} className="masked-heading__baseline" />
          </span>
        ))}
      </span>
      <svg className="masked-heading__defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            {words.map((word, i) => (
              <text key={`${word}-${i}`} ref={(el) => { glyphRefs.current[i] = el; }}>{word}</text>
            ))}
          </clipPath>
        </defs>
      </svg>
      <span ref={revealRef} className="masked-heading__reveal">
        <span className="masked-heading__clip" style={{ clipPath: `url(#${clipId})` }}>
          <span ref={mediaRef} className="masked-heading__media">
            {fill ? (
              <span className="masked-heading__fill" style={{ background: fill }} aria-hidden="true" />
            ) : mediaType === "video" ? (
              <video className="masked-heading__source" src={src} autoPlay muted loop playsInline />
            ) : (
              <img className="masked-heading__source" src={src} alt="" draggable={false} />
            )}
          </span>
        </span>
      </span>
    </Tag>
  );
}

/* ================================= FoldText ================================ */
const HINGE_CONFIG = {
  top: { origin: "50% 0%", rotateX: -92, rotateY: 0 },
  bottom: { origin: "50% 100%", rotateX: 92, rotateY: 0 },
  left: { origin: "0% 50%", rotateX: 0, rotateY: 92 },
  right: { origin: "100% 50%", rotateX: 0, rotateY: -92 }
};
const clampFT = (value, min, max) => Math.min(max, Math.max(min, value));
const renderWhitespace = (value, key) =>
  value.split(/(\n)/).map((part, index) => {
    if (part === "\n") return <br key={`${key}-br-${index}`} />;
    if (!part) return null;
    return (
      <span className="fold-text-whitespace" key={`${key}-space-${index}`}>
        {part.replace(/ /g, "\u00A0")}
      </span>
    );
  });

export function FoldText({
  text = "Design unfolds",
  splitBy = "char",
  hinge = "top",
  duration = 0.65,
  stagger = 0.045,
  ease = "power3.out",
  perspective = 700,
  creaseShading = 0.55,
  trigger = "mount",
  fontSize = 80,
  fontWeight = 800,
  color = "#f7f2e8",
  className = "",
  style = {}
}) {
  const rootRef = useRef(null);
  const timelineRef = useRef(null);
  const hingeConfig = HINGE_CONFIG[hinge] || HINGE_CONFIG.top;
  const safeCrease = clampFT(creaseShading, 0, 1);
  const safePerspective = Math.max(120, perspective);

  const segments = useMemo(() => {
    let segmentIndex = 0;
    const renderSegment = (content, key, split = splitBy) => {
      segmentIndex += 1;
      return (
        <span className="fold-text-segment" data-fold-split={split} key={key} style={{ "--fold-perspective": `${safePerspective}px` }}>
          <span className="fold-text-piece" data-fold-hinge={hinge} style={{ transformOrigin: hingeConfig.origin, "--fold-crease": 0 }}>
            {content || "\u00A0"}
          </span>
        </span>
      );
    };
    if (splitBy === "line") {
      return text.split("\n").map((line, index) => (
        <span className="fold-text-line" key={`line-${index}`}>
          {renderSegment(line || "\u00A0", `segment-line-${index}`, "line")}
        </span>
      ));
    }
    if (splitBy === "word") {
      return text.split(/(\s+)/).flatMap((part, index) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return renderWhitespace(part, `ws-${index}`);
        return renderSegment(part, `segment-word-${segmentIndex}`);
      });
    }
    return Array.from(text).map((char, index) => {
      if (char === "\n") return <br key={`br-${index}`} />;
      return renderSegment(char === " " ? "\u00A0" : char, `segment-char-${index}`);
    });
  }, [text, splitBy, hinge, hingeConfig.origin, safePerspective]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const pieces = Array.from(root.querySelectorAll(".fold-text-piece"));
    if (!pieces.length) return undefined;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const activeDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
    const activeStagger = reduceMotion ? Math.min(stagger, 0.02) : stagger;
    const fromVars = {
      opacity: 0,
      rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
      rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
      "--fold-crease": reduceMotion ? 0 : safeCrease,
      transformOrigin: hingeConfig.origin,
      force3D: true
    };
    const toVars = {
      opacity: 1, rotateX: 0, rotateY: 0, "--fold-crease": 0,
      duration: activeDuration, ease: reduceMotion ? "power1.out" : ease,
      stagger: activeStagger, clearProps: "willChange"
    };
    const killTimeline = () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      gsap.killTweensOf(pieces);
    };
    const play = (repeat) => {
      killTimeline();
      timelineRef.current = gsap.timeline({ repeat: repeat ? -1 : 0, repeatDelay: repeat ? 0.75 : 0 });
      timelineRef.current.fromTo(pieces, fromVars, toVars);
      return timelineRef.current;
    };
    let scrollTrigger;
    let hoverHandler;
    if (trigger === "hover") {
      gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0, "--fold-crease": 0, transformOrigin: hingeConfig.origin });
      hoverHandler = () => play(false);
      root.addEventListener("mouseenter", hoverHandler);
    } else if (trigger === "scroll") {
      gsap.set(pieces, fromVars);
      scrollTrigger = ScrollTrigger.create({ trigger: root, start: "top 82%", once: true, onEnter: () => play(false) });
    } else if (trigger === "loop") {
      play(true);
    } else {
      play(false);
    }
    return () => {
      if (hoverHandler) root.removeEventListener("mouseenter", hoverHandler);
      scrollTrigger?.kill();
      killTimeline();
    };
  }, [text, splitBy, hinge, duration, stagger, ease, perspective, safeCrease, trigger, hingeConfig.origin, hingeConfig.rotateX, hingeConfig.rotateY]);

  const rootStyle = {
    "--fold-text-font-size": typeof fontSize === "number" ? `${fontSize}px` : fontSize,
    "--fold-text-font-weight": fontWeight,
    "--fold-text-color": color,
    ...style
  };
  return (
    <span ref={rootRef} className={`fold-text ${className}`.trim()} style={rootStyle}>
      <span className="fold-text-sr-only">{text}</span>
      <span className="fold-text-visual" aria-hidden="true">{segments}</span>
    </span>
  );
}

/* =============================== ScrollExpand =============================== */
const clampSE = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (edge0, edge1, x) => {
  const t = clampSE((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

export function ScrollExpand({
  src = "",
  alt = "",
  title = "",
  scrollHint = "",
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  className = "",
  style
}) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const overlayRef = useRef(null);
  const scrimRef = useRef(null);
  const hintRef = useRef(null);
  const propsRef = useRef({});
  propsRef.current = { startWidth, startHeight, startRadius, endRadius, mediaZoom, scrollDistance, holdDistance, smoothing, overlayScrim, useWindowScroll, enabled };

  const applyProgress = useCallback((p) => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;
    const e = smoothstep(0, 1, p);
    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;
    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim * e}`;
    if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }
    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }
    if (overlayRef.current) {
      const inn = smoothstep(0.68, 1, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;
    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;
      const w = root.clientWidth || stageH;
      stage.style.setProperty("--se-title-size", `${clampSE(w * 0.075, 20, 84)}px`);
    };
    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clampSE(-top / span, 0, 1);
      }
      return clampSE(root.scrollTop / span, 0, 1);
    };
    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) { current = target; running = false; }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) { current = target; applyProgress(current); return; }
      kick();
    };
    const onResize = () => { measure(); target = readProgress(); current = target; applyProgress(current); };
    measure();
    target = readProgress();
    current = target;
    applyProgress(current);
    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  return (
    <div ref={rootRef} className={`scroll-expand ${useWindowScroll ? "" : "scroll-expand--scroller"} ${className}`.trim()} style={style}>
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            <img ref={mediaRef} className="scroll-expand__media" src={src} alt={alt} draggable={false} />
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children ? (
              <div ref={overlayRef} className="scroll-expand__overlay">{children}</div>
            ) : null}
          </div>
          {title ? (
            <div ref={titleRef} className="scroll-expand__title">{title}</div>
          ) : null}
          {scrollHint ? (
            <div ref={hintRef} className="scroll-expand__hint">{scrollHint}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============================= AccordionGallery ============================= */
export function AccordionGallery({
  items = [],
  defaultIndex = 1,
  accentColor = "#7aa2ff",
  overlayColor = "#0b0f1c",
  textColor = "#ffffff",
  height = 420,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  orientation = "horizontal",
  duration = 0.6,
  ease = "power3.out",
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = "hover",
  showLabels = true,
  grayscale = true,
  className = ""
}) {
  const rootRef = useRef(null);
  const panelRefs = useRef([]);
  const mediaRefs = useRef([]);
  const barRefs = useRef([]);
  const textRefs = useRef([]);
  const tlRef = useRef(null);
  const firstRunRef = useRef(true);
  const mediaSizeRef = useRef(320);
  const vertical = orientation === "vertical";
  const count = items.length;
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), count - 1));
  const prefersReduced = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  const applyLayout = useCallback((animate) => {
    const panels = panelRefs.current;
    if (!panels.length) return;
    const r = Math.min(Math.max(expandRatio, 0.2), 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
    const mediaSize = mediaSizeRef.current;
    tlRef.current?.kill();
    const dur = animate && !prefersReduced ? duration : 0;
    const tl = gsap.timeline();
    panels.forEach((panel, i) => {
      if (!panel) return;
      const isActive = i === active;
      const media = mediaRefs.current[i];
      const bar = barRefs.current[i];
      const text = textRefs.current[i];
      const rot = isActive ? 0 : i < active ? tilt : -tilt;
      const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot };
      tl.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);
      if (media) {
        const drift = Math.max(-1.5, Math.min(1.5, active - i));
        const shift = drift * parallax * mediaSize * 0.06;
        const gray = grayscale ? (isActive ? 0 : 1) : 0;
        tl.to(media, {
          xPercent: -50, yPercent: -50,
          x: vertical ? 0 : isActive ? 0 : shift,
          y: vertical ? (isActive ? 0 : shift) : 0,
          "--ag-gray": gray, "--ag-dim": isActive ? 0 : 0.35,
          duration: dur, ease
        }, 0);
      }
      if (showLabels && bar && text) {
        if (isActive) tl.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : stagger }, 0);
        else tl.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
      }
    });
    tlRef.current = tl;
  }, [active, count, expandRatio, duration, ease, vertical, tilt, parallax, grayscale, showLabels, stagger, prefersReduced]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const total = vertical ? rect.height : rect.width;
      const usable = Math.max(total - gap * (count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22);
      mediaSizeRef.current = size;
      el.style.setProperty("--ag-media-size", `${size}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gap, count, expandRatio, vertical]);

  useEffect(() => { applyLayout(!firstRunRef.current); firstRunRef.current = false; }, [applyLayout]);
  useEffect(() => () => { tlRef.current?.kill(); }, []);

  const handleEnter = (i) => { if (trigger === "hover") setActive(i); };
  const handleClick = (i, e) => { if (i !== active) { e.preventDefault(); setActive(i); } };
  const handleKeyDown = (i, e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); setActive((i + 1) % count); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); setActive((i - 1 + count) % count); }
  };

  return (
    <div ref={rootRef}
      className={`accordion-gallery${vertical ? " accordion-gallery--vertical" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--ag-accent": accentColor, "--ag-overlay": overlayColor, "--ag-text": textColor, "--ag-gap": `${gap}px`, "--ag-radius": `${radius}px`, height: vertical ? `${Math.round(height * 1.6)}px` : `${height}px` }}
      role="list" aria-label="Image accordion gallery">
      {items.map((item, i) => {
        const isActive = i === active;
        const Tag = item.link ? "a" : "div";
        return (
          <Tag key={i} ref={(el) => (panelRefs.current[i] = el)}
            className={`ag-panel${isActive ? " ag-panel--active" : ""}`}
            style={{ borderRadius: `${radius}px` }} href={item.link || undefined}
            onClick={(e) => handleClick(i, e)} onMouseEnter={() => handleEnter(i)}
            onFocus={() => setActive(i)} onKeyDown={(e) => handleKeyDown(i, e)}
            role="listitem" tabIndex={0} aria-current={isActive ? "true" : undefined} aria-label={item.label}>
            <span className="ag-panel__frame">
              <span className="ag-panel__media" ref={(el) => (mediaRefs.current[i] = el)}>
                <img src={item.image} alt={item.alt || item.label || ""} draggable="false" />
              </span>
              <span className="ag-panel__overlay" aria-hidden="true" />
            </span>
            {showLabels && (
              <span className="ag-panel__label" aria-hidden="true">
                <span className="ag-panel__bar" ref={(el) => (barRefs.current[i] = el)} />
                <span className="ag-panel__text" ref={(el) => (textRefs.current[i] = el)}>{item.label}</span>
              </span>
            )}
          </Tag>
        );
      })}
    </div>
  );
}

/* ============================= CircularGallery ============================= */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }
function autoBind(instance) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor" && typeof instance[key] === "function") instance[key] = instance[key].bind(instance);
  });
}
function getFontSize(font) {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}
function createTextTexture(gl, text, font = "bold 30px monospace", color = "black") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(getFontSize(font) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}
class Title {
  constructor({ gl, plane, renderer, text, textColor = "#545050", font = "30px sans-serif" }) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragment: `precision highp float; uniform sampler2D tMap; varying vec2 vUv;
        void main() { vec4 color = texture2D(tMap, vUv); if (color.a < 0.1) discard; gl_FragColor = color; }`,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}
class Media {
  constructor({ geometry, gl, image, index, length, renderer, scene, screen, text, viewport, bend, textColor, borderRadius = 0, font }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform float uTime; uniform float uSpeed; varying vec2 vUv;
        void main() { vUv = uv; vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragment: `precision highp float; uniform vec2 uImageSizes; uniform vec2 uPlaneSizes; uniform sampler2D tMap; uniform float uBorderRadius; varying vec2 vUv;
        float roundedBoxSDF(vec2 p, vec2 b, float r) { vec2 d = abs(p) - b; return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r; }
        void main() {
          vec2 ratio = vec2(min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0), min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0));
          vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5);
          vec4 color = texture2D(tMap, uv);
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }`,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius }
      },
      transparent: true
    });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }
  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }
  createTitle() {
    this.title = new Title({ gl: this.gl, plane: this.plane, renderer: this.renderer, text: this.text, textColor: this.textColor, font: this.font });
  }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }
    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) { this.extra -= this.widthTotal; this.isBefore = this.isAfter = false; }
    if (direction === "left" && this.isAfter) { this.extra += this.widthTotal; this.isBefore = this.isAfter = false; }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}
class CGApp {
  constructor(container, { items, bend, textColor = "#ffffff", borderRadius = 0, font = "bold 30px sans-serif", scrollSpeed = 2, scrollEase = 0.05 } = {}) {
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }
  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
  }
  createCamera() { this.camera = new Camera(this.gl); this.camera.fov = 45; this.camera.position.z = 20; }
  createScene() { this.scene = new Transform(); }
  createGeometry() { this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 }); }
  createMedias(items, bend = 1, textColor, borderRadius, font) {
    const galleryItems = items && items.length ? items : [];
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) =>
      new Media({
        geometry: this.planeGeometry, gl: this.gl, image: data.image, index,
        length: this.mediasImages.length, renderer: this.renderer, scene: this.scene,
        screen: this.screen, text: data.text, viewport: this.viewport, bend,
        textColor, borderRadius, font
      })
    );
  }
  onTouchDown(e) { this.isDown = true; this.scroll.position = this.scroll.current; this.start = e.touches ? e.touches[0].clientX : e.clientX; }
  onTouchMove(e) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }
  onTouchUp() { this.isDown = false; this.onCheck(); }
  onWheel(e) {
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }
  onKeyDown(e) {
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); this.scroll.target += this.scrollSpeed * 5; this.onCheckDebounce(); break;
      case "ArrowLeft": e.preventDefault(); this.scroll.target -= this.scrollSpeed * 5; this.onCheckDebounce(); break;
      case "Home": e.preventDefault(); this.scroll.target = 0; this.onCheckDebounce(); break;
      default: break;
    }
  }
  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }));
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) this.medias.forEach((media) => media.update(this.scroll, direction));
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    window.addEventListener("resize", this.boundOnResize);
    window.addEventListener("mousewheel", this.boundOnWheel);
    window.addEventListener("wheel", this.boundOnWheel);
    window.addEventListener("mousedown", this.boundOnTouchDown);
    window.addEventListener("mousemove", this.boundOnTouchMove);
    window.addEventListener("mouseup", this.boundOnTouchUp);
    window.addEventListener("touchstart", this.boundOnTouchDown);
    window.addEventListener("touchmove", this.boundOnTouchMove);
    window.addEventListener("touchend", this.boundOnTouchUp);
    this.container?.addEventListener("keydown", this.boundOnKeyDown);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize);
    window.removeEventListener("mousewheel", this.boundOnWheel);
    window.removeEventListener("wheel", this.boundOnWheel);
    window.removeEventListener("mousedown", this.boundOnTouchDown);
    window.removeEventListener("mousemove", this.boundOnTouchMove);
    window.removeEventListener("mouseup", this.boundOnTouchUp);
    window.removeEventListener("touchstart", this.boundOnTouchDown);
    window.removeEventListener("touchmove", this.boundOnTouchMove);
    window.removeEventListener("touchend", this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    if (this.container) this.container.removeEventListener("keydown", this.boundOnKeyDown);
  }
}

export function CircularGallery({
  items,
  bend = 3,
  textColor = "#ffffff",
  borderRadius = 0.05,
  font = "bold 30px sans-serif",
  scrollSpeed = 2,
  scrollEase = 0.05
}) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    let app;
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted || !containerRef.current) return;
      app = new CGApp(containerRef.current, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase });
    }, 60);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      app?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="circular-gallery" ref={containerRef} tabIndex={0} aria-label="Circular gallery" />;
}
