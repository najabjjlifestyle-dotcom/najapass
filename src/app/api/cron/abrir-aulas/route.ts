import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushToAll } from '@/lib/push'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: aulasParaAbrir, error: rpcError } = await supabase.rpc('aulas_para_abrir_agora')
  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }
  if (!aulasParaAbrir || aulasParaAbrir.length === 0) {
    return NextResponse.json({ abridas: 0 })
  }

  let abridas = 0
  for (const aula of aulasParaAbrir as { id: string; turma_id: string | null; turma_nome: string | null }[]) {
    const { error } = await supabase
      .from('aulas')
      .update({ status: 'aberta' })
      .eq('id', aula.id)
      .eq('status', 'agendada') // idempotente — se outro cron run já abriu, não reabre/repush

    if (!error) {
      abridas++
      if (aula.turma_id) {
        const { data: subs } = await supabase.rpc('subscricoes_da_turma', { p_turma_id: aula.turma_id })
        if (subs && subs.length > 0) {
          await sendPushToAll(subs, {
            title: '🥋 Aula aberta!',
            body: `${aula.turma_nome ?? 'Sua turma'} — confirme sua presença`,
            url: '/aluno',
          })
        }
      }
    }
  }

  return NextResponse.json({ abridas })
}
