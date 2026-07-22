# HANDOFF-024 — Jornada no Tatame

**Data:** 2026-07-22  
**Branch:** `feat/sprint27-jornada-tatame`  
**Base:** `main`  
**Épico:** EP-29 — Jornada no Tatame  
**Cards:** B-096 · B-097 · B-098 · B-099

> Momentos instagramáveis que transformam dados do aluno em imagens que ele vai querer compartilhar. Sem gráficos complexos — design limpo, tipografia grande, brand forte. Cada tela cabe num stories do Instagram.

---

## Visão dos 4 momentos

| Momento | Gatilho | Rota |
|---|---|---|
| 🎂 **Aniversário** | `data_nascimento` day = hoje | `/aluno/momento/aniversario` |
| 🏆 **Anual** | ±7 dias do aniversário de `matriculado_em` | `/aluno/momento/anual` |
| 🥋 **Graduação** | Qualquer hora (acesso via perfil) | `/aluno/momento/graduacao` |
| 📅 **Mensal** | Primeiros 7 dias do mês | `/aluno/momento/mensal` |

Todos exibem um **banner dismissível** na home (`/aluno`) quando ativo. Os banners têm prioridade: aniversário > anual > mensal. Graduação fica sempre acessível no perfil.

---

## B-096 — Sem migration

Sem novas tabelas. Todos os dados já existem:
- `alunos.data_nascimento`
- `alunos.matriculado_em`
- `alunos.faixa`, `alunos.grau`
- `presencas` + `aulas` → stats de frequência
- `aula_tecnicas` → técnicas aprendidas

---

## B-097 — Banners na home do aluno

### `src/app/(app)/aluno/page.tsx`

**Lógica de detecção de momentos** (no server component, após buscar `aluno`):

```typescript
// Detectar momentos ativos
const hoje = new Date()
const mesHoje = hoje.getMonth() + 1   // 1-12
const diaHoje = hoje.getDate()

// 1. Aniversário
const dataNasc = aluno.data_nascimento ? new Date(aluno.data_nascimento) : null
const isAniversario =
  dataNasc !== null &&
  (dataNasc.getUTCMonth() + 1) === mesHoje &&
  dataNasc.getUTCDate() === diaHoje

// 2. Anual (±7 dias do aniversário de matrícula)
const dataMatricula = new Date(aluno.matriculado_em)
const mesMatricula = dataMatricula.getUTCMonth() + 1
const diaMatricula = dataMatricula.getUTCDate()
const anoAtual = hoje.getFullYear()
const anoEntrada = dataMatricula.getUTCFullYear()
const anosNaAcademia = anoAtual - anoEntrada
const anivAcad = new Date(anoAtual, mesMatricula - 1, diaMatricula)
const diffAniv = Math.abs(hoje.getTime() - anivAcad.getTime()) / (1000 * 60 * 60 * 24)
const isAnual = anosNaAcademia >= 1 && diffAniv <= 7

// 3. Mensal (primeiros 7 dias do mês)
const isMensal = diaHoje <= 7

// Prioridade de exibição: só o mais importante (exceto mensal que pode coexistir)
const momentoPrimario = isAniversario
  ? 'aniversario'
  : isAnual
  ? 'anual'
  : null
```

**No JSX da home**, logo abaixo do header (antes do CheckinCard), inserir seção de banners:

```tsx
{/* ── Momentos da Jornada ── */}
{(momentoPrimario || isMensal) && (
  <section className="px-4 space-y-2 mb-2">
    {momentoPrimario === 'aniversario' && (
      <JornadaBanner
        tipo="aniversario"
        emoji="🎂"
        titulo={`Feliz aniversário, ${aluno.nome.split(' ')[0]}!`}
        subtitulo="Sua jornada começou há anos. Hoje é seu dia."
        href="/aluno/momento/aniversario"
      />
    )}
    {momentoPrimario === 'anual' && (
      <JornadaBanner
        tipo="anual"
        emoji="🏆"
        titulo={`${anosNaAcademia} ${anosNaAcademia === 1 ? 'ano' : 'anos'} no tatame!`}
        subtitulo="Veja seu ano em treinos →"
        href="/aluno/momento/anual"
      />
    )}
    {isMensal && (
      <JornadaBanner
        tipo="mensal"
        emoji="📅"
        titulo={`Seu ${MESES[mesHoje - 1]} no tatame`}
        subtitulo="Veja o resumo do mês →"
        href="/aluno/momento/mensal"
      />
    )}
  </section>
)}
```

### `src/components/jornada-banner.tsx` — banner dismissível

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

const COR_POR_TIPO: Record<string, string> = {
  aniversario: '#C8A96E',
  anual:       '#7C3AED',
  mensal:      '#2563EB',
}

export default function JornadaBanner({
  tipo, emoji, titulo, subtitulo, href,
}: {
  tipo: string
  emoji: string
  titulo: string
  subtitulo: string
  href: string
}) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const cor = COR_POR_TIPO[tipo] ?? 'var(--brand-gold)'

  return (
    <div
      className="relative flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: `${cor}18`,
        border: `1px solid ${cor}44`,
      }}>
      <span className="text-2xl flex-shrink-0">{emoji}</span>
      <Link href={href} className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-snug" style={{ color: 'var(--brand-texto)' }}>
          {titulo}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
          {subtitulo}
        </p>
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-[10px] flex-shrink-0 px-1"
        style={{ color: '#333' }}>
        ✕
      </button>
    </div>
  )
}
```

Adicionar constante de meses em português ao page.tsx do aluno:
```typescript
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
```

---

## B-098 — Páginas instagramáveis `/aluno/momento/[tipo]`

### Layout base: `src/app/(app)/aluno/momento/[tipo]/layout.tsx`

Este layout ignora o `AlunoBottomNav` da rota pai — a tela é full-screen, clean.

```tsx
// Não adicionar nada — o layout pai já existe.
// Suprimir bottom nav para esta rota específica:
// Em src/components/aluno-bottom-nav.tsx, adicionar:
//   || pathname.startsWith('/aluno/momento')
// à condição de return null (já existe para /aluno/celebracao e /aluno/aula/)
```

### Server component: `src/app/(app)/aluno/momento/[tipo]/page.tsx`

```tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAlunoOuRedireciona } from '@/lib/aluno-auth'
import MomentoAniversario from './momento-aniversario'
import MomentoAnual from './momento-anual'
import MomentoMensal from './momento-mensal'
import MomentoGraduacao from './momento-graduacao'

export default async function MomentoPage({
  params,
}: {
  params: Promise<{ tipo: string }>
}) {
  const { tipo } = await params
  const aluno = await getAlunoOuRedireciona()
  const supabase = await createClient()
  const acadId = aluno.academia_id

  // Buscar nome da academia
  const { data: acad } = await supabase
    .from('academias')
    .select('nome')
    .eq('id', acadId)
    .maybeSingle()
  const acadNome = acad?.nome ?? 'Naja BJJ'

  if (tipo === 'aniversario') {
    // Dados para o card de aniversário
    const { count: totalAulas } = await supabase
      .from('presencas')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id)

    const { count: totalTecnicas } = await supabase
      .from('presencas')
      .select('aulas!inner(aula_tecnicas(tecnica_id))', { count: 'exact', head: true })
      .eq('aluno_id', aluno.id)
      .not('aulas.aula_tecnicas', 'is', null)

    const anoNasc = aluno.data_nascimento
      ? new Date().getFullYear() - new Date(aluno.data_nascimento).getFullYear()
      : null

    return (
      <MomentoAniversario
        aluno={{ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau, foto_url: aluno.foto_url }}
        totalAulas={totalAulas ?? 0}
        idadeAnos={anoNasc}
        acadNome={acadNome}
      />
    )
  }

  if (tipo === 'anual') {
    const dataEntrada = new Date(aluno.matriculado_em)
    const anosNaAcademia = new Date().getFullYear() - dataEntrada.getFullYear()

    // Stats do último ano
    const umAnoAtras = new Date()
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1)
    const umAnoAtrasStr = umAnoAtras.toISOString().split('T')[0]

    const [{ count: aulasAno }, { count: totalAulas }] = await Promise.all([
      supabase
        .from('presencas')
        .select('aulas!inner(data)', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .gte('aulas.data', umAnoAtrasStr),
      supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id),
    ])

    // Técnica mais vista no ano
    const { data: tecRaw } = await supabase
      .from('presencas')
      .select(`
        aulas!inner(
          data,
          aula_tecnicas(tecnicas(nome))
        )
      `)
      .eq('aluno_id', aluno.id)
      .gte('aulas.data', umAnoAtrasStr)
      .eq('aulas.status', 'finalizada')
      .limit(200)

    // Contar técnicas — flatten + count
    const tecCount: Record<string, number> = {}
    for (const p of tecRaw ?? []) {
      const aula = p.aulas as unknown as {
        data: string
        aula_tecnicas: { tecnicas: { nome: string } | null }[]
      }
      for (const at of aula.aula_tecnicas ?? []) {
        const nome = at.tecnicas?.nome
        if (nome) tecCount[nome] = (tecCount[nome] ?? 0) + 1
      }
    }
    const tecTop = Object.entries(tecCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return (
      <MomentoAnual
        aluno={{ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau, foto_url: aluno.foto_url }}
        anosNaAcademia={anosNaAcademia}
        aulasAno={aulasAno ?? 0}
        totalAulas={totalAulas ?? 0}
        tecnicaFavorita={tecTop}
        acadNome={acadNome}
        dataEntrada={dataEntrada.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      />
    )
  }

  if (tipo === 'mensal') {
    const hoje = new Date()
    const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
    const ultimoDiaMesAnterior   = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
    const mesNome = MESES[primeiroDiaMesAnterior.getMonth()]

    const [{ count: aulasNoMes }, { count: totalAulas }] = await Promise.all([
      supabase
        .from('presencas')
        .select('aulas!inner(data, status)', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .eq('aulas.status', 'finalizada')
        .gte('aulas.data', primeiroDiaMesAnterior.toISOString().split('T')[0])
        .lte('aulas.data', ultimoDiaMesAnterior.toISOString().split('T')[0]),
      supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id),
    ])

    return (
      <MomentoMensal
        aluno={{ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau, foto_url: aluno.foto_url }}
        aulasNoMes={aulasNoMes ?? 0}
        totalAulas={totalAulas ?? 0}
        mesNome={mesNome}
        acadNome={acadNome}
      />
    )
  }

  if (tipo === 'graduacao') {
    const refDate = aluno.graduado_em ?? aluno.matriculado_em ?? '1970-01-01'

    const [{ count: aulasNaFaixa }, { count: totalAulas }] = await Promise.all([
      supabase
        .from('presencas')
        .select('aulas!inner(data)', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id)
        .gte('aulas.data', refDate.substring(0, 10)),
      supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', aluno.id),
    ])

    const dataGradStr = aluno.graduado_em
      ? new Date(aluno.graduado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : null

    return (
      <MomentoGraduacao
        aluno={{ nome: aluno.nome, faixa: aluno.faixa, grau: aluno.grau, foto_url: aluno.foto_url }}
        aulasNaFaixa={aulasNaFaixa ?? 0}
        totalAulas={totalAulas ?? 0}
        dataGraduacao={dataGradStr}
        acadNome={acadNome}
      />
    )
  }

  return notFound()
}
```

---

## B-099 — Componentes de card instagramável

> **Princípios de design para todos os cards:**
> - `min-h-dvh`, sem scroll — cabe na tela (Portrait 9:16)
> - Background `#080808` + gradiente radial na cor da faixa
> - Tipografia grande: nome do aluno em `text-3xl font-bold`
> - Stats em `text-4xl font-bold` + label `text-[9px] uppercase tracking-widest`
> - Rodapé discreto: "najapass.com.br" + nome da academia
> - Botão `← Fechar` no canto superior esquerdo (link para `/aluno`)
> - NÃO tem bottom nav (suprimido em `aluno-bottom-nav.tsx`)

Criar os 4 arquivos dentro de `src/app/(app)/aluno/momento/[tipo]/`:

---

### `momento-aniversario.tsx`

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca:'#FFFFFF', cinza:'#9CA3AF', amarela:'#FBBF24',
  laranja:'#F97316', verde:'#16A34A', azul:'#2563EB',
  roxa:'#7C3AED', marrom:'#92400E', preta:'#111111',
}

type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

export default function MomentoAniversario({
  aluno, totalAulas, idadeAnos, acadNome,
}: {
  aluno: AlunoCard
  totalAulas: number
  idadeAnos: number | null
  acadNome: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-between px-6 py-8 relative overflow-hidden"
      style={{ background: '#080808' }}>

      {/* Gradiente de fundo */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 30%, ${cor}28 0%, transparent 65%)`,
      }} />

      {/* Header */}
      <div className="w-full flex items-center justify-between relative z-10">
        <Link href="/aluno" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Fechar
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      {/* Centro */}
      <div
        className="flex flex-col items-center text-center gap-6 relative z-10"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.7s ease' }}>

        {/* Emoji grande */}
        <div className="text-6xl" style={{ filter: 'drop-shadow(0 0 24px rgba(200,169,110,0.4))' }}>
          🎂
        </div>

        {/* Nome + faixa */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: cor === '#FFFFFF' ? '#C8A96E' : cor }}>
            Feliz aniversário
          </p>
          <p className="text-4xl font-bold" style={{ color: '#FFFFFF' }}>{nome}</p>
          {idadeAnos !== null && (
            <p className="text-sm" style={{ color: '#555' }}>{idadeAnos} anos de vida</p>
          )}
        </div>

        {/* Stat: total de aulas */}
        <div className="rounded-3xl px-10 py-6 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-5xl font-bold" style={{ color: '#C8A96E' }}>{totalAulas}</p>
          <p className="text-[9px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            aulas no tatame
          </p>
        </div>

        {/* Frase motivacional */}
        <p className="text-sm max-w-[220px] leading-relaxed" style={{ color: '#444' }}>
          Cada treino foi um presente que você deu a si mesmo.
        </p>
      </div>

      {/* Rodapé */}
      <div className="relative z-10 text-center space-y-1">
        <p className="text-[8px] uppercase tracking-[0.5em]" style={{ color: '#1F1F1F' }}>
          {acadNome}
        </p>
        <p className="text-[7px] uppercase tracking-[0.4em]" style={{ color: '#161616' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
```

---

### `momento-anual.tsx`

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca:'#FFFFFF', cinza:'#9CA3AF', amarela:'#FBBF24',
  laranja:'#F97316', verde:'#16A34A', azul:'#2563EB',
  roxa:'#7C3AED', marrom:'#92400E', preta:'#111111',
}
type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

export default function MomentoAnual({
  aluno, anosNaAcademia, aulasAno, totalAulas, tecnicaFavorita, acadNome, dataEntrada,
}: {
  aluno: AlunoCard
  anosNaAcademia: number
  aulasAno: number
  totalAulas: number
  tecnicaFavorita: string | null
  acadNome: string
  dataEntrada: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]

  const frase =
    aulasAno >= 150 ? 'Você é uma máquina de treino.' :
    aulasAno >= 80  ? 'Consistência que poucos têm.' :
    aulasAno >= 40  ? 'Um ano sólido no tatame.' :
    aulasAno >= 15  ? 'Cada treino conta.' :
    'A jornada continua.'

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 gap-6 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${cor}22 0%, transparent 60%)`,
      }} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <Link href="/aluno" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Fechar
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      {/* Título */}
      <div
        className="relative z-10 space-y-1"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.5s ease' }}>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: cor === '#FFFFFF' ? '#C8A96E' : cor }}>
          {anosNaAcademia} {anosNaAcademia === 1 ? 'ano' : 'anos'} no tatame · {acadNome}
        </p>
        <p className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
          Seu ano, {nome}.
        </p>
        <p className="text-sm" style={{ color: '#444' }}>Desde {dataEntrada}</p>
      </div>

      {/* Grid de stats */}
      <div
        className="grid grid-cols-2 gap-3 relative z-10"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.15s' }}>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{aulasAno}</p>
          <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            treinos no último ano
          </p>
        </div>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{totalAulas}</p>
          <p className="text-[8px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            total na academia
          </p>
        </div>
      </div>

      {/* Técnica favorita */}
      {tecnicaFavorita && (
        <div
          className="relative z-10 rounded-2xl px-5 py-4"
          style={{
            background: `${cor}14`,
            border: `1px solid ${cor}30`,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.7s ease 0.25s',
          }}>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>
            Técnica mais treinada
          </p>
          <p className="font-bold" style={{ color: '#FFFFFF' }}>{tecnicaFavorita}</p>
        </div>
      )}

      {/* Faixa atual */}
      <div
        className="relative z-10 rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.3s' }}>
        <div>
          <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#555' }}>Faixa atual</p>
          <p className="font-bold capitalize" style={{ color: '#FFFFFF' }}>{aluno.faixa}</p>
        </div>
        <div className="w-12 h-8 rounded-lg" style={{ background: cor, border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>

      {/* Frase */}
      <p
        className="relative z-10 text-center text-sm"
        style={{ color: '#333', opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.4s' }}>
        {frase}
      </p>

      {/* Rodapé */}
      <div className="relative z-10 text-center mt-auto">
        <p className="text-[7px] uppercase tracking-[0.5em]" style={{ color: '#161616' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
```

---

### `momento-mensal.tsx`

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca:'#FFFFFF', cinza:'#9CA3AF', amarela:'#FBBF24',
  laranja:'#F97316', verde:'#16A34A', azul:'#2563EB',
  roxa:'#7C3AED', marrom:'#92400E', preta:'#111111',
}
type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

export default function MomentoMensal({
  aluno, aulasNoMes, totalAulas, mesNome, acadNome,
}: {
  aluno: AlunoCard
  aulasNoMes: number
  totalAulas: number
  mesNome: string
  acadNome: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]

  const frase =
    aulasNoMes === 0 ? 'O tatame está esperando por você.' :
    aulasNoMes === 1 ? 'Um começo. Continue.' :
    aulasNoMes <= 4  ? 'Construindo o hábito, treino a treino.' :
    aulasNoMes <= 8  ? 'Mês consistente. Isso que conta.' :
    aulasNoMes <= 12 ? 'Frequência de elite.' :
    'Você é imparável.'

  // Barra de progresso: meta de 12 treinos/mês
  const pct = Math.min(100, Math.round((aulasNoMes / 12) * 100))

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between px-6 py-8 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 50%, ${cor}16 0%, transparent 65%)`,
      }} />

      {/* Header */}
      <div className="w-full flex items-center justify-between relative z-10">
        <Link href="/aluno" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Fechar
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      {/* Centro */}
      <div
        className="flex flex-col items-center text-center gap-8 relative z-10 w-full"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease' }}>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: '#444' }}>
            {mesNome} · {nome}
          </p>
          <p className="text-5xl font-bold" style={{ color: '#C8A96E' }}>{aulasNoMes}</p>
          <p className="text-sm" style={{ color: '#555' }}>
            {aulasNoMes === 1 ? 'treino' : 'treinos'} no mês
          </p>
        </div>

        {/* Barra de meta */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-[9px] uppercase tracking-widest"
            style={{ color: '#333' }}>
            <span>0</span>
            <span>meta: 12 treinos</span>
            <span>12+</span>
          </div>
          <div style={{ height: 4, background: '#1A1A1A', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: pct >= 100 ? '#4ADE80' : '#C8A96E',
              borderRadius: 4,
              transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
            }} />
          </div>
        </div>

        {/* Total geral */}
        <div className="rounded-2xl px-8 py-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-3xl font-bold" style={{ color: '#555' }}>{totalAulas}</p>
          <p className="text-[8px] uppercase tracking-widest mt-1.5" style={{ color: '#333' }}>
            total de treinos na academia
          </p>
        </div>

        {/* Frase */}
        <p className="text-sm max-w-[220px]" style={{ color: '#444' }}>{frase}</p>
      </div>

      {/* Rodapé */}
      <div className="relative z-10 text-center space-y-1">
        <p className="text-[8px] uppercase tracking-[0.5em]" style={{ color: '#1F1F1F' }}>{acadNome}</p>
        <p className="text-[7px] uppercase tracking-[0.4em]" style={{ color: '#161616' }}>najapass.com.br</p>
      </div>
    </div>
  )
}
```

---

### `momento-graduacao.tsx`

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const FAIXA_HEX: Record<string, string> = {
  branca:'#FFFFFF', cinza:'#9CA3AF', amarela:'#FBBF24',
  laranja:'#F97316', verde:'#16A34A', azul:'#2563EB',
  roxa:'#7C3AED', marrom:'#92400E', preta:'#111111',
}
type AlunoCard = { nome: string; faixa: string; grau: number; foto_url: string | null }

function BeltBar({ faixa, grau }: { faixa: string; grau: number }) {
  const cor = FAIXA_HEX[faixa] ?? '#FFF'
  const rankCor = faixa === 'preta' ? '#DC2626' : '#111111'
  return (
    <div className="flex items-stretch h-14 rounded-2xl overflow-hidden w-full"
      style={{ background: cor }}>
      <div className="flex-1" />
      <div className="flex items-center justify-center gap-[5px] px-5"
        style={{ background: rankCor, minWidth: 96 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-[5px] h-7 rounded-sm"
            style={{ background: i < grau ? '#FFF' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>
      <div style={{ width: 18, background: cor }} />
    </div>
  )
}

export default function MomentoGraduacao({
  aluno, aulasNaFaixa, totalAulas, dataGraduacao, acadNome,
}: {
  aluno: AlunoCard
  aulasNaFaixa: number
  totalAulas: number
  dataGraduacao: string | null
  acadNome: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  const cor = FAIXA_HEX[aluno.faixa] ?? '#C8A96E'
  const nome = aluno.nome.split(' ')[0]
  const textoCor = cor === '#FFFFFF' ? '#C8A96E' : cor

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8 gap-8 relative overflow-hidden"
      style={{ background: '#080808' }}>

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 20%, ${cor}2A 0%, transparent 65%)`,
      }} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <Link href="/aluno/perfil" className="text-xs py-1.5 px-3 rounded-full"
          style={{ border: '1px solid #1F1F1F', color: '#555' }}>
          ← Perfil
        </Link>
        <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: '#333' }}>NajaPass</p>
      </div>

      {/* Nome + faixa */}
      <div
        className="relative z-10 space-y-1"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: 'all 0.5s ease' }}>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: textoCor }}>
          {acadNome}
        </p>
        <p className="text-3xl font-bold" style={{ color: '#FFF' }}>{nome}</p>
        {dataGraduacao && (
          <p className="text-xs" style={{ color: '#444' }}>Graduado em {dataGraduacao}</p>
        )}
      </div>

      {/* Belt bar — animado */}
      <div
        className="relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.15s',
        }}>
        <BeltBar faixa={aluno.faixa} grau={aluno.grau} />
      </div>

      {/* Faixa label */}
      <p
        className="relative z-10 text-4xl font-bold capitalize text-center"
        style={{ color: '#FFF', opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease 0.3s' }}>
        Faixa {aluno.faixa}
        {aluno.grau > 0 && (
          <span className="text-2xl ml-3" style={{ color: '#444' }}>· {aluno.grau}º grau</span>
        )}
      </p>

      {/* Stats */}
      <div
        className="relative z-10 grid grid-cols-2 gap-3"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease 0.35s' }}>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{aulasNaFaixa}</p>
          <p className="text-[7px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            aulas nesta faixa
          </p>
        </div>
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-4xl font-bold" style={{ color: '#C8A96E' }}>{totalAulas}</p>
          <p className="text-[7px] uppercase tracking-widest mt-2" style={{ color: '#444' }}>
            total de treinos
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <div className="relative z-10 text-center mt-auto">
        <p className="text-[7px] uppercase tracking-[0.5em]" style={{ color: '#161616' }}>
          najapass.com.br
        </p>
      </div>
    </div>
  )
}
```

---

## Alteração: `src/components/aluno-bottom-nav.tsx`

Suprimir nav nas rotas de momento:

```typescript
// Adicionar à condição existente de return null:
|| pathname.startsWith('/aluno/momento')
```

Linha existente (referência):
```typescript
if (pathname === '/aluno/sem-conta' || pathname.startsWith('/aluno/celebracao') || pathname.startsWith('/aluno/aula/')) {
  return null
}
```

Após a mudança:
```typescript
if (
  pathname === '/aluno/sem-conta' ||
  pathname.startsWith('/aluno/celebracao') ||
  pathname.startsWith('/aluno/aula/') ||
  pathname.startsWith('/aluno/momento')
) {
  return null
}
```

---

## Link de graduação no perfil do aluno

Em `src/app/(app)/aluno/perfil/page.tsx`, dentro da seção do graduation hero (após as stats de aulas como faixa), adicionar:

```tsx
<Link
  href="/aluno/momento/graduacao"
  className="block w-full text-center py-2 rounded-xl text-[10px] uppercase tracking-widest mt-2"
  style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
  📸 Compartilhar graduação
</Link>
```

---

## Resumo dos arquivos

| Arquivo | Card | O que muda |
|---|---|---|
| `src/app/(app)/aluno/page.tsx` | B-097 | Lógica de detecção de momentos + seção de banners |
| `src/components/jornada-banner.tsx` | B-097 | **Novo.** Banner dismissível client component |
| `src/app/(app)/aluno/momento/[tipo]/page.tsx` | B-098 | **Novo.** Server component com dados por tipo |
| `src/app/(app)/aluno/momento/[tipo]/momento-aniversario.tsx` | B-099 | **Novo.** Card birthday |
| `src/app/(app)/aluno/momento/[tipo]/momento-anual.tsx` | B-099 | **Novo.** Card Wrapped/anual |
| `src/app/(app)/aluno/momento/[tipo]/momento-mensal.tsx` | B-099 | **Novo.** Card mensal |
| `src/app/(app)/aluno/momento/[tipo]/momento-graduacao.tsx` | B-099 | **Novo.** Card graduação |
| `src/components/aluno-bottom-nav.tsx` | B-098 | Adicionar `/aluno/momento` ao return null |
| `src/app/(app)/aluno/perfil/page.tsx` | B-099 | Link "📸 Compartilhar graduação" |

---

## Critérios de aceite (Sprint 27)

**B-097 — Banners:**
- [ ] Banner 🎂 aparece na home apenas no dia do aniversário do aluno
- [ ] Banner 🏆 aparece ±7 dias do aniversário de matrícula (somente a partir de 1 ano)
- [ ] Banner 📅 aparece nos primeiros 7 dias do mês
- [ ] Botão ✕ nos banners dismiss localmente (some até recarregar)
- [ ] Máximo 2 banners visíveis ao mesmo tempo (birthday + mensal)

**B-098 — Rotas:**
- [ ] `/aluno/momento/aniversario` carrega sem bottom nav
- [ ] `/aluno/momento/anual` carrega sem bottom nav
- [ ] `/aluno/momento/mensal` carrega sem bottom nav
- [ ] `/aluno/momento/graduacao` carrega sem bottom nav
- [ ] `/aluno/momento/tipo-invalido` retorna 404

**B-099 — Cards instagramáveis:**
- [ ] Todos os cards são full-screen sem scroll em iPhone 14 (375×812)
- [ ] Background dark `#080808` com gradiente na cor da faixa
- [ ] Stat principal ocupa espaço generoso (`text-4xl` ou maior)
- [ ] Botão "← Fechar" / "← Perfil" funciona e leva para rota correta
- [ ] Rodapé "najapass.com.br" presente em todos
- [ ] Card mensal: barra de progresso animada (meta: 12 treinos)
- [ ] Card anual: exibe técnica favorita apenas quando há dados
- [ ] Card graduação: `BeltBar` com animação de entrada (scale spring)
- [ ] Link "📸 Compartilhar graduação" visível no perfil do aluno
