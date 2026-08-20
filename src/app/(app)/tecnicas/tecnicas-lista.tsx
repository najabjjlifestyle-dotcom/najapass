'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import TecnicaItem from './tecnica-item'

type Item = {
  id: string
  nomeExibido: string
  global: boolean
  temCustom: boolean
  ehVariacao: boolean
  descricao: string | null
}
type Grupo = { categoria: string; itens: Item[] }

// Lista de posições com categorias colapsáveis (acordeão). Todas começam
// expandidas — o estado é local, só pra facilitar a navegação no mobile.
export default function TecnicasLista({ grupos }: { grupos: Grupo[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggle(cat: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {grupos.map(g => {
        const isCollapsed = collapsed.has(g.categoria)
        return (
          <div key={g.categoria}>
            <button onClick={() => toggle(g.categoria)}
              className="w-full flex items-center justify-between py-2 active:opacity-70 transition-opacity">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
                  {g.categoria}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                  ({g.itens.length})
                </span>
              </div>
              <ChevronDown size={16}
                style={{
                  color: 'var(--brand-texto-muted)',
                  transform: isCollapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
            </button>

            {!isCollapsed && (
              <div className="space-y-1.5 mt-1">
                {g.itens.map(t => (
                  <TecnicaItem
                    key={t.id}
                    id={t.id}
                    nomeExibido={t.nomeExibido}
                    global={t.global}
                    temCustom={t.temCustom}
                    ehVariacao={t.ehVariacao}
                    descricao={t.descricao}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
