import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/back-button'
import { nomeTecnica } from '@/lib/tecnicas'
import TecnicasLista from './tecnicas-lista'

type Tecnica = {
  id: string
  nome: string
  descricao: string | null
  global: boolean
  tecnica_origem_id: string | null
  categorias_tecnicas: { nome: string; cor: string | null } | null
  tecnicas_academias: { nome_custom: string }[] | null
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
    .select('id, nome, descricao, global, tecnica_origem_id, categorias_tecnicas(nome, cor), tecnicas_academias(nome_custom)')
    .or(`academia_id.eq.${professor.academia_id},global.eq.true`)
    .order('nome')

  const rows = (tecnicas ?? []) as unknown as Tecnica[]

  // Group by category — ordena pelo nome de exibição (custom quando houver)
  const gruposMap = rows.reduce<Record<string, Tecnica[]>>((acc, t) => {
    const cat = t.categorias_tecnicas?.nome ?? 'Sem categoria'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(t)
    return acc
  }, {})
  const grupos = Object.entries(gruposMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([categoria, items]) => ({
      categoria,
      itens: items
        .sort((a, b) => nomeTecnica(a).localeCompare(nomeTecnica(b)))
        .map(t => ({
          id: t.id,
          nomeExibido: nomeTecnica(t),
          global: t.global,
          temCustom: (t.tecnicas_academias?.length ?? 0) > 0,
          ehVariacao: Boolean(t.tecnica_origem_id),
          descricao: t.descricao,
        })),
    }))

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
          <TecnicasLista grupos={grupos} />
        )}
      </main>
    </div>
  )
}
