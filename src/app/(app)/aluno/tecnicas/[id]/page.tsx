import { notFound } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import BackButton from '@/components/back-button'

const DIAS_STALE = 21

type TecnicaDetalhe = {
  id: string
  nome: string
  vezes: number
  ultimaVez: Date | null
  diasDesdeUltima: number | null
}

function labelFrequencia(vezes: number): { texto: string; cor: string } {
  if (vezes >= 5) return { texto: 'Frequente', cor: 'var(--brand-gold)' }
  if (vezes >= 3) return { texto: 'Boa', cor: 'var(--brand-gold)' }
  return { texto: `${vezes}×`, cor: '#888' }
}

export default async function AlunoTecnicaCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { aluno, supabase } = await getAlunoOuRedireciona()

  const { data: categoria } = await supabase
    .from('categorias_tecnicas')
    .select('id, nome')
    .eq('id', id)
    .maybeSingle()

  if (!categoria) notFound()

  const { data: presencas } = await supabase
    .from('presencas')
    .select('aula_id')
    .eq('aluno_id', aluno.id)
  const aulaIds = (presencas ?? []).map(p => p.aula_id)

  const { data: vistasRows } = aulaIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('tecnica_id, aulas(data)')
        .in('aula_id', aulaIds)
        .eq('tipo', 'ensinada')
    : { data: [] }

  const { data: todasRows } = await supabase
    .from('tecnicas')
    .select('id, nome')
    .eq('categoria_id', id)
    .or(`global.eq.true,academia_id.eq.${aluno.academia_id}`)
    .order('nome')

  const tecnicaMap = new Map<string, TecnicaDetalhe>()
  for (const t of todasRows ?? []) {
    tecnicaMap.set(t.id, { id: t.id, nome: t.nome, vezes: 0, ultimaVez: null, diasDesdeUltima: null })
  }

  type VistaRow = { tecnica_id: string; aulas: { data: string } | null }
  for (const row of ((vistasRows ?? []) as unknown as VistaRow[])) {
    const t = tecnicaMap.get(row.tecnica_id)
    if (!t || !row.aulas?.data) continue
    const data = new Date(row.aulas.data + 'T12:00:00')
    t.vezes++
    if (!t.ultimaVez || data > t.ultimaVez) t.ultimaVez = data
  }

  const agora = Date.now()
  const vistas: TecnicaDetalhe[] = []
  const stale: TecnicaDetalhe[] = []
  const naoVistas: TecnicaDetalhe[] = []

  for (const t of tecnicaMap.values()) {
    if (t.ultimaVez) {
      t.diasDesdeUltima = Math.floor((agora - t.ultimaVez.getTime()) / 86400000)
      if (t.diasDesdeUltima > DIAS_STALE) stale.push(t)
      else vistas.push(t)
    } else {
      naoVistas.push(t)
    }
  }

  vistas.sort((a, b) => b.vezes - a.vezes)
  stale.sort((a, b) => (b.diasDesdeUltima ?? 0) - (a.diasDesdeUltima ?? 0))

  return (
    <div>
      <header className="px-4 pt-safe pb-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/aluno/tecnicas" />
        <div>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            categoria
          </p>
          <h1 className="font-bold text-lg" style={{ color: 'var(--brand-texto)' }}>
            {categoria.nome}
          </h1>
        </div>
      </header>

      <main className="px-4 pt-4 pb-10 space-y-5">
        {stale.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#F97316' }}>
              ⚠ Precisa reforçar
            </p>
            <div className="space-y-2">
              {stale.map(t => (
                <div key={t.id} className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                  style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{t.nome}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#F97316' }}>
                      vista há {t.diasDesdeUltima} dias
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded" style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>
                    Revisar
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {vistas.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand-gold)' }}>
              Aprendidas
            </p>
            <div className="space-y-2">
              {vistas.map(t => {
                const freq = labelFrequencia(t.vezes)
                return (
                  <div key={t.id} className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{t.nome}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                        vista {t.vezes}× · última: {t.diasDesdeUltima === 0 ? 'hoje' : t.diasDesdeUltima === 1 ? 'ontem' : `${t.diasDesdeUltima} dias atrás`}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-1 rounded"
                      style={{ background: 'var(--brand-gold-dim)', color: freq.cor, border: '1px solid var(--brand-gold-border)' }}>
                      {freq.texto}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {naoVistas.length > 0 && (
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: '#444' }}>
              Ainda não viu
            </p>
            <div className="flex flex-wrap gap-1.5">
              {naoVistas.slice(0, 8).map(t => (
                <span key={t.id} className="text-[10px] px-2.5 py-1 rounded-lg" style={{ color: '#333', border: '1px solid #1F1F1F' }}>
                  {t.nome}
                </span>
              ))}
            </div>
            {naoVistas.length > 8 && (
              <p className="text-[10px] mt-2" style={{ color: '#2A2A2A' }}>
                + {naoVistas.length - 8} técnicas avançadas
              </p>
            )}
          </div>
        )}

        {vistas.length === 0 && stale.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
              {categoria.nome}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Você ainda não participou de nenhuma aula com técnicas desta posição.
            </p>
            <p className="text-xs mt-1" style={{ color: '#333' }}>
              {naoVistas.length} técnicas aguardam você.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
