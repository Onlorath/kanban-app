import { useState, useRef, useEffect } from 'react'

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function DatePicker({ value, onChange, onTimeChange, timeValue }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const initialDate = value ? new Date(value) : new Date()
  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())
  const [showTime, setShowTime] = useState(!!timeValue)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleSelectDay = (day) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dateStr = `${viewYear}-${m}-${d}`
    onChange(dateStr)
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    onTimeChange?.('')
    setShowTime(false)
    setOpen(false)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  const today = new Date()
  const isToday = (day) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const isSelected = (day) =>
    selectedDate &&
    day === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear()

  const formatDisplay = () => {
    if (!value) return ''
    const d = new Date(value + 'T00:00:00')
    let str = `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`
    if (timeValue) str += ` ${timeValue}`
    return str
  }

  return (
    <div className="datepicker" ref={ref}>
      <div
        className="datepicker-input"
        onClick={() => setOpen(!open)}
      >
        <span className="datepicker-icon">📅</span>
        <span className={value ? '' : 'datepicker-placeholder'}>
          {value ? formatDisplay() : 'Tarih seçin'}
        </span>
        {value && (
          <button
            className="datepicker-clear"
            onClick={(e) => { e.stopPropagation(); handleClear() }}
          >×</button>
        )}
      </div>

      {open && (
        <div className="datepicker-dropdown">
          <div className="datepicker-nav">
            <button onClick={handlePrevMonth}>‹</button>
            <span className="datepicker-month-label">
              {MONTHS_TR[viewMonth]} {viewYear}
            </span>
            <button onClick={handleNextMonth}>›</button>
          </div>

          <div className="datepicker-grid">
            {DAYS_TR.map((d) => (
              <div key={d} className="datepicker-weekday">{d}</div>
            ))}
            {cells.map((day, i) => (
              <div
                key={i}
                className={`datepicker-day ${day === null ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''} ${day && isSelected(day) ? 'selected' : ''}`}
                onClick={() => day && handleSelectDay(day)}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="datepicker-time-toggle">
            <label className="time-toggle-label">
              <input
                type="checkbox"
                checked={showTime}
                onChange={(e) => {
                  setShowTime(e.target.checked)
                  if (!e.target.checked) onTimeChange?.('')
                }}
              />
              <span>Saat ekle</span>
            </label>
            {showTime && (
              <input
                type="time"
                className="datepicker-time-input"
                value={timeValue || ''}
                onChange={(e) => onTimeChange?.(e.target.value)}
              />
            )}
          </div>

          {value && (
            <div className="datepicker-footer">
              <button className="btn btn-sm" onClick={handleClear}>Temizle</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
