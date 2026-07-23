export type DadosConquistas = {
  totalPresencas: number
  anosNaAcademia: number
  faixa: string
  maxTreinosMes: number
}

export type Conquista = {
  id: string
  emoji: string
  nome: string
  descricao: string
  desbloqueada: (dados: DadosConquistas) => boolean
}

const FAIXAS_ORDEM = ['branca', 'cinza', 'amarela', 'laranja', 'verde', 'azul', 'roxa', 'marrom', 'preta']

function faixaAtingiuOuUltrapassou(faixaAtual: string, faixaAlvo: string): boolean {
  return FAIXAS_ORDEM.indexOf(faixaAtual) >= FAIXAS_ORDEM.indexOf(faixaAlvo)
}

export const CONQUISTAS: Conquista[] = [
  { id: 'primeiro_treino', emoji: '🥋', nome: 'Primeiro Treino', descricao: 'Pisou no tatame pela primeira vez.', desbloqueada: d => d.totalPresencas >= 1 },
  { id: 'dez_treinos', emoji: '🔟', nome: 'Dez Treinos', descricao: 'Os primeiros dez. A jornada começou de verdade.', desbloqueada: d => d.totalPresencas >= 10 },
  { id: 'cinquenta_treinos', emoji: '💪', nome: '50 Treinos', descricao: 'Meio century. Comprometimento real.', desbloqueada: d => d.totalPresencas >= 50 },
  { id: 'cem_treinos', emoji: '💯', nome: '100 Treinos', descricao: 'Centena completa. Guerreiro.', desbloqueada: d => d.totalPresencas >= 100 },
  { id: 'duzentos_treinos', emoji: '🔥', nome: '200 Treinos', descricao: 'Duzentos treinos. O tatame é sua segunda casa.', desbloqueada: d => d.totalPresencas >= 200 },
  { id: 'quinhentos_treinos', emoji: '⚔️', nome: '500 Treinos', descricao: '500 treinos. Lenda da academia.', desbloqueada: d => d.totalPresencas >= 500 },
  { id: 'mil_treinos', emoji: '👑', nome: '1000 Treinos', descricao: 'Mil treinos. Você é diferente.', desbloqueada: d => d.totalPresencas >= 1000 },
  { id: 'um_ano', emoji: '⭐', nome: '1 Ano no Tatame', descricao: 'Um ano completo treinando. Consistência é tudo.', desbloqueada: d => d.anosNaAcademia >= 1 },
  { id: 'dois_anos', emoji: '🌟', nome: '2 Anos no Tatame', descricao: 'Dois anos. A faixa vem com o tempo e o treino.', desbloqueada: d => d.anosNaAcademia >= 2 },
  { id: 'cinco_anos', emoji: '🏛️', nome: '5 Anos no Tatame', descricao: 'Cinco anos de dedicação. Respeito.', desbloqueada: d => d.anosNaAcademia >= 5 },
  { id: 'faixa_azul', emoji: '🟦', nome: 'Faixa Azul', descricao: 'Primeira grande graduação da jornada.', desbloqueada: d => faixaAtingiuOuUltrapassou(d.faixa, 'azul') },
  { id: 'faixa_roxa', emoji: '🟪', nome: 'Faixa Roxa', descricao: 'A faixa mais rara. Poucos chegam aqui.', desbloqueada: d => faixaAtingiuOuUltrapassou(d.faixa, 'roxa') },
  { id: 'faixa_marrom', emoji: '🟫', nome: 'Faixa Marrom', descricao: 'A pré-faixa preta. A visão está clara.', desbloqueada: d => faixaAtingiuOuUltrapassou(d.faixa, 'marrom') },
  { id: 'faixa_preta', emoji: '⬛', nome: 'Faixa Preta', descricao: 'O topo da montanha. E o começo de uma nova jornada.', desbloqueada: d => d.faixa === 'preta' },
  { id: 'mes_consistente', emoji: '📅', nome: 'Mês Consistente', descricao: '12 ou mais treinos em um único mês.', desbloqueada: d => d.maxTreinosMes >= 12 },
  { id: 'mes_perfeito', emoji: '🌕', nome: 'Mês Perfeito', descricao: '20 treinos em um mês. Absurdo.', desbloqueada: d => d.maxTreinosMes >= 20 },
]

export function computarConquistas(dados: DadosConquistas) {
  return CONQUISTAS.map(c => ({
    ...c,
    desbloqueada: c.desbloqueada(dados),
  }))
}
