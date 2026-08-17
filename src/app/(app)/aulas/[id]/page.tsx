import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AttendanceList from './attendance-list'
import TecnicasAula from './tecnicas-aula'
import BackButton from '@/components/back-button'
import AulaAgendadaActions from './agendada-actions'
import DuplicarAulaButton from '@/components/duplicar-aula-button'
import AulaFotoUpload from '@/components/aula-foto-upload'
import { salvarFotoAula } from './actions'
import ZonaDePerigo from './gestao-aula'
import InfoAulaEdit from './info-aula-edit'
import GruposAula from './grupos-aula'
import { nomeTecnica } from '@/lib/tecnicas'

type AlunoRow = { id: string; nome: string; faixa: string; grau: number; foto_url: string | null }

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: aula } = await supabase
    .from('aulas')
    .select('id, data, status, hora_inicio, turma_id, video_url, observacoes, tema_id, foto_url, turmas(nome), tema:categorias_tecnicas(nome)')
    .eq('id', id)
    .single()

  if (!aula) redirect('/aulas')

  const temaNome = (aula.tema as unknown as { nome: string } | null)?.nome ?? null

  // Parallel: presencas, todas as aula_tecnicas, posições disponíveis, turmas (p/ duplicar)
  const [presencasResult, aulaTecnicasResult, todasTecnicasResult, turmasResult, gruposResult] = await Promise.all([
    supabase.from('presencas').select('id, aluno_id, nome_visitante, grupo_id').eq('aula_id', id),
    supabase
      .from('aula_tecnicas')
      .select('tipo, reforco, grupo_id, tecnicas(id, nome, categoria_id, categorias_tecnicas(nome), tecnicas_academias(nome_custom))')
      .eq('aula_id', id),
    supabase
      .from('tecnicas')
      .select('id, nome, categoria_id, categorias_tecnicas(nome), tecnicas_academias(nome_custom)')
      .or(`academia_id.eq.${professor.academia_id},global.eq.true`)
      .order('nome'),
    supabase
      .from('turmas')
      .select('id, nome')
      .eq('academia_id', professor.academia_id)
      .eq('ativa', true)
      .order('nome'),
    supabase.from('aula_grupos').select('id, nome').eq('aula_id', id).order('criado_em'),
  ])

  const grupos = (gruposResult.data ?? []) as { id: string; nome: string }[]
  const presencas = (presencasResult.data ?? []) as unknown as
    { id: string; aluno_id: string | null; nome_visitante: string | null; grupo_id: string | null }[]
  const presencaAlunoIds = presencas.map(p => p.aluno_id).filter((v): v is string => Boolean(v))
  const visitantesIniciais = presencas
    .filter(p => p.nome_visitante)
    .map(p => ({ id: p.id, nome: p.nome_visitante as string }))

  // Alunos da aula
  let alunos: AlunoRow[] = []
  let outrosAlunos: AlunoRow[] = []
  if (aula.turma_id) {
    const { data: turmaAlunos } = await supabase
      .from('alunos_turmas')
      .select('alunos(id, nome, faixa, grau, foto_url)')
      .eq('turma_id', aula.turma_id)
      .eq('ativo', true)
    alunos = (turmaAlunos ?? [])
      .map(ta => ta.alunos as unknown as AlunoRow | null)
      .filter(Boolean) as AlunoRow[]

    // Alunos avulsos: presença registrada mas não matriculados nessa turma
    const turmaAlunoIds = new Set(alunos.map(a => a.id))
    const avulsoIds = presencaAlunoIds.filter(alunoId => !turmaAlunoIds.has(alunoId))
    if (avulsoIds.length > 0) {
      const { data: avulsosData } = await supabase
        .from('alunos')
        .select('id, nome, faixa, grau, foto_url')
        .in('id', avulsoIds)
      alunos = [...alunos, ...((avulsosData as AlunoRow[]) ?? [])]
    }
    alunos.sort((a, b) => a.nome.localeCompare(b.nome))

    const { data: todosDaAcademia } = await supabase
      .from('alunos')
      .select('id, nome, faixa, grau, foto_url')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome')
    const jaNaLista = new Set(alunos.map(a => a.id))
    outrosAlunos = ((todosDaAcademia as AlunoRow[]) ?? []).filter(a => !jaNaLista.has(a.id))
  } else {
    const { data } = await supabase
      .from('alunos')
      .select('id, nome, faixa, grau, foto_url')
      .eq('academia_id', professor.academia_id)
      .eq('ativo', true)
      .order('nome')
    alunos = (data as AlunoRow[]) ?? []
  }

  const presencasIniciais = presencaAlunoIds

  type RawAT = {
    tipo: string
    reforco: boolean
    grupo_id: string | null
    tecnicas: { id: string; nome: string; categoria_id: string | null; categorias_tecnicas: { nome: string } | null; tecnicas_academias: { nome_custom: string }[] | null } | null
  }
  const aulaTecnicas = ((aulaTecnicasResult.data ?? []) as unknown as RawAT[]).filter(r => r.tecnicas)

  const tecnicasNaAula = aulaTecnicas.map(r => ({
    id: r.tecnicas!.id,
    nome: nomeTecnica(r.tecnicas!),
    categoria: r.tecnicas!.categorias_tecnicas?.nome ?? null,
    tipo: r.tipo as 'planejada' | 'ensinada' | 'nao_ensinada',
    reforco: r.reforco,
    grupo_id: r.grupo_id,
  }))

  // Temas da aula = categorias das posições que ela tem (multi). Fallback pro
  // tema_id antigo, pra aulas criadas antes de o tema virar derivado.
  const temasDerivados = [...new Set(tecnicasNaAula.map(t => t.categoria).filter(Boolean))] as string[]

  const naAulaIds = new Set(tecnicasNaAula.map(t => t.id))

  type RawTec = { id: string; nome: string; categoria_id: string | null; categorias_tecnicas: { nome: string } | null; tecnicas_academias: { nome_custom: string }[] | null }
  const disponiveis = ((todasTecnicasResult.data ?? []) as unknown as RawTec[])
    .filter(t => !naAulaIds.has(t.id))
    .map(t => ({ id: t.id, nome: nomeTecnica(t), categoria: t.categorias_tecnicas?.nome ?? null }))

  const turma = aula.turmas as unknown as { nome: string } | null

  // Dados pro cartão de grupos: cada presente com seu grupo, cada posição
  // ensinada/planejada com seu grupo (NULL = comum a todos).
  const nomePorAlunoId = new Map(alunos.map(a => [a.id, a.nome]))
  const presentesGrupo = presencas.map(p => ({
    presencaId: p.id,
    nome: p.aluno_id ? (nomePorAlunoId.get(p.aluno_id) ?? 'Aluno') : (p.nome_visitante ?? 'Visitante'),
    grupoId: p.grupo_id,
  }))
  const tecnicasGrupo = tecnicasNaAula
    .filter(t => t.tipo === 'ensinada' || t.tipo === 'planejada')
    .map(t => ({ tecnicaId: t.id, nome: t.nome, grupoId: t.grupo_id }))

  const dataFormatada = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
  // Aula com data no passado ainda não registrada — o professor está fazendo
  // um registro retroativo (semana que passou). Data livre, sem bloqueio.
  const hojeStr = new Date().toISOString().split('T')[0]
  const isRetroativa = (aula.data as string) < hojeStr
    && aula.status !== 'finalizada' && aula.status !== 'cancelada'

  // Contexto da última aula da turma — só faz sentido pra aula ainda não
  // iniciada, com turma definida (aula avulsa não tem "última aula" a comparar)
  let ultimaAulaDaTurma: { data: string; tecnicas: { nome: string; reforco: boolean }[] } | null = null
  if (aula.turma_id && aula.status === 'agendada') {
    const { data: ultima } = await supabase
      .from('aulas')
      .select('id, data')
      .eq('turma_id', aula.turma_id)
      .eq('status', 'finalizada')
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (ultima) {
      const { data: tecs } = await supabase
        .from('aula_tecnicas')
        .select('reforco, tecnicas(nome)')
        .eq('aula_id', ultima.id)
        .eq('tipo', 'ensinada')

      type UltimaTecRow = { reforco: boolean; tecnicas: { nome: string } | null }
      ultimaAulaDaTurma = {
        data: ultima.data,
        tecnicas: ((tecs ?? []) as unknown as UltimaTecRow[])
          .filter(t => t.tecnicas)
          .map(t => ({ nome: t.tecnicas!.nome, reforco: t.reforco })),
      }
    }
  }

  const dataUltimaAulaFmt = ultimaAulaDaTurma
    ? new Date(ultimaAulaDaTurma.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-start gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/aulas" useBack />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              {turma?.nome ?? 'Aula Avulsa'}
            </h1>
            {aula.status === 'finalizada' && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}>
                Finalizada
              </span>
            )}
            {aula.status === 'aberta' && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                Ao vivo
              </span>
            )}
            {aula.status === 'agendada' && (() => {
              const hoje = new Date().toISOString().split('T')[0]
              const isPendente = (aula.data as string) <= hoje
              return (
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                  style={{
                    color: isPendente ? '#FBBF24' : 'var(--brand-texto-muted)',
                    border: `1px solid ${isPendente ? 'rgba(251,191,36,0.3)' : 'var(--brand-border)'}`,
                  }}>
                  {isPendente ? 'Pendente' : 'Agendada'}
                </span>
              )
            })()}
            {aula.status === 'cancelada' && (
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                Cancelada
              </span>
            )}
          </div>
          <p className="text-xs mt-1 capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {dataFormatada}
            {aula.hora_inicio ? ` · ${(aula.hora_inicio as string).substring(0, 5)}` : ''}
          </p>
          {(temasDerivados.length > 0 ? temasDerivados : (temaNome ? [temaNome] : [])).length > 0 && (
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--brand-gold)' }}>
              {temasDerivados.length > 1 ? 'Temas: ' : 'Tema: '}
              {(temasDerivados.length > 0 ? temasDerivados : [temaNome]).join(' · ')}
            </p>
          )}
        </div>
        <DuplicarAulaButton aulaId={id} turmas={turmasResult.data ?? []} />
      </header>

      {isRetroativa && (
        <div className="mx-5 mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <Clock size={14} style={{ color: 'var(--brand-texto-muted)' }} className="flex-shrink-0" />
          <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            Registrando aula retroativa — {dataFormatada}
          </p>
        </div>
      )}

      {aula.status === 'agendada' && (
        <div className="px-5 mt-4">
          <AulaAgendadaActions aulaId={id} />
        </div>
      )}

      <InfoAulaEdit
        aulaId={id}
        observacoesIniciais={(aula.observacoes as string | null) ?? null}
        videoUrlInicial={(aula.video_url as string | null) ?? null}
      />

      {ultimaAulaDaTurma && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-xl"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Última aula desta turma — {dataUltimaAulaFmt}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ultimaAulaDaTurma.tecnicas.map((t, i) => (
              <span key={i}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                style={{
                  background: t.reforco ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.08)',
                  border: `1px solid ${t.reforco ? 'rgba(251,146,60,0.25)' : 'rgba(74,222,128,0.2)'}`,
                  color: t.reforco ? '#FB923C' : '#4ADE80',
                }}>
                {t.reforco ? '↺' : '✓'} {t.nome}
              </span>
            ))}
          </div>
          {ultimaAulaDaTurma.tecnicas.some(t => t.reforco) && (
            <p className="text-[9px] mt-2" style={{ color: '#FB923C' }}>
              Técnicas laranja foram marcadas para reforço — já adicionadas ao plano de hoje
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl mx-5 mt-4 overflow-hidden"
        style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <TecnicasAula
          aulaId={id}
          tecnicas={tecnicasNaAula}
          disponiveis={disponiveis}
          aulaAberta={aula.status === 'aberta'}
          aulaAgendada={aula.status === 'agendada'}
          temaNome={temaNome}
        />
      </div>

      <AttendanceList
        aulaId={id}
        alunos={alunos}
        presencasIniciais={presencasIniciais}
        visitantesIniciais={visitantesIniciais}
        outrosAlunos={outrosAlunos}
        status={aula.status}
      />

      <GruposAula
        aulaId={id}
        grupos={grupos}
        presentes={presentesGrupo}
        tecnicas={tecnicasGrupo}
      />

      {/* Foto da turma — só em aula finalizada */}
      {aula.status === 'finalizada' && (
        <div className="mt-4 px-5 pb-6">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--brand-texto-muted)' }}>
            📸 Foto da turma
          </p>
          {aula.foto_url ? (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--brand-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aula.foto_url as string}
                alt="Foto da turma"
                className="w-full object-cover"
                style={{ maxHeight: 320 }}
              />
              <AulaFotoUpload
                aulaId={aula.id}
                fotoUrlAtual={aula.foto_url as string}
                persist={salvarFotoAula.bind(null, aula.id)}
              />
            </div>
          ) : (
            <AulaFotoUpload
              aulaId={aula.id}
              fotoUrlAtual={null}
              persist={salvarFotoAula.bind(null, aula.id)}
            />
          )}
        </div>
      )}

      {/* Zona de perigo — reabrir / apagar */}
      <div className="px-5">
        <ZonaDePerigo
          aulaId={id}
          status={aula.status}
          turmaLabel={turma?.nome ?? 'Aula'}
          dataLabel={dataFormatada}
          totalPresencas={presencas.length}
        />
      </div>
    </div>
  )
}
