import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFFFFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div className="flex items-stretch h-12 rounded-xl overflow-hidden w-full"
      style={{ background: cor }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[4px] px-4" style={{ background: rankCor, minWidth: 88 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[4px] h-6 rounded-sm"
            style={{ background: i < grau ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <div style={{ width: 16, background: cor }} />
    </div>
  )
}

export default async function CardGraduacaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id, academias(nome)')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, foto_url, matriculado_em, graduado_em')
    .eq('id', id)
    .single()
  if (!aluno) redirect('/alunos')

  const { count: totalAulas } = await supabase
    .from('presencas')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', id)

  // Aulas nesta faixa (desde graduado_em)
  const refDate = aluno.graduado_em ?? aluno.matriculado_em ?? '1970-01-01'
  const { count: aulasNaFaixa } = await supabase
    .from('presencas')
    .select('aulas!inner(data)', { count: 'exact', head: true })
    .eq('aluno_id', id)
    .gte('aulas.data', refDate.substring(0, 10))

  const dataGrad = aluno.graduado_em
    ? new Date(aluno.graduado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const academia = professor.academias as unknown as { nome: string } | null
  const cor = FAIXA_HEX[aluno.faixa] ?? '#FFFFFF'
  const nomeFirst = aluno.nome.split(' ')[0]

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-6"
      style={{ background: '#080808' }}>
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6 relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% -10%, ${cor}33 0%, #111111 65%)`,
          border: `1px solid ${cor}44`,
        }}>

        {/* Marca d'água: cobra + academia */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em]" style={{ color: '#444' }}>
              NajaPass
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#666' }}>
              {academia?.nome ?? 'Naja BJJ'}
            </p>
          </div>
          <p className="text-2xl opacity-30">🐍</p>
        </div>

        {/* Foto + nome */}
        <div className="text-center space-y-3">
          {aluno.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={aluno.foto_url}
              alt={aluno.nome}
              className="w-20 h-20 rounded-full object-cover mx-auto"
              style={{ border: `3px solid ${cor}` }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto"
              style={{ background: `${cor}22`, border: `3px solid ${cor}`, color: cor }}>
              {nomeFirst.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{aluno.nome}</p>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: cor === '#FFFFFF' ? 'var(--brand-gold)' : cor }}>
              Graduado em {dataGrad}
            </p>
          </div>
        </div>

        {/* Belt bar */}
        <BeltBar faixa={aluno.faixa} grau={aluno.grau} />

        {/* Faixa label */}
        <p className="text-center text-3xl font-bold capitalize tracking-widest" style={{ color: '#FFFFFF' }}>
          Faixa {aluno.faixa}
          {aluno.grau > 0 && (
            <span className="text-xl ml-2" style={{ color: '#888' }}>· {aluno.grau}º grau</span>
          )}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-3xl font-bold leading-none" style={{ color: '#C8A96E' }}>
              {aulasNaFaixa ?? 0}
            </p>
            <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#555' }}>
              aulas nesta faixa
            </p>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-3xl font-bold leading-none" style={{ color: '#C8A96E' }}>
              {totalAulas ?? 0}
            </p>
            <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#555' }}>
              total de aulas
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-[8px] uppercase tracking-[0.4em]" style={{ color: '#222' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
