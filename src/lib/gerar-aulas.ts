const DIA_MAP: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
}

export type Turma = {
  id: string
  dias_semana: string[] | null
  horario: string | null
}

export type AulaGerada = {
  turma_id: string
  academia_id: string
  data: string
  hora_inicio: string | null
  status: 'agendada'
}

export function calcularDatasRecorrentes(
  turma: Turma,
  semanas: 1 | 2 | 4,
  academiaId: string,
): AulaGerada[] {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const fim = new Date(hoje)
  fim.setDate(hoje.getDate() + semanas * 7)

  const diasAlvo = (turma.dias_semana ?? []).map(d => DIA_MAP[d] ?? -1).filter(n => n >= 0)
  const resultado: AulaGerada[] = []
  if (diasAlvo.length === 0) return resultado

  const cursor = new Date(hoje)
  // Começa amanhã pra não duplicar a aula de hoje (se já houver uma aberta manualmente)
  cursor.setDate(cursor.getDate() + 1)

  while (cursor < fim) {
    if (diasAlvo.includes(cursor.getDay())) {
      resultado.push({
        turma_id: turma.id,
        academia_id: academiaId,
        data: cursor.toISOString().split('T')[0],
        hora_inicio: turma.horario,
        status: 'agendada',
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return resultado
}
