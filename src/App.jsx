import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const navItems = ['HOME', 'MEDIA', 'UNIVERSE', 'NEWS'];

const slides = [
  {
    heading: 'A fractured world ignites.',
    body: 'Coalitions collapse, borders shift, and every decision echoes across a battlefield powered by air, armor, and intelligence.'
  },
  {
    heading: 'Command in real time.',
    body: 'Coordinate strikes, secure supply lines, and adapt to dynamic fronts with a control layer built for fluid tactical decisions.'
  },
  {
    heading: 'Every front tells a story.',
    body: 'From mountain passes to coastal defense zones, every region introduces unique pressure, pace, and strategic opportunities.'
  }
];

function useMouseParallax({ strength = 15, invert = false, restingScale = 1.05, containerRef }) {
  const targetRef = useRef(null);

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    const ease = 0.08;

    const onMove = (event) => {
      const rect = containerRef?.current?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const nx = (event.clientX - cx) / (rect ? rect.width / 2 : window.innerWidth / 2);
      const ny = (event.clientY - cy) / (rect ? rect.height / 2 : window.innerHeight / 2);
      const dir = invert ? -1 : 1;
      tx = nx * strength * dir;
      ty = ny * strength * dir;
    };

    let raf;
    const loop = () => {
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${restingScale})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [containerRef, invert, restingScale, strength]);

  return targetRef;
}

function DiamondButton({ children }) {
  const [hovered, setHovered] = useState(false);
  const baseClip = 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)';
  const hoverClip = 'polygon(0 0, 100% 0, 100% 50%, 100% 100%, 0 100%, 0 50%)';

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        clipPath: hovered ? hoverClip : baseClip,
        transition: 'all 300ms ease-out',
        background: '#f3f3f3',
        color: '#111',
        border: 'none',
        padding: '12px 28px',
        fontWeight: 700,
        letterSpacing: '.08em',
        cursor: 'pointer'
      }}
    >
      <span>{children}</span>
    </button>
  );
}

function IntroBlackBox({ progress }) {
  const slideIndex = Math.min(slides.length - 1, Math.floor(progress * slides.length));

  return (
    <div className="intro-card">
      <div className="rails" />
      <div className="content">
        <h3>
          {slides[slideIndex].heading.split(' ').map((word, idx) => (
            <motion.span
              key={`${word}-${idx}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.55, delay: idx * 0.035 }}
              style={{ display: 'inline-block', marginRight: 6 }}
            >
              {word}
            </motion.span>
          ))}
        </h3>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
          {slides[slideIndex].body}
        </motion.p>
        <div className="dots">
          {slides.map((_, idx) => <span key={idx} className={idx === slideIndex ? 'active' : ''} />)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const heroRef = useRef(null);
  const sectionTwoRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(1);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const ww3Y = useTransform(scrollYProgress, [0, 1], ['0vh', '49vh']);

  const aircraftY = useMemo(() => -scrollY * 0.05, [scrollY]);
  const eagleY = useMemo(() => -scrollY * 0.07, [scrollY]);
  const tankY = useMemo(() => -scrollY * 0.07, [scrollY]);

  const bgParallaxRef = useMouseParallax({ strength: 15, invert: true, containerRef: sectionTwoRef });
  const eagleParallaxRef = useMouseParallax({ strength: 8, invert: false, containerRef: sectionTwoRef });

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY || 0);
      setViewportHeight(window.innerHeight || 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        body { margin:0; font-family: Inter, system-ui, sans-serif; background:#080808; color:#fff; }
        .hero { position:relative; min-height:98vh; overflow:hidden; padding:28px 5vw; }
        .nav { display:flex; gap:20px; justify-content:flex-end; opacity:.9; }
        .hero-title-wrap { overflow:hidden; }
        .hero-title { font-size:clamp(2rem,8vw,7rem); line-height:.95; margin:.5rem 0; }
        .ww3 { position:absolute; bottom:-2vh; left:50%; transform:translateX(-50%); font-size:clamp(4rem,18vw,16rem); letter-spacing:.12em; color:rgba(255,255,255,.08); white-space:nowrap; pointer-events:none; }
        .section { min-height:100vh; position:relative; overflow:hidden; display:grid; place-items:center; }
        .intro-card { position:sticky; top:0; transform: translateY(40%); max-width:420px; width:90vw; aspect-ratio:458/474; background:#0f0f11; border-radius:9px; border:1px solid rgba(255,255,255,.2); }
        .content { padding:34px; display:flex; flex-direction:column; height:100%; justify-content:space-between; }
        .content h3 { font-size:clamp(1.4rem,3vw,2rem); margin:0; }
        .content p { color:rgba(255,255,255,.75); line-height:1.6; }
        .dots { display:flex; gap:8px; }
        .dots span { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.25); transition:.3s; }
        .dots span.active { width:24px; border-radius:999px; background:#fff; }
        .bg-layer { position:absolute; inset:0; background:linear-gradient(160deg,#222,#101820); will-change:transform; }
        .overlay { position:absolute; font-weight:700; letter-spacing:.06em; opacity:.8; user-select:none; pointer-events:none; }
      `}</style>

      <motion.section ref={heroRef} className="hero" style={{ scale }}>
        <motion.nav
          className="nav"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9 }}
        >
          {navItems.map((item, i) => (
            <motion.span key={item} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              {item}
            </motion.span>
          ))}
        </motion.nav>

        <div style={{ maxWidth: 960, marginTop: '12vh' }}>
          {['TACTICAL WARFARE', 'AT A GLOBAL', 'SCALE'].map((line, idx) => (
            <div className="hero-title-wrap" key={line}>
              <motion.h1
                className="hero-title"
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
              >
                {line}
              </motion.h1>
            </div>
          ))}
          <p style={{ opacity: 0.8, maxWidth: 600 }}>Command land, sea, and air with layered strategic systems and cinematic scale.</p>
          <DiamondButton>WATCH TRAILER</DiamondButton>
        </div>

        <motion.div
          className="ww3"
          style={{ y: ww3Y }}
          initial={{ y: 300, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        >
          WORLDWAR3
        </motion.div>
      </motion.section>

      <section ref={sectionTwoRef} className="section" style={{ minHeight: '160vh' }}>
        <div className="bg-layer" ref={bgParallaxRef} style={{ transform: `translate3d(0, ${scrollY * 0.05}px, 0)` }} />
        <div className="overlay" style={{ top: '16%', left: '6%', transform: `translateY(${aircraftY}px)`, fontSize: '2rem' }}>FIGHTER</div>
        <div className="overlay" style={{ top: '20%', right: '8%', transform: `translateY(${aircraftY}px)`, fontSize: '2rem' }}>DRONE</div>
        <div className="overlay" ref={eagleParallaxRef} style={{ bottom: '8%', right: '8%', transform: `translateY(${eagleY}px)`, fontSize: '2.5rem' }}>EAGLE</div>
        <IntroBlackBox progress={Math.min(0.999, (scrollY % viewportHeight) / viewportHeight)} />
      </section>

      <section className="section" style={{ marginTop: '-100vh' }}>
        <div className="bg-layer" style={{ background: 'linear-gradient(180deg,#1c2227,#101216)' }} />
        <div className="overlay" style={{ left: '6%', bottom: '10%', transform: `translateY(${tankY}px)`, fontSize: '2.5rem' }}>TANK DIVISION</div>
      </section>
    </>
  );
}
