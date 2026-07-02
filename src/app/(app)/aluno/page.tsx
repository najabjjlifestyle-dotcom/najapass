import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckinCard from './checkin'
import AvatarUpload from '@/components/avatar-upload'
import { updateFotoPropria } from './actions'
import PushSubscribeButton from './push-subscribe'

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white', cinza: 'bg-gray-400', amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400', verde: 'bg-green-400', azul: 'bg-blue-400',
  roxa: 'bg-purple-400', marrom: 'bg-amber-700', preta: 'bg-gray-800 border border-white/20',
}

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

export default async function AlunoPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if professor — redirect to dashboard
  const { data: professor } = await supabase
    .from('professores')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (professor) redirect('/dashboard')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, academia_id, foto_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--brand-fundo)' }}>
        <div className="text-center">
          <p className="font-bold text-xl uppercase tracking-wider mb-2" style={{ color: 'var(--brand-texto)' }}>
            Conta não vinculada
          </p>
          <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
            Peça ao seu professor para cadastrar seu e-mail no sistema.
          </p>
        </div>
      </div>
    )
  }

  // Active classes in this academia
  const { data: aulasAtivasData } = await supabase
    .from('aulas')
    .select('id, video_url, turmas(nome), tema:categorias_tecnicas(nome)')
    .eq('academia_id', aluno.academia_id)
    .eq('status', 'aberta')

  type AulaAtivaRow = {
    id: string
    video_url: string | null
    turmas: { nome: string } | null
    tema: { nome: string } | null
  }
  const aulasAtivasRows = (aulasAtivasData ?? []) as unknown as AulaAtivaRow[]

  // Quem vai + técnicas planejadas de cada aula ao vivo
  const aulasAtivas = await Promise.all(aulasAtivasRows.map(async (aula) => {
    const [{ data: quemVaiData }, { data: planejadasData }] = await Promise.all([
      supabase.rpc('quem_vai', { p_aula_id: aula.id }),
      supabase.from('aula_tecnicas').select('tecnicas(nome)').eq('aula_id', aula.id).eq('tipo', 'planejada'),
    ])
    const confirmados = (quemVaiData ?? []) as { nome: string; visitante: boolean }[]
    const planejadas = ((planejadasData ?? []) as unknown as { tecnicas: { nome: string } | null }[])
      .map(p => p.tecnicas?.nome)
      .filter((n): n is string => Boolean(n))
    return {
      id: aula.id,
      video_url: aula.video_url,
      turma_nome: aula.turmas?.nome ?? null,
      tema: aula.tema?.nome ?? null,
      confirmados,
      planejadas,
    }
  }))

  // Check existing check-ins
  const aulaIds = aulasAtivas.map(a => a.id)
  const { data: checkins } = aulaIds.length > 0
    ? await supabase
        .from('presencas')
        .select('aula_id')
        .eq('aluno_id', aluno.id)
        .in('aula_id', aulaIds)
    : { data: [] }

  const checkinSet = new Set((checkins ?? []).map(c => c.aula_id))

  // Turmas
  const { data: turmasData } = await supabase
    .from('alunos_turmas')
    .select('turmas(id, nome, dias_semana, horario)')
    .eq('aluno_id', aluno.id)
    .eq('ativo', true)

  const turmas = (turmasData ?? [])
    .map(t => t.turmas as unknown as { id: string; nome: string; dias_semana: string[] | null; horario: string | null } | null)
    .filter(Boolean) as { id: string; nome: string; dias_semana: string[] | null; horario: string | null }[]

  // Avisos ativos: da academia toda ou das turmas do aluno
  const turmaIdsDoAluno = turmas.map(t => t.id)
  const avisosFiltro = turmaIdsDoAluno.length > 0
    ? `turma_id.is.null,turma_id.in.(${turmaIdsDoAluno.join(',')})`
    : 'turma_id.is.null'
  const { data: avisosData } = await supabase
    .from('avisos')
    .select('id, titulo, corpo, criado_em, turmas(nome)')
    .eq('academia_id', aluno.academia_id)
    .eq('ativo', true)
    .or(avisosFiltro)
    .order('criado_em', { ascending: false })

  // Recent presences
  const { data: presencasData } = await supabase
    .from('presencas')
    .select('aulas(data, tema, turmas(nome))')
    .eq('aluno_id', aluno.id)
    .order('registrado_em', { ascending: false })
    .limit(10)

  // Frequência: últimos 30/90 dias + última presença
  const trintaDias = new Date(); trintaDias.setDate(trintaDias.getDate() - 30)
  const noventaDias = new Date(); noventaDias.setDate(noventaDias.getDate() - 90)

  const [{ count: presencas30 }, { count: presencas90 }, { data: ultimaPresenca }] = await Promise.all([
    supabase.from('presencas').select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id).gte('registrado_em', trintaDias.toISOString()),
    supabase.from('presencas').select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id).gte('registrado_em', noventaDias.toISOString()),
    supabase.from('presencas').select('registrado_em')
      .eq('aluno_id', aluno.id).order('registrado_em', { ascending: false }).limit(1).maybeSingle(),
  ])

  const diasDesdeUltima = ultimaPresenca?.registrado_em
    ? Math.floor((Date.now() - new Date(ultimaPresenca.registrado_em).getTime()) / 86400000)
    : null

  // Técnicas da Semana — posições desta semana filtradas pela faixa do aluno
  type PosicaoSemana = { data: string; turma_nome: string | null; posicoes: string[] }
  let tecnicasDaSemana: PosicaoSemana[] = []
  const turmaIds = turmas.map(t => t.id)
  if (turmaIds.length > 0) {
    const today = new Date()
    const dow = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const weekStart = monday.toISOString().split('T')[0]
    const weekEnd = sunday.toISOString().split('T')[0]

    const { data: aulasSemanaisData } = await supabase
      .from('aulas')
      .select('id, data, turma_id, turmas(nome)')
      .in('turma_id', turmaIds)
      .gte('data', weekStart)
      .lte('data', weekEnd)
      .order('data')

    const aulasSemanais = (aulasSemanaisData ?? []) as unknown as {
      id: string; data: string; turma_id: string; turmas: { nome: string } | null
    }[]

    if (aulasSemanais.length > 0) {
      const aulaSemanaisIds = aulasSemanais.map(a => a.id)
      const { data: atData } = await supabase
        .from('aula_tecnicas')
        .select('aula_id, tecnicas(nome, faixas)')
        .in('aula_id', aulaSemanaisIds)
        .in('tipo', ['planejada', 'ensinada'])

      const faixaAluno = aluno.faixa
      tecnicasDaSemana = aulasSemanais.map(a => {
        const turmaObj = a.turmas as unknown as { nome: string } | null
        const ats = (atData ?? []).filter(at => at.aula_id === a.id)
        const posicoes = ats
          .map(at => at.tecnicas as unknown as { nome: string; faixas: string[] } | null)
          .filter((t): t is { nome: string; faixas: string[] } => Boolean(t))
          .filter(t => t.faixas.length === 0 || t.faixas.includes(faixaAluno))
          .map(t => t.nome)
        return { data: a.data, turma_nome: turmaObj?.nome ?? null, posicoes }
      }).filter(a => a.posicoes.length > 0)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-12 pb-6" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-14 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
            </p>
            <h1 className="font-bold text-2xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              {aluno.nome.split(' ')[0]}
            </h1>
          </div>
          <AvatarUpload
            alunoId={aluno.id}
            nome={aluno.nome}
            fotoUrlAtual={aluno.foto_url}
            persist={updateFotoPropria}
            size={56}
          />
        </div>
        <div className="mt-3">
          <PushSubscribeButton />
        </div>
      </header>

      <main className="px-6 pt-6 pb-10 space-y-6">

        {/* Avisos */}
        {(avisosData ?? []).length > 0 && (
          <div className="space-y-2">
            {(avisosData ?? []).map(a => {
              const turma = a.turmas as unknown as { nome: string } | null
              return (
                <div key={a.id} className="rounded-2xl p-4"
                  style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{a.titulo}</p>
                    <span className="text-[9px] uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--brand-gold)' }}>
                      {turma?.nome ?? 'Geral'}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-sec)' }}>{a.corpo}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Active classes — check-in */}
        {aulasAtivas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Fazer check-in
            </p>
            {aulasAtivas.map(aula => (
              <CheckinCard
                key={aula.id}
                aula={aula}
                jaFezCheckin={checkinSet.has(aula.id)}
              />
            ))}
          </div>
        )}

        {/* Turmas */}
        {turmas.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Minhas turmas
            </p>
            <div className="space-y-2">
              {turmas.map(t => (
                <div key={t.id} className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <p className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--brand-texto)' }}>
                    {t.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {t.dias_semana?.map(d => (
                      <span key={d} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--brand-texto-muted)', background: 'var(--brand-surf-2)' }}>
                        {DIAS_ABBR[d] ?? d}
                      </span>
                    ))}
                    {t.horario && (
                      <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>· {t.horario.substring(0, 5)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Técnicas da Semana */}
        {tecnicasDaSemana.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Técnicas da semana
            </p>
            <div className="space-y-2">
              {tecnicasDaSemana.map((item, i) => {
                const d = new Date(item.data + 'T12:00:00')
                const dataFmt = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
                return (
                  <div key={i} className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium capitalize" style={{ color: 'var(--brand-texto-sec)' }}>{dataFmt}</p>
                      {item.turma_nome && (
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--brand-gold)' }}>
                          {item.turma_nome}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.posicoes.map((pos, j) => (
                        <span key={j}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                          {pos}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Frequência */}
        {(presencas30 ?? 0) > 0 || (presencas90 ?? 0) > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Meu histórico
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="px-4 py-3 rounded-2xl text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="font-bold text-2xl" style={{ color: 'var(--brand-texto)' }}>
                  {presencas30 ?? 0}
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>Últimos 30 dias</p>
              </div>
              <div className="px-4 py-3 rounded-2xl text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="font-bold text-2xl" style={{ color: 'var(--brand-texto)' }}>
                  {presencas90 ?? 0}
                </p>
                <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>Últimos 90 dias</p>
              </div>
            </div>
            {diasDesdeUltima !== null && (
              <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
                Última presença: {diasDesdeUltima === 0 ? 'hoje' : diasDesdeUltima === 1 ? 'ontem' : `${diasDesdeUltima} dias atrás`}
              </p>
            )}
          </div>
        ) : null}

        {/* Recent presences */}
        {(presencasData ?? []).length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Presenças recentes
            </p>
            <div className="space-y-1">
              {(presencasData ?? []).map((p, i) => {
                const aula = p.aulas as unknown as { data: string; tema: string | null; turmas: { nome: string } | null } | null
                if (!aula) return null
                const turma = aula.turmas
                const data = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: 'short',
                })
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ border: '1px solid var(--brand-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--brand-texto-sec)' }}>
                      {turma?.nome ?? 'Aula avulsa'}
                      {aula.tema ? ` · ${aula.tema}` : ''}
                    </p>
                    <p className="text-xs flex-shrink-0 ml-2 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>{data}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {aulasAtivas.length === 0 && turmas.length === 0 && (presencasData ?? []).length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma aula ativa no momento
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
