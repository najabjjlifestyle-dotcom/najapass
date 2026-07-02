'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { abrirAula } from '../actions'
import { criarTema } from '../../tecnicas/actions'

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
    <div className="min-h-screen bg-black">
      <header className="px-6 pt-12 pb-6 border-b border-white/10 flex items-center gap-3">
        <Link href="/dashboard" className="text-white/40 hover:text-white transition-colors text-xl">←</Link>
        <h1 className="text-white font-bold text-xl uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-oswald)' }}>
          Planejar Aula
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">

          {turmas.length > 0 && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
                style={{ fontFamily: 'var(--font-oswald)' }}>Turma</label>
              <select name="turma_id" value={turmaId}
                onChange={e => handleTurmaChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
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
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Data</label>
            <input name="data" type="date" defaultValue={hoje} required
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Hora de início</label>
            <input name="hora_inicio" type="time" defaultValue={horaAtual}
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-widest text-white/50"
                style={{ fontFamily: 'var(--font-oswald)' }}>Tema da aula</label>
              <button type="button" onClick={() => setShowNovoTema(v => !v)}
                className="text-xs text-white/40 underline underline-offset-2">
                + Novo tema
              </button>
            </div>
            <select name="tema_id" value={temaId}
              onChange={e => setTemaId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black border border-white/30 text-white focus:outline-none focus:border-white text-base transition-colors">
              <option value="" className="bg-black">Sem tema específico</option>
              {temasList.map(t => (
                <option key={t.id} value={t.id} className="bg-black">{t.nome}</option>
              ))}
            </select>

            {showNovoTema && (
              <div className="flex gap-2 mt-2">
                <input type="text" value={novoTemaNome} onChange={e => setNovoTemaNome(e.target.value)}
                  placeholder="Nome do tema" autoFocus
                  className="flex-1 px-3 py-2 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white" />
                <button type="button" onClick={handleCriarTema}
                  disabled={criandoTema || !novoTemaNome.trim()}
                  className="px-4 py-2 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-40">
                  {criandoTema ? '...' : 'Criar'}
                </button>
              </div>
            )}
            {temaError && <p className="text-red-400 text-xs mt-1.5">{temaError}</p>}
          </div>

          {/* Posições planejadas — aparece após selecionar tema */}
          {temaId && (
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
                style={{ fontFamily: 'var(--font-oswald)' }}>
                Posições a ensinar
                {planejadas.size > 0 && (
                  <span className="ml-2 normal-case font-normal text-white/40">
                    ({planejadas.size} selecionada{planejadas.size > 1 ? 's' : ''})
                  </span>
                )}
              </label>
              {tecnicasDoTema.length === 0 ? (
                <p className="text-xs text-white/30 py-2">
                  Nenhuma posição cadastrada para este tema.{' '}
                  <a href="/tecnicas/nova" className="underline text-white/50">Cadastrar</a>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all border"
                        style={{
                          background: selecionada ? 'rgba(200,169,110,0.2)' : 'rgba(255,255,255,0.05)',
                          borderColor: selecionada ? '#C8A96E' : 'rgba(255,255,255,0.15)',
                          color: selecionada ? '#C8A96E' : 'rgba(255,255,255,0.5)',
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
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1.5">
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all border"
                          style={{
                            background: selecionada ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)',
                            borderColor: selecionada ? '#FBBF24' : 'rgba(255,255,255,0.1)',
                            color: selecionada ? '#FBBF24' : 'rgba(255,255,255,0.35)',
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
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2"
              style={{ fontFamily: 'var(--font-oswald)' }}>Link de estudo (YouTube, etc)</label>
            <input name="video_url" type="url" placeholder="https://youtube.com/..."
              className="w-full px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/30 focus:outline-none focus:border-white text-base transition-colors" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-white hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-lg uppercase tracking-widest transition-colors mt-2"
            style={{ fontFamily: 'var(--font-oswald)' }}>
            {loading ? 'Abrindo...' : 'Abrir Aula'}
          </button>
        </form>
      </main>
    </div>
  )
}
