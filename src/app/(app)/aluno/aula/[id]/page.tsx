import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
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
      id, data, hora_inicio, tema, foto_url, status,
      turmas(nome),
      aula_tecnicas(tipo, tecnicas(nome, categorias_tecnicas(nome)))
    `)
    .eq('id', id)
    .eq('academia_id', aluno.academia_id)
    .maybeSingle()

  if (!aula) return notFound()

  const [{ data: presencasData }, { data: anotacao }, { data: resenhas }] = await Promise.all([
    supabase.from('presencas')
      .select('aluno_id, nome_visitante, alunos(nome, foto_url)')
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

  // Técnicas ensinadas agrupadas por categoria
  type TecnicaRaw = {
    tipo: string
    tecnicas: { nome: string; categorias_tecnicas: { nome: string } | null } | null
  }
  const ensinadas = ((aula.aula_tecnicas ?? []) as unknown as TecnicaRaw[])
    .filter(at => at.tipo === 'ensinada' && at.tecnicas)
    .map(at => ({
      nome: at.tecnicas!.nome,
      categoria: at.tecnicas!.categorias_tecnicas?.nome ?? 'Outras',
    }))

  const porCategoria = ensinadas.reduce<Record<string, string[]>>((acc, t) => {
    if (!acc[t.categoria]) acc[t.categoria] = []
    acc[t.categoria].push(t.nome)
    return acc
  }, {})

  const turma = aula.turmas as unknown as { nome: string } | null
  const dataFormatada = new Date(aula.data + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })

  type PresencaRaw = {
    aluno_id: string | null
    nome_visitante: string | null
    alunos: { nome: string; foto_url: string | null } | null
  }
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

  return (
    <div className="min-h-dvh pb-8" style={{ background: 'var(--brand-fundo)' }}>
      {/* Header */}
      <div className="px-4 pt-safe pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <Link href="/aluno/historico"
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 active:scale-90 transition-transform"
          style={{ border: '1px solid var(--brand-border)' }}>
          <span style={{ color: 'var(--brand-texto)' }}>←</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ color: 'var(--brand-texto)' }}>
            {turma?.nome ?? 'Aula'}
          </p>
          <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>
            {dataFormatada}{hora ? ` · ${hora.substring(0, 5)}` : ''}
          </p>
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

        {/* Técnicas ensinadas */}
        {Object.keys(porCategoria).length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Técnicas ensinadas
            </p>
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
          </div>
        )}

        {/* Quem foi */}
        {presentes.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Quem foi · {presentes.length} {presentes.length === 1 ? 'pessoa' : 'pessoas'}
            </p>
            <div className="flex flex-wrap gap-2">
              {presentes.map(p => {
                const inner = (
                  <>
                    {p.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto_url} alt={p.nome}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ background: p.isVisitante ? '#222' : 'var(--brand-gold-dim)', color: p.isVisitante ? '#666' : 'var(--brand-gold)' }}>
                        {p.isVisitante ? '?' : p.nome.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-medium" style={{ color: p.isVisitante ? 'var(--brand-texto-muted)' : 'var(--brand-texto)' }}>
                      {p.nome.split(' ')[0]}{p.isVisitante ? ' (visitante)' : ''}
                    </span>
                  </>
                )
                // Visitante não tem conta → não é clicável. Aluno → perfil público.
                return p.isVisitante ? (
                  <div key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    {inner}
                  </div>
                ) : (
                  <Link key={p.id} href={`/aluno/perfil/${p.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    {inner}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Minha anotação */}
        <Link href={`/aluno/aula/${id}/anotacao`}
          className="flex items-center justify-between px-4 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg flex-shrink-0">{anotacao ? '📝' : '✏️'}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-texto)' }}>
                {anotacao ? 'Minha anotação' : 'Anotar esse treino'}
              </p>
              {anotacao && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--brand-texto-muted)' }}>
                  {anotacao.texto}
                </p>
              )}
            </div>
          </div>
          <span className="flex-shrink-0 ml-2" style={{ color: 'var(--brand-texto-muted)' }}>→</span>
        </Link>

        {/* Cantinho da Resenha */}
        <ResenhaSection
          aulaId={id}
          alunoId={aluno.id}
          alunoNome={aluno.nome}
          alunoFoto={aluno.foto_url}
          resenhasIniciais={resenhasFormatadas}
        />

      </div>
    </div>
  )
}
