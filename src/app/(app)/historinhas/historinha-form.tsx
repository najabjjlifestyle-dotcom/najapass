'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { salvarHistorinha, deletarHistorinha } from './actions'
import BackButton from '@/components/back-button'

type TecnicaOpt = { id: string; nome: string; categoria: string }
type TecnicaItem = { id: string; nome: string; categoria: string }

type Props = {
  id?: string
  nomeInicial?: string
  tecnicasIniciais?: TecnicaItem[]
  tecnicasDisponiveis: TecnicaOpt[]
}

export default function HistorinhaForm({ id, nomeInicial = '', tecnicasIniciais = [], tecnicasDisponiveis }: Props) {
  const router = useRouter()
  const [nome, setNome] = useState(nomeInicial)
  const [tecnicas, setTecnicas] = useState<TecnicaItem[]>(tecnicasIniciais)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  const resultadosBusca = busca.trim().length >= 2
    ? tecnicasDisponiveis
        .filter(t => t.nome.toLowerCase().includes(busca.toLowerCase()) && !tecnicas.some(sel => sel.id === t.id))
        .slice(0, 6)
    : []

  function adicionarTecnica(tecnica: TecnicaOpt) {
    if (tecnicas.some(t => t.id === tecnica.id)) return
    setTecnicas(prev => [...prev, tecnica])
    setBusca('')
  }

  function removerTecnica(id: string) {
    setTecnicas(prev => prev.filter(t => t.id !== id))
  }

  function moverParaCima(index: number) {
    if (index === 0) return
    setTecnicas(prev => {
      const arr = [...prev]
      ;[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]]
      return arr
    })
  }

  function moverParaBaixo(index: number) {
    if (index === tecnicas.length - 1) return
    setTecnicas(prev => {
      const arr = [...prev]
      ;[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]]
      return arr
    })
  }

  async function handleSalvar() {
    if (!nome.trim()) return
    setSalvando(true)
    await salvarHistorinha({
      id,
      nome: nome.trim(),
      tecnicas: tecnicas.map((t, i) => ({ tecnica_id: t.id, ordem: i })),
    })
    router.push('/historinhas')
  }

  async function handleDeletar() {
    if (!id) return
    if (!confirm('Excluir esta historinha?')) return
    await deletarHistorinha(id)
    router.push('/historinhas')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/historinhas" />
        <h1 className="font-bold text-lg uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          {id ? 'Editar Historinha' : 'Nova Historinha'}
        </h1>
      </header>

      <main className="px-5 pt-5 pb-36 space-y-6">
        <div>
          <label className="block text-[9px] uppercase tracking-widest mb-2"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Nome da historinha
          </label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Passagem Toreando"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--brand-surf)',
              border: '1px solid var(--brand-border)',
              color: 'var(--brand-texto)',
            }}
          />
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-widest mb-3"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Sequência de técnicas ({tecnicas.length})
          </label>

          {tecnicas.length === 0 && (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--brand-texto-muted)' }}>
              Adicione técnicas abaixo para montar a sequência
            </p>
          )}

          <div className="space-y-2">
            {tecnicas.map((t, i) => (
              <div key={t.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <span className="text-[10px] font-bold w-5 text-center flex-shrink-0"
                  style={{ color: 'var(--brand-gold)' }}>
                  {i + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
                    {t.nome}
                  </p>
                  <p className="text-[9px] truncate" style={{ color: 'var(--brand-texto-muted)' }}>
                    {t.categoria}
                  </p>
                </div>

                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moverParaCima(i)}
                    disabled={i === 0}
                    className="w-6 h-5 flex items-center justify-center rounded text-[10px]"
                    style={{ color: i === 0 ? 'var(--brand-border)' : 'var(--brand-texto-muted)' }}>
                    ↑
                  </button>
                  <button type="button" onClick={() => moverParaBaixo(i)}
                    disabled={i === tecnicas.length - 1}
                    className="w-6 h-5 flex items-center justify-center rounded text-[10px]"
                    style={{ color: i === tecnicas.length - 1 ? 'var(--brand-border)' : 'var(--brand-texto-muted)' }}>
                    ↓
                  </button>
                </div>

                <button type="button" onClick={() => removerTecnica(t.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0"
                  style={{ color: '#ef4444' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {tecnicas.length >= 2 && (
            <div className="mt-3 px-3 py-2 rounded-xl"
              style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>
                Sequência
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--brand-texto)' }}>
                {tecnicas.map(t => t.nome).join(' → ')}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[9px] uppercase tracking-widest mb-2"
            style={{ color: 'var(--brand-texto-muted)' }}>
            Adicionar técnica
          </label>
          <input
            type="text"
            placeholder="Buscar técnica..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}
          />
          {resultadosBusca.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {resultadosBusca.map(t => (
                <button key={t.id} type="button" onClick={() => adicionarTecnica(t)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border"
                  style={{ background: 'var(--brand-surf)', borderColor: 'var(--brand-border)', color: 'var(--brand-texto-sec)' }}>
                  {t.nome}
                  {t.categoria && <span className="ml-1 opacity-50 font-normal">· {t.categoria}</span>}
                </button>
              ))}
            </div>
          )}
          {busca.trim().length >= 2 && resultadosBusca.length === 0 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma técnica encontrada
            </p>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 space-y-2"
        style={{
          background: 'var(--brand-surf)',
          borderTop: '1px solid var(--brand-border)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}>
        <button
          onClick={handleSalvar}
          disabled={!nome.trim() || tecnicas.length === 0 || salvando}
          className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-40"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          {salvando ? 'Salvando…' : 'Salvar historinha'}
        </button>
        {id && (
          <button onClick={handleDeletar}
            className="w-full py-3 rounded-xl text-xs font-bold"
            style={{ color: '#ef4444' }}>
            Excluir historinha
          </button>
        )}
      </div>
    </div>
  )
}
