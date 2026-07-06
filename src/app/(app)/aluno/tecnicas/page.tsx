import { getAlunoOuRedireciona } from '@/lib/aluno-auth'

type TecnicaInfo = { id: string; nome: string }
type CategoriaData = {
  categoria: string
  total: TecnicaInfo[]
  vistas: Set<string>
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
        .select('tecnicas(id, nome, categorias_tecnicas(id, nome))')
        .in('aula_id', aulaIds)
        .eq('tipo', 'ensinada')
    : { data: [] }

  const { data: curriculoRows } = await supabase
    .from('tecnicas')
    .select('id, nome, categorias_tecnicas(id, nome)')
    .or(`global.eq.true,academia_id.eq.${aluno.academia_id}`)

  const categoriaMap = new Map<string, CategoriaData>()

  for (const row of curriculoRows ?? []) {
    const cat = (row.categorias_tecnicas as unknown as { id: string; nome: string } | null)?.nome ?? 'Outras'
    if (!categoriaMap.has(cat)) {
      categoriaMap.set(cat, { categoria: cat, total: [], vistas: new Set() })
    }
    categoriaMap.get(cat)!.total.push({ id: row.id, nome: row.nome })
  }

  const vistasIds = new Set(
    ((vistaRows ?? []) as unknown as { tecnicas: { id: string } | null }[])
      .map(r => r.tecnicas?.id)
      .filter((id): id is string => Boolean(id))
  )

  for (const data of categoriaMap.values()) {
    data.total.forEach(t => {
      if (vistasIds.has(t.id)) data.vistas.add(t.id)
    })
  }

  const categorias = [...categoriaMap.values()]
    .filter(c => c.total.length > 0)
    .sort((a, b) => (b.vistas.size / b.total.length) - (a.vistas.size / a.total.length))

  const totalVistas = categorias.reduce((acc, c) => acc + c.vistas.size, 0)

  return (
    <div>
      <header className="px-5 pt-safe pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          sua jornada
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--brand-texto)' }}>
          Técnicas <span style={{ color: 'var(--brand-gold)' }}>aprendidas</span>
        </h1>
        {totalVistas > 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            {totalVistas} técnicas em {categorias.filter(c => c.vistas.size > 0).length} categorias
          </p>
        )}
      </header>

      <main className="px-5 pt-5 space-y-3">
        {categorias.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              Participe de aulas para ver suas técnicas aqui
            </p>
          </div>
        )}

        {categorias.map(cat => {
          const pct = cat.total.length > 0 ? (cat.vistas.size / cat.total.length) * 100 : 0
          return (
            <div key={cat.categoria} className="rounded-2xl p-4"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
                  {cat.categoria}
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--brand-gold)' }}>
                  {cat.vistas.size}/{cat.total.length}
                </span>
              </div>

              <div className="h-1 rounded-full mb-3" style={{ background: 'var(--brand-border)' }}>
                <div
                  className="h-1 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: 'var(--brand-gold)' }}
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {cat.total.map(t => {
                  const vista = cat.vistas.has(t.id)
                  return (
                    <span key={t.id}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      style={vista
                        ? { background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }
                        : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                      }>
                      {t.nome}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </main>
    </div>
  )
}
