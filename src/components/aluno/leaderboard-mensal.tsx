import Link from 'next/link'

type EntradaRanking = {
  aluno_id: string
  aluno_nome: string
  foto_url: string | null
  presencas_mes: number
  posicao: number
}

const POSICAO_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function Avatar({ nome, foto, size = 32 }: { nome: string; foto: string | null; size?: number }) {
  if (foto) return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt={nome}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  )
  return (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'var(--brand-gold-dim)',
        color: 'var(--brand-gold)',
        fontSize: size * 0.38,
        border: '1px solid var(--brand-gold-border)',
      }}>
      {nome.charAt(0)}
    </div>
  )
}

export function LeaderboardMensal({
  ranking,
  meuAlunoId,
  mesLabel,
}: {
  ranking: EntradaRanking[]
  meuAlunoId: string
  mesLabel: string
}) {
  if (ranking.length === 0) return null

  const minhaPosicao = ranking.find(r => r.aluno_id === meuAlunoId)
  const top10 = ranking.slice(0, 10)
  const euEstouForaDoTop10 = !!minhaPosicao && (minhaPosicao.posicao ?? 0) > 10
  const listaFinal = euEstouForaDoTop10 ? [...top10, minhaPosicao!] : top10

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          🏅 Ranking de {mesLabel}
        </p>
        {minhaPosicao && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
            {minhaPosicao.posicao}º lugar
          </span>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--brand-border)' }}>
        {listaFinal.map((entrada, idx) => {
          const euSou = entrada.aluno_id === meuAlunoId
          const separador = euEstouForaDoTop10 && idx === 10

          return (
            <div key={entrada.aluno_id}>
              {separador && (
                <div className="px-4 py-1 flex items-center gap-2">
                  <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
                  <span className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>···</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
                </div>
              )}
              <Link
                href={`/aluno/perfil/${entrada.aluno_id}`}
                className="flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity"
                style={{
                  background: euSou ? 'var(--brand-gold-dim)' : idx % 2 === 0 ? 'var(--brand-surf)' : 'transparent',
                  borderTop: idx > 0 && !separador ? '1px solid var(--brand-border)' : 'none',
                }}>
                <div className="w-6 text-center flex-shrink-0">
                  {POSICAO_EMOJI[entrada.posicao] ? (
                    <span className="text-base">{POSICAO_EMOJI[entrada.posicao]}</span>
                  ) : (
                    <span className="text-xs font-bold"
                      style={{ color: euSou ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
                      {entrada.posicao}
                    </span>
                  )}
                </div>

                <Avatar nome={entrada.aluno_nome} foto={entrada.foto_url} size={30} />

                <p className="flex-1 text-sm font-medium truncate"
                  style={{ color: euSou ? 'var(--brand-gold)' : 'var(--brand-texto)' }}>
                  {entrada.aluno_nome.split(' ')[0]}
                  {euSou && <span className="ml-1 text-[9px]">(você)</span>}
                </p>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold"
                    style={{ color: euSou ? 'var(--brand-gold)' : 'var(--brand-texto)' }}>
                    {entrada.presencas_mes}
                  </p>
                  <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
                    {entrada.presencas_mes === 1 ? 'treino' : 'treinos'}
                  </p>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
