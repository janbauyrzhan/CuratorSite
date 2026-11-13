'use client';

import { useEffect, useRef, useState } from 'react';
import { GripVertical, Lock, Unlock } from 'lucide-react';

export function PosterLock({ locked, label, onClick, style }) {
  return (
    <button type="button" className="poster-lock" style={style} aria-label={label} title={label}
      aria-pressed={locked} onClick={onClick}>
      {locked ? <Lock size={14} /> : <Unlock size={14} />}
    </button>
  );
}

export default function PosterReorder({ rows, onSwap, onLocked, children, locks }) {
  const root = useRef(null);
  const gesture = useRef(null);
  const scrollFrame = useRef(0);
  const ignoreClick = useRef(false);
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const items = rows.flatMap(row => row.students).filter(item => !item.readOnly);

  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);

  function hit(x, y) {
    const target = document.elementFromPoint(x, y)?.closest('[data-poster-student]');
    return root.current?.contains(target) ? target.dataset.posterStudent : null;
  }

  function activate(id) {
    if (items.find(item => item.id === id)?.locked) {
      onLocked();
      return;
    }
    const previous = items.find(item => item.id === selected && !item.locked);
    if (!previous || selected === id) {
      setSelected(previous ? null : id);
      return;
    }
    onSwap(selected, id);
    setSelected(null);
  }

  function scrollNearEdge() {
    const current = gesture.current;
    if (!current?.moved || !current.scroller) return;
    const { top, bottom } = current.scroller.getBoundingClientRect();
    const edge = 54;
    const upperEdge = Math.max(top, 0) + edge;
    const distance = current.y < upperEdge
      ? current.y - upperEdge
      : Math.max(0, current.y - Math.min(bottom, window.innerHeight) + edge);
    if (distance) {
      current.scroller.scrollTop += Math.max(-14, Math.min(14, distance / 3));
      const target = hit(current.x, current.y);
      setDrag(previous => !previous || previous.target === target ? previous : { ...previous, target });
    }
    scrollFrame.current = requestAnimationFrame(scrollNearEdge);
  }

  function finish(event, cancelled = false) {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    gesture.current = null;
    cancelAnimationFrame(scrollFrame.current);
    setDrag(null);
    if (cancelled || !current.moved) return;
    ignoreClick.current = true;
    const target = hit(event.clientX, event.clientY);
    if (target && target !== current.item.id) {
      onSwap(current.item.id, target);
      setSelected(null);
    }
  }

  function inputProps(item, canDrag = true) {
    return {
      'data-poster-student': item.id,
      'data-active': selected === item.id || drag?.id === item.id || drag?.target === item.id,
      'aria-pressed': selected === item.id,
      'aria-label': item.name,
      onClick: event => {
        if (!ignoreClick.current || event.detail === 0) activate(item.id);
        ignoreClick.current = false;
      },
      onPointerDown: event => {
        ignoreClick.current = false;
        if (!canDrag || item.locked || !event.isPrimary || event.button !== 0) return;
        const workspace = event.currentTarget.closest('.pair-workspace');
        const scroller = workspace && workspace.scrollHeight > workspace.clientHeight
          ? workspace
          : event.currentTarget.closest('.workspace-main');
        gesture.current = {
          item, pointer: event.pointerId, x: event.clientX, y: event.clientY,
          startX: event.clientX, startY: event.clientY, moved: false, scroller,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: event => {
        const current = gesture.current;
        if (!current || current.pointer !== event.pointerId) return;
        if (!current.moved) {
          if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 7) return;
          current.moved = true;
          scrollFrame.current = requestAnimationFrame(scrollNearEdge);
        }
        current.x = event.clientX;
        current.y = event.clientY;
        setDrag({ id: item.id, name: item.name, x: event.clientX, y: event.clientY, target: hit(event.clientX, event.clientY) });
      },
      onPointerUp: finish,
      onPointerCancel: event => finish(event, true),
      onLostPointerCapture: event => finish(event, true),
    };
  }

  return (
    <div ref={root} className="poster-reorder" onKeyDown={event => {
      if (event.key === 'Escape') {
        setSelected(null);
        gesture.current = null;
        cancelAnimationFrame(scrollFrame.current);
        setDrag(null);
      }
    }}>
      {rows.length > 0 && (
        <div className="poster-touch-editor">
          {rows.map(row => (
            <div className="poster-touch-row" key={row.key}>
              <div className="poster-touch-label">
                <span>{row.label}</span>
                {row.lock && <PosterLock {...row.lock} />}
              </div>
              <div className="poster-touch-students">
                {row.students.map(item => (
                  <div className="poster-touch-student" key={item.id}>
                    {item.readOnly
                      ? <span className="poster-student-name">{item.name}</span>
                      : <button type="button" className="poster-student-name" {...inputProps(item, false)}>{item.name}</button>}
                    {item.lock && <PosterLock {...item.lock} />}
                    {!item.readOnly && !item.locked && (
                      <button type="button" className="poster-grip" {...inputProps(item)}
                        aria-label={`${item.name}: жылжыту`} tabIndex={-1}>
                        <GripVertical size={17} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="poster-preview-toggle" aria-expanded={showPreview}
        aria-controls="reorder-poster-preview"
        onClick={() => setShowPreview(open => !open)}>
        {showPreview ? 'Постерді жасыру' : 'Постерді көру'}
      </button>
      <div id="reorder-poster-preview" className={showPreview ? 'poster-frame is-open' : 'poster-frame'}>
        {children}
        <div className="poster-interactions">
          {items.map(item => (
            <button key={item.id} type="button" className="poster-student-hit"
              style={item.position} {...inputProps(item)} />
          ))}
          {locks}
        </div>
      </div>
      {drag && <div className="poster-drag-name" aria-hidden="true" style={{ left: drag.x, top: drag.y }}>{drag.name}</div>}
    </div>
  );
}
