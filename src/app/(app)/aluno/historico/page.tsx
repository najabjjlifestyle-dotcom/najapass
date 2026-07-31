import Link from 'next/link'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import { LeaderboardMensal } from '@/components/aluno/leaderboard-mensal'
import { nomeTecnica } from '@/lib/tecnicas'

type AulaPresenca = {
  id: string | null
  data: string | null
  foto_url: string | null
  turmas: { nome: string } | null
  aula_tecnicas: { tipo: string; grupo_id: string | null; tecnicas: { nome: string; tecnicas_academias: { nome_custom: string }[] | null } | null }[] | null
}

export default async function AlunoHistoricoPage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  const trintaDias = new Date(); trintaDias.setDate(trintaDias.getDate() - 30)
  const noventaDias = new Date(); noventaDias.setDate(noventaDias.getDate() - 90)

  const hojeDate = new Date()
  const mesLabel = hojeDate.toLocaleDateString('pt-BR', { month: 'long' })

  const [
    { count: presencas30 },
    { count: presencas90 },
    { count: total },
    { data: ultimaPresenca },
    { data: presencasData },
    { data: anotacoesData },
    { data: rankingData },
  ] = await Promise.all([
    supabase.from('presencas').select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id).gte('registrado_em', trintaDias.toISOString()),
    supabase.from('presencas').select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id).gte('registrado_em', noventaDias.toISOString()),
    supabase.from('presencas').select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id),
    supabase.from('presencas').select('registrado_em')
      .eq('aluno_id', aluno.id).order('registrado_em', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('presencas')
      .select('registrado_em, grupo_id, aulas(id, data, foto_url, turmas(nome), aula_tecnicas(tipo, grupo_id, tecnicas(nome, tecnicas_academias(nome_custom))))')
      .eq('aluno_id', aluno.id)
      .order('registrado_em', { ascending: false })
      .limit(50),
    supabase.from('anotacoes_treino').select('aula_id').eq('aluno_id', aluno.id),
    // Ranking mensal da academia. .then de fallback caso a migration não rodou.
    supabase.rpc('ranking_frequencia_mensal', {
      p_academia_id: aluno.academia_id,
      p_ano: hojeDate.getFullYear(),
      p_mes: hojeDate.getMonth() + 1,
    }).then(r => r.error ? { data: null } : r),
  ])

  type RankingRow = { aluno_id: string; aluno_nome: string; foto_url: string | null; presencas_mes: number; posicao: number }
  const ranking = (rankingData as RankingRow[] | null) ?? []

  const anotacoesSet = new Set((anotacoesData ?? []).map(a => a.aula_id))

  const diasDesdeUltima = ultimaPresenca?.registrado_em
    ? Math.floor((Date.now() - new Date(ultimaPresenca.registrado_em).getTime()) / 86400000)
    : null

  const presencas = ((presencasData ?? []) as unknown as { registrado_em: string; grupo_id: string | null; aulas: AulaPresenca | null }[])
    .map(p => {
      const aula = p.aulas
      // Só as técnicas do grupo do aluno naquela aula (+ as comuns, grupo NULL).
      const tecnicas = (aula?.aula_tecnicas ?? [])
        .filter(at => at.tipo === 'ensinada' && (at.grupo_id === null || at.grupo_id === p.grupo_id))
        .map(at => at.tecnicas ? nomeTecnica(at.tecnicas) : null)
        .filter((n): n is string => Boolean(n))
      return {
        aulaId: aula?.id ?? null,
        data: aula?.data ?? null,
        foto_url: aula?.foto_url ?? null,
        turma: aula?.turmas?.nome ?? 'Aula avulsa',
        tecnicas,
        registrado_em: p.registrado_em,
      }
    })

  return (
    <div>
      <header className="px-5 pt-safe pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--brand-texto)' }}>
          Meu <span style={{ color: 'var(--brand-gold)' }}>histórico</span>
        </h1>
      </header>

      <main className="px-5 pt-5 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { valor: presencas30 ?? 0, label: '30 dias' },
            { valor: presencas90 ?? 0, label: '90 dias' },
            { valor: total ?? 0, label: 'total' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl py-4 text-center"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-[22px] font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>{stat.valor}</p>
              <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {diasDesdeUltima !== null && (
          <p className="text-[11px] text-center" style={{ color: 'var(--brand-texto-muted)' }}>
            Último treino:{' '}
            <span style={{ color: 'var(--brand-texto)' }}>
              {diasDesdeUltima === 0 ? 'hoje' : diasDesdeUltima === 1 ? 'ontem' : `${diasDesdeUltima} dias atrás`}
            </span>
          </p>
        )}

        {/* Ranking mensal da academia (some sozinho se ninguém treinou no mês) */}
        <LeaderboardMensal ranking={ranking} meuAlunoId={aluno.id} mesLabel={mesLabel} />

        {presencas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma presença registrada ainda.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Aulas presenciadas
            </p>
            <div className="space-y-2">
              {presencas.map((p, i) => {
                const dataFmt = p.data
                  ? new Date(p.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
                  : ''
                const conteudo = (
                  <>
                    {p.foto_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto_url}
                        alt={`Treino ${p.turma}`}
                        className="w-full object-cover"
                        style={{ maxHeight: 160 }}
                      />
                    )}
                    <div className="px-4 py-3 pr-12">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium" style={{ color: 'var(--brand-texto-sec)' }}>{p.turma}</p>
                        <p className="text-xs capitalize flex-shrink-0 ml-2" style={{ color: 'var(--brand-texto-muted)' }}>{dataFmt}</p>
                      </div>
                      {p.tecnicas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.tecnicas.map((t, j) => (
                            <span key={j}
                              className="px-2 py-0.5 rounded text-[10px] font-bold"
                              style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )
                return (
                  <div key={i} className="relative rounded-2xl overflow-hidden" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    {p.aulaId ? (
                      <Link href={`/aluno/aula/${p.aulaId}`} className="block active:opacity-90 transition-opacity">
                        {conteudo}
                      </Link>
                    ) : conteudo}
                    {p.aulaId && (
                      <Link href={`/aluno/aula/${p.aulaId}/anotacao`}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm active:scale-90 transition-transform"
                        style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border)' }}
                        title={anotacoesSet.has(p.aulaId) ? 'Ver anotação' : 'Anotar treino'}
                        aria-label="Minha anotação">
                        {anotacoesSet.has(p.aulaId) ? '📝' : '✏️'}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
