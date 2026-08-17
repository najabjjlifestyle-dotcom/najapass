import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'
import { nomeTecnica } from '@/lib/tecnicas'
import TecnicaEditor from './tecnica-editor'

const FAIXA_LABEL: Record<string, string> = {
  branca: 'Branca', cinza: 'Cinza', amarela: 'Amarela', laranja: 'Laranja',
  verde: 'Verde', azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta',
}

function diasDesde(data: string): number {
  return Math.floor((Date.now() - new Date(data + 'T12:00:00').getTime()) / 86400000)
}
function dataRelativa(data: string): string {
  const d = diasDesde(data)
  if (d <= 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 30) return `há ${d} dias`
  const meses = Math.round(d / 30)
  return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`
}
function dataCompacta(data: string): string {
  const d = new Date(data + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export default async function TecnicaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')

  const [{ data: tecnica }, { data: ocorrenciasRaw }, { data: categorias }] = await Promise.all([
    supabase
      .from('tecnicas')
      .select('id, nome, global, academia_id, tecnica_origem_id, categoria_id, faixas, categorias_tecnicas(nome), tecnicas_academias(nome_custom)')
      .eq('id', id)
      .maybeSingle(),
    // Ocorrências reais (ensinadas) desta técnica nas aulas da academia.
    supabase
      .from('aula_tecnicas')
      .select('id, reforco, aulas!inner(id, data, academia_id, turmas(nome))')
      .eq('tecnica_id', id)
      .eq('tipo', 'ensinada')
      .eq('aulas.academia_id', professor.academia_id),
    supabase
      .from('categorias_tecnicas').select('id, nome').order('nome'),
  ])

  if (!tecnica) return notFound()
  // Só técnica global ou da própria academia — senão 404.
  if (!tecnica.global && tecnica.academia_id !== professor.academia_id) return notFound()

  type OcorrenciaRaw = { id: string; reforco: boolean; aulas: { id: string; data: string; turmas: { nome: string } | null } | null }
  const ocorrencias = ((ocorrenciasRaw ?? []) as unknown as OcorrenciaRaw[])
    .filter(o => o.aulas)
    .sort((a, b) => (b.aulas!.data).localeCompare(a.aulas!.data))

  const totalOcorrencias = ocorrencias.length
  const ultimaVez = ocorrencias[0]?.aulas?.data ?? null
  const vezesReforco = ocorrencias.filter(o => o.reforco).length
  const taxaReforco = totalOcorrencias > 0 ? Math.round((vezesReforco / totalOcorrencias) * 100) : 0
  const interpretacao = taxaReforco > 50 ? 'técnica difícil' : taxaReforco > 25 ? 'média' : 'boa retenção'
  const stale = ultimaVez ? diasDesde(ultimaVez) > 21 : false

  const nome = nomeTecnica(tecnica as unknown as { nome: string; tecnicas_academias: { nome_custom: string }[] | null })
  const categoriaNome = (tecnica.categorias_tecnicas as unknown as { nome: string } | null)?.nome ?? null
  const faixas = (tecnica.faixas as string[] | null) ?? []
  const temCustom = ((tecnica.tecnicas_academias as unknown as { nome_custom: string }[] | null)?.length ?? 0) > 0
  const ehVariacao = Boolean(tecnica.tecnica_origem_id)

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-start gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <BackButton href="/tecnicas" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-lg" style={{ color: 'var(--brand-texto)' }}>{nome}</h1>
            {tecnica.global ? (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                sugestão
              </span>
            ) : ehVariacao ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-texto-muted)' }}>
                variação
              </span>
            ) : (
              <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }}>
                da academia
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            {categoriaNome ?? 'Sem categoria'}
            {' · '}
            {faixas.length > 0 ? faixas.map(f => FAIXA_LABEL[f] ?? f).join(', ') : 'Todas as faixas'}
          </p>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-6">
        {/* Stale */}
        {stale && ultimaVez && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.25)' }}>
            <AlertTriangle size={14} style={{ color: '#F97316' }} className="flex-shrink-0" />
            <p className="text-xs" style={{ color: '#F97316' }}>
              Não ensinada há {diasDesde(ultimaVez)} dias — hora de retomar!
            </p>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="font-bold text-[26px] leading-none" style={{ color: 'var(--brand-texto)' }}>{totalOcorrencias}</p>
            <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>vezes ensinada</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            <p className="font-bold text-sm leading-tight mt-1" style={{ color: 'var(--brand-texto)' }}>
              {ultimaVez ? dataRelativa(ultimaVez) : '—'}
            </p>
            <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: 'var(--brand-texto-muted)' }}>última vez</p>
          </div>
          <div className="rounded-2xl p-3 text-center"
            style={{
              background: taxaReforco > 50 ? 'rgba(249,115,22,0.08)' : 'var(--brand-surf)',
              border: `1px solid ${taxaReforco > 50 ? 'rgba(249,115,22,0.25)' : 'var(--brand-border)'}`,
            }}>
            <p className="font-bold text-[26px] leading-none" style={{ color: taxaReforco > 50 ? '#F97316' : 'var(--brand-texto)' }}>{taxaReforco}%</p>
            <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
              {totalOcorrencias > 0 ? interpretacao : 'reforço'}
            </p>
          </div>
        </div>
        {totalOcorrencias > 0 && (
          <p className="text-[10px] -mt-3" style={{ color: 'var(--brand-texto-muted)' }}>
            Reforço alto = a turma precisa repetir mais essa posição antes de fixar.
          </p>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>Histórico</p>
          {ocorrencias.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              Esta posição ainda não foi ensinada em nenhuma aula.
            </p>
          ) : (
            <div className="space-y-2">
              {ocorrencias.map(o => (
                <Link key={o.id} href={`/aulas/${o.aulas!.id}`}
                  className="flex items-center justify-between p-3 rounded-xl active:scale-[0.98] transition-transform"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--brand-texto)' }}>
                      {o.aulas!.turmas?.nome ?? 'Aula avulsa'}
                    </p>
                    <p className="text-xs capitalize" style={{ color: 'var(--brand-texto-muted)' }}>{dataCompacta(o.aulas!.data)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={o.reforco
                        ? { background: 'rgba(249,115,22,0.12)', color: '#F97316' }
                        : { background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
                      {o.reforco ? 'REFORÇO' : 'ENSINADA'}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--brand-border)' }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Edição / controles */}
        <div className="pt-2" style={{ borderTop: '1px solid var(--brand-border)' }}>
          <div className="pt-4">
            <TecnicaEditor
              tecnicaId={tecnica.id}
              global={tecnica.global}
              nomeExibido={nome}
              temCustom={temCustom}
              categoriaIdAtual={tecnica.categoria_id as string | null}
              faixasAtuais={faixas}
              categorias={(categorias ?? []) as { id: string; nome: string }[]}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
