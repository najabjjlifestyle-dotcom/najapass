import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import AvatarUpload from '@/components/avatar-upload'
import LogoutButton from '@/components/logout-button'
import { updateFotoPropria } from '../actions'
import PushSubscribeButton from '../push-subscribe'
import PerfilForm from './perfil-form'
import { graduacaoInsight } from '@/lib/graduacao-insight'
import { CalendarDays, MapPin } from 'lucide-react'

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

function fmtLongo(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Faixa de BJJ estilizada: barra na cor da faixa + ponteira com os 4 graus
// (preenchidos em branco, vazios em cinza — os graus aparecem mesmo com 0).
function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFFFFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div className="flex items-stretch h-11 rounded-lg overflow-hidden"
      style={{ background: cor, border: '1px solid rgba(255,255,255,0.18)' }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[4px] px-3" style={{ background: rankCor, minWidth: 92 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[4px] h-6 rounded-sm"
            style={{ background: i < grau ? '#FFFFFF' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <div style={{ width: 18, background: cor }} />
    </div>
  )
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

  const graduadoEm = fmtLongo(aluno.graduado_em)
  const grauEm = fmtLongo(aluno.grau_em)
  const insight = graduacaoInsight(aluno.faixa, aluno.grau, aluno.graduado_em, aluno.grau_em)

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
          <p className="text-[11px] uppercase tracking-widest mt-1 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
          </p>
        </div>
        <PushSubscribeButton />
      </header>

      <main className="px-5 pt-5 pb-10 space-y-5">

        {/* ── Hero da graduação — faixa + graus + datas, sempre visível ── */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <BeltBar faixa={aluno.faixa} grau={aluno.grau} />

          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold capitalize leading-none" style={{ color: 'var(--brand-texto)' }}>
                Faixa {aluno.faixa}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--brand-gold)' }}>
                {aluno.grau > 0 ? `${aluno.grau}º grau` : 'Lisa'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: '1px solid var(--brand-border)' }}>
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
                Faixa desde
              </p>
              <p className="text-sm" style={{ color: graduadoEm ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
                {graduadoEm ?? 'Não registrada'}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
                Último grau
              </p>
              <p className="text-sm" style={{ color: grauEm ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
                {grauEm ?? (aluno.grau > 0 ? 'Não registrado' : 'Sem graus ainda')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Análise de graduação — celebra conquista / avisa próxima faixa ── */}
        <div className="rounded-2xl p-4 flex gap-3 items-start"
          style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
          <span className="text-2xl leading-none flex-shrink-0">{insight.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--brand-gold)' }}>{insight.titulo}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--brand-texto-sec)' }}>{insight.texto}</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl py-4 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-[28px] font-bold leading-none" style={{ color: 'var(--brand-gold)' }}>{total ?? 0}</p>
            <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
              aulas no Naja BJJ
            </p>
          </div>
          <div className="rounded-2xl py-4 px-2 text-center flex flex-col justify-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            {desde ? (
              <>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--brand-gold)' }}>
                  {tempoNaAcademia}
                </p>
                <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  na academia · desde {desde}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--brand-texto-muted)' }}>
                  —
                </p>
                <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  tempo de casa
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Menu ── */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest px-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Meu treino
          </p>

          {turmas.map(t => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                <CalendarDays size={16} style={{ color: 'var(--brand-gold)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold uppercase tracking-wider text-sm truncate" style={{ color: 'var(--brand-texto)' }}>
                  {t.nome}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {t.dias_semana?.map(d => (
                    <span key={d}
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
                      {DIAS_ABBR[d] ?? d}
                    </span>
                  ))}
                  {t.horario && (
                    <span className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>· {t.horario.substring(0, 5)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {academia?.nome && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
                <MapPin size={16} style={{ color: 'var(--brand-gold)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>Academia</p>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--brand-texto)' }}>{academia.nome}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Dados pessoais ── */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest px-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Meus dados
          </p>
          <PerfilForm
            dataNascimentoAtual={aluno.data_nascimento}
            condicoesSaudeAtual={aluno.condicoes_saude}
            diaMensalidadeAtual={aluno.dia_mensalidade}
          />
        </div>

        <LogoutButton />
      </main>
    </div>
  )
}
