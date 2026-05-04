import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ text, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const iconRef = useRef<HTMLButtonElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    const tipW = 260

    let top = 0
    let left = 0

    if (position === 'top') {
      top = rect.top + window.scrollY - 8
      left = rect.left + window.scrollX + rect.width / 2
    } else if (position === 'bottom') {
      top = rect.bottom + window.scrollY + 8
      left = rect.left + window.scrollX + rect.width / 2
    } else if (position === 'left') {
      top = rect.top + window.scrollY + rect.height / 2
      left = rect.left + window.scrollX - 8
    } else {
      top = rect.top + window.scrollY + rect.height / 2
      left = rect.right + window.scrollX + 8
    }

    // Keep within viewport
    const maxLeft = window.innerWidth - tipW - 12
    left = Math.min(Math.max(left - tipW / 2, 8), maxLeft)

    setCoords({ top, left })
  }, [visible, position])

  return (
    <>
      <button
        ref={iconRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="inline-flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 15,
          height: 15,
          background: 'rgba(107,114,128,0.2)',
          color: '#6b7280',
          fontSize: 9,
          fontWeight: 700,
          border: '1px solid #2a2f38',
          cursor: 'help',
          lineHeight: 1,
        }}
        tabIndex={0}
        aria-label="More info"
      >
        ?
      </button>

      {visible && (
        <div
          ref={tipRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: 260,
            transform: position === 'top' ? 'translateY(-100%)' : position === 'left' ? 'translateY(-50%)' : position === 'right' ? 'translateY(-50%)' : undefined,
            background: '#1e2533',
            border: '1px solid #3b4252',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 11,
            lineHeight: 1.55,
            color: '#cbd5e1',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>
      )}
    </>
  )
}

// Convenience wrapper: label + tooltip icon inline
export function SectionHeader({ title, tooltip, color, position }: {
  title: string
  tooltip: string
  color?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-sm font-semibold tracking-widest uppercase"
        style={{ color: color || '#6b7280' }}
      >
        {title}
      </span>
      <Tooltip text={tooltip} position={position} />
    </div>
  )
}
