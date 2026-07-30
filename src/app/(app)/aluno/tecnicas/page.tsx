import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import { nomeTecnica } from '@/lib/tecnicas'

const DIAS_STALE = 21

type TecnicaInfo = { id: string; nome: string }
type CategoriaCard = {
  id: string
  nome: string
  vistasIds: Set<string>
  staleIds: Set<string>
  total: TecnicaInfo[]
  topVistas: { id: string; nome: string; ultimaVez: Date }[]
}

export default async function AlunoTecnicasPage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  const { data: presencas } = await supabase
    .from('presencas')
    .select('aula_id')
    .eq('aluno_id', aluno.id)

  const aulaIds = (presencas ?? []).map(p => p.aula_id)

  const { data: vistaRows } = aulaIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('tecnicas(id, nome, categorias_tecnicas(id, nome)), aulas(data)')
        .in('aula_id', aulaIds)
        .eq('tipo', 'ensinada')
    : { data: [] }

  const { data: curriculoRows } = await supabase
    .from('tecnicas')
    .select('id, nome, categorias_tecnicas(id, nome), tecnicas_academias(nome_custom)')
    .or(`global.eq.true,academia_id.eq.${aluno.academia_id}`)

  const categoriaMap = new Map<string, CategoriaCard>()

  for (const row of curriculoRows ?? []) {
    const catObj = row.categorias_tecnicas as unknown as { id: string; nome: string } | null
    if (!catObj) continue // técnica sem categoria — sem link de detalhe possível, não mostra no overview
    if (!categoriaMap.has(catObj.id)) {
      categoriaMap.set(catObj.id, { id: catObj.id, nome: catObj.nome, total: [], vistasIds: new Set(), staleIds: new Set(), topVistas: [] })
    }
    categoriaMap.get(catObj.id)!.total.push({ id: row.id, nome: nomeTecnica(row as unknown as { nome: string; tecnicas_academias: { nome_custom: string }[] | null }) })
  }

  // Última vez que cada técnica apareceu (MAX data)
  const ultimaVezPorTecnica = new Map<string, Date>()
  type VistaRow = { tecnicas: { id: string } | null; aulas: { data: string } | null }
  for (const row of ((vistaRows ?? []) as unknown as VistaRow[])) {
    const tecId = row.tecnicas?.id
    const dataStr = row.aulas?.data
    if (!tecId || !dataStr) continue
    const data = new Date(dataStr + 'T12:00:00')
    const atual = ultimaVezPorTecnica.get(tecId)
    if (!atual || data > atual) ultimaVezPorTecnica.set(tecId, data)
  }

  const agora = Date.now()
  for (const cat of categoriaMap.values()) {
    for (const t of cat.total) {
      const ultimaVez = ultimaVezPorTecnica.get(t.id)
      if (!ultimaVez) continue
      cat.vistasIds.add(t.id)
      const dias = Math.floor((agora - ultimaVez.getTime()) / 86400000)
      if (dias > DIAS_STALE) {
        cat.staleIds.add(t.id)
      } else {
        cat.topVistas.push({ id: t.id, nome: t.nome, ultimaVez })
      }
    }
    cat.topVistas.sort((a, b) => b.ultimaVez.getTime() - a.ultimaVez.getTime())
  }

  const categorias = [...categoriaMap.values()].filter(c => c.total.length > 0)

  const ordenadas = categorias.sort((a, b) => {
    const aUrgente = a.staleIds.size > 0 ? 2 : a.vistasIds.size > 0 ? 1 : 0
    const bUrgente = b.staleIds.size > 0 ? 2 : b.vistasIds.size > 0 ? 1 : 0
    if (aUrgente !== bUrgente) return bUrgente - aUrgente
    return a.nome.localeCompare(b.nome)
  })

  const totalVistas = categorias.reduce((acc, c) => acc + c.vistasIds.size, 0)

  return (
    <div>
      <header className="px-4 pt-safe pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          sua jornada
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--brand-texto)' }}>
          Técnicas <span style={{ color: 'var(--brand-gold)' }}>aprendidas</span>
        </h1>
        {totalVistas > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            {totalVistas} técnicas em {categorias.filter(c => c.vistasIds.size > 0).length} categorias
          </p>
        )}
      </header>

      <main className="px-4 pt-5 space-y-3">
        {ordenadas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              Participe de aulas para ver suas técnicas aqui
            </p>
          </div>
        )}

        {ordenadas.map(cat => {
          const pct = cat.total.length > 0 ? (cat.vistasIds.size / cat.total.length) * 100 : 0
          const naoVistas = cat.total.length - cat.vistasIds.size
          const staleParaMostrar = [...cat.staleIds].slice(0, 2)
          const recentesParaMostrar = cat.topVistas.filter(t => !cat.staleIds.has(t.id)).slice(0, 2)

          return (
            <Link key={cat.id} href={`/aluno/tecnicas/${cat.id}`}
              className="block rounded-2xl p-4 active:scale-[0.98] transition-transform"
              style={{
                background: cat.staleIds.size > 0 ? 'rgba(249,115,22,0.06)' : 'var(--brand-surf)',
                border: `1px solid ${cat.staleIds.size > 0 ? 'rgba(249,115,22,0.25)' : 'var(--brand-border)'}`,
              }}>

              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                  {cat.nome}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold" style={{ color: cat.vistasIds.size > 0 ? 'var(--brand-gold)' : '#444' }}>
                    {cat.vistasIds.size}/{cat.total.length}
                  </span>
                  <ChevronRight size={14} style={{ color: '#444' }} />
                </div>
              </div>

              <div style={{ height: 3, background: 'var(--brand-border)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand-gold)', borderRadius: 3 }} />
              </div>

              {cat.vistasIds.size > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {staleParaMostrar.map(id => {
                    const t = cat.total.find(x => x.id === id)
                    return t ? (
                      <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                        {t.nome} ⚠
                      </span>
                    ) : null
                  })}
                  {recentesParaMostrar.map(t => (
                    <span key={t.id} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                      {t.nome}
                    </span>
                  ))}
                  {naoVistas > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ color: '#333', border: '1px solid #1F1F1F' }}>
                      +{naoVistas}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] italic" style={{ color: '#333' }}>
                  Nenhuma técnica vista ainda — toque para explorar
                </p>
              )}
            </Link>
          )
        })}
      </main>
    </div>
  )
}
