export default function Jauge({ label, valeur, objectif, couleur, unite }) {
  const pct = Math.min((valeur / objectif) * 100, 100)
  const depasse = valeur > objectif
  const r = 28, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{
      background: '#12121e', border: `1px solid ${depasse ? couleur + '44' : '#1a1a2e'}`,
      borderRadius: 16, padding: '16px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="35" cy="35" r={r} fill="none" stroke="#1a1a2e" strokeWidth="6" />
        <circle cx="35" cy="35" r={r} fill="none"
          stroke={depasse ? '#ef4444' : couleur}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text x="35" y="35"
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '35px 35px' }}
          fill={depasse ? '#ef4444' : couleur}
          fontSize="11" fontWeight="700" fontFamily="DM Sans">
          {Math.round(pct)}%
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1, color: depasse ? '#ef4444' : '#fff', lineHeight: 1 }}>
          {Math.round(valeur)}<span style={{ fontSize: 11, color: '#4a4a6a', marginLeft: 2 }}>{unite}</span>
        </div>
        <div style={{ fontSize: 9, color: '#4a4a6a', marginTop: 2 }}>/ {objectif}{unite}</div>
        <div style={{ fontSize: 10, color: '#6b6b8a', marginTop: 4, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  )
}
