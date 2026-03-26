import { useState, useRef, useCallback, useEffect } from 'react'

export default function FloatingWindow({
  title = 'Pencere',
  icon = '',
  children,
  defaultX = 100,
  defaultY = 100,
  defaultWidth = 500,
  defaultHeight = 400,
  onClose,
  className = '',
}) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY })
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight })
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Sürüklenmeden önceki durumu sakla
  const prevRect = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const windowRef = useRef(null)

  // ESC ile kapat
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // --- Sürükleme ---
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('.fw-controls')) return
    if (isMaximized) return

    e.preventDefault()
    e.stopPropagation()
    const rect = windowRef.current.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setIsDragging(true)

    const handleMove = (ev) => {
      ev.preventDefault()
      const nx = ev.clientX - dragOffset.current.x
      const ny = Math.max(0, ev.clientY - dragOffset.current.y)
      setPos({ x: nx, y: ny })
    }

    const handleUp = () => {
      setIsDragging(false)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }, [isMaximized])

  // --- Kontroller ---
  const handleMinimize = () => setIsMinimized((v) => !v)

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore
      if (prevRect.current) {
        setPos({ x: prevRect.current.x, y: prevRect.current.y })
        setSize({ w: prevRect.current.w, h: prevRect.current.h })
      }
      setIsMaximized(false)
    } else {
      // Maximize
      prevRect.current = { ...pos, ...{ w: size.w, h: size.h } }
      setPos({ x: 0, y: 0 })
      setSize({ w: window.innerWidth, h: window.innerHeight })
      setIsMaximized(true)
    }
  }

  const handleClose = () => {
    if (onClose) onClose()
  }

  const style = isMaximized
    ? { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 400 }
    : {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: isMinimized ? 'auto' : size.h,
        zIndex: 400,
      }

  return (
    <div
      ref={windowRef}
      className={`floating-window ${isDragging ? 'fw-dragging' : ''} ${isMaximized ? 'fw-maximized' : ''} ${isMinimized ? 'fw-minimized' : ''} ${className}`}
      style={style}
    >
      {/* Title Bar */}
      <div
        className="fw-titlebar"
        onPointerDown={handlePointerDown}
      >
        <div className="fw-titlebar-left">
          <span className="fw-title">{icon && <span className="fw-icon">{icon}</span>}{title}</span>
        </div>
        <div className="fw-controls">
          <button className="fw-btn fw-btn-close" onClick={handleClose} title="Kapat">
            <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button className="fw-btn fw-btn-minimize" onClick={handleMinimize} title="Küçült">
            <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button className="fw-btn fw-btn-maximize" onClick={handleMaximize} title={isMaximized ? 'Küçült' : 'Büyüt'}>
            {isMaximized ? (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <rect x="3" y="1" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="3" width="7" height="7" rx="1" fill="var(--bg-card)" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="fw-body">
          {children}
        </div>
      )}
    </div>
  )
}
