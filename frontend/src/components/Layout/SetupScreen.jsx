import React from 'react'

/**
 * SetupScreen — shared wrapper for all mode setup pages.
 * Gives a full-height centered layout with a consistent hero,
 * background glow, and card panel.
 */
export const SetupScreen = ({ icon, title, subtitle, accent = '#E8A020', children }) => (
  <div style={{
    minHeight: '100%',
    background: 'var(--bg-0)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Background radial glow */}
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 600, height: 600, borderRadius: '50%',
      background: `radial-gradient(circle, ${accent}0A 0%, transparent 65%)`,
      pointerEvents: 'none',
    }} />
    {/* Corner noise texture dots */}
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: 320, height: 320,
      backgroundImage: `radial-gradient(${accent}18 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      pointerEvents: 'none', opacity: 0.6,
      maskImage: 'radial-gradient(ellipse 60% 60% at 100% 0%, black 30%, transparent 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 100% 0%, black 30%, transparent 80%)',
    }} />

    <div className="anim-fade-up" style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: 20,
          background: `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
          border: `1px solid ${accent}40`,
          fontSize: 32, marginBottom: 20,
          boxShadow: `0 8px 32px ${accent}20`,
          color: accent,
        }}>
          {icon}
        </div>
        <h1 className="display" style={{ fontSize: 26, color: 'var(--t1)', marginBottom: 8, lineHeight: 1.2 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 340, margin: '0 auto' }}>
          {subtitle}
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--bg-1)',
        border: `1px solid var(--line)`,
        borderRadius: 20,
        padding: '28px 24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {children}
      </div>
    </div>
  </div>
)

/**
 * SectionLabel — consistent uppercase section header inside a card.
 */
export const SectionLabel = ({ children }) => (
  <p style={{
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 10,
  }}>
    {children}
  </p>
)

/**
 * OptionButton — color/difficulty pick button.
 * selected + accent control active state.
 */
export const OptionButton = ({ selected, accent = '#E8A020', onClick, children, style = {} }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '14px 10px',
      borderRadius: 14,
      border: `2px solid ${selected ? accent : 'var(--line)'}`,
      background: selected
        ? `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)`
        : 'var(--bg-2)',
      cursor: 'pointer',
      transition: 'all 0.15s',
      outline: 'none',
      boxShadow: selected ? `0 0 0 1px ${accent}30, 0 4px 16px ${accent}15` : 'none',
      ...style,
    }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--line-hi)' }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--line)' }}
  >
    {children}
  </button>
)

/**
 * StartButton — the primary CTA at the bottom of every setup screen.
 */
export const StartButton = ({ onClick, children, accent = '#E8A020' }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      padding: '14px 0',
      borderRadius: 14,
      border: 'none',
      background: `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`,
      color: '#0C0C0E',
      fontSize: 15,
      fontWeight: 800,
      fontFamily: 'inherit',
      cursor: 'pointer',
      transition: 'all 0.15s',
      letterSpacing: '0.02em',
      boxShadow: `0 4px 24px ${accent}40`,
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${accent}50` }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 24px ${accent}40` }}
    onMouseDown={e => { e.currentTarget.style.transform = 'translateY(0) scale(0.99)' }}
  >
    {children}
  </button>
)
