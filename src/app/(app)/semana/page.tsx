import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const DIAS_PT: Record<number, string> = {
  0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta',
  4: 'Quinta', 5: 'Sexta', 6: 'Sábado',
}

function semanaAtual() {
  const today = new Date()
  const dow = today.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    inicio: monday.toISOString().split('T')[0],
    fim: sunday.toISOString().split('T')[0],
    label: `${monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
  }
}

type TecnicaRow = {
  id: string; nome: string
  faixas: string[]
  categorias_tecnicas: { nome: string } | null
}
type AulaTecnicaRow = { aula_id: string; tipo: string; reforco: boolean; tecnicas: TecnicaRow | null }
type AulaRow = {
  id: string; data: string; hora_inicio: string | null; status: string
  turmas: { nome: string } | null
  tema: { nome: string } | null
}

export default async function SemanaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')

  const { inicio, fim, label } = semanaAtual()

  const { data: aulasRaw } = await supabase
    .from('aulas')
    .select('id, data, hora_inicio, status, turmas(nome), tema:categorias_tecnicas(nome)')
    .eq('academia_id', professor.academia_id)
    .gte('data', inicio)
    .lte('data', fim)
    .order('data')
    .order('hora_inicio')

  const aulas = (aulasRaw ?? []) as unknown as AulaRow[]
  const aulaIds = aulas.map(a => a.id)

  const { data: atRows } = aulaIds.length > 0
    ? await supabase
        .from('aula_tecnicas')
        .select('aula_id, tipo, reforco, tecnicas(id, nome, faixas, categorias_tecnicas(nome))')
        .in('aula_id', aulaIds)
    : { data: [] }

  const aulaTecnicas = (atRows ?? []) as unknown as AulaTecnicaRow[]

  // Group tecnicas by aula
  const tecnicasPorAula = aulaTecnicas.reduce<Record<string, AulaTecnicaRow[]>>((acc, at) => {
    if (!acc[at.aula_id]) acc[at.aula_id] = []
    acc[at.aula_id].push(at)
    return acc
  }, {})

  // Group aulas by date
  const aulasPorDia = aulas.reduce<Record<string, AulaRow[]>>((acc, a) => {
    if (!acc[a.data]) acc[a.data] = []
    acc[a.data].push(a)
    return acc
  }, {})

  const diasOrdenados = Object.keys(aulasPorDia).sort()

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-12 pb-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/dashboard" className="text-xl" style={{ color: 'var(--brand-texto-muted)' }}>←</Link>
        <div>
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Semana
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>{label}</p>
        </div>
      </header>

      <main className="px-5 pt-5 pb-10 space-y-6">
        {diasOrdenados.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma aula planejada esta semana
            </p>
            <Link href="/aulas/nova"
              className="inline-block text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl"
              style={{ background: 'var(--brand-gold)', color: 'black' }}>
              Planejar aula
            </Link>
          </div>
        ) : (
          diasOrdenados.map(data => {
            const aulasDoDia = aulasPorDia[data]
            const d = new Date(data + 'T12:00:00')
            const diaNome = DIAS_PT[d.getDay()]
            const dataFmt = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            const isHoje = data === new Date().toISOString().split('T')[0]

            return (
              <div key={data}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: isHoje ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                    {diaNome}, {dataFmt}
                  </p>
                  {isHoje && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                      Hoje
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {aulasDoDia.map(aula => {
                    const tecsDaAula = tecnicasPorAula[aula.id] ?? []
                    const planejadas = tecsDaAula.filter(t => t.tipo === 'planejada')
                    const ensinadas = tecsDaAula.filter(t => t.tipo === 'ensinada')
                    const comReforco = tecsDaAula.filter(t => t.reforco)

                    return (
                      <Link key={aula.id} href={`/aulas/${aula.id}`}
                        className="block px-4 py-3 rounded-xl"
                        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                              {aula.turmas?.nome ?? 'Aula avulsa'}
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                              {aula.tema?.nome ? `Tema: ${aula.tema.nome}` : 'Sem tema definido'}
                              {aula.hora_inicio ? ` · ${(aula.hora_inicio as string).substring(0, 5)}` : ''}
                            </p>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0"
                            style={{
                              color: aula.status === 'aberta' ? 'var(--brand-gold)' : aula.status === 'finalizada' ? '#4ADE80' : 'var(--brand-texto-muted)',
                              border: `1px solid ${aula.status === 'aberta' ? 'var(--brand-gold-border)' : aula.status === 'finalizada' ? 'rgba(74,222,128,0.3)' : 'var(--brand-border)'}`,
                            }}>
                            {aula.status === 'aberta' ? 'Ao vivo' : aula.status === 'finalizada' ? 'Finalizada' : 'Planejada'}
                          </span>
                        </div>

                        {/* Posições */}
                        {tecsDaAula.length === 0 ? (
                          <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                            Nenhuma posição planejada
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {planejadas.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {planejadas.map(at => at.tecnicas && (
                                  <span key={at.tecnicas.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--brand-texto-sec)', border: '1px solid var(--brand-border)' }}>
                                    📋 {at.tecnicas.nome}
                                    {at.tecnicas.faixas?.length > 0 && (
                                      <span className="ml-1 opacity-60">({at.tecnicas.faixas.join(', ')})</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                            {ensinadas.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {ensinadas.map(at => at.tecnicas && (
                                  <span key={at.tecnicas.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                                    style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                                    {at.reforco && '🔁 '}{at.tecnicas.nome}
                                  </span>
                                ))}
                              </div>
                            )}
                            {comReforco.length > 0 && aula.status === 'finalizada' && (
                              <p className="text-[10px]" style={{ color: '#FBBF24' }}>
                                🔁 {comReforco.length} posição{comReforco.length > 1 ? 'ões' : ''} para reforçar
                              </p>
                            )}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}
