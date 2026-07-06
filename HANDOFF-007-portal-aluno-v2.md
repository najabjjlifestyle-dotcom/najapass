# HANDOFF-007 — Portal do Aluno V2: Nav Bar + Jornada de Aprendizado

**Data:** 2026-07-06  
**Autor:** Claude.ai (PM)  
**Para:** Claude Code (CTO)  
**Cards:** B-043 e B-044  
**Dependência:** HANDOFF-006 deve ser aplicado antes (banco de tokens visuais + header redesign)  
**Branch sugerida:** `feat/sprint11-portal-aluno-v2` (a partir da `feat/sprint10-curriculo-global`)

---

## Problema

O portal do aluno é uma única página (`/aluno/page.tsx`) com tudo empilhado: check-in, avisos, frequência, presenças recentes, técnicas da semana, turmas. Não há navegação.

O usuário quer que o app seja **bom para o aprendizado do aluno**: ver as posições que já aprendeu, consultar o histórico de aulas, entender sua evolução. Isso não cabe em uma single-page.

---

## Solução: Multi-page com bottom nav

```
Home            Técnicas         Histórico        Perfil
/aluno          /aluno/tecnicas  /aluno/historico /aluno/perfil

check-in        posições         frequência       avatar + faixa
avisos          aprendidas       stats 30/90d     turmas
técnicas        por categoria    lista de aulas   push toggle
da semana       progresso vis.   + técnicas
```

---

## Arquitetura de arquivos

```
src/
  lib/
    aluno-auth.ts                 ← NOVO: helper compartilhado
  components/
    aluno-bottom-nav.tsx          ← NOVO: nav do aluno (Client Component)
  app/(app)/aluno/
    layout.tsx                    ← NOVO: layout com aluno nav
    page.tsx                      ← EDITAR: manter só check-in + avisos + TdS
    checkin.tsx                   (sem alteração)
    push-subscribe.tsx            (sem alteração; HANDOFF-006 refatora este)
    actions.ts                    (sem alteração)
    tecnicas/
      page.tsx                    ← NOVO: posições aprendidas
    historico/
      page.tsx                    ← NOVO: histórico de aulas
    perfil/
      page.tsx                    ← NOVO: perfil + turmas
```

---

## 1. `src/lib/aluno-auth.ts` — helper compartilhado

Toda sub-página precisa saber quem é o aluno. Centraliza o fetch para evitar duplicação.

```ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AlunoBasico = {
  id: string
  nome: string
  faixa: string
  grau: number
  academia_id: string
  foto_url: string | null
}

export async function getAlunoOuRedireciona(): Promise<{
  aluno: AlunoBasico
  supabase: Awaited<ReturnType<typeof createClient>>
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professor } = await supabase
    .from('professores').select('id').eq('user_id', user.id).maybeSingle()
  if (professor) redirect('/dashboard')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, faixa, grau, academia_id, foto_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!aluno) redirect('/aluno/sem-conta')  // ver nota abaixo *

  return { aluno: aluno as AlunoBasico, supabase }
}
```

> **Nota:** Mover a tela "Conta não vinculada" para `/aluno/sem-conta/page.tsx` é opcional. Se quiser simplificar, pode retornar `{ aluno: null }` e tratar inline nas páginas — mas o redirect é mais limpo.

---

## 2. `src/components/aluno-bottom-nav.tsx` — Client Component

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Layers, ClipboardList, User } from 'lucide-react'

const ITEMS = [
  { href: '/aluno',           Icon: Home,          label: 'Home' },
  { href: '/aluno/tecnicas',  Icon: Layers,        label: 'Técnicas' },
  { href: '/aluno/historico', Icon: ClipboardList, label: 'Histórico' },
  { href: '/aluno/perfil',    Icon: User,          label: 'Perfil' },
] as const

export default function AlunoBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t"
      style={{
        background: 'var(--brand-surf)',
        borderColor: 'var(--brand-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {ITEMS.map(({ href, Icon, label }) => {
        // /aluno deve ser ativo APENAS em /aluno exato, não em sub-rotas
        const active = href === '/aluno'
          ? pathname === '/aluno'
          : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5"
          >
            <Icon
              size={22}
              style={{
                color: active ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
                strokeWidth: active ? 2.5 : 1.5,
              }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: active ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
```

---

## 3. `src/app/(app)/aluno/layout.tsx` — Layout do aluno

Este layout envolve TODAS as páginas `/aluno/*` e injeta o bottom nav.

```tsx
import AlunoBottomNav from '@/components/aluno-bottom-nav'

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--brand-fundo)', minHeight: '100dvh' }}>
      <div className="pb-20">   {/* espaço para o nav fixo */}
        {children}
      </div>
      <AlunoBottomNav />
    </div>
  )
}
```

> **Importante:** O professor BottomNav em `(app)/layout.tsx` já esconde em caminhos `/aluno*`. Não há conflito.  
> **Não redirecionar aqui.** Auth e redirect ficam em cada página (via `getAlunoOuRedireciona`). Layouts no Next.js 15 não fazem redirect limpo em todos os edge cases — deixe nas pages.

---

## 4. Editar `src/app/(app)/aluno/page.tsx` — Home simplificada

**O que fica:** check-in ao vivo + avisos + técnicas da semana + empty state  
**O que sai:** frequência stats, presença recent list, bloco de turmas (mover para Histórico/Perfil)

```tsx
import { redirect } from 'next/navigation'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import CheckinCard from './checkin'
import PushSubscribeButton from './push-subscribe'
// ← PushSubscribeButton agora é ícone (HANDOFF-006 FIX-02)

const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

const DIAS_ABBR: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', terca: 'Ter',
  quarta: 'Qua', quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb',
}

// Utilitário: próximo dia de treino baseado nos dias_semana das turmas
function calcularProximoTreino(turmas: { dias_semana: string[] | null; horario: string | null }[]): string | null {
  const diasMap: Record<string, number> = {
    domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
  }
  const hoje = new Date().getDay()
  const dias = turmas.flatMap(t => t.dias_semana ?? [])
  if (dias.length === 0) return null
  const diasNums = [...new Set(dias.map(d => diasMap[d] ?? -1).filter(n => n >= 0))].sort((a, b) => a - b)
  const proximo = diasNums.find(d => d > hoje) ?? diasNums[0]
  const nomeDia = Object.entries(diasMap).find(([, n]) => n === proximo)?.[0]
  const nomesBR: Record<string, string> = {
    domingo: 'domingo', segunda: 'segunda-feira', terca: 'terça-feira',
    quarta: 'quarta-feira', quinta: 'quinta-feira', sexta: 'sexta-feira', sabado: 'sábado',
  }
  return nomeDia ? nomesBR[nomeDia] ?? nomeDia : null
}

export default async function AlunoHomePage() {
  const { aluno, supabase } = await getAlunoOuRedireciona()

  // — Aulas ativas —
  const { data: aulasAtivasData } = await supabase
    .from('aulas')
    .select('id, video_url, turmas(nome), tema:categorias_tecnicas(nome)')
    .eq('academia_id', aluno.academia_id)
    .eq('status', 'aberta')

  // (mesma lógica de quem_vai + planejadas do page.tsx atual)
  // … (manter igual ao atual)

  // — Turmas (só para empty state e técnicas da semana) —
  const { data: turmasData } = await supabase
    .from('alunos_turmas')
    .select('turmas(id, nome, dias_semana, horario)')
    .eq('aluno_id', aluno.id)
    .eq('ativo', true)
  const turmas = /* mesma extração atual */

  // — Avisos —
  // (mesma lógica atual)

  // — Técnicas da Semana —
  // (mesma lógica atual — manter exatamente como está)

  const proximoTreino = aulasAtivas.length === 0 ? calcularProximoTreino(turmas) : null

  return (
    <div>
      {/* Header — conforme HANDOFF-006 FIX-01 */}
      <div style={{ height: 3, background: FAIXA_HEX[aluno.faixa] ?? '#FFF' }} />
      <header className="px-4 pt-safe pb-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--brand-border)' }}>
        {/* avatar + nome + faixa badge + PushSubscribeButton ícone */}
        {/* ver HANDOFF-006 FIX-01 e FIX-02 para detalhes exatos */}
      </header>

      <main className="px-4 pt-4 space-y-5">

        {/* Avisos */}
        {/* ... (igual ao atual) */}

        {/* Check-in ao vivo */}
        {aulasAtivas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span style={{
                display: 'inline-block', width: 7, height: 7,
                borderRadius: '50%', background: 'var(--brand-gold)',
                animation: 'pulse 2s infinite',
              }} />
              <p className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--brand-gold)' }}>
                Aula ao vivo agora
              </p>
            </div>
            {aulasAtivas.map(aula => (
              <CheckinCard key={aula.id} aula={aula} jaFezCheckin={checkinSet.has(aula.id)} />
            ))}
          </div>
        )}

        {/* Empty state — próximo treino */}
        {aulasAtivas.length === 0 && (
          <div className="rounded-2xl px-5 py-6 text-center"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
            {proximoTreino ? (
              <>
                <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
                  Próximo treino: {proximoTreino}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
                  Nenhuma aula ao vivo agora
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
                Nenhuma aula ativa no momento
              </p>
            )}
          </div>
        )}

        {/* Técnicas da Semana */}
        {/* ... (igual ao atual — não alterar) */}

      </main>
    </div>
  )
}
```

---

## 5. `src/app/(app)/aluno/tecnicas/page.tsx` — NOVA (B-044, a estrela do sprint)

Este é o diferencial do NajaPass: o aluno vê quais posições já passou em aula, agrupadas por categoria, com barra de progresso mostrando cobertura em relação ao currículo global.

### Queries

```ts
// Step 1: aula_ids onde o aluno esteve presente
const { data: presencas } = await supabase
  .from('presencas')
  .select('aula_id')
  .eq('aluno_id', aluno.id)

const aulaIds = (presencas ?? []).map(p => p.aula_id)

// Step 2: técnicas ensinadas nessas aulas
// (se aulaIds for [], pular — retornar tudo vazio)
const { data: vistaRows } = aulaIds.length > 0
  ? await supabase
      .from('aula_tecnicas')
      .select('tecnica_id, tecnicas(id, nome, categorias_tecnicas(id, nome))')
      .in('aula_id', aulaIds)
      .eq('tipo', 'ensinada')
  : { data: [] }

// Step 3: currículo completo (global + academia)
const { data: curriculoRows } = await supabase
  .from('tecnicas')
  .select('id, nome, categorias_tecnicas(id, nome)')
  .or(`global.eq.true,academia_id.eq.${aluno.academia_id}`)
```

### Processamento em JS (groupBy categoria)

```ts
type TecnicaInfo = { id: string; nome: string }
type CategoriaData = {
  categoria: string
  total: TecnicaInfo[]
  vistas: Set<string>  // ids das técnicas que o aluno viu
}

// Montar mapa de todas as técnicas por categoria
const categoriaMap = new Map<string, CategoriaData>()

for (const row of curriculoRows ?? []) {
  const cat = (row.categorias_tecnicas as { id: string; nome: string } | null)?.nome ?? 'Outras'
  if (!categoriaMap.has(cat)) {
    categoriaMap.set(cat, { categoria: cat, total: [], vistas: new Set() })
  }
  categoriaMap.get(cat)!.total.push({ id: row.id, nome: row.nome })
}

// Marcar as que o aluno já viu
const vistasIds = new Set(
  (vistaRows ?? [])
    .map(r => (r.tecnicas as { id: string } | null)?.id)
    .filter(Boolean)
)

for (const [cat, data] of categoriaMap) {
  data.total.forEach(t => {
    if (vistasIds.has(t.id)) data.vistas.add(t.id)
  })
}

// Converter para array e ordenar por % vistas DESC
const categorias = [...categoriaMap.values()]
  .filter(c => c.total.length > 0)
  .sort((a, b) => (b.vistas.size / b.total.length) - (a.vistas.size / a.total.length))
```

### UI

```tsx
const totalVistas = categorias.reduce((acc, c) => acc + c.vistas.size, 0)
const totalTecnicas = categorias.reduce((acc, c) => acc + c.total.length, 0)

return (
  <div>
    <header className="px-4 pt-safe pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
      <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
        sua jornada
      </p>
      <h1 className="text-xl font-bold" style={{ color: 'var(--brand-texto)' }}>
        Técnicas <span style={{ color: 'var(--brand-gold)' }}>aprendidas</span>
      </h1>
      {totalVistas > 0 && (
        <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
          {totalVistas} técnicas em {categorias.filter(c => c.vistas.size > 0).length} categorias
        </p>
      )}
    </header>

    <main className="px-4 pt-4 space-y-3">
      {categorias.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--brand-texto-muted)' }}>
            Participe de aulas para ver suas técnicas aqui
          </p>
        </div>
      )}

      {categorias.map(cat => {
        const pct = cat.total.length > 0 ? (cat.vistas.size / cat.total.length) * 100 : 0
        return (
          <div key={cat.categoria} className="rounded-2xl p-4"
            style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>

            {/* Header da categoria */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
                {cat.categoria}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--brand-gold)' }}>
                {cat.vistas.size}/{cat.total.length}
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="h-1 rounded-full mb-3" style={{ background: 'var(--brand-border)' }}>
              <div
                className="h-1 rounded-full transition-all"
                style={{ width: `${pct}%`, background: 'var(--brand-gold)' }}
              />
            </div>

            {/* Chips de técnicas */}
            <div className="flex flex-wrap gap-1.5">
              {cat.total.map(t => {
                const vista = cat.vistas.has(t.id)
                return (
                  <span key={t.id}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                    style={vista
                      ? { background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }
                      : { background: 'transparent', color: 'var(--brand-texto-muted)', border: '1px solid var(--brand-border)' }
                    }>
                    {t.nome}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </main>
  </div>
)
```

---

## 6. `src/app/(app)/aluno/historico/page.tsx` — NOVA

Move as seções de frequência e presença que saem da home.

### Queries

```ts
const { aluno, supabase } = await getAlunoOuRedireciona()

const trintaDias = new Date(); trintaDias.setDate(trintaDias.getDate() - 30)
const noventaDias = new Date(); noventaDias.setDate(noventaDias.getDate() - 90)

const [{ count: presencas30 }, { count: presencas90 }, { count: total }, { data: ultimaPresenca }, { data: presencasData }] = await Promise.all([
  supabase.from('presencas').select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno.id).gte('registrado_em', trintaDias.toISOString()),
  supabase.from('presencas').select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno.id).gte('registrado_em', noventaDias.toISOString()),
  supabase.from('presencas').select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno.id),
  supabase.from('presencas').select('registrado_em')
    .eq('aluno_id', aluno.id).order('registrado_em', { ascending: false }).limit(1).maybeSingle(),
  supabase.from('presencas')
    .select(`
      registrado_em,
      aulas(
        data,
        turmas(nome),
        aula_tecnicas(tipo, tecnicas(nome))
      )
    `)
    .eq('aluno_id', aluno.id)
    .order('registrado_em', { ascending: false })
    .limit(50),
])
```

### UI

- Stats strip: 3 cards — "este mês", "90 dias", "total"
- Última presença: X dias atrás
- Lista de presenças: data + turma + chips das técnicas ensinadas naquela aula (tipo='ensinada')

```tsx
// Extrair técnicas de cada presença
const presencas = (presencasData ?? []).map(p => {
  const aula = p.aulas as any
  const tecnicas = (aula?.aula_tecnicas ?? [])
    .filter((at: any) => at.tipo === 'ensinada')
    .map((at: any) => at.tecnicas?.nome)
    .filter(Boolean)
  return {
    data: aula?.data,
    turma: aula?.turmas?.nome ?? 'Aula avulsa',
    tecnicas,
    registrado_em: p.registrado_em,
  }
})
```

---

## 7. `src/app/(app)/aluno/perfil/page.tsx` — NOVA

Move avatar + turmas da home.

### Queries

```ts
const { aluno, supabase } = await getAlunoOuRedireciona()

const [{ data: turmasData }, { count: total }] = await Promise.all([
  supabase.from('alunos_turmas')
    .select('turmas(id, nome, dias_semana, horario)')
    .eq('aluno_id', aluno.id).eq('ativo', true),
  supabase.from('presencas')
    .select('id', { count: 'exact', head: true })
    .eq('aluno_id', aluno.id),
])
```

### UI

- Header completo: faixa color band (3px) + AvatarUpload (64px) + nome completo + faixa/grau badge
- PushSubscribeButton (ícone — HANDOFF-006 FIX-02)
- Stat: total de aulas no NajaPass
- Seção "Minhas turmas": dias chips gold + horário
- Seção "Academia": nome da academia (buscar via `academia_id`)

---

## Resumo das mudanças em `page.tsx` atual

| Seção | Destino |
|---|---|
| Header (avatar, faixa, push) | Perfil + Home (compacto) |
| Avisos | Home ✓ |
| Check-in | Home ✓ |
| Turmas | Perfil |
| Técnicas da Semana | Home ✓ |
| Frequência 30/90d | Histórico |
| Presença recente | Histórico (com expand) |

---

## Sem migrações necessárias

Todas as tabelas e campos existem:
- `presencas` (aluno_id, aula_id, registrado_em) ✓
- `aula_tecnicas` (aula_id, tecnica_id, tipo='ensinada') ✓
- `tecnicas` (id, nome, global, academia_id, categorias_tecnicas) ✓
- `categorias_tecnicas` (id, nome) ✓

O currículo global com ~168 técnicas (`global=true`) já foi inserido no sprint10.

---

## Estimativa

| Tarefa | Tempo |
|---|---|
| `aluno-auth.ts` helper | 15 min |
| `aluno-bottom-nav.tsx` | 20 min |
| `aluno/layout.tsx` | 10 min |
| Editar `aluno/page.tsx` (remover seções) | 20 min |
| `aluno/tecnicas/page.tsx` (star feature) | 45 min |
| `aluno/historico/page.tsx` | 25 min |
| `aluno/perfil/page.tsx` | 20 min |
| Teste mobile completo | 15 min |
| **Total** | **~3h** |

---

## Critério de done

- [ ] Bottom nav aparece em todas as páginas `/aluno/*`
- [ ] Bottom nav NÃO aparece em `/aluno/sem-conta` (se implementado)
- [ ] `/aluno/tecnicas` mostra técnicas agrupadas por categoria com barra de progresso
- [ ] Técnicas vistas em aulas presenciadas aparecem em gold
- [ ] Técnicas do currículo não vistas aparecem em cinza
- [ ] `/aluno/historico` mostra stats + lista com técnicas de cada aula
- [ ] `/aluno/perfil` mostra avatar editável + turmas
- [ ] `/aluno` (home) NÃO mostra mais frequência nem presença recente (movidas)
- [ ] Professor BottomNav continua oculto em todas as rotas `/aluno*`
- [ ] Teste: aluno sem nenhuma presença vê empty state em Técnicas
- [ ] Teste: professor logado não acessa `/aluno` (continua redirecionando para `/dashboard`)
