import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Zap, Atom, Sparkles, ChevronRight } from 'lucide-react';
import { useModeStore } from '@/status';

const MODES = [
  {
    id: 'fast',
    label: '快速',
    desc: '适用于大部分情况',
    icon: Zap,
  },
  {
    id: 'thinking',
    label: '思考',
    desc: '擅长解决更难的问题',
    icon: Atom,
  },
  {
    id: 'expert',
    label: '专家',
    desc: '研究级智能模型',
    icon: Sparkles,
  },
];

export default function ModeSelector() {
  const currentMode = useModeStore(s => s.currentMode);
  const setCurrentMode = useModeStore(s => s.setCurrentMode);
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const activeMode = MODES.find(m => m.id === currentMode) || MODES[0];
  const ActiveIcon = activeMode.icon;

  const positionMenu = useCallback(() => {
    const btn = btnRef.current;
    const menu = menuRef.current;
    if (!btn || !menu) return;

    const rect = btn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const gap = 8;
    let top = rect.top - menuRect.height - gap;
    let left = rect.left;
    if (top < 8) top = rect.bottom + gap;
    if (left + menuRect.width > window.innerWidth - 8) left = window.innerWidth - menuRect.width - 8;
    if (left < 8) left = 8;
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }, []);

  useLayoutEffect(() => {
    if (open) positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    const onScroll = () => positionMenu();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', positionMenu);
    return () => {
      document.removeEventListener('click', handler);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', positionMenu);
    };
  }, [open, positionMenu]);

  const handleSelect = useCallback((modeId) => {
    setCurrentMode(modeId);
    setOpen(false);
  }, [setCurrentMode]);

  return (
    <div className="dropdown-wrapper quick-dropdown-wrapper">
      <button
        className="action-btn quick-btn"
        ref={btnRef}
        title={activeMode.label}
        id="quickBtn"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <ActiveIcon size={16} />
        <span>{activeMode.label}</span>
        <ChevronRight size={12} />
      </button>
      <div
        className={`dropdown-menu quick-menu${open ? ' show' : ''}`}
        id="quickMenu"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        {MODES.map(mode => {
          const Icon = mode.icon;
          const isActive = mode.id === currentMode;
          return (
            <div
              key={mode.id}
              className={`dropdown-item${isActive ? ' active' : ''}`}
              data-mode={mode.id}
              onClick={() => handleSelect(mode.id)}
            >
              <div className="dropdown-item-header">
                <Icon size={20} />
                <span>{mode.label}</span>
              </div>
              <p className="dropdown-item-desc">{mode.desc}</p>
              {isActive && (
                <div className="dropdown-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
