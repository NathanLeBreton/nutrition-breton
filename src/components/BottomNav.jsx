const items = [
  { id: 'aujourdhui', icon: '🥗', label: "Aujourd'hui" },
  { id: 'historique', icon: '📅', label: 'Historique'  },
  { id: 'parametres', icon: '⚙️', label: 'Paramètres'  },
]

export default function BottomNav({ current, onNav }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#0d0d14', borderTop: '1px solid #1a1a2e',
      display: 'flex', padding: '10px 0 20px', zIndex: 100,
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onNav(item.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          border: 'none', background: 'none', padding: '4px 0',
          color: current === item.id ? '#10b981' : '#3a3a5a',
          transition: 'color 0.15s',
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
