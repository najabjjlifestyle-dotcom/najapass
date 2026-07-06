# HANDOFF-008 — Aulas Agendadas e Recorrentes

**Data:** 2026-07-06  
**Autor:** Claude.ai (PM)  
**Para:** Claude Code (CTO)  
**Cards:** B-045, B-046, B-047  
**Dependência:** HANDOFF-007 deve ser aplicado antes (layout do aluno + `getAlunoOuRedireciona`)  
**Branch sugerida:** `feat/sprint12-agendamento` (a partir da `feat/sprint11-portal-aluno-v2`)

---

## Problema

Hoje o professor só consegue "abrir" uma aula no momento em que ela está acontecendo. Não há como planejar aulas futuras nem visualizar o que vem pela frente. O aluno, por sua vez, só vê uma aula se o professor já a abriu — o app parece vazio todo o tempo fora do treino.

Com aulas agendadas e recorrência:
- Professor agenda a semana inteira em segundos (botão "Gerar semana")
- Aluno vê as próximas aulas, quantos vão comparecer, as técnicas planejadas
- Check-in antecipado: aluno confirma presença antes de o professor abrir a aula
- Fluxo de abertura: no horário da aula, professor toca "Abrir" → vira `aberta` → notificação disparada

---

## Modelo de dados

### Status `agendada` em `aulas`

A coluna `aulas.status` é TEXT sem constraint de CHECK (validação só na aplicação). Apenas adicionar `'agendada'` como valor legítimo não exige migration.

**Verificar:** se houver constraint, rodar:
```sql
ALTER TABLE aulas DROP CONSTRAINT IF EXISTS aulas_status_check;
ALTER TABLE aulas ADD CONSTRAINT aulas_status_check
  CHECK (status IN ('aberta', 'finalizada', 'agendada', 'cancelada'));
```

**Campo novo necessário:** `aulas.horario` para armazenar o horário de início da aula agendada (ex: `'07:00'`). A coluna `data` já existe mas não tem hora.

```sql
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS horario TEXT;
-- Preencher retroativamente das turmas: opcional, deixar NULL para aulas históricas
```

**Opcional — pré-confirmação de presença:**  
A tabela `presencas` já existe. Para distinguir pré-confirmação (agendada) de presença real (aberta/finalizada):

```sql
ALTER TABLE presencas ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'presenca'
  CHECK (tipo IN ('presenca', 'confirmacao'));
```

Alternativa mais simples: usar a própria tabela `presencas` sem distinção — quando a aula virar `aberta`, o check-in já existe e conta como presença. Esta é a abordagem recomendada por ser a mais simples.

---

## B-045 · Aulas agendadas (professor cria e gerencia)

### Onde agendar

Duas entradas naturais:
1. **Botão "Agendar" na página da turma** (`/turmas/[id]`) — cria uma aula para aquela turma
2. **Card rápido no dashboard** — "Próximas aulas" com botão "Gerar semana" (ver B-046)

Não criar uma nova rota `/agenda` para o professor — a criação usa o formulário já existente de nova aula (`/aulas/nova`) com um campo de data futuro.

### Mudanças em `/aulas/nova`

**Arquivo:** `src/app/(app)/aulas/nova/page.tsx` (wrapper) + form Client Component

Adicionar ao formulário:
- **Campo "Data"** — `<input type="date">` — padrão = hoje, aceita datas futuras
- **Campo "Horário"** — `<input type="time">` — pré-preenche com `turma.horario` quando turma selecionada
- **Select de status** — não expor ao professor. Lógica automática:
  - Se `data === hoje` → `status = 'aberta'` (abre agora, comportamento atual)
  - Se `data > hoje` → `status = 'agendada'`

Ao salvar:
```ts
const status = new Date(data) <= new Date(hoje) ? 'aberta' : 'agendada'
await supabase.from('aulas').insert({ ..., data, horario, status, academia_id })
```

### Mudanças no Dashboard (`/dashboard`)

Adicionar seção "Próximas aulas" entre o stats strip e o grid de ações:

```ts
// Buscar aulas agendadas dos próximos 14 dias
const { data: agendadas } = await supabase
  .from('aulas')
  .select('id, data, horario, turmas(nome)')
  .eq('academia_id', professorAcademiaId)
  .eq('status', 'agendada')
  .gte('data', hoje)
  .lte('data', quatorze_dias_depois)
  .order('data')
  .order('horario')
  .limit(5)

// Contar confirmados por aula (presencas com aula_id)
// (query paralela para cada aula — ou LEFT JOIN via RPC se performance for issue)
```

**UI do card "Próximas aulas":**
```tsx
<section>
  <div className="flex items-center justify-between mb-2">
    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
      Próximas aulas
    </p>
    <Link href="/aulas/nova" className="text-xs" style={{ color: 'var(--brand-gold)' }}>
      + Agendar
    </Link>
  </div>
  {agendadas.map(aula => (
    <AgendadaCard key={aula.id} aula={aula} confirmados={confirmadasCount[aula.id]} />
  ))}
</section>
```

**AgendadaCard** (Client Component simples):
- Data (ex: "Ter · 08/07") + turma nome + horário + confirmados count
- Botão "Abrir" → Server Action que muda status para 'aberta' + dispara push (reutilizar lógica existente)
- Botão "Cancelar" → muda status para 'cancelada' (novo valor de status)

### Server Action — abrir aula agendada

```ts
'use server'
// src/app/(app)/aulas/actions.ts — adicionar:

export async function abrirAulaAgendada(aulaId: string) {
  const supabase = await createClient()
  // Verificar que o professor é owner da academia desta aula (RLS)
  await supabase
    .from('aulas')
    .update({ status: 'aberta' })
    .eq('id', aulaId)
    .eq('status', 'agendada')  // só abre se ainda agendada
  // Disparar push — reutilizar função existente de notificação
  // revalidatePath('/dashboard')
}
```

---

## B-046 · Gerar ciclo de aulas recorrentes

Este é o recurso que poupa o professor de criar aulas manualmente uma por uma.

### Onde fica

Na página de detalhe/edição da turma: `/turmas/[id]`

Adicionar seção "Gerar aulas" com:
1. Seletor de período: 1 semana / 2 semanas / 4 semanas
2. Preview: "Vai criar X aulas entre {data_início} e {data_fim}"
3. Botão "Confirmar e gerar"

### Algoritmo de geração

```ts
// src/lib/gerar-aulas.ts

type Turma = {
  id: string
  dias_semana: string[]  // ex: ['terca', 'quinta', 'sabado']
  horario: string | null // ex: '07:00'
}

const DIA_MAP: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3,
  quinta: 4, sexta: 5, sabado: 6,
}

export function calcularDatasRecorrentes(
  turma: Turma,
  semanas: 1 | 2 | 4,
  academiaId: string,
): Array<{ turma_id: string; academia_id: string; data: string; horario: string | null; status: 'agendada' }> {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(hoje)
  fim.setDate(hoje.getDate() + semanas * 7)

  const diasAlvo = turma.dias_semana.map(d => DIA_MAP[d] ?? -1).filter(n => n >= 0)
  const resultado: ReturnType<typeof calcularDatasRecorrentes> = []

  const cursor = new Date(hoje)
  // Começar amanhã para não duplicar aula de hoje
  cursor.setDate(cursor.getDate() + 1)

  while (cursor < fim) {
    if (diasAlvo.includes(cursor.getDay())) {
      resultado.push({
        turma_id: turma.id,
        academia_id: academiaId,
        data: cursor.toISOString().split('T')[0],
        horario: turma.horario,
        status: 'agendada',
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return resultado
}
```

### Evitar duplicatas

Antes de inserir, checar quais datas já têm aula para esta turma:

```ts
// Server Action: gerarAulasRecorrentes(turmaId, semanas)

const datas = calcularDatasRecorrentes(turma, semanas, academiaId)

// Verificar datas já existentes
const { data: existentes } = await supabase
  .from('aulas')
  .select('data')
  .eq('turma_id', turmaId)
  .in('data', datas.map(d => d.data))
  .in('status', ['agendada', 'aberta'])  // não duplicar sobre agendadas ou abertas

const datasExistentes = new Set(existentes?.map(e => e.data) ?? [])
const novas = datas.filter(d => !datasExistentes.has(d.data))

if (novas.length === 0) {
  return { error: 'Todas as datas neste período já têm aula agendada.' }
}

await supabase.from('aulas').insert(novas)
return { criadas: novas.length }
```

### UI na página da turma

```tsx
// Adicionar ao final de /turmas/[id]/page.tsx ou component separado

<GerarAulasForm turma={turma} academiaId={academiaId} />
```

**GerarAulasForm** (Client Component):
- 3 botões: "1 semana" / "2 semanas" / "4 semanas" (toggle)
- Preview dinâmico calculado no cliente (mesma função `calcularDatasRecorrentes`)
- Submit → Server Action `gerarAulasRecorrentes`
- Toast de confirmação: "12 aulas criadas entre 08/07 e 02/08"

---

## B-047 · Portal do aluno — próximas aulas (integra HANDOFF-007)

Este card estende a Home do aluno (`/aluno/page.tsx`) com as aulas agendadas das turmas do aluno.

### Query adicional na home

```ts
// Adicionar às queries existentes em /aluno/page.tsx

const { data: proximasData } = await supabase
  .from('aulas')
  .select(`
    id,
    data,
    horario,
    turmas!inner(id, nome),
    aula_tecnicas(tipo, tecnicas(nome))
  `)
  .eq('academia_id', aluno.academia_id)
  .eq('status', 'agendada')
  .in('turmas.id', turmaIds)   // só turmas do aluno
  .gte('data', hoje)
  .order('data')
  .order('horario')
  .limit(5)
```

> **Nota PostgREST:** O filtro `.in('turmas.id', turmaIds)` pode não funcionar diretamente como filtro de join em todos os casos. Alternativa robusta:
> ```ts
> .from('aulas')
> .select('id, data, horario, turma_id, turmas(nome), aula_tecnicas(...)')
> .eq('academia_id', aluno.academia_id)
> .eq('status', 'agendada')
> .in('turma_id', turmaIds)
> .gte('data', hoje)
> ```

### Contar confirmados por aula

```ts
// Para cada próxima aula, contar presencas existentes (pre-confirmações)
const proximasIds = (proximasData ?? []).map(a => a.id)
const { data: confirmacoesData } = proximasIds.length > 0
  ? await supabase
      .from('presencas')
      .select('aula_id')
      .in('aula_id', proximasIds)
  : { data: [] }

const confirmacoesCount = (confirmacoesData ?? []).reduce((acc, p) => {
  acc[p.aula_id] = (acc[p.aula_id] ?? 0) + 1
  return acc
}, {} as Record<string, number>)
```

### Verificar pré-confirmação do aluno

```ts
const alunoConfirmouSet = new Set(
  (confirmacoesData ?? [])
    .filter(p => p.aluno_id === aluno.id)
    .map(p => p.aula_id)
)
```

> Para isso a query de confirmações precisa incluir `aluno_id`: `.select('aula_id, aluno_id')`.

### UI na home do aluno

Mostrar seção "Próximas aulas" quando `proximas.length > 0` e não há aula ao vivo ativa:

```tsx
{aulasAtivas.length === 0 && proximas.length > 0 && (
  <div>
    <p className="text-xs uppercase tracking-widest mb-2"
      style={{ color: 'var(--brand-texto-muted)' }}>
      Próximas aulas
    </p>
    <div className="space-y-2">
      {proximas.map(aula => {
        const confirmados = confirmacoesCount[aula.id] ?? 0
        const euVou = alunoConfirmouSet.has(aula.id)
        const tecnicas = aula.aula_tecnicas
          ?.filter(at => at.tipo === 'planejada')
          .map(at => at.tecnicas?.nome)
          .filter(Boolean) ?? []
        const data = new Date(aula.data + 'T12:00:00')
        const dataFmt = data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

        return (
          <div key={aula.id} className="rounded-2xl p-4"
            style={{
              background: euVou ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
              border: `1px solid ${euVou ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
            }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
                  {aula.turmas?.nome ?? 'Aula'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                  {dataFmt}{aula.horario ? ` · ${aula.horario.substring(0,5)}` : ''} · {confirmados} vão
                </p>
                {tecnicas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tecnicas.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded"
                        style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Pré-confirmação */}
              <ConfirmarPresencaButton aulaId={aula.id} confirmado={euVou} />
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}
```

### `ConfirmarPresencaButton` (Client Component)

```tsx
'use client'
import { useState } from 'react'
import { Check, Circle } from 'lucide-react'
import { fazerCheckin, cancelarCheckin } from '../actions'  // mesmas actions existentes

export default function ConfirmarPresencaButton({ aulaId, confirmado }: { aulaId: string; confirmado: boolean }) {
  const [confirmed, setConfirmed] = useState(confirmado)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (confirmed) {
      setConfirmed(false)
      const r = await cancelarCheckin(aulaId)
      if (r?.error) setConfirmed(true)
    } else {
      setConfirmed(true)
      const r = await fazerCheckin(aulaId)
      if (r?.error) setConfirmed(false)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-all disabled:opacity-50"
      style={confirmed
        ? { background: 'var(--brand-gold)', color: '#000' }
        : { border: '1.5px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }
      }
      aria-label={confirmed ? 'Cancelar confirmação' : 'Confirmar presença'}
    >
      {loading
        ? <Circle size={18} style={{ opacity: 0.5 }} />
        : confirmed
          ? <Check size={18} strokeWidth={2.5} />
          : <Circle size={18} strokeWidth={1.5} />
      }
    </button>
  )
}
```

> **Reutilização:** `fazerCheckin` e `cancelarCheckin` já existem em `aluno/actions.ts` e funcionam para qualquer `aula_id` — o status da aula não é verificado nas actions (apenas insere/deleta uma `presenca`). Isso significa que a pré-confirmação e o check-in ao vivo usam exatamente o mesmo mecanismo. Quando o professor abre a aula (`agendada → aberta`), os pré-confirmados já constam como presentes.

---

## Empty state hierarchy (home do aluno)

Após todos os cards acima, a lógica do empty state fica:

```
Se há aula aberta (status='aberta'):
  → Mostrar CheckinCard (check-in ao vivo)

Se não há aula aberta MAS há aulas agendadas futuras:
  → Mostrar lista de "Próximas aulas" com pré-confirmação

Se não há nem aula aberta nem agendadas:
  → Mostrar empty state com "Próximo treino: {calcularProximoTreino}" (HANDOFF-007)
```

---

## Fluxo completo (professor → aluno)

```
Segunda-feira, 08:00
  Professor → dashboard → "Gerar semana" para "Adulto Manhã" (Ter/Qui/Sáb)
  → Cria 3 aulas com status='agendada' para 08/07, 10/07, 12/07

Segunda, 08:01
  Aluno abre o app → vê "Próximas aulas" na home
  → Toca no círculo da aula de terça → pre-confirma presença

Terça, 07:00
  Professor → dashboard → card "Adulto Manhã 08/07" → toca "Abrir"
  → status: 'agendada' → 'aberta'
  → Push notification dispara para alunos da turma
  
Terça, 07:00
  Aluno abre o app → vê CheckinCard ao vivo (já estava pré-confirmado, check ativo)
  → Presença já registrada, pode confirmar ou cancelar
```

---

## Arquivos a criar/editar

| Arquivo | Ação | Card |
|---|---|---|
| `src/lib/gerar-aulas.ts` | CRIAR — função `calcularDatasRecorrentes` | B-046 |
| `src/app/(app)/aulas/nova/page.tsx` | EDITAR — adicionar campo data + horário | B-045 |
| `src/app/(app)/dashboard/page.tsx` | EDITAR — seção "Próximas aulas" | B-045 |
| `src/app/(app)/turmas/[id]/page.tsx` | EDITAR — seção "Gerar aulas" | B-046 |
| `src/components/gerar-aulas-form.tsx` | CRIAR — Client Component do gerador | B-046 |
| `src/app/(app)/aulas/actions.ts` | EDITAR — `abrirAulaAgendada`, `cancelarAula` | B-045 |
| `src/app/(app)/aluno/page.tsx` | EDITAR — seção "Próximas aulas" + query | B-047 |
| `src/app/(app)/aluno/confirmar-button.tsx` | CRIAR — `ConfirmarPresencaButton` | B-047 |
| `supabase/migrations/XXXX_aulas_horario.sql` | CRIAR — `ALTER TABLE aulas ADD COLUMN horario` | B-045 |
| `supabase/migrations/XXXX_status_agendada.sql` | CRIAR — `ALTER TABLE aulas DROP/ADD CONSTRAINT` (verificar primeiro) | B-045 |

---

## Estimativa

| Tarefa | Tempo |
|---|---|
| Migration + verificação constraint | 15 min |
| `gerar-aulas.ts` (algoritmo puro) | 20 min |
| Nova aula com campo data/horário | 30 min |
| Dashboard + `abrirAulaAgendada` action | 40 min |
| `GerarAulasForm` na turma | 30 min |
| Home do aluno + query proximas | 30 min |
| `ConfirmarPresencaButton` | 20 min |
| Teste integrado (gerar → professor abre → aluno vê) | 20 min |
| **Total** | **~3,5h** |

---

## Critério de done

- [ ] Professor cria aula com data futura → status='agendada' automaticamente
- [ ] Professor vê próximas aulas no dashboard com botão "Abrir"
- [ ] "Abrir" muda status para 'aberta' e dispara push (mesmo fluxo atual)
- [ ] Na turma: "Gerar semana" cria aulas agendadas baseado em `dias_semana`
- [ ] Duplicatas são ignoradas (datas que já têm aula não são recriadas)
- [ ] Aluno vê seção "Próximas aulas" na home quando não há aula ao vivo
- [ ] Aluno pode pré-confirmar presença tocando no círculo
- [ ] Quando professor abre a aula, pré-confirmados já aparecem como presentes
- [ ] Se não há agendadas nem abertas: fallback para "Próximo treino: {dia_semana}"
- [ ] Cancelar aula agendada (nova action) não aparece como erro para o aluno
- [ ] Aula cancelada NÃO aparece na home do aluno
