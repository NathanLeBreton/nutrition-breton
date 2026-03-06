import { useEffect } from 'react'

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      background: '#1a1a2e', border: '1px solid #2a2a4a',
      borderRadius: 12, padding: '12px 20px',
      color: '#e8e8f0', fontSize: 13, fontWeight: 600,
      zIndex: 300, whiteSpace: 'nowrap',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {message}
    </div>
  )
}
