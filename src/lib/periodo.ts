export function getPeriodoDatas(periodo: string): { dataInicio: string; dataFim: string; label: string } {
  const hoje = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (periodo === 'trimestre') {
    const inicio = new Date(hoje)
    inicio.setMonth(inicio.getMonth() - 2)
    inicio.setDate(1)
    return { dataInicio: fmt(inicio), dataFim: fmt(hoje), label: `${fmtMes(inicio)} – ${fmtMes(hoje)}` }
  }

  if (periodo === 'ano') {
    const inicio = new Date(hoje.getFullYear(), 0, 1)
    return { dataInicio: fmt(inicio), dataFim: fmt(hoje), label: `Jan – ${fmtMes(hoje)} ${hoje.getFullYear()}` }
  }

  // padrão: mês atual
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  return { dataInicio: fmt(inicio), dataFim: fmt(hoje), label: fmtMes(hoje, true) }
}

function fmtMes(d: Date, comAno = false) {
  return d.toLocaleDateString('pt-BR', { month: 'long', ...(comAno ? { year: 'numeric' } : {}) })
}
