import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import AvatarUpload from '@/components/avatar-upload'
import LogoutButton from '@/components/logout-button'
import { updateFotoPropria } from '../actions'
import PushSubscribeButton from '../push-subscribe'
import PerfilForm from './perfil-form'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

export default async function AlunoPerfilPage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  const [{ data: turmasData }, { count: total }, { data: academia }] = await Promise.all([
    supabase.from('alunos_turmas')
      .select('turmas(id, nome, dias_semana, horario)')
      .eq('aluno_id', aluno.id).eq('ativo', true),
    supabase.from('presencas')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id),
    supabase.from('academias').select('nome').eq('id', aluno.academia_id).maybeSingle(),
  ])

  const turmas = (turmasData ?? [])
    .map(t => t.turmas as unknown as { id: string; nome: string; dias_semana: string[] | null; horario: string | null } | null)
    .filter(Boolean) as { id: string; nome: string; dias_semana: string[] | null; horario: string | null }[]

  const desde = aluno.matriculado_em
    ? new Date(aluno.matriculado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null

  const tempoNaAcademia = aluno.matriculado_em
    ? (() => {
        const meses = Math.floor((Date.now() - new Date(aluno.matriculado_em!).getTime()) / (1000 * 60 * 60 * 24 * 30.5))
        if (meses < 1) return 'Menos de 1 mês'
        if (meses < 12) return `${meses} ${meses > 1 ? 'meses' : 'mês'}`
        const anos = Math.floor(meses / 12)
        const resto = meses % 12
        return resto > 0
          ? `${anos} ano${anos > 1 ? 's' : ''} e ${resto} ${resto > 1 ? 'meses' : 'mês'}`
          : `${anos} ano${anos > 1 ? 's' : ''}`
      })()
    : null

  return (
    <div>
      <div style={{ height: 3, background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF' }} />
      <header
        className="flex items-center gap-4 px-5 pt-safe pb-4"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <AvatarUpload
          entityId={aluno.id}
          nome={aluno.nome}
          fotoUrlAtual={aluno.foto_url}
          persist={updateFotoPropria}
          size={64}
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate" style={{ color: 'var(--brand-texto)' }}>
            {aluno.nome}
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: FAIXA_HEX[aluno.faixa] ?? '#FFFFFF' }} />
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--brand-texto-muted)' }}>
              {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
            </p>
          </div>
        </div>
        <PushSubscribeButton />
      </header>

      <main className="px-5 pt-5 pb-10 space-y-5">

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl py-4 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[28px] font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>{total ?? 0}</p>
            <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
              aulas no Naja BJJ
            </p>
          </div>
          {desde ? (
            <div className="rounded-2xl py-4 px-2 text-center flex flex-col justify-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--brand-gold)' }}>
                {tempoNaAcademia}
              </p>
              <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                na academia · desde {desde}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl py-4 text-center flex flex-col justify-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-[28px] font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>
                {aluno.grau}
              </p>
              <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
                {aluno.grau === 1 ? 'grau' : 'graus'}
              </p>
            </div>
          )}
        </div>

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
                  <div className="flex items-center gap-2 mt-1.5">
                    {t.dias_semana?.map(d => (
                      <span key={d}
                        className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
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

        {academia?.nome && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
              Academia
            </p>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--brand-texto)' }}>{academia.nome}</p>
            </div>
          </div>
        )}

        <PerfilForm
          dataNascimentoAtual={aluno.data_nascimento}
          condicoesSaudeAtual={aluno.condicoes_saude}
          diaMensalidadeAtual={aluno.dia_mensalidade}
        />

        <LogoutButton />
      </main>
    </div>
  )
}
