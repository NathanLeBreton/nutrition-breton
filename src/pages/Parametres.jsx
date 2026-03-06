import { useState, useEffect } from 'react'
import { getObjectifs, saveObjectifs } from '../db/db'

export default function Parametres({ showToast, onSaved }) {
  const [form, setForm] = useState({ calories: 3000, proteines: 200, glucides: 250, lipides: 90 })

  useEffect(() => {
    getObjectifs().then(setForm)
  }, [])

  const handleSave = async () => {
    await saveObjectifs(form)
    onSaved()
    showToast('✅ Objectifs sauvegardés !')
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        padding: '20px 20px 16px', background: '#0d0d14',
        borderBottom: '1px solid #1a1a2e',
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: '#fff' }}>
          Paramètres
        </div>
        <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>Tes objectifs nutritionnels</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { key: 'calories',  label: 'Calories',   unite: 'kcal', couleur: '#f97316' },
          { key: 'proteines', label: 'Protéines',  unite: 'g',    couleur: '#ef4444' },
          { key: 'glucides',  label: 'Glucides',   unite: 'g',    couleur: '#eab308' },
          { key: 'lipides',   label: 'Lipides',    unite: 'g',    couleur: '#3b82f6' },
        ].map(({ key, label, unite, couleur }) => (
          <div key={key} style={{ background: '#12121e', border: '1px solid #1a1a2e', borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{label}</span>
              <span style={{ fontSize: 11, color: couleur, fontWeight: 600 }}>{form[key]} {unite}</span>
            </div>
            <input type="number" value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
              style={{
                width: '100%', background: '#1a1a2e', border: `1.5px solid ${couleur}44`,
                borderRadius: 8, padding: '10px 12px', color: '#e8e8f0',
                fontSize: 16, fontWeight: 700, outline: 'none',
              }}
            />
          </div>
        ))}

        <button onClick={handleSave} style={{
          width: '100%', padding: 16, borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', fontSize: 15, fontWeight: 700, marginTop: 8,
        }}>
          ✓ Sauvegarder les objectifs
        </button>

        <div style={{ background: '#12121e', border: '1px solid #1a1a2e', borderRadius: 14, padding: 16, marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#4a4a6a', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
            Tes objectifs actuels
          </div>
          <div style={{ fontSize: 12, color: '#6b6b8a', lineHeight: 2 }}>
            🔥 {form.calories} kcal/jour<br/>
            🥩 {form.proteines}g de protéines<br/>
            🍚 {form.glucides}g de glucides<br/>
            🥑 {form.lipides}g de lipides
          </div>
        </div>
      </div>
    </div>
  )
}
