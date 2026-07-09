# HANDOFF-009 — Banho de Loja: Portal do Aluno V2

**Data:** 2026-07-06  
**Autor:** Claude.ai (PM)  
**Para:** Claude Code (CTO)  
**Cards:** B-048, B-049, B-050  
**Dependência:** HANDOFF-007 aplicado (layout multi-page do aluno existe)  
**Branch sugerida:** `feat/sprint13-aluno-insights` (a partir da `feat/sprint11-portal-aluno-v2`)

---

## Diagnóstico dos screenshots

Três problemas centrais identificados:

**1. Header degradado**  
"TROCAR FOTO" aparece como texto solto ao lado do avatar — cluttered, não parece ação de upload. O badge de faixa parece placeholder. O avatar não convida interação.

**2. Técnicas sem insights**  
A lista completa de todas as posições (0/20, 0/16, etc.) é uma parede de chips sem hierarquia. Não diz o que o aluno deve fazer. Não tem drill-down. Não há diferença visual entre "aprendi recentemente" e "aprendi há meses".

**3. Home vazia, sem personalidade**  
"NENHUMA AULA AO VIVO AGORA" + nada. O app aparenta estar quebrado. Um aluno abre o app entre treinos e não vê nada que o motive — zero contexto da sua jornada.

---

## B-050 · Header + Avatar redesign

**Objetivo:** Avatar tappable com câmera overlay, sem texto "TROCAR FOTO". Bell limpo. Belt badge com cor real.

### Mudar em `AvatarUpload` component (`src/components/avatar-upload.tsx`)

O componente atualmente renderiza o avatar + um botão/label de texto separado. Refatorar para que o **próprio avatar seja o label do input**:

```tsx
// ANTES: avatar + texto separado
<div>
  <img ... />
  <label>TROCAR FOTO</label>
  <input type="file" hidden />
</div>

// DEPOIS: avatar é o label
<label htmlFor={inputId} style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}>
  {/* Avatar */}
  <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', ... }}>
    {foto_url ? <img src={foto_url} alt={nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize: size * 0.3, fontWeight: 700, color: 'var(--brand-gold)' }}>
                  {getInitials(nome)}
                </span>}
  </div>
  {/* Camera overlay */}
  <div style={{
    position: 'absolute', bottom: 2, right: 2,
    width: Math.round(size * 0.34), height: Math.round(size * 0.34),
    borderRadius: '50%',
    background: 'var(--brand-gold)',
    border: '2px solid var(--brand-fundo)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Camera size={Math.round(size * 0.16)} color="#000" strokeWidth={2.5} />
  </div>
  <input id={inputId} type="file" accept="image/*" hidden onChange={handleChange} />
</label>
```

Garante que em mobile: tap no avatar → abre galeria/câmera nativa do iOS/Android. Sem texto extra, sem botão separado.

### Mudar em `/aluno/page.tsx` — header

```tsx
// Header atual (verboso, cluttered):
<header>
  <div className="flex items-center gap-4">
    <div className="w-4 h-14 ...faixa bar..." />  {/* barra lateral? remover */}
    <div>
      <p>Faixa {aluno.faixa}...</p>
      <h1>{aluno.nome}</h1>
    </div>
    <AvatarUpload ... />  {/* separado do nome */}
  </div>
  <PushSubscribeButton />  {/* texto underline */}
</header>

// Header novo (limpo):
// 3px color band no topo (FAIXA_HEX por faixa)
// Linha única: [Avatar com câmera] Nome + badge | [🔔 bell]
```

```tsx
const FAIXA_HEX: Record<string, string> = {
  branca: '#FFFFFF', cinza: '#9CA3AF', amarela: '#FBBF24',
  laranja: '#F97316', verde: '#16A34A', azul: '#2563EB',
  roxa: '#7C3AED', marrom: '#92400E', preta: '#111111',
}

// JSX:
<>
  {/* Belt color band */}
  <div style={{ height: 3, background: FAIXA_HEX[aluno.faixa] ?? '#FFF' }} />

  <header className="px-4 pt-safe pb-4 flex items-center justify-between gap-3"
    style={{ borderBottom: '1px solid var(--brand-border)' }}>

    <div className="flex items-center gap-3">
      <AvatarUpload
        entityId={aluno.id}
        nome={aluno.nome}
        fotoUrlAtual={aluno.foto_url}
        persist={updateFotoPropria}
        size={52}
        // O componente agora NÃO mostra texto — apenas o círculo com câmera overlay
      />
      <div>
        <h1 className="font-bold text-[22px]" style={{ color: 'var(--brand-texto)', lineHeight: 1.1 }}>
          {aluno.nome.split(' ')[0]}
        </h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div style={{
            width: 10, height: 10, borderRadius: 2,
            background: FAIXA_HEX[aluno.faixa] ?? '#FFF',
            flexShrink: 0,
          }} />
          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#888' }}>
            {aluno.faixa}{aluno.grau > 0 ? ` · ${aluno.grau}º grau` : ''}
          </span>
        </div>
      </div>
    </div>

    {/* Bell — ícone limpo, não texto */}
    <PushSubscribeButton />
    {/* PushSubscribeButton deve renderizar <Bell> / <BellOff> Lucide em círculo 38px — ver HANDOFF-006 FIX-02 */}
  </header>
</>
```

---

## B-048 · Técnicas: overview compacto + drill-down por categoria

### Overview reformulado — `/aluno/tecnicas/page.tsx`

**Regra:** categorias mostram chips das técnicas VISTAS apenas (não todas), com indicador de stale (laranja) e count de não-vistas. Cada categoria é um card tappável com seta `›`.

**Ordenação das categorias:**
1. Tem técnica stale (> 21 dias) → primeiro (mais urgente)
2. Tem técnicas vistas, sem stale → segundo
3. Sem nenhuma técnica vista → último (ordenado por nome)

```tsx
// Processamento JS (após queries existentes de B-044):

const DIAS_STALE = 21
const agora = Date.now()

type CategoriaCard = {
  id: string
  nome: string
  vistasIds: Set<string>                    // ids das técnicas vistas
  staleIds: Set<string>                     // vistas mas há > 21 dias
  total: { id: string; nome: string }[]     // todas do currículo
  topVistas: { id: string; nome: string; ultimaVez: Date }[]  // top 3 para mostrar
}

// Para cada categoria, computar stale:
// stale = vista, mas a data máxima de aparição desta técnica é > 21 dias atrás

// Ordenar:
const ordenadas = categorias.sort((a, b) => {
  const aUrgente = a.staleIds.size > 0 ? 2 : a.vistasIds.size > 0 ? 1 : 0
  const bUrgente = b.staleIds.size > 0 ? 2 : b.vistasIds.size > 0 ? 1 : 0
  return bUrgente - aUrgente
})
```

**JSX de cada card de categoria:**
```tsx
<Link href={`/aluno/tecnicas/${cat.id}`}>
  <div className="rounded-2xl p-4" style={{
    background: cat.staleIds.size > 0
      ? 'rgba(249,115,22,0.06)'         // laranja sutil se tem stale
      : cat.vistasIds.size > 0
        ? 'var(--brand-surf)'
        : 'var(--brand-surf)',
    border: `1px solid ${
      cat.staleIds.size > 0 ? 'rgba(249,115,22,0.25)' : 'var(--brand-border)'
    }`,
  }}>
    {/* Header: nome + X/Y + chevron */}
    <div className="flex items-center justify-between mb-2">
      <span className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
        {cat.nome}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold" style={{
          color: cat.vistasIds.size > 0 ? 'var(--brand-gold)' : '#444'
        }}>
          {cat.vistasIds.size}/{cat.total.length}
        </span>
        <ChevronRight size={14} style={{ color: '#444' }} />
      </div>
    </div>

    {/* Progress bar */}
    <div style={{ height: 3, background: 'var(--brand-border)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
      <div style={{
        height: '100%',
        width: `${cat.total.length > 0 ? (cat.vistasIds.size / cat.total.length) * 100 : 0}%`,
        background: 'var(--brand-gold)',
        borderRadius: 3,
      }} />
    </div>

    {/* Chips: stale (laranja) + recentes (gold) + unseen count */}
    {cat.vistasIds.size > 0 ? (
      <div className="flex flex-wrap gap-1">
        {cat.staleIds.size > 0 && [...cat.staleIds].slice(0, 2).map(id => {
          const t = cat.total.find(x => x.id === id)
          return t ? (
            <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
              {t.nome} ⚠
            </span>
          ) : null
        })}
        {cat.topVistas.filter(t => !cat.staleIds.has(t.id)).slice(0, 2).map(t => (
          <span key={t.id} className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
            style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
            {t.nome}
          </span>
        ))}
        {cat.total.length - cat.vistasIds.size > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-lg"
            style={{ color: '#333', border: '1px solid #1F1F1F' }}>
            +{cat.total.length - cat.vistasIds.size}
          </span>
        )}
      </div>
    ) : (
      <p className="text-[10px] italic" style={{ color: '#333' }}>
        Nenhuma técnica vista ainda — toque para explorar
      </p>
    )}
  </div>
</Link>
```

---

### Detalhe por categoria — `/aluno/tecnicas/[id]/page.tsx` (NOVA)

**Queries:**
```ts
const { aluno, supabase } = await getAlunoOuRedireciona()

// 1. Dados da categoria
const { data: categoria } = await supabase
  .from('categorias_tecnicas')
  .select('id, nome')
  .eq('id', params.id)
  .single()

if (!categoria) notFound()

// 2. Presencas do aluno (aula_ids)
const { data: presencas } = await supabase
  .from('presencas')
  .select('aula_id')
  .eq('aluno_id', aluno.id)

const aulaIds = (presencas ?? []).map(p => p.aula_id)

// 3. Técnicas desta categoria que o aluno viu + quando
// (somente técnicas desta categoria)
const { data: vistasRows } = aulaIds.length > 0
  ? await supabase
      .from('aula_tecnicas')
      .select('tecnica_id, aulas(data)')
      .in('aula_id', aulaIds)
      .eq('tipo', 'ensinada')
  : { data: [] }

// 4. Todas as técnicas desta categoria (currículo global)
const { data: todasRows } = await supabase
  .from('tecnicas')
  .select('id, nome')
  .eq('categoria_id', params.id)
  .or(`global.eq.true,academia_id.eq.${aluno.academia_id}`)
  .order('nome')
```

**Processamento em JS:**
```ts
// Agrupar aparições de cada técnica
type TecnicaDetalhe = {
  id: string
  nome: string
  vezes: number
  ultimaVez: Date | null
  diasDesdeUltima: number | null
}

const tecnicaMap = new Map<string, TecnicaDetalhe>()

// Inicializar com todas do currículo (não vistas)
for (const t of todasRows ?? []) {
  tecnicaMap.set(t.id, { id: t.id, nome: t.nome, vezes: 0, ultimaVez: null, diasDesdeUltima: null })
}

// Contar aparições das vistas
for (const row of vistasRows ?? []) {
  const t = tecnicaMap.get(row.tecnica_id)
  if (!t) continue  // técnica de outra categoria
  const data = new Date((row.aulas as any).data + 'T12:00:00')
  t.vezes++
  if (!t.ultimaVez || data > t.ultimaVez) t.ultimaVez = data
}

// Calcular diasDesdeUltima e separar em grupos
const agora = Date.now()
const vistas: TecnicaDetalhe[] = []
const stale: TecnicaDetalhe[] = []
const naoVistas: TecnicaDetalhe[] = []

for (const t of tecnicaMap.values()) {
  if (t.ultimaVez) {
    t.diasDesdeUltima = Math.floor((agora - t.ultimaVez.getTime()) / 86400000)
    if (t.diasDesdeUltima > 21) {
      stale.push(t)
    } else {
      vistas.push(t)
    }
  } else {
    naoVistas.push(t)
  }
}

// Ordenar vistas por frequência DESC
vistas.sort((a, b) => b.vezes - a.vezes)
stale.sort((a, b) => (b.diasDesdeUltima ?? 0) - (a.diasDesdeUltima ?? 0)) // mais antiga primeiro
```

**Helper para label de frequência:**
```ts
function labelFrequencia(vezes: number): { texto: string; cor: string } {
  if (vezes >= 5) return { texto: 'Frequente', cor: 'var(--brand-gold)' }
  if (vezes >= 3) return { texto: 'Boa', cor: 'var(--brand-gold)' }
  return { texto: `${vezes}×`, cor: '#888' }
}
```

**JSX:**
```tsx
return (
  <div>
    {/* Back button + título */}
    <header className="px-4 pt-safe pb-3 flex items-center gap-3"
      style={{ borderBottom: '1px solid var(--brand-border)' }}>
      <BackButton href="/aluno/tecnicas" />  {/* componente existente */}
      <div>
        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          categoria
        </p>
        <h1 className="font-bold text-lg" style={{ color: 'var(--brand-texto)' }}>
          {categoria.nome}
        </h1>
      </div>
    </header>

    <main className="px-4 pt-4 space-y-5">

      {/* SEÇÃO 1: Precisa reforçar (só aparece se há stale) */}
      {stale.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#F97316' }}>
            ⚠ Precisa reforçar
          </p>
          <div className="space-y-2">
            {stale.map(t => (
              <div key={t.id} className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{t.nome}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#F97316' }}>
                    vista há {t.diasDesdeUltima} dias
                  </p>
                </div>
                <span className="text-[9px] font-bold px-2 py-1 rounded"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316' }}>
                  Revisar
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO 2: Aprendidas recentemente */}
      {vistas.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--brand-gold)' }}>
            Aprendidas
          </p>
          <div className="space-y-2">
            {vistas.map(t => {
              const freq = labelFrequencia(t.vezes)
              return (
                <div key={t.id} className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                  style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-gold-border)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>{t.nome}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
                      vista {t.vezes}× · última: {t.diasDesdeUltima === 0 ? 'hoje' : t.diasDesdeUltima === 1 ? 'ontem' : `${t.diasDesdeUltima} dias atrás`}
                    </p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-1 rounded"
                    style={{ background: 'var(--brand-gold-dim)', color: freq.cor, border: '1px solid var(--brand-gold-border)' }}>
                    {freq.texto}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SEÇÃO 3: Ainda não viu */}
      {naoVistas.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#444' }}>
            Ainda não viu
          </p>
          <div className="flex flex-wrap gap-1.5">
            {naoVistas.map(t => (
              <span key={t.id} className="text-[10px] px-2.5 py-1 rounded-lg"
                style={{ color: '#333', border: '1px solid #1F1F1F' }}>
                {t.nome}
              </span>
            ))}
          </div>
          {naoVistas.length > 8 && (
            <p className="text-[10px] mt-2" style={{ color: '#2A2A2A' }}>
              + {naoVistas.length - 8} técnicas avançadas
            </p>
          )}
        </div>
      )}

      {/* Empty state (nunca viu nada nesta categoria) */}
      {vistas.length === 0 && stale.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm font-bold" style={{ color: 'var(--brand-texto)' }}>
            {categoria.nome}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
            Você ainda não participou de nenhuma aula com técnicas desta posição.
          </p>
          <p className="text-xs mt-1" style={{ color: '#333' }}>
            {naoVistas.length} técnicas aguardam você.
          </p>
        </div>
      )}

    </main>
  </div>
)
```

**Novo arquivo:** `src/app/(app)/aluno/tecnicas/[id]/page.tsx`

---

## B-049 · Home insights engine

### Nova RPC: `aluno_home_insights`

Evita N queries sequenciais na home. Uma chamada retorna tudo:

```sql
-- supabase/migrations/XXXX_aluno_home_insights.sql

CREATE OR REPLACE FUNCTION aluno_home_insights(p_aluno_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_academia_id UUID;
  v_result JSON;
BEGIN
  -- Verificar que o aluno pertence à academia do caller (RLS)
  SELECT academia_id INTO v_academia_id
  FROM alunos WHERE id = p_aluno_id;

  SELECT json_build_object(
    -- 1. Técnica mais antiga (stale)
    'tecnica_reforcar', (
      SELECT json_build_object(
        'nome', t.nome,
        'categoria_nome', cat.nome,
        'categoria_id', cat.id,
        'ultima_vez', MAX(a.data)::text
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      JOIN tecnicas t ON t.id = at.tecnica_id
      JOIN categorias_tecnicas cat ON cat.id = t.categoria_id
      WHERE p.aluno_id = p_aluno_id
      GROUP BY t.id, t.nome, cat.nome, cat.id
      HAVING MAX(a.data) < CURRENT_DATE - INTERVAL '21 days'
      ORDER BY MAX(a.data) ASC
      LIMIT 1
    ),
    -- 2. Contagens
    'presencas_30d', (
      SELECT COUNT(*) FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      WHERE p.aluno_id = p_aluno_id
        AND p.registrado_em >= NOW() - INTERVAL '30 days'
    ),
    'tecnicas_aprendidas', (
      SELECT COUNT(DISTINCT at.tecnica_id)
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      WHERE p.aluno_id = p_aluno_id
    ),
    -- 3. Melhor categoria (mais % completada, pelo menos 1 técnica)
    'melhor_categoria', (
      SELECT json_build_object(
        'nome', cat.nome,
        'id', cat.id,
        'vistas', COUNT(DISTINCT at.tecnica_id),
        'total', (SELECT COUNT(*) FROM tecnicas t2 WHERE t2.categoria_id = cat.id AND (t2.global = true OR t2.academia_id = v_academia_id))
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      JOIN aula_tecnicas at ON at.aula_id = a.id AND at.tipo = 'ensinada'
      JOIN tecnicas t ON t.id = at.tecnica_id
      JOIN categorias_tecnicas cat ON cat.id = t.categoria_id
      WHERE p.aluno_id = p_aluno_id
      GROUP BY cat.id, cat.nome
      HAVING COUNT(DISTINCT at.tecnica_id) > 0
      ORDER BY COUNT(DISTINCT at.tecnica_id)::float / NULLIF((SELECT COUNT(*) FROM tecnicas t2 WHERE t2.categoria_id = cat.id AND (t2.global = true OR t2.academia_id = v_academia_id)), 0) DESC
      LIMIT 1
    ),
    -- 4. Última aula + técnicas ensinadas
    'ultima_aula', (
      SELECT json_build_object(
        'data', a.data::text,
        'turma_nome', tu.nome,
        'tecnicas', COALESCE((
          SELECT json_agg(t.nome)
          FROM aula_tecnicas at2
          JOIN tecnicas t ON t.id = at2.tecnica_id
          WHERE at2.aula_id = a.id AND at2.tipo = 'ensinada'
          LIMIT 5
        ), '[]'::json)
      )
      FROM presencas p
      JOIN aulas a ON a.id = p.aula_id AND a.academia_id = v_academia_id
      LEFT JOIN turmas tu ON tu.id = a.turma_id
      WHERE p.aluno_id = p_aluno_id
      ORDER BY a.data DESC
      LIMIT 1
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
```

> **Segurança:** SECURITY DEFINER com validação interna de `academia_id` (mesmo padrão de `aluno_mais_ausente`).

### Chamada na home

```ts
// Em /aluno/page.tsx, adicionar após auth:

const { data: insightsRaw } = await supabase
  .rpc('aluno_home_insights', { p_aluno_id: aluno.id })

type HomeInsights = {
  tecnica_reforcar: { nome: string; categoria_nome: string; categoria_id: string; ultima_vez: string } | null
  presencas_30d: number
  tecnicas_aprendidas: number
  melhor_categoria: { nome: string; id: string; vistas: number; total: number } | null
  ultima_aula: { data: string; turma_nome: string | null; tecnicas: string[] } | null
}

const insights = insightsRaw as HomeInsights | null
```

### Seção de insights na home

Substituir o vazio atual por:

```tsx
{/* SEÇÃO: Insights */}
<div className="space-y-3">

  {/* Card 1: Hora de revisar (só aparece se há técnica stale) */}
  {insights?.tecnica_reforcar && (() => {
    const dias = Math.floor(
      (Date.now() - new Date(insights.tecnica_reforcar.ultima_vez + 'T12:00:00').getTime()) / 86400000
    )
    return (
      <Link href={`/aluno/tecnicas/${insights.tecnica_reforcar.categoria_id}`}>
        <div className="rounded-2xl p-4" style={{ background: 'var(--brand-gold-dim)', border: '1px solid var(--brand-gold-border)' }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--brand-gold)' }}>
            ⟳ Hora de revisar
          </p>
          <p className="font-bold text-[15px]" style={{ color: 'var(--brand-texto)' }}>
            {insights.tecnica_reforcar.nome}
          </p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>
            Você viu essa técnica <strong style={{ color: 'var(--brand-texto)' }}>{dias} dias atrás</strong>. Já está esquecendo?
          </p>
          <p className="text-[10px] mt-2" style={{ color: 'var(--brand-gold)', textDecoration: 'underline' }}>
            Ver em {insights.tecnica_reforcar.categoria_nome} →
          </p>
        </div>
      </Link>
    )
  })()}

  {/* Stats strip: 2 cards */}
  {((insights?.presencas_30d ?? 0) > 0 || (insights?.tecnicas_aprendidas ?? 0) > 0) && (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="font-bold text-[28px]" style={{ color: 'var(--brand-texto)', lineHeight: 1 }}>
          {insights?.presencas_30d ?? 0}
        </p>
        <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
          aulas este mês
        </p>
      </div>
      <div className="rounded-2xl p-3 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="font-bold text-[28px]" style={{ color: 'var(--brand-texto)', lineHeight: 1 }}>
          {insights?.tecnicas_aprendidas ?? 0}
        </p>
        <p className="text-[9px] uppercase tracking-widest mt-1.5" style={{ color: 'var(--brand-texto-muted)' }}>
          técnicas aprendidas
        </p>
      </div>
    </div>
  )}

  {/* Card 2: Progresso na melhor categoria */}
  {insights?.melhor_categoria && (() => {
    const cat = insights.melhor_categoria
    const pct = Math.round((cat.vistas / cat.total) * 100)
    return (
      <Link href={`/aluno/tecnicas/${cat.id}`}>
        <div className="rounded-2xl p-4" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
              Progresso — {cat.nome}
            </p>
            <p className="text-xs font-bold" style={{ color: 'var(--brand-gold)' }}>{pct}%</p>
          </div>
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--brand-texto)' }}>
            {cat.vistas} de {cat.total} técnicas
          </p>
          <div style={{ height: 4, background: 'var(--brand-border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand-gold)', borderRadius: 4 }} />
          </div>
          <p className="text-[10px] mt-2" style={{ color: '#555' }}>
            Aprenda mais <strong style={{ color: 'var(--brand-texto)' }}>{cat.total - cat.vistas} técnicas</strong> para completar
          </p>
        </div>
      </Link>
    )
  })()}

  {/* Card 3: Última aula */}
  {insights?.ultima_aula && (() => {
    const ua = insights.ultima_aula
    const data = new Date(ua.data + 'T12:00:00')
    const dataFmt = data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
    return (
      <div className="rounded-2xl p-4" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
          Última aula
        </p>
        <p className="text-sm font-bold capitalize" style={{ color: 'var(--brand-texto)' }}>
          {dataFmt}{ua.turma_nome ? ` · ${ua.turma_nome}` : ''}
        </p>
        {ua.tecnicas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ua.tecnicas.map((t, i) => (
              <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', border: '1px solid var(--brand-gold-border)' }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  })()}

  {/* Empty state — aluno novo sem nenhuma presença */}
  {!insights?.ultima_aula && (insights?.presencas_30d ?? 0) === 0 && (
    <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <p className="font-bold text-sm" style={{ color: 'var(--brand-texto)' }}>
        Bem-vindo ao NajaPass!
      </p>
      <p className="text-xs mt-2" style={{ color: 'var(--brand-texto-muted)' }}>
        Sua jornada começa quando o professor registrar sua primeira presença.
      </p>
      <p className="text-xs mt-1" style={{ color: '#333' }}>
        Explore as técnicas do currículo enquanto isso.
      </p>
      <Link href="/aluno/tecnicas">
        <div className="mt-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--brand-gold)' }}>
          Ver currículo →
        </div>
      </Link>
    </div>
  )}

</div>
```

---

## Arquivos a criar/editar

| Arquivo | Ação | Card |
|---|---|---|
| `src/components/avatar-upload.tsx` | EDITAR — avatar é o label, câmera overlay, sem texto "TROCAR FOTO" | B-050 |
| `src/app/(app)/aluno/page.tsx` | EDITAR — header novo + seção insights | B-049/B-050 |
| `src/app/(app)/aluno/push-subscribe.tsx` | EDITAR — renderizar Bell/BellOff em círculo 38px (sem underline) | B-050 |
| `src/app/(app)/aluno/tecnicas/page.tsx` | EDITAR — cards compactos + stale logic + Link → detail | B-048 |
| `src/app/(app)/aluno/tecnicas/[id]/page.tsx` | CRIAR — detalhe por categoria | B-048 |
| `supabase/migrations/XXXX_aluno_home_insights.sql` | CRIAR — RPC insights | B-049 |

---

## Estimativa

| Tarefa | Tempo |
|---|---|
| `AvatarUpload` refactor (câmera overlay) | 20 min |
| Header home + PushSubscribeButton ícone | 20 min |
| Técnicas overview — cards compactos + stale | 30 min |
| `/aluno/tecnicas/[id]` detail page | 45 min |
| RPC `aluno_home_insights` + migration | 30 min |
| Seção insights na home | 30 min |
| Teste: aluno com 0 presencas (Victor), aluno com 50+ | 15 min |
| **Total** | **~3h** |

---

## Critério de done

- [ ] Avatar tappable com câmera overlay — sem texto "TROCAR FOTO" na tela
- [ ] Header: banda de cor da faixa (3px) + avatar + nome + badge colorido + bell ícone
- [ ] PushSubscribeButton = ícone Bell/BellOff em círculo 38px
- [ ] Técnicas overview: cards compactos, chips stale em laranja, seta `›`, ordered by urgência
- [ ] `/aluno/tecnicas/[id]` existe e mostra: stale (laranja) + aprendidas (com frequência) + não vistas
- [ ] Home mostra insight "Hora de revisar" quando há técnica stale
- [ ] Home mostra stats (aulas 30d + técnicas aprendidas) quando > 0
- [ ] Home mostra progresso da melhor categoria (link para detalhe)
- [ ] Home mostra técnicas da última aula
- [ ] Aluno novo (0 presencas) vê empty state com convite para ver currículo
- [ ] Nenhuma tela usa "NENHUMA AULA AO VIVO AGORA" em caixa alta sem contexto
