import { useState, useEffect, useRef } from 'react'
import { getJournalDu, saveJournalDu, getObjectifs, getAllRepas, saveRepas, deleteRepas } from '../db/db'
import Jauge from '../components/Jauge'

const today = () => new Date().toISOString().slice(0, 10)

const totaux = (items) => items.reduce((acc, item) => ({
  calories:  acc.calories  + (item.calories  || 0),
  proteines: acc.proteines + (item.proteines || 0),
  glucides:  acc.glucides  + (item.glucides  || 0),
  lipides:   acc.lipides   + (item.lipides   || 0),
}), { calories: 0, proteines: 0, glucides: 0, lipides: 0 })

// Recherche Open Food Facts
async function searchFood(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&lc=fr&cc=fr`
  const res = await fetch(url)
  const data = await res.json()
  return (data.products || []).filter(p => p.nutriments && p.product_name).map(p => ({
    id: p.code,
    nom: p.product_name_fr || p.product_name,
    marque: p.brands,
    calories:  Math.round(p.nutriments['energy-kcal_100g'] || 0),
    proteines: Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
    glucides:  Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
    lipides:   Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
    pour100g: true,
  }))
}

// Scan code-barre
async function fetchBarcode(code) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
  const data = await res.json()
  if (data.status !== 1) return null
  const p = data.product
  return {
    id: code,
    nom: p.product_name_fr || p.product_name,
    marque: p.brands,
    calories:  Math.round(p.nutriments['energy-kcal_100g'] || 0),
    proteines: Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
    glucides:  Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
    lipides:   Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
    pour100g: true,
  }
}

export default function Aujourdhui({ refreshKey, onRefresh, showToast }) {
  const [items, setItems]           = useState([])
  const [objectifs, setObjectifs]   = useState({ calories: 3000, proteines: 200, glucides: 250, lipides: 90 })
  const [showModal, setShowModal]   = useState(false)
  const [mode, setMode]             = useState('recherche') // recherche | scan | manuel | repas
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState([])
  const [searching, setSearching]   = useState(false)
  const [selected, setSelected]     = useState(null)
  const [quantite, setQuantite]     = useState('100')
  const [repasEnregistres, setRepasEnregistres] = useState([])
  const [showSaveRepas, setShowSaveRepas] = useState(false)
  const [nomRepas, setNomRepas]     = useState('')
  const [manuel, setManuel]         = useState({ nom: '', calories: '', proteines: '', glucides: '', lipides: '' })
  const scanRef = useRef(null)
  const date = today()

  const load = async () => {
    const [journal, obj, repas] = await Promise.all([
      getJournalDu(date),
      getObjectifs(),
      getAllRepas(),
    ])
    setItems(journal.items)
    setObjectifs(obj)
    setRepasEnregistres(repas)
  }

  useEffect(() => { load() }, [refreshKey])

  const save = async (newItems) => {
    await saveJournalDu(date, newItems)
    setItems(newItems)
    onRefresh()
  }

  const removeItem = async (idx) => {
    const newItems = items.filter((_, i) => i !== idx)
    await save(newItems)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setResults([])
    const res = await searchFood(query)
    setResults(res)
    setSearching(false)
  }

  const handleScanInput = async (e) => {
    const code = e.target.value.trim()
    if (code.length >= 8) {
      setSearching(true)
      const product = await fetchBarcode(code)
      setSearching(false)
      if (product) {
        setSelected(product)
        setQuantite('100')
      } else {
        showToast('❌ Produit non trouvé')
      }
    }
  }

  const addItem = () => {
    if (!selected) return
    const q = parseFloat(quantite) || 100
    const ratio = q / 100
    const item = {
      nom:       selected.nom,
      quantite:  q,
      calories:  Math.round(selected.calories  * ratio),
      proteines: Math.round(selected.proteines * ratio * 10) / 10,
      glucides:  Math.round(selected.glucides  * ratio * 10) / 10,
      lipides:   Math.round(selected.lipides   * ratio * 10) / 10,
    }
    const newItems = [...items, item]
    save(newItems)
    setShowModal(false)
    setSelected(null)
    setQuery('')
    setResults([])
    setQuantite('100')
    showToast(`✅ ${item.nom} ajouté !`)
  }

  const addManuel = () => {
    if (!manuel.nom) { showToast('❌ Nom obligatoire'); return }
    const item = {
      nom:       manuel.nom,
      quantite:  null,
      calories:  parseFloat(manuel.calories)  || 0,
      proteines: parseFloat(manuel.proteines) || 0,
      glucides:  parseFloat(manuel.glucides)  || 0,
      lipides:   parseFloat(manuel.lipides)   || 0,
    }
    const newItems = [...items, item]
    save(newItems)
    setShowModal(false)
    setManuel({ nom: '', calories: '', proteines: '', glucides: '', lipides: '' })
    showToast(`✅ ${item.nom} ajouté !`)
  }

  const addRepas = async (repas) => {
    const repasItems = JSON.parse(repas.items)
    const newItems = [...items, ...repasItems]
    await save(newItems)
    setShowModal(false)
    showToast(`✅ ${repas.nom} ajouté !`)
  }

  const handleSaveRepas = async () => {
    if (!nomRepas.trim() || items.length === 0) return
    await saveRepas(nomRepas, items)
    setNomRepas('')
    setShowSaveRepas(false)
    load()
    showToast('💾 Repas enregistré !')
  }

  const handleDeleteRepas = async (id) => {
    if (!confirm('Supprimer ce repas enregistré ?')) return
    await deleteRepas(id)
    load()
  }

  const t = totaux(items)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '20px 20px 16px', background: '#0d0d14',
        borderBottom: '1px solid #1a1a2e',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color: '#fff' }}>
            Aujourd'hui
          </div>
          <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none', borderRadius: 12, padding: '10px 16px',
          color: '#fff', fontSize: 13, fontWeight: 600,
        }}>＋ Ajouter</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 120px' }}>

        {/* Jauges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <Jauge label="Calories"  valeur={t.calories}  objectif={objectifs.calories}  couleur="#f97316" unite="kcal" />
          <Jauge label="Protéines" valeur={t.proteines} objectif={objectifs.proteines} couleur="#ef4444" unite="g" />
          <Jauge label="Glucides"  valeur={t.glucides}  objectif={objectifs.glucides}  couleur="#eab308" unite="g" />
          <Jauge label="Lipides"   valeur={t.lipides}   objectif={objectifs.lipides}   couleur="#3b82f6" unite="g" />
        </div>

        {/* Bouton sauvegarder repas du jour */}
        {items.length > 0 && (
          <button onClick={() => setShowSaveRepas(true)} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: '1px dashed #2a2a4a',
            background: 'none', color: '#6b6b8a', fontSize: 12, fontWeight: 600, marginBottom: 16,
          }}>
            💾 Sauvegarder ce repas
          </button>
        )}

        {/* Liste aliments */}
        {items.length === 0 && (
          <div style={{ color: '#3a3a5a', textAlign: 'center', padding: 40, fontSize: 14, lineHeight: 1.8 }}>
            Aucun aliment ajouté.<br />Tape ＋ Ajouter pour commencer !
          </div>
        )}
        {items.map((item, i) => (
          <div key={i} style={{
            background: '#12121e', border: '1px solid #1a1a2e',
            borderRadius: 12, padding: '12px 14px', marginBottom: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0', marginBottom: 4 }}>
                {item.nom} {item.quantite && <span style={{ color: '#4a4a6a', fontWeight: 400 }}>({item.quantite}g)</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Chip color="#f97316" value={`${Math.round(item.calories)} kcal`} />
                <Chip color="#ef4444" value={`${item.proteines}g prot`} />
                <Chip color="#eab308" value={`${item.glucides}g gluc`} />
                <Chip color="#3b82f6" value={`${item.lipides}g lip`} />
              </div>
            </div>
            <button onClick={() => removeItem(i)}
              style={{ background: 'none', border: 'none', color: '#3a3a5a', fontSize: 16, padding: 4, marginLeft: 8 }}>
              🗑
            </button>
          </div>
        ))}
      </div>

      {/* Modal sauvegarder repas */}
      {showSaveRepas && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200, backdropFilter: 'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setShowSaveRepas(false)}>
          <div style={{
            width: '100%', maxWidth: 430, margin: '0 auto',
            background: '#12121e', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#fff' }}>
              Sauvegarder le repas
            </div>
            <input placeholder="Nom du repas (ex: Repas midi standard)"
              value={nomRepas} onChange={e => setNomRepas(e.target.value)}
              style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSaveRepas(false)} style={btnSecondaire}>Annuler</button>
              <button onClick={handleSaveRepas} style={btnPrimaire}>💾 Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout aliment */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200, backdropFilter: 'blur(4px)',
        }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{
            width: '100%', maxWidth: 430, margin: '0 auto',
            background: '#12121e', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#fff' }}>
              Ajouter un aliment
            </div>

            {/* Tabs mode */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'recherche', label: '🔍 Recherche' },
                { id: 'scan',      label: '📷 Code-barre' },
                { id: 'manuel',    label: '✏️ Manuel' },
                { id: 'repas',     label: '⭐ Repas' },
              ].map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); setSelected(null); setResults([]) }} style={{
                  flex: 1, padding: '7px 2px', borderRadius: 8, border: 'none', fontSize: 10, fontWeight: 600,
                  background: mode === m.id ? '#10b981' : '#1a1a2e',
                  color: mode === m.id ? '#fff' : '#4a4a6a',
                }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* MODE RECHERCHE */}
            {mode === 'recherche' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Ex: poulet, riz, avocat..."
                    value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleSearch} style={{
                    background: '#10b981', border: 'none', borderRadius: 8,
                    padding: '0 16px', color: '#fff', fontWeight: 700, fontSize: 13,
                  }}>Go</button>
                </div>
                {searching && <div style={{ color: '#4a4a6a', textAlign: 'center', fontSize: 13 }}>Recherche...</div>}
                {results.map(r => (
                  <div key={r.id} onClick={() => { setSelected(r); setQuantite('100') }} style={{
                    background: selected?.id === r.id ? '#0f2a1a' : '#1a1a2e',
                    border: `1.5px solid ${selected?.id === r.id ? '#10b981' : '#22223a'}`,
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{r.nom}</div>
                    {r.marque && <div style={{ fontSize: 11, color: '#4a4a6a' }}>{r.marque}</div>}
                    <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 4 }}>
                      {r.calories} kcal · {r.proteines}g prot · {r.glucides}g gluc · {r.lipides}g lip <span style={{ color: '#3a3a5a' }}>(pour 100g)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODE SCAN */}
            {mode === 'scan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: '#6b6b8a' }}>Entre le code-barre manuellement ou scanne avec ton lecteur :</div>
                <input ref={scanRef} placeholder="Code-barre (ex: 3017620422003)"
                  onChange={handleScanInput} style={inputStyle} autoFocus />
                {searching && <div style={{ color: '#4a4a6a', textAlign: 'center', fontSize: 13 }}>Recherche du produit...</div>}
                {selected && (
                  <div style={{ background: '#0f2a1a', border: '1.5px solid #10b981', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{selected.nom}</div>
                    <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 4 }}>
                      {selected.calories} kcal · {selected.proteines}g prot (pour 100g)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE MANUEL */}
            {mode === 'manuel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input placeholder="Nom de l'aliment *" value={manuel.nom}
                  onChange={e => setManuel(f => ({ ...f, nom: e.target.value }))}
                  style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'calories',  label: 'Calories (kcal)', couleur: '#f97316' },
                    { key: 'proteines', label: 'Protéines (g)',    couleur: '#ef4444' },
                    { key: 'glucides',  label: 'Glucides (g)',     couleur: '#eab308' },
                    { key: 'lipides',   label: 'Lipides (g)',      couleur: '#3b82f6' },
                  ].map(({ key, label, couleur }) => (
                    <div key={key}>
                      <div style={{ fontSize: 9, color: couleur, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                      <input type="number" placeholder="0" value={manuel[key]}
                        onChange={e => setManuel(f => ({ ...f, [key]: e.target.value }))}
                        style={inputStyle} />
                    </div>
                  ))}
                </div>
                <button onClick={addManuel} style={btnPrimaire}>＋ Ajouter</button>
              </div>
            )}

            {/* MODE REPAS ENREGISTRÉS */}
            {mode === 'repas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {repasEnregistres.length === 0 && (
                  <div style={{ color: '#3a3a5a', textAlign: 'center', padding: 20, fontSize: 13 }}>
                    Aucun repas enregistré.<br />Sauvegarde un repas depuis la page principale !
                  </div>
                )}
                {repasEnregistres.map(r => {
                  const repasItems = JSON.parse(r.items)
                  const t = totaux(repasItems)
                  return (
                    <div key={r.id} style={{
                      background: '#1a1a2e', border: '1.5px solid #22223a',
                      borderRadius: 10, padding: '12px 14px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div onClick={() => addRepas(r)} style={{ flex: 1, cursor: 'pointer' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e8f0' }}>{r.nom}</div>
                        <div style={{ fontSize: 11, color: '#6b6b8a', marginTop: 2 }}>
                          {Math.round(t.calories)} kcal · {Math.round(t.proteines)}g prot · {repasItems.length} aliments
                        </div>
                      </div>
                      <button onClick={() => handleDeleteRepas(r.id)}
                        style={{ background: 'none', border: 'none', color: '#3a3a5a', fontSize: 14, padding: 4 }}>🗑</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quantité + bouton ajouter (recherche et scan) */}
            {selected && (mode === 'recherche' || mode === 'scan') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #1a1a2e', paddingTop: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#4a4a6a', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                    Quantité (g)
                  </div>
                  <input type="number" value={quantite}
                    onChange={e => setQuantite(e.target.value)}
                    style={inputStyle} />
                </div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>
                  → {Math.round(selected.calories * (parseFloat(quantite)||100) / 100)} kcal ·{' '}
                  {Math.round(selected.proteines * (parseFloat(quantite)||100) / 100 * 10)/10}g prot ·{' '}
                  {Math.round(selected.glucides  * (parseFloat(quantite)||100) / 100 * 10)/10}g gluc ·{' '}
                  {Math.round(selected.lipides   * (parseFloat(quantite)||100) / 100 * 10)/10}g lip
                </div>
                <button onClick={addItem} style={btnPrimaire}>＋ Ajouter</button>
              </div>
            )}

            <button onClick={() => { setShowModal(false); setSelected(null); setResults([]); setQuery('') }}
              style={btnSecondaire}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ color, value }) {
  return (
    <span style={{
      fontSize: 10, color, fontWeight: 600,
      background: color + '15', borderRadius: 4, padding: '2px 6px',
    }}>
      {value}
    </span>
  )
}

const inputStyle = {
  width: '100%', background: '#1a1a2e', border: '1.5px solid #22223a',
  borderRadius: 8, padding: '10px 12px', color: '#e8e8f0',
  fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
}

const btnPrimaire = {
  flex: 2, padding: 14, borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: '#fff', fontSize: 14, fontWeight: 600, width: '100%',
}

const btnSecondaire = {
  flex: 1, padding: 14, borderRadius: 12, border: 'none',
  background: '#1a1a2e', color: '#6b6b8a', fontSize: 14, fontWeight: 600,
}
