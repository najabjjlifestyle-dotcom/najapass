import { notFound } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import BackButton from '@/components/back-button'
import AnotacaoForm from './anotacao-form'

export default async function AnotacaoAulaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: aulaId } = await params
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Valida que o aluno esteve presente nessa aula
  const { data: presenca } = await supabase
    .from('presencas')
    .select('aulas(data, turmas(nome))')
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aulaId)
    .maybeSingle()

  if (!presenca) notFound()

  const { data: anotacao } = await supabase
    .from('anotacoes_treino')
    .select('texto')
    .eq('aluno_id', aluno.id)
    .eq('aula_id', aulaId)
    .maybeSingle()

  type AulaInfo = { data: string; turmas: { nome: string } | null } | null
  const aulaInfo = presenca.aulas as unknown as AulaInfo
  const dataFmt = aulaInfo?.data
    ? new Date(aulaInfo.data + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
      })
    : null

  return (
    <div style={{ background: 'var(--brand-fundo)', minHeight: '100dvh' }}>
      <header className="flex items-center gap-3 px-4 pt-safe pb-4"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/aluno/historico" />
        <div>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            Diário do treino
          </p>
          <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--brand-texto)' }}>
            {aulaInfo?.turmas?.nome ?? 'Aula avulsa'}
          </h1>
          {dataFmt && (
            <p className="text-[10px] capitalize mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              {dataFmt}
            </p>
          )}
        </div>
      </header>

      <main className="px-4 pt-5 pb-10">
        <AnotacaoForm aulaId={aulaId} textoAtual={anotacao?.texto ?? ''} />
      </main>
    </div>
  )
}
