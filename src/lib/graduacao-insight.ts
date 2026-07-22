// Análise motivacional de graduação — compartilhada entre a home do aluno
// (/aluno) e o perfil (/aluno/perfil). Celebra conquista recente ou avisa
// quando a próxima faixa está perto (retenção: não sumir dos treinos).

// Próxima faixa na progressão (cobre a trilha adulto e a infantil).
export const PROXIMA_FAIXA: Record<string, string> = {
  branca: 'azul', cinza: 'amarela', amarela: 'laranja', laranja: 'verde',
  verde: 'azul', azul: 'roxa', roxa: 'marrom', marrom: 'preta',
}

export type GradInsight = {
  emoji: string
  titulo: string
  texto: string
  // notavel = vale destacar na home (conquista recente ou próxima faixa perto).
  // Os casos "ambiente" (progresso genérico, faixa preta) só aparecem no perfil.
  notavel: boolean
}

export function graduacaoInsight(
  faixa: string,
  grau: number,
  graduadoEm: string | null,
  grauEm: string | null,
): GradInsight {
  const DIA = 1000 * 60 * 60 * 24
  const recente = (iso: string | null) => !!iso && (Date.now() - new Date(iso).getTime()) < 45 * DIA
  const proxima = PROXIMA_FAIXA[faixa]

  // 1. No grau máximo com próxima faixa à vista — nudge mais forte de retenção
  if (proxima && grau >= 4) {
    return {
      emoji: '🔥',
      titulo: `A faixa ${proxima} está logo ali`,
      texto: `Você chegou ao 4º grau da faixa ${faixa} — a ${proxima} vem da consistência no tatame. Sumir agora reseta esse ritmo. Bora manter a presença!`,
      notavel: true,
    }
  }
  // 2. Trocou de faixa há pouco
  if (recente(graduadoEm)) {
    return {
      emoji: '🎉',
      titulo: `Parabéns pela faixa ${faixa}!`,
      texto: proxima
        ? `Conquista nova é combustível. Continue aparecendo e comece a somar graus rumo à faixa ${proxima}.`
        : 'Você chegou ao topo. Siga treinando e inspirando a academia.',
      notavel: true,
    }
  }
  // 3. Ganhou grau há pouco
  if (recente(grauEm)) {
    return {
      emoji: '⭐',
      titulo: `${grau}º grau conquistado!`,
      texto: proxima
        ? `Cada grau te aproxima da faixa ${proxima}. Mantenha a frequência que a evolução continua.`
        : 'Mais um marco. Continue firme no tatame.',
      notavel: true,
    }
  }
  // 4. Perto da próxima faixa (3º grau)
  if (proxima && grau === 3) {
    return {
      emoji: '🥋',
      titulo: `Rumo à faixa ${proxima}`,
      texto: `3º grau da faixa ${faixa} — você está na reta. Cada treino conta pra chegar na ${proxima}.`,
      notavel: true,
    }
  }
  // 5. Progresso geral
  if (proxima) {
    return {
      emoji: '💪',
      titulo: `Construindo a faixa ${proxima}`,
      texto: 'Graduação é presença somada no tempo. Quanto mais constante, mais rápido você evolui.',
      notavel: false,
    }
  }
  // 6. Faixa preta — topo da jornada
  return {
    emoji: '🖤',
    titulo: 'Faixa preta',
    texto: 'O ápice da jornada. Agora é legado — siga treinando e formando novos faixas-pretas.',
    notavel: false,
  }
}
