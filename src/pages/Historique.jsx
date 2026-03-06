import { useState, useEffect } from 'react'
import { getAllJournal, getObjectifs } from '../db/db'

const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
  weekday: 'short', day: 'numeric', month: 'short'
})

const totaux = (items) => items.reduce((acc, item) => ({
  calories:  acc.calories  + (item.calories  || 0),
  proteines: acc.proteines + (item.proteines || 0),
  glucides:  acc.glucides  + (item.glucides  || 0),
  lipides:   acc.lipides   + (item.lipides   || 0),
}), { calories: 0, proteines: 0, glucides: 0, lipides: 0 })

export default function Historique({ refreshKey }) {
  const [journal, setJournal] = useState([])
  const [objectifs, setObjectifs] = useState(null)

  useEffect(() => {
    Promise.all([getAllJournal(), getObjectifs()]).then(([j, o]) => {
      setJournal(j)
      setObjectifs(o)
    })
  }, [refreshKey])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '20px 20px 16px', background: '#0d0d14',
        borderBottom: '1px solid #1a1a2e',
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: '#fff' }}>
          Historique
        </div>
        <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>{journal.length} jours enregistrés</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {journal.length === 0 && (
          <div style={{ color: '#3a3a5a', textAlign: 'center', padding: 60, fontSize: 14, lineHeight: 1.8 }}>
            Aucun jour enregistré.<br />Commence à logger aujourd'hui !
          </div>
        )}
        {journal.map(entry => {
          const t = totaux(entry.items)
          const ok = objectifs && t.calories >= objectifs.calories * 0.85 && t.proteines >= objectifs.proteines * 0.85
          return (
            <div key={entry.id} style={{
              background: '#12121e', border: `1px solid ${ok ? '#10b98133' : '#1a1a2e'}`,
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1, color: '#fff' }}>
                  {fmtDate(entry.date)}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  background: ok ? '#10b98122' : '#1a1a2e',
                  color: ok ? '#10b981' : '#4a4a6a',
                }}>
                  {ok ? '✓ Objectifs atteints' : `${entry.items.length} aliments`}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Kcal',  value: Math.round(t.calories),  couleur: '#f97316' },
                  { label: 'Prot',  value: Math.round(t.proteines) + 'g', couleur: '#ef4444' },
                  { label: 'Gluc',  value: Math.round(t.glucides)  + 'g', couleur: '#eab308' },
                  { label: 'Lip',   value: Math.round(t.lipides)   + 'g', couleur: '#3b82f6' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: s.couleur }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
