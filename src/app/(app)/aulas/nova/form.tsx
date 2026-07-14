'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { abrirAula } from '../actions'
import { criarTema } from '../../tecnicas/actions'
import BackButton from '@/components/back-button'

type Turma = { id: string; nome: string }
type Tema = { id: string; nome: string }
type TecnicaOpt = { id: string; nome: string; categoria_id: string | null; faixas: string[] }
type HistorinhaTecnica = { ordem: number; tecnica_id: string; tecnicas: { nome: string } | null }
type Historinha = { id: string; nome: string; historinha_tecnicas: HistorinhaTecnica[] | null }

export default function NovaAulaForm({
  turmas,
  temas,
  tecnicas,
  reforcosPorTurma,
  historinhas,
  defaultTurmaId,
}: {
  turmas: Turma[]
  temas: Tema[]
  tecnicas: TecnicaOpt[]
  reforcosPorTurma: Record<string, string[]>
  historinhas: Historinha[]
  defaultTurmaId?: string | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submittingIntent, setSubmittingIntent] = useState<'abrir_agora' | 'planejar' | null>(null)
  const [error, setError] = useState('')
  const [turmaId, setTurmaId] = useState(
    defaultTurmaId && turmas.some(t => t.id === defaultTurmaId) ? defaultTurmaId : ''
  )
  const intentRef = useRef<HTMLInputElement>(null)
  const [temaId, setTemaId] = useState('')
  const [planejadas, setPlanejadas] = useState<Set<string>>(new Set())
  const [temasList, setTemasList] = useState<Tema[]>(temas)
  const [showNovoTema, setShowNovoTema] = useState(false)
  const [novoTemaNome, setNovoTemaNome] = useState('')
  const [criandoTema, setCriandoTema] = useState(false)
  const [temaError, setTemaError] = useState('')
  const [buscaTecnica, setBuscaTecnica] = useState('')
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null)

  const hoje = new Date().toISOString().split('T')[0]
  const horaAtual = new Date().toTimeString().slice(0, 5)
  const [dataSelecionada, setDataSelecionada] = useState(hoje)

  // Chegando com ?turma_id= (ex: vindo de "Planejar próxima aula" no
  // feedback), pré-popula os reforços da turma já pré-selecionada.
  useEffect(() => {
    if (!defaultTurmaId) return
    const refs = reforcosPorTurma[defaultTurmaId] ?? []
    if (refs.length > 0) setPlanejadas(new Set(refs))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Agrupa TODAS as técnicas por categoria — seleção de posições é
  // desacoplada do "Tema da aula" (que agora é só um label de display).
  const categorias = useMemo(() => {
    const nomePorId = new Map(temasList.map(t => [t.id, t.nome]))
    const mapa: Record<string, { id: string; nome: string; tecnicas: TecnicaOpt[] }> = {}
    for (const t of tecnicas) {
      const catId = t.categoria_id ?? '__sem_categoria'
      const catNome = t.categoria_id ? (nomePorId.get(t.categoria_id) ?? '') : 'Outras'
      if (!mapa[catId]) mapa[catId] = { id: catId, nome: catNome, tecnicas: [] }
      mapa[catId].tecnicas.push(t)
    }
    return Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome))
  }, [tecnicas, temasList])

  // Quando um tema está selecionado, o picker foca só naquela categoria
  const categoriasVisiveis = temaId
    ? categorias.filter(cat => cat.id === temaId)
    : categorias

  // Auto-expande a categoria correspondente ao tema selecionado
  useEffect(() => {
    if (temaId) setCategoriaExpandida(temaId)
  }, [temaId])

  const resultadosBusca = buscaTecnica.trim().length >= 2
    ? tecnicas.filter(t => t.nome.toLowerCase().includes(buscaTecnica.toLowerCase()))
    : []

  // Reforços da última aula desta turma
  const reforcosATurma = turmaId ? (reforcosPorTurma[turmaId] ?? []) : []
  const reforcosComNome = reforcosATurma
    .map(id => tecnicas.find(t => t.id === id))
    .filter(Boolean) as TecnicaOpt[]

  function aplicarHistorinha(historinha: Historinha) {
    const idsNovos = [...(historinha.historinha_tecnicas ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map(ht => ht.tecnica_id)
    setPlanejadas(prev => new Set([...prev, ...idsNovos]))
  }

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
              {/* hidden input carrega o valor pro FormData (cards são type=button) */}
              <input type="hidden" name="turma_id" value={turmaId} />
              <div className="space-y-2">
                <button type="button" onClick={() => handleTurmaChange('')}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
                  style={!turmaId
                    ? { background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }
                    : { background: 'transparent', border: '1px solid var(--brand-border)' }
                  }>
                  <p className="text-sm font-bold" style={{ color: !turmaId ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                    Sem turma específica
                  </p>
                </button>
                {turmas.map(t => {
                  const ativa = turmaId === t.id
                  return (
                    <button key={t.id} type="button" onClick={() => handleTurmaChange(t.id)}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
                      style={ativa
                        ? { background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }
                        : { background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }
                      }>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm" style={{ color: ativa ? 'var(--brand-gold)' : 'var(--brand-texto)' }}>
                          {t.nome}
                        </p>
                        {ativa && <span className="text-[10px] font-bold" style={{ color: 'var(--brand-gold)' }}>✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {reforcosComNome.length > 0 && (
                <p className="text-xs mt-2" style={{ color: '#FBBF24' }}>
                  🔁 {reforcosComNome.length} posição{reforcosComNome.length > 1 ? 'ões' : ''} de reforço da última aula pré-selecionada{reforcosComNome.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Data</label>
            <input name="data" type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)} required
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
            {/* hidden input carrega o valor pro FormData (chips são type=button) */}
            <input type="hidden" name="tema_id" value={temaId} />
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button type="button" onClick={() => setTemaId('')}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96]"
                style={!temaId
                  ? { background: 'var(--brand-gold)', color: '#000' }
                  : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
                }>
                Geral
              </button>
              {temasList.map(t => {
                const ativo = temaId === t.id
                return (
                  <button key={t.id} type="button" onClick={() => setTemaId(t.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.96]"
                    style={ativo
                      ? { background: 'var(--brand-gold)', color: '#000' }
                      : { background: 'transparent', border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
                    }>
                    {t.nome}
                  </button>
                )
              })}
            </div>

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

          {/* Histórinhas — sequências prontas pra aplicar de uma vez */}
          {historinhas.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
                  Histórinhas
                </label>
                <Link href="/historinhas" className="text-xs" style={{ color: 'var(--brand-gold)' }}>
                  Gerenciar →
                </Link>
              </div>

              <div className="space-y-2">
                {historinhas.map(h => {
                  const tecnicasOrdenadas = [...(h.historinha_tecnicas ?? [])].sort((a, b) => a.ordem - b.ordem)
                  const jaAplicada = tecnicasOrdenadas.length > 0 && tecnicasOrdenadas.every(ht => planejadas.has(ht.tecnica_id))

                  return (
                    <div key={h.id}
                      className="px-3 py-2.5 rounded-xl"
                      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
                            {h.nome}
                          </p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                            {tecnicasOrdenadas.map(ht => ht.tecnicas?.nome).join(' → ')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => jaAplicada ? undefined : aplicarHistorinha(h)}
                          disabled={jaAplicada}
                          className="ml-3 px-3 py-1.5 rounded-lg text-[10px] font-bold flex-shrink-0"
                          style={{
                            background: jaAplicada ? 'transparent' : 'var(--brand-gold)',
                            color: jaAplicada ? '#4ADE80' : '#000',
                            border: jaAplicada ? '1px solid rgba(74,222,128,0.3)' : 'none',
                          }}>
                          {jaAplicada ? '✓ Aplicada' : 'Aplicar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Posições a ensinar — desacoplado do tema, múltiplas categorias */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Posições a ensinar
              {planejadas.size > 0 && (
                <span className="ml-2 normal-case font-normal" style={{ color: 'var(--brand-texto-muted)' }}>
                  ({planejadas.size} selecionada{planejadas.size !== 1 ? 's' : ''})
                </span>
              )}
            </label>

            {/* Chips selecionados — sempre visíveis */}
            {planejadas.size > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 pb-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
                {[...planejadas].map(id => {
                  const t = tecnicas.find(x => x.id === id)
                  if (!t) return null
                  return (
                    <button key={id} type="button" onClick={() => togglePlanejada(id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)', color: 'var(--brand-gold)' }}>
                      {t.nome} ×
                    </button>
                  )
                })}
              </div>
            )}

            {/* Busca */}
            <input
              type="text"
              placeholder="Buscar posição..."
              value={buscaTecnica}
              onChange={e => setBuscaTecnica(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm mb-3"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)', color: 'var(--brand-texto)' }}
            />

            {buscaTecnica.trim().length >= 2 ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {resultadosBusca.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>Nenhuma posição encontrada</p>
                ) : resultadosBusca.map(t => {
                  const sel = planejadas.has(t.id)
                  return (
                    <button key={t.id} type="button" onClick={() => togglePlanejada(t.id)}
                      className="px-3 py-1.5 rounded-xl text-sm font-bold border"
                      style={{
                        background: sel ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
                        borderColor: sel ? 'var(--brand-gold)' : 'var(--brand-border-str)',
                        color: sel ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
                      }}>
                      {t.nome} {sel ? '✓' : ''}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {categoriasVisiveis.map(cat => {
                  const temSelecionadas = cat.tecnicas.some(t => planejadas.has(t.id))
                  const isExpanded = categoriaExpandida === cat.id || temSelecionadas
                  return (
                    <div key={cat.id} className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid var(--brand-border)', background: 'var(--brand-surf)' }}>
                      <button type="button"
                        onClick={() => setCategoriaExpandida(isExpanded && !temSelecionadas ? null : cat.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5">
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--brand-texto-sec)' }}>
                          {cat.nome}
                        </span>
                        <div className="flex items-center gap-2">
                          {temSelecionadas && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
                              {cat.tecnicas.filter(t => planejadas.has(t.id)).length}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                          {cat.tecnicas.map(t => {
                            const sel = planejadas.has(t.id)
                            const isReforco = reforcosATurma.includes(t.id)
                            return (
                              <button key={t.id} type="button" onClick={() => togglePlanejada(t.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border"
                                style={{
                                  background: sel ? 'var(--brand-gold-dim)' : 'transparent',
                                  borderColor: sel ? 'var(--brand-gold)' : 'var(--brand-border)',
                                  color: sel ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
                                }}>
                                {isReforco && '🔁 '}{t.nome}{sel ? ' ✓' : ''}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {temaId && (
                  <p className="text-center text-[10px] py-1">
                    <span style={{ color: 'var(--brand-texto-muted)' }}>Filtrando por tema · </span>
                    <button type="button" onClick={() => setTemaId('')}
                      className="underline underline-offset-2" style={{ color: 'var(--brand-gold)' }}>
                      Ver todas
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Link de estudo (YouTube, etc)</label>
            <input name="video_url" type="url" placeholder="https://youtube.com/..."
              className="w-full px-4 py-3 rounded-xl bg-transparent placeholder-white/30 text-base focus:outline-none transition-colors"
              style={{ border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

          <input ref={intentRef} type="hidden" name="intent" defaultValue="planejar" />

          <button type="submit" disabled={loading}
            onClick={() => { intentRef.current?.setAttribute('value', 'abrir_agora'); setSubmittingIntent('abrir_agora') }}
            className="w-full py-4 rounded-xl font-bold text-lg uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] mt-2"
            style={{ background: 'var(--brand-gold)', color: '#000' }}>
            {loading && submittingIntent === 'abrir_agora' ? 'Abrindo...' : 'Abrir Agora'}
          </button>
          <button type="submit" disabled={loading}
            onClick={() => { intentRef.current?.setAttribute('value', 'planejar'); setSubmittingIntent('planejar') }}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-[0.98] mt-2"
            style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)', background: 'transparent' }}>
            {loading && submittingIntent === 'planejar' ? 'Salvando...' : 'Planejar para depois'}
          </button>
        </form>
      </main>
    </div>
  )
}
