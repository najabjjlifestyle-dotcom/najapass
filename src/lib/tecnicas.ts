// EP-36 — nome de exibição de uma técnica.
//
// Uma academia pode renomear uma técnica global via `tecnicas_academias`
// (override de nome). Toda query que exibe técnica deve trazer o embed
// `tecnicas_academias(nome_custom)` — o RLS já filtra pelos overrides da
// academia do usuário logado — e usar nomeTecnica() no display.

export interface TecnicaComCustom {
  nome: string
  tecnicas_academias?: { nome_custom: string }[] | { nome_custom: string } | null
  [key: string]: unknown
}

/**
 * Nome exibido da técnica: nome_custom da academia se houver, senão o original.
 * Aceita o embed como array (padrão do PostgREST) ou objeto único.
 */
export function nomeTecnica(t: TecnicaComCustom): string {
  const ta = t.tecnicas_academias
  const custom = Array.isArray(ta) ? ta[0]?.nome_custom : ta?.nome_custom
  return custom ?? t.nome
}
