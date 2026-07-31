import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, UserRound, Pencil, BookOpen, Play, ExternalLink } from 'lucide-react'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import { nomeTecnica } from '@/lib/tecnicas'
import ResenhaSection from './resenha-section'

// Cor por categoria pros chips de técnica
const CATEGORIA_CORES: Record<string, string> = {
  'Guarda Fechada': '#2563EB',
  'Meia Guarda': '#7C3AED',
  'Guarda Aberta': '#0891B2',
  'Montada': '#DC2626',
  'Costas': '#EA580C',
  'Passagem de Guarda': '#16A34A',
  'Raspagem': '#CA8A04',
  'Finalização': '#9333EA',
  'Defesa': '#64748B',
  'Fundamentos': '#374151',
}

// Data compacta: "Sex, 24 jul"
function formatDataCompacta(data: string): string {
  const d = new Date(data + 'T12:00:00')
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${dias[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]}`
}

// No currículo, algumas técnicas têm o nome cadastrado como "... (entrada)".
// Isso é ruído pro aluno — remove só esse sufixo de tipo, preservando
// parênteses legítimos ("(float pass)", "(Ashi Garami)", "(pêndulo)").
function limparNomeTecnica(nome: string): string {
  return nome.replace(/\s*\((entrada|refor[çc]o)\)\s*$/i, '').trim()
}

type TecItem = { nome: string; categoria: string }

function agruparPorCategoria(items: TecItem[]): Record<string, string[]> {
  return items.reduce<Record<string, string[]>>((acc, t) => {
    ;(acc[t.categoria] ??= []).push(t.nome)
    return acc
  }, {})
}

// Chips de técnica agrupados por categoria — sem sufixo de tipo.
function ChipsPorCategoria({ porCategoria }: { porCategoria: Record<string, string[]> }) {
  return (
    <>
      {Object.entries(porCategoria).map(([cat, tecnicas]) => (
        <div key={cat} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: CATEGORIA_CORES[cat] ?? 'var(--brand-texto-muted)' }}>
            {cat}
          </p>
          <div className="flex flex-wrap gap-2">
            {tecnicas.map(nome => (
              <span key={nome}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: `${CATEGORIA_CORES[cat] ?? '#444'}22`,
                  border: `1px solid ${CATEGORIA_CORES[cat] ?? '#444'}44`,
                  color: 'var(--brand-texto)',
                }}>
                {nome}
              </span>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

export default async function AulaDetalheAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // Dados da aula — valida que é da academia do aluno (senão 404).
  const { data: aula } = await supabase
    .from('aulas')
    .select(`
      id, data, hora_inicio, tema, foto_url, status, video_url, observacoes,
      turmas(nome),
      aula_tecnicas(tipo, grupo_id, tecnicas(nome, categorias_tecnicas(nome), tecnicas_academias(nome_custom)))
    `)
    .eq('id', id)
    .eq('academia_id', aluno.academia_id)
    .maybeSingle()

  if (!aula) return notFound()

  const isFinalizada = aula.status === 'finalizada'

  const [{ data: presencasData }, { data: anotacao }, { data: resenhas }] = await Promise.all([
    supabase.from('presencas')
      .select('aluno_id, nome_visitante, grupo_id, alunos(nome, foto_url)')
      .eq('aula_id', id)
      .order('registrado_em'),
    supabase.from('anotacoes_treino')
      .select('id, texto')
      .eq('aula_id', id)
      .eq('aluno_id', aluno.id)
      .maybeSingle(),
    supabase.from('resenhas_aula')
      .select('id, texto, criado_em, aluno_id, alunos(nome, foto_url)')
      .eq('aula_id', id)
      .order('criado_em', { ascending: true }),
  ])

  // Técnicas — separadas por tipo. Ensinadas viram a lista da aula finalizada;
  // planejadas, a prévia da aula agendada/ao vivo.
  type TecnicaRaw = {
    tipo: string
    grupo_id: string | null
    tecnicas: {
      nome: string
      categorias_tecnicas: { nome: string } | null
      tecnicas_academias: { nome_custom: string }[] | null
    } | null
  }
  type PresencaRaw = {
    aluno_id: string | null
    nome_visitante: string | null
    grupo_id: string | null
    alunos: { nome: string; foto_url: string | null } | null
  }
  const presencasRaw = (presencasData ?? []) as unknown as PresencaRaw[]

  // Grupo do próprio aluno nesta aula (null = sem grupo). Ele vê só as técnicas
  // do grupo dele + as comuns (grupo_id NULL na técnica).
  const meuGrupo = presencasRaw.find(p => p.aluno_id === aluno.id)?.grupo_id ?? null
  const noMeuGrupo = (at: TecnicaRaw) => at.grupo_id === null || at.grupo_id === meuGrupo

  const aulaTecnicas = (aula.aula_tecnicas ?? []) as unknown as TecnicaRaw[]
  const mapTec = (at: TecnicaRaw): TecItem => ({
    nome: limparNomeTecnica(nomeTecnica(at.tecnicas!)),
    categoria: at.tecnicas!.categorias_tecnicas?.nome ?? 'Outras',
  })
  const porCategoriaEnsinadas = agruparPorCategoria(
    aulaTecnicas.filter(at => at.tipo === 'ensinada' && at.tecnicas && noMeuGrupo(at)).map(mapTec)
  )
  const porCategoriaPlanejadas = agruparPorCategoria(
    aulaTecnicas.filter(at => at.tipo === 'planejada' && at.tecnicas && noMeuGrupo(at)).map(mapTec)
  )
  const temPlanejadas = Object.keys(porCategoriaPlanejadas).length > 0

  const turma = aula.turmas as unknown as { nome: string } | null
  const presentes = (presencasData ?? []).map((p) => {
    const pr = p as unknown as PresencaRaw
    return {
      id: pr.aluno_id ?? pr.nome_visitante ?? Math.random().toString(),
      nome: pr.alunos?.nome ?? pr.nome_visitante ?? 'Visitante',
      foto_url: pr.alunos?.foto_url ?? null,
      isVisitante: !pr.aluno_id,
    }
  })

  type ResenhaRaw = {
    id: string
    texto: string
    criado_em: string
    aluno_id: string | null
    alunos: { nome: string; foto_url: string | null } | null
  }
  const resenhasFormatadas = (resenhas ?? []).map((r) => {
    const rr = r as unknown as ResenhaRaw
    return {
      id: rr.id,
      texto: rr.texto,
      criado_em: rr.criado_em,
      aluno_id: rr.aluno_id,
      aluno_nome: rr.alunos?.nome ?? 'Aluno',
      aluno_foto: rr.alunos?.foto_url ?? null,
    }
  })

  const hora = aula.hora_inicio as string | null

  // Chip de status: AO VIVO (verde) · AGENDADA / ENCERRADA (gold)
  const chip = aula.status === 'aberta'
    ? { label: 'AO VIVO', cor: '#4ade80', bg: 'rgba(74,222,128,0.10)', bd: 'rgba(74,222,128,0.25)' }
    : aula.status === 'agendada'
      ? { label: 'AGENDADA', cor: 'var(--brand-gold)', bg: 'rgba(200,169,110,0.10)', bd: 'rgba(200,169,110,0.25)' }
      : { label: 'ENCERRADA', cor: 'var(--brand-gold)', bg: 'rgba(200,169,110,0.10)', bd: 'rgba(200,169,110,0.25)' }

  const n = presentes.length
  const contagem = isFinalizada
    ? `${n} ${n === 1 ? 'presente' : 'presentes'}`
    : `${n} ${n === 1 ? 'confirmado' : 'confirmados'}`

  return (
    <div className="min-h-dvh pb-8" style={{ background: 'var(--brand-fundo)' }}>
      {/* Header contextual: turma + data compacta + presentes/confirmados + status */}
      <div className="px-4 pt-safe pb-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/aluno/historico"
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <ChevronLeft size={16} style={{ color: 'var(--brand-texto-muted)' }} />
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold leading-tight truncate"
            style={{ color: 'var(--brand-texto)' }}>
            {turma?.nome ?? 'Aula'}
          </h1>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
            {formatDataCompacta(aula.data as string)}
            {hora ? ` · ${hora.substring(0, 5)}` : ''}
            {' · '}{contagem}
          </p>
        </div>

        <div className="px-2 py-1 rounded-md flex-shrink-0"
          style={{ background: chip.bg, border: `1px solid ${chip.bd}` }}>
          <span className="text-[8px] font-semibold tracking-[0.4px]" style={{ color: chip.cor }}>
            {chip.label}
          </span>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-5">

        {/* Foto da turma */}
        {aula.foto_url && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--brand-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aula.foto_url as string} alt="Foto da turma"
              className="w-full object-cover" style={{ maxHeight: 260 }} />
          </div>
        )}

        {/* Tema (legado) */}
        {aula.tema && (
          <div className="rounded-xl px-4 py-3"
            style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-gold)' }}>
              Tema da aula
            </p>
            <p className="font-bold" style={{ color: 'var(--brand-texto)' }}>{aula.tema as string}</p>
          </div>
        )}

        {/* Quem foi / Quem vai — avatares circulares com scroll horizontal */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
            {isFinalizada ? 'Quem foi' : 'Quem vai'}
          </p>
          {presentes.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
              {isFinalizada ? 'Nenhuma presença registrada.' : 'Ninguém confirmou ainda.'}
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}>
              {presentes.map(p => {
                const isEu = !p.isVisitante && p.id === aluno.id
                const rotulo = isEu ? 'Você' : p.nome.split(' ')[0]
                const anel = isEu ? 'var(--brand-gold)' : '#2A2A2A'

                const avatar = p.isVisitante ? (
                  /* Visitante: anel tracejado + ícone */
                  <div className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--brand-surf)', border: '2px dashed var(--brand-border)' }}>
                    <UserRound size={16} style={{ color: 'var(--brand-texto-muted)' }} />
                  </div>
                ) : p.foto_url ? (
                  /* Com foto */
                  <div className="w-11 h-11 rounded-full overflow-hidden"
                    style={{ border: `2px solid ${anel}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.foto_url} alt={rotulo} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  /* Sem foto: inicial */
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold"
                    style={{
                      background: isEu ? 'rgba(200,169,110,0.12)' : '#1C1C1C',
                      border: `2px solid ${anel}`,
                      color: isEu ? 'var(--brand-gold)' : '#777',
                    }}>
                    {rotulo.charAt(0).toUpperCase()}
                  </div>
                )

                const conteudo = (
                  <>
                    {avatar}
                    <span className="text-[9px] max-w-[48px] truncate text-center"
                      style={{ color: isEu ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                      {rotulo}
                    </span>
                  </>
                )

                // Colega (não eu, não visitante) → perfil público clicável.
                return p.isVisitante || isEu ? (
                  <div key={p.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    {conteudo}
                  </div>
                ) : (
                  <Link key={p.id} href={`/aluno/perfil/${p.id}`}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform">
                    {conteudo}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Técnicas ensinadas — só para aulas finalizadas */}
        {isFinalizada && Object.keys(porCategoriaEnsinadas).length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Técnicas ensinadas
            </p>
            <ChipsPorCategoria porCategoria={porCategoriaEnsinadas} />
          </div>
        )}

        {/* Técnicas planejadas — para aulas agendadas / ao vivo */}
        {!isFinalizada && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Técnicas planejadas
            </p>
            {temPlanejadas ? (
              <ChipsPorCategoria porCategoria={porCategoriaPlanejadas} />
            ) : (
              <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
                Nenhuma técnica planejada ainda.
              </p>
            )}
          </div>
        )}

        {/* Vídeo de referência — qualquer status */}
        {aula.video_url && (
          <a href={aula.video_url as string} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.16)' }}>
              <Play size={16} style={{ color: 'var(--brand-gold)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium" style={{ color: 'var(--brand-texto)' }}>
                Referência técnica
              </p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--brand-texto-muted)' }}>
                {aula.video_url as string}
              </p>
            </div>
            <ExternalLink size={12} style={{ color: 'var(--brand-texto-muted)' }} className="flex-shrink-0" />
          </a>
        )}

        {/* Observação do professor — qualquer status */}
        {aula.observacoes && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Observação do professor
            </p>
            <div className="p-4 rounded-2xl"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brand-texto)' }}>
                {aula.observacoes as string}
              </p>
            </div>
          </div>
        )}

        {/* Diário do treino — só para finalizadas */}
        {isFinalizada && (
          <Link href={`/aluno/aula/${id}/anotacao`}
            className="block active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.16)' }}>
                {anotacao
                  ? <BookOpen size={16} style={{ color: 'var(--brand-gold)' }} />
                  : <Pencil size={16} style={{ color: 'var(--brand-gold)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: 'var(--brand-texto)' }}>
                  Diário do treino
                </p>
                <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--brand-texto-muted)' }}>
                  {anotacao
                    ? anotacao.texto.slice(0, 60) + (anotacao.texto.length > 60 ? '…' : '')
                    : 'Toque para adicionar uma reflexão'}
                </p>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--brand-border)' }} className="flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Cantinho da Resenha — só para finalizadas */}
        {isFinalizada && (
          <ResenhaSection
            aulaId={id}
            alunoId={aluno.id}
            alunoNome={aluno.nome}
            alunoFoto={aluno.foto_url}
            resenhasIniciais={resenhasFormatadas}
          />
        )}

      </div>
    </div>
  )
}
