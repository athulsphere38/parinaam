'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type CursorState = 'default' | 'hover' | 'click' | 'text';

export const CustomCursor = () => {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const pos      = useRef({ x: -100, y: -100 });
  const ring     = useRef({ x: -100, y: -100 });
  const rafId    = useRef<number>(0);
  const isTouch  = useRef(false);

  const [state, setState] = useState<CursorState>('default');
  const [label, setLabel] = useState('');
  const [visible, setVisible] = useState(false);

  /* ── smooth ring lerp loop ── */
  const animate = useCallback(() => {
    ring.current.x += (pos.current.x - ring.current.x) * 0.12;
    ring.current.y += (pos.current.y - ring.current.y) * 0.12;

    if (ringRef.current) {
      ringRef.current.style.transform =
        `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%,-50%)`;
    }
    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* hide on touch devices */
    if ('ontouchstart' in window) { isTouch.current = true; return; }

    const moveDot = (e: MouseEvent) => {
      try {
        pos.current = { x: e.clientX, y: e.clientY };
        if (dotRef.current) {
          dotRef.current.style.transform =
            `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
        }
        if (!visible) setVisible(true);
      } catch {
        // ignore
      }
    };

    const detectTarget = (e: MouseEvent) => {
      try {
        const rawTarget = e.target as any;
        if (!rawTarget || typeof rawTarget.closest !== 'function') {
          setState('default');
          setLabel('');
          return;
        }

        const isBtn  = rawTarget.closest('button, a, [role="button"], [data-cursor="hover"]');
        const isText = rawTarget.closest('input, textarea, [contenteditable]');
        const isCard = rawTarget.closest('[data-cursor="card"]');
        const lbl    = (rawTarget.closest('[data-cursor-label]') as HTMLElement)?.dataset?.cursorLabel ?? '';

        setLabel(lbl);

        if (isText)   setState('text');
        else if (isBtn || isCard) setState('hover');
        else          setState('default');
      } catch {
        setState('default');
        setLabel('');
      }
    };

    const onDown = () => setState('click');
    const onUp   = () => {
      try {
        if (pos.current.x < 0 || pos.current.y < 0) return;
        const el = document.elementFromPoint(pos.current.x, pos.current.y) as any;
        const isBtn = el && typeof el.closest === 'function' ? el.closest('button, a, [role="button"]') : null;
        setState(isBtn ? 'hover' : 'default');
      } catch {
        setState('default');
      }
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener('mousemove', moveDot, { passive: true });
    window.addEventListener('mousemove', detectTarget, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', moveDot);
      window.removeEventListener('mousemove', detectTarget);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(rafId.current);
    };
  }, [animate, visible]);

  if (isTouch.current) return null;

  /* ── ring size / style by state ── */
  const ringSize: Record<CursorState, string> = {
    default: '28px',
    hover:   '48px',
    click:   '20px',
    text:    '4px',
  };
  const ringBorder: Record<CursorState, string> = {
    default: '1.5px solid rgba(192,132,252,0.7)',
    hover:   '1.5px solid rgba(217,70,239,0.9)',
    click:   '2px solid rgba(245,158,11,0.9)',
    text:    '0px solid transparent',
  };
  const ringRadius: Record<CursorState, string> = {
    default: '50%',
    hover:   '4px',   /* square-ish on hover — cyber feel */
    click:   '50%',
    text:    '50%',
  };
  const dotSize: Record<CursorState, string> = {
    default: '5px',
    hover:   '5px',
    click:   '3px',
    text:    '2px',
  };
  const dotColor: Record<CursorState, string> = {
    default: 'rgba(192,132,252,1)',
    hover:   'rgba(217,70,239,1)',
    click:   'rgba(245,158,11,1)',
    text:    'rgba(192,132,252,0.5)',
  };

  return (
    <>
      {/* ── dot (instant) ── */}
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position:        'fixed',
          top:             0,
          left:            0,
          zIndex:          99999,
          pointerEvents:   'none',
          width:           dotSize[state],
          height:          dotSize[state],
          borderRadius:    '50%',
          background:      dotColor[state],
          opacity:         visible ? 1 : 0,
          transition:      'width 150ms ease, height 150ms ease, background 150ms ease, opacity 200ms ease',
          willChange:      'transform',
        }}
      />

      {/* ── ring (lagging) ── */}
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          zIndex:        99998,
          pointerEvents: 'none',
          width:         ringSize[state],
          height:        ringSize[state],
          border:        ringBorder[state],
          borderRadius:  ringRadius[state],
          opacity:       visible ? 1 : 0,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          transition:    'width 200ms cubic-bezier(.34,1.56,.64,1), height 200ms cubic-bezier(.34,1.56,.64,1), border-radius 200ms ease, border 200ms ease, opacity 200ms ease',
          willChange:    'transform',
          overflow:      'hidden',
        }}
      >
        {/* ── crosshair lines inside ring on default ── */}
        {state === 'default' && (
          <>
            <span style={{ position:'absolute', left:'50%', top:0, bottom:0, width:'1px', background:'rgba(192,132,252,0.2)', transform:'translateX(-50%)' }} />
            <span style={{ position:'absolute', top:'50%', left:0, right:0, height:'1px', background:'rgba(192,132,252,0.2)', transform:'translateY(-50%)' }} />
          </>
        )}

        {/* ── label on hover ── */}
        {state === 'hover' && label && (
          <span style={{
            position:      'absolute',
            bottom:        '-22px',
            left:          '50%',
            transform:     'translateX(-50%)',
            fontSize:      '9px',
            fontFamily:    'monospace',
            letterSpacing: '0.15em',
            color:         'rgba(192,132,252,0.9)',
            whiteSpace:    'nowrap',
            textTransform: 'uppercase',
          }}>
            {label}
          </span>
        )}

        {/* ── corner ticks when hovering (bracket feel) ── */}
        {state === 'hover' && (
          <>
            <span style={{ position:'absolute', top:2, left:2, width:6, height:6, borderTop:'1px solid rgba(217,70,239,0.8)', borderLeft:'1px solid rgba(217,70,239,0.8)' }} />
            <span style={{ position:'absolute', top:2, right:2, width:6, height:6, borderTop:'1px solid rgba(217,70,239,0.8)', borderRight:'1px solid rgba(217,70,239,0.8)' }} />
            <span style={{ position:'absolute', bottom:2, left:2, width:6, height:6, borderBottom:'1px solid rgba(217,70,239,0.8)', borderLeft:'1px solid rgba(217,70,239,0.8)' }} />
            <span style={{ position:'absolute', bottom:2, right:2, width:6, height:6, borderBottom:'1px solid rgba(217,70,239,0.8)', borderRight:'1px solid rgba(217,70,239,0.8)' }} />
          </>
        )}
      </div>
    </>
  );
};
