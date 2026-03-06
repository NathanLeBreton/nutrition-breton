import { useState } from 'react'
import Aujourd'hui from './pages/Aujourdhui'
import Historique from './pages/Historique'
import Parametres from './pages/Parametres'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'

export default function App() {
  const [view, setView] = useState('aujourdhui')
  const [toast, setToast] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const showToast = (msg) => setToast(msg)

  const refresh = () => setRefreshKey(k => k + 1)

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto',
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: '#0d0d14', position: 'relative', overflow: 'hidden',
    }}>
      {view === 'aujourdhui'  && <Aujourdhui refreshKey={refreshKey} onRefresh={refresh} showToast={showToast} />}
      {view === 'historique'  && <Historique refreshKey={refreshKey} />}
      {view === 'parametres'  && <Parametres showToast={showToast} onSaved={refresh} />}

      <BottomNav current={view} onNav={setView} />

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
