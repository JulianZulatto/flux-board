import './App.css'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import FluxERPControlBoard from './components/FluxBoard'
import ClientsBoard from './components/ClientsBoard'

function App() {
  const [section, setSection] = useState<'tickets' | 'clientes'>('tickets')

  return (
    <div>
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl gap-2">
          <Button
            variant={section === 'tickets' ? 'default' : 'outline'}
            onClick={() => setSection('tickets')}
          >
            Tickets
          </Button>
          <Button
            variant={section === 'clientes' ? 'default' : 'outline'}
            onClick={() => setSection('clientes')}
          >
            Clientes
          </Button>
        </div>
      </div>

      {section === 'tickets' ? <FluxERPControlBoard /> : <ClientsBoard />}
    </div>
  )
}

export default App
