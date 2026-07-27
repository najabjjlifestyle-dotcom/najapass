import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import { BeltBar } from '@/components/belt-bar'
import { computarConquistas } from '@/lib/conquistas'

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { aluno: eu, supabase } = await getAlunoOuRedireciona()

  // Próprio perfil → manda pro perfil completo.
  if (id === eu.id) redirect('/aluno/perfil')

  // Só campos seguros, e dentro da mesma academia (garantia além do RLS).
  const { data: alvo } = await supabase
    .from('alunos')
    .select('id, nome, foto_url, faixa, grau, academia_id, matriculado_em')
    .eq('id', id)
    .eq('academia_id', eu.academia_id)
    .eq('ativo', true)
    .maybeSingle()

  if (!alvo) return notFound()

  const [{ count: totalPresencas }, { data: conquistasData }] = await Promise.all([
    supabase.from('presencas').select('id', { count: 'exact', head: true }).eq('aluno_id', alvo.id),
    supabase.rpc('dados_conquistas_aluno', { p_aluno_id: alvo.id }).then(r => r.error ? { data: null } : r),
  ])

  type ConquistasRow = { total_presencas: number; max_treinos_mes: number }
  const cRow = (conquistasData as ConquistasRow[] | null)?.[0]
  const anosNaAcademia = alvo.matriculado_em
    ? (Date.now() - new Date(alvo.matriculado_em).getTime()) / (1000 * 60 * 60 * 24 * 365)
    : 0

  const todas = computarConquistas({
    totalPresencas: cRow?.total_presencas ?? totalPresencas ?? 0,
    maxTreinosMes: cRow?.max_treinos_mes ?? 0,
    anosNaAcademia,
    faixa: alvo.faixa ?? 'branca',
  })
  const desbloqueadas = todas.filter(c => c.desbloqueada)
  const primeiroNome = alvo.nome.split(' ')[0]

  return (
    <div className="min-h-dvh pb-20" style={{ background: 'var(--brand-fundo)' }}>
      <div className="px-4 pt-safe pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/aluno/historico"
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 active:scale-90 transition-transform"
          style={{ border: '1px solid var(--brand-border)' }}>
          <span style={{ color: 'var(--brand-texto)' }}>←</span>
        </Link>
        <p className="font-bold" style={{ color: 'var(--brand-texto)' }}>
          Perfil de {primeiroNome}
        </p>
      </div>

      <div className="px-4 space-y-6 mt-5">
        <div className="flex flex-col items-center gap-3 py-4">
          {alvo.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={alvo.foto_url} alt={alvo.nome}
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: '3px solid var(--brand-gold-border)' }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black"
              style={{ background: 'var(--brand-gold-dim)', border: '3px solid var(--brand-gold-border)', color: 'var(--brand-gold)' }}>
              {alvo.nome.charAt(0)}
            </div>
          )}
          <div className="text-center">
            <p className="text-xl font-black" style={{ color: 'var(--brand-texto)' }}>{alvo.nome}</p>
            {alvo.matriculado_em && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                Na academia desde {new Date(alvo.matriculado_em).getFullYear()}
              </p>
            )}
          </div>
        </div>

        <BeltBar faixa={alvo.faixa ?? 'branca'} grau={alvo.grau ?? 0} />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl px-4 py-3 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-2xl font-black" style={{ color: 'var(--brand-gold)' }}>{totalPresencas ?? 0}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>treinos</p>
          </div>
          <div className="rounded-xl px-4 py-3 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-2xl font-black" style={{ color: 'var(--brand-gold)' }}>{desbloqueadas.length}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>conquistas</p>
          </div>
        </div>

        {desbloqueadas.length > 0 ? (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Conquistas de {primeiroNome}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {desbloqueadas.map(c => (
                <div key={c.id}
                  className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                  style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                  <span className="text-xl flex-shrink-0">{c.emoji}</span>
                  <p className="text-xs font-bold leading-tight truncate" style={{ color: 'var(--brand-texto)' }}>
                    {c.nome}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl py-8 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px dashed var(--brand-border)' }}>
            <p className="text-2xl mb-2">🥋</p>
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              {primeiroNome} ainda não desbloqueou conquistas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
