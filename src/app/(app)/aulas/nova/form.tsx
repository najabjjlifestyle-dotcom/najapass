'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { abrirAula } from '../actions'
import { criarTema } from '../../tecnicas/actions'
import BackButton from '@/components/back-button'

type Turma = { id: string; nome: string }
type Tema = { id: string; nome: string }
type TecnicaOpt = { id: string; nome: string; categoria_id: string | null; faixas: string[] }

export default function NovaAulaForm({
  turmas,
  temas,
  tecnicas,
  reforcosPorTurma,
}: {
  turmas: Turma[]
  temas: Tema[]
  tecnicas: TecnicaOpt[]
  reforcosPorTurma: Record<string, string[]>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turmaId, setTurmaId] = useState('')
  const [temaId, setTemaId] = useState('')
  const [planejadas, setPlanejadas] = useState<Set<string>>(new Set())
  const [temasList, setTemasList] = useState<Tema[]>(temas)
  const [showNovoTema, setShowNovoTema] = useState(false)
  const [novoTemaNome, setNovoTemaNome] = useState('')
  const [criandoTema, setCriandoTema] = useState(false)
  const [temaError, setTemaError] = useState('')

  const hoje = new Date().toISOString().split('T')[0]
  const horaAtual = new Date().toTimeString().slice(0, 5)

  // Posições do tema selecionado
  const tecnicasDoTema = temaId
    ? tecnicas.filter(t => t.categoria_id === temaId)
    : []

  // Reforços da última aula desta turma
  const reforcosATurma = turmaId ? (reforcosPorTurma[turmaId] ?? []) : []
  const reforcosComNome = reforcosATurma
    .map(id => tecnicas.find(t => t.id === id))
    .filter(Boolean) as TecnicaOpt[]

  function togglePlanejada(id: string) {
    setPlanejadas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleCriarTema() {
    const nome = novoTemaNome.trim()
    if (!nome) return
    setCriandoTema(true)
    setTemaError('')
    const result = await criarTema(nome)
    setCriandoTema(false)

    if (result?.error) { setTemaError(result.error); return }
    if (result?.tema) {
      setTemasList(prev => [...prev, result.tema!].sort((a, b) => a.nome.localeCompare(b.nome)))
      setTemaId(result.tema.id)
    }
    setNovoTemaNome('')
    setShowNovoTema(false)
  }

  function handleTurmaChange(id: string) {
    setTurmaId(id)
    // Pré-seleciona os reforços da última aula dessa turma
    const refs = reforcosPorTurma[id] ?? []
    setPlanejadas(new Set(refs))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    planejadas.forEach(id => formData.append('planejadas[]', id))

    const result = await abrirAula(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.id) {
      router.replace(`/aulas/${result.id}`)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-safe pb-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/dashboard" />
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Planejar Aula
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">

          {turmas.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Turma</label>
              <select name="turma_id" value={turmaId}
                onChange={e => handleTurmaChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
                style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
                <option value="" className="bg-black">Sem turma específica</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
                ))}
              </select>
              {reforcosComNome.length > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#FBBF24' }}>
                  🔁 {reforcosComNome.length} posição{reforcosComNome.length > 1 ? 'ões' : ''} de reforço da última aula pré-selecionada{reforcosComNome.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Data</label>
            <input name="data" type="date" defaultValue={hoje} required
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Hora de início</label>
            <input name="hora_inicio" type="time" defaultValue={horaAtual}
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>Tema da aula</label>
              <button type="button" onClick={() => setShowNovoTema(v => !v)}
                className="text-xs underline underline-offset-2" style={{ color: 'var(--brand-texto-muted)' }}>
                + Novo tema
              </button>
            </div>
            <select name="tema_id" value={temaId}
              onChange={e => setTemaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-transparent text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}>
              <option value="" className="bg-black">Sem tema específico</option>
              {temasList.map(t => (
                <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
              ))}
            </select>

            {showNovoTema && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={novoTemaNome} onChange={e => setNovoTemaNome(e.target.value)}
                  placeholder="Nome do tema" autoFocus
                  className="flex-1 px-3 py-2 rounded-xl bg-transparent placeholder-white/30 text-sm focus:outline-none"
                  style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
                <button type="button" onClick={handleCriarTema}
                  disabled={criandoTema || !novoTemaNome.trim()}
                  className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40 active:scale-[0.98] transition-transform"
                  style={{ background: 'var(--brand-gold)', color: '#000' }}>
                  {criandoTema ? '...' : 'Criar'}
                </button>
              </div>
            )}
            {temaError && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{temaError}</p>}
          </div>

          {/* Posições planejadas — aparece após selecionar tema */}
          {temaId && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
                Posições a ensinar
                {planejadas.size > 0 && (
                  <span className="ml-2 normal-case font-normal" style={{ color: 'var(--brand-texto-muted)' }}>
                    ({planejadas.size} selecionada{planejadas.size > 1 ? 's' : ''})
                  </span>
                )}
              </label>
              {tecnicasDoTema.length === 0 ? (
                <p className="text-xs py-2" style={{ color: 'var(--brand-texto-muted)' }}>
                  Nenhuma posição cadastrada para este tema.{' '}
                  <a href="/tecnicas/nova" className="underline" style={{ color: 'var(--brand-texto-sec)' }}>Cadastrar</a>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tecnicasDoTema.map(t => {
                    const selecionada = planejadas.has(t.id)
                    const isReforco = reforcosATurma.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => togglePlanejada(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border"
                        style={{
                          background: selecionada ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
                          borderColor: selecionada ? 'var(--brand-gold)' : 'var(--brand-border-str)',
                          color: selecionada ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
                        }}>
                        {isReforco && <span title="Reforço">🔁</span>}
                        {t.nome}
                        {selecionada && <span>✓</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Reforços de outro tema (não no tema atual) */}
              {reforcosComNome.filter(t => t.categoria_id !== temaId).length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                    Reforços de outros temas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {reforcosComNome.filter(t => t.categoria_id !== temaId).map(t => {
                      const selecionada = planejadas.has(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => togglePlanejada(t.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border"
                          style={{
                            background: selecionada ? 'rgba(251,191,36,0.15)' : 'var(--brand-surf)',
                            borderColor: selecionada ? '#FBBF24' : 'var(--brand-border-str)',
                            color: selecionada ? '#FBBF24' : 'var(--brand-texto-muted)',
                          }}>
                          🔁 {t.nome}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Link de estudo (YouTube, etc)</label>
            <input name="video_url" type="url" placeholder="https://youtube.com/..."
              className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] mt-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            {loading ? 'Abrindo...' : 'Abrir Aula'}
          </button>
        </form>
      </main>
    </div>
  )
}
