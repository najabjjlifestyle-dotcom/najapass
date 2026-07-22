import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GraduacaoForm from './graduacao'
import EditarAlunoForm from './editar'
import NotasProfessor from './notas'
import AvatarUpload from '@/components/avatar-upload'
import { updateFotoAluno } from './actions'
import BackButton from '@/components/back-button'

const FAIXA_COR: Record<string, string> = {
  branca: 'bg-white', cinza: 'bg-gray-400', amarela: 'bg-yellow-400',
  laranja: 'bg-orange-400', verde: 'bg-green-400', azul: 'bg-blue-400',
  roxa: 'bg-purple-400', marrom: 'bg-amber-700', preta: 'bg-gray-800 border border-white/20',
}

// Dias até o próximo aniversário + idade atual. Usa meio-dia pra evitar
// deslocamento de timezone que jogaria a data pro dia anterior.
function proximoAniversario(dataNasc: string | null): { diasAte: number; idade: number } | null {
  if (!dataNasc) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const nasc = new Date(dataNasc + 'T12:00:00')

  const proxAniv = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate())
  if (proxAniv < hoje) proxAniv.setFullYear(hoje.getFullYear() + 1)

  const diasAte = Math.round((proxAniv.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  // Idade que ele terá/tem hoje: anos entre nascimento e o ano do aniversário
  // que ainda vai acontecer, menos 1 se o aniversário deste ciclo é no ano que vem.
  const idade = proxAniv.getFullYear() - nasc.getFullYear() - (diasAte === 0 ? 0 : 1)
  return { diasAte, idade }
}

function fmtData(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

type PresencaRow = {
  aula_id: string
  aulas: { data: string; tema: string | null; turmas: { nome: string } | null } | null
}

type JornadaCat = {
  categoria: string
  categoria_id: string
  tecnicas: { id: string; nome: string; vezes: number }[]
  total_visto: number
}

export default async function AlunoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, email, telefone, ativo, matriculado_em, foto_url, data_nascimento, condicoes_saude, dia_mensalidade, graduado_em, grau_em')
    .eq('id', id)
    .single()

  if (!aluno) redirect('/alunos')

  const { data: turmasData } = await supabase
    .from('alunos_turmas')
    .select('turmas(id, nome, dias_semana, horario)')
    .eq('aluno_id', id)
    .eq('ativo', true)

  const turmas = (turmasData ?? [])
    .map(t => t.turmas as unknown as { id: string; nome: string; dias_semana: string[] | null; horario: string | null } | null)
    .filter(Boolean) as { id: string; nome: string; dias_semana: string[] | null; horario: string | null }[]

  const { data: presencasData } = await supabase
    .from('presencas')
    .select('aula_id, aulas(data, tema, turmas(nome))')
    .eq('aluno_id', id)
    .order('registrado_em', { ascending: false })
    .limit(20)

  const presencas = (presencasData ?? []) as unknown as PresencaRow[]

  const { data: jornadaRaw } = await supabase.rpc('jornada_tecnica_aluno', { p_aluno_id: id })
  const jornada = (jornadaRaw ?? []) as JornadaCat[]

  const { data: notasData } = await supabase
    .from('notas_professor')
    .select('id, texto, criado_em')
    .eq('aluno_id', id)
    .order('criado_em', { ascending: false })
    .limit(20)

  const trinta_dias = new Date()
  trinta_dias.setDate(trinta_dias.getDate() - 30)

  const presencasRecentes = presencas.filter(p =>
    p.aulas?.data && new Date(p.aulas.data) >= trinta_dias
  ).length

  const matriculadoEm = aluno.matriculado_em
    ? new Date(aluno.matriculado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-6 pt-safe pb-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/alunos" />
        <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          {aluno.nome.split(' ')[0]}
        </h1>
      </header>

      <main className="px-6 pt-6 pb-10 space-y-6">

        {/* Foto */}
        <AvatarUpload
          entityId={aluno.id}
          nome={aluno.nome}
          fotoUrlAtual={aluno.foto_url}
          persist={updateFotoAluno.bind(null, aluno.id)}
          size={72}
        />

        {/* Student card */}
        <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div className={`w-4 h-16 rounded-full flex-shrink-0 ${FAIXA_COR[aluno.faixa] ?? 'bg-white'}`} />
          <div>
            <h2 className="font-bold text-2xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              {aluno.nome}
            </h2>
            <p className="text-sm capitalize mt-0.5" style={{ color: 'var(--brand-texto-sec)' }}>
              Faixa {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
            </p>
            {matriculadoEm && (
              <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>Desde {matriculadoEm}</p>
            )}
            {!aluno.ativo && (
              <span className="inline-block mt-1.5 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                Inativo
              </span>
            )}
          </div>
        </div>

        {/* Graduação — datas da faixa atual e do último grau (sempre visível) */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>Graduação</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-0.5 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
                Faixa {aluno.faixa} desde
              </p>
              <p className="text-sm" style={{ color: aluno.graduado_em ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
                {fmtData(aluno.graduado_em) ?? 'Não registrada'}
              </p>
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                {aluno.grau > 0 ? `${aluno.grau}º grau desde` : 'Último grau'}
              </p>
              <p className="text-sm" style={{ color: aluno.grau_em ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
                {fmtData(aluno.grau_em) ?? (aluno.grau > 0 ? 'Não registrado' : 'Sem graus ainda')}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="px-4 py-4 rounded-2xl text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="font-bold text-3xl" style={{ color: 'var(--brand-texto)' }}>
              {presencas.length}
            </p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
              Presenças total
            </p>
          </div>
          <div className="px-4 py-4 rounded-2xl text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="font-bold text-3xl" style={{ color: 'var(--brand-texto)' }}>
              {presencasRecentes}
            </p>
            <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
              Últimos 30 dias
            </p>
          </div>
        </div>

        {/* Contact */}
        {(aluno.email || aluno.telefone) && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>Contato</p>
            {aluno.email && (
              <p className="text-sm" style={{ color: 'var(--brand-texto-sec)' }}>{aluno.email}</p>
            )}
            {aluno.telefone && (
              <p className="text-sm" style={{ color: 'var(--brand-texto-sec)' }}>{aluno.telefone}</p>
            )}
          </div>
        )}

        {/* Dados pessoais — só aparece se o aluno preencheu algo */}
        {(aluno.data_nascimento || aluno.condicoes_saude !== null || aluno.dia_mensalidade) && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Dados pessoais
            </p>

            {aluno.data_nascimento && (() => {
              const aniv = proximoAniversario(aluno.data_nascimento)
              const dataFormatada = new Date(aluno.data_nascimento + 'T12:00:00')
                .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
              return (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                      Nascimento
                    </p>
                    <p className="text-sm" style={{ color: 'var(--brand-texto-sec)' }}>
                      {dataFormatada}
                    </p>
                    {aniv && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                        {aniv.idade} anos
                      </p>
                    )}
                  </div>
                  {aniv && aniv.diasAte <= 7 && (
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-xl"
                      style={{
                        background: aniv.diasAte === 0 ? 'rgba(251,191,36,0.15)' : 'var(--brand-gold-dim)',
                        border: `1px solid ${aniv.diasAte === 0 ? 'rgba(251,191,36,0.5)' : 'var(--brand-gold-border)'}`,
                        color: 'var(--brand-gold)',
                      }}>
                      {aniv.diasAte === 0 ? '🎂 Hoje!' : `🎂 em ${aniv.diasAte}d`}
                    </span>
                  )}
                </div>
              )
            })()}

            {aluno.condicoes_saude !== null && (
              <div className="px-4 py-3 rounded-2xl"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
                  Saúde
                </p>
                <p className="text-sm" style={{ color: aluno.condicoes_saude ? 'var(--brand-texto-sec)' : 'var(--brand-texto-muted)' }}>
                  {aluno.condicoes_saude || 'Nenhuma condição informada'}
                </p>
              </div>
            )}

            {aluno.dia_mensalidade && (
              <div className="px-4 py-3 rounded-2xl"
                style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
                  Mensalidade
                </p>
                <p className="text-sm" style={{ color: 'var(--brand-texto-sec)' }}>
                  Dia {aluno.dia_mensalidade} de cada mês
                </p>
              </div>
            )}
          </div>
        )}

        {/* Turmas */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Turmas</p>
          {turmas.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>Não matriculado em nenhuma turma.</p>
          ) : (
            <div className="space-y-2">
              {turmas.map(t => (
                <Link key={t.id} href={`/turmas/${t.id}`}
                  className="block px-4 py-2 rounded-xl active:scale-[0.98] transition-transform"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
                    {t.nome}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Jornada Técnica */}
        {jornada.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
                Jornada Técnica
              </p>
              <p className="text-[10px]" style={{ color: 'var(--brand-texto-muted)' }}>
                {jornada.reduce((s, c) => s + c.tecnicas.length, 0)} técnicas aprendidas
              </p>
            </div>

            <div className="space-y-2">
              {jornada.map(cat => (
                <div key={cat.categoria_id}
                  className="px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--brand-texto)' }}>
                      {cat.categoria}
                    </p>
                    <span className="text-[9px] px-2 py-0.5 rounded"
                      style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                      {cat.tecnicas.length} téc.
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {cat.tecnicas.map(t => (
                      <span key={t.id}
                        className="px-2 py-0.5 rounded text-[9px] font-bold"
                        style={{
                          background: t.vezes >= 3 ? 'rgba(74,222,128,0.1)' : 'var(--brand-gold-dim)',
                          border: `1px solid ${t.vezes >= 3 ? 'rgba(74,222,128,0.3)' : 'var(--brand-gold-border)'}`,
                          color: t.vezes >= 3 ? '#4ADE80' : 'var(--brand-gold)',
                        }}>
                        {t.nome}
                        {t.vezes >= 2 && <span className="ml-1 opacity-60">×{t.vezes}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] mt-1.5 text-right" style={{ color: 'var(--brand-texto-muted)' }}>
              Verde = vista 3+ vezes · Dourado = vista 1–2 vezes
            </p>
          </div>
        ) : (
          <div className="px-4 py-5 rounded-xl text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma técnica registrada ainda
            </p>
            <p className="text-[9px] mt-1" style={{ color: '#333' }}>
              As técnicas aparecem aqui quando o professor finalizá-las nas aulas em que este aluno esteve presente
            </p>
          </div>
        )}

        {/* Notas privadas do professor */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            🔒 Observações do professor
          </p>
          <NotasProfessor
            alunoId={aluno.id}
            notas={(notasData ?? []).map(n => ({ id: n.id, texto: n.texto, criado_em: n.criado_em }))}
          />
        </div>

        {/* Graduação */}
        <GraduacaoForm alunoId={aluno.id} faixaAtual={aluno.faixa ?? 'branca'} grauAtual={aluno.grau ?? 0} />

        {/* Card de graduação instagramável (abre em nova aba) */}
        <a
          href={`/alunos/${aluno.id}/card-graduacao`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2.5 rounded-xl text-xs uppercase tracking-widest active:opacity-70"
          style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
          📸 Card de graduação →
        </a>

        {/* Editar dados / inativar */}
        <EditarAlunoForm
          alunoId={aluno.id}
          nomeAtual={aluno.nome}
          emailAtual={aluno.email}
          telefoneAtual={aluno.telefone}
          ativo={aluno.ativo ?? true}
          dataNascimentoAtual={aluno.data_nascimento ?? null}
          condicoesSaudeAtual={aluno.condicoes_saude ?? null}
          diaMensalidadeAtual={aluno.dia_mensalidade ?? null}
        />

        {/* Attendance history */}
        {presencas.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>Histórico de presenças</p>
            <div className="space-y-1">
              {presencas.map((p, i) => {
                const aula = p.aulas
                if (!aula) return null
                const turma = aula.turmas as { nome: string } | null
                const data = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short',
                })
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ border: '1px solid var(--brand-border)' }}>
                    <p className="text-xs" style={{ color: 'var(--brand-texto-sec)' }}>
                      {turma?.nome ?? 'Aula avulsa'}
                      {aula.tema ? ` · ${aula.tema}` : ''}
                    </p>
                    <p className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--brand-texto-muted)' }}>{data}</p>
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
