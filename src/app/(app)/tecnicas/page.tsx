import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'

type Tecnica = {
  id: string
  nome: string
  descricao: string | null
  global: boolean
  categorias_tecnicas: { nome: string; cor: string | null } | null
}

export default async function TecnicasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('academia_id').eq('user_id', user.id).maybeSingle()
  if (!professor?.academia_id) redirect('/dashboard')

  const { data: tecnicas } = await supabase
    .from('tecnicas')
    .select('id, nome, descricao, global, categorias_tecnicas(nome, cor)')
    .or(`academia_id.eq.${professor.academia_id},global.eq.true`)
    .order('nome')

  const rows = (tecnicas ?? []) as unknown as Tecnica[]

  // Group by category
  const grupos = rows.reduce<Record<string, Tecnica[]>>((acc, t) => {
    const cat = t.categorias_tecnicas?.nome ?? 'Sem categoria'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-fundo)' }}>
      <header className="px-5 pt-safe pb-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard" />
          <h1 className="font-bold text-xl uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
            Posições
          </h1>
        </div>
        <Link href="/tecnicas/nova"
          className="text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl"
          style={{ background: 'var(--brand-gold)', color: 'black' }}>
          + Nova
        </Link>
      </header>

      <main className="px-5 pt-5 pb-10">
        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🥋</p>
            <p className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
              Nenhuma posição cadastrada
            </p>
            <Link href="/tecnicas/nova"
              className="inline-block mt-4 text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl"
              style={{ background: 'var(--brand-gold)', color: 'black' }}>
              Cadastrar primeira posição
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--brand-gold)' }}>
                  {cat} ({items.length})
                </p>
                <div className="space-y-1.5">
                  {items.map(t => (
                    <div key={t.id}
                      className="px-4 py-3 rounded-xl"
                      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>{t.nome}</p>
                        {t.global && (
                          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                            sugestão
                          </span>
                        )}
                      </div>
                      {t.descricao && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--brand-texto-sec)' }}>
                          {t.descricao}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
