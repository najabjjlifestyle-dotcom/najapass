import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import BackButton from '@/components/back-button'

type HistorinhaTecnica = { ordem: number; tecnicas: { nome: string } | null }
type Historinha = { id: string; nome: string; historinha_tecnicas: HistorinhaTecnica[] | null }

export default async function HistorinhasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores')
    .select('academia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!professor?.academia_id) redirect('/onboarding')

  const { data: historinhasData } = await supabase
    .from('historinhas')
    .select('id, nome, historinha_tecnicas(ordem, tecnicas(nome))')
    .eq('academia_id', professor.academia_id)
    .order('nome')

  const historinhas = (historinhasData ?? []) as unknown as Historinha[]

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3">
          <BackButton href="/perfil" />
          <div>
            <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
              Histórinhas
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
              Sequências de técnicas para suas aulas
            </p>
          </div>
        </div>
        <Link href="/historinhas/nova"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--brand-gold)', color: '#000' }}>
          <Plus size={14} strokeWidth={2.5} />
          Nova
        </Link>
      </header>

      <main className="px-5 pt-4 pb-24 space-y-3">
        {historinhas.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma historinha ainda
            </p>
            <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
              Crie sequências de técnicas para reutilizar nas aulas
            </p>
          </div>
        )}

        {historinhas.map(h => {
          const tecnicas = [...(h.historinha_tecnicas ?? [])]
            .sort((a, b) => a.ordem - b.ordem)
            .map(ht => ht.tecnicas?.nome)
            .filter(Boolean)

          return (
            <Link key={h.id} href={`/historinhas/${h.id}/editar`}
              className="block px-4 py-3 rounded-xl active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
              <p className="font-bold text-sm mb-2" style={{ color: 'var(--brand-texto)' }}>
                {h.nome}
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--brand-texto-muted)' }}>
                {tecnicas.join(' → ')}
              </p>
              <p className="text-[9px] mt-1.5" style={{ color: 'var(--brand-gold)' }}>
                {tecnicas.length} técnica{tecnicas.length !== 1 ? 's' : ''}
              </p>
            </Link>
          )
        })}
      </main>
    </div>
  )
}
