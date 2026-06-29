import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Detect profile and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: professor } = await supabase
          .from('professores')
          .select('id, academia_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (professor?.academia_id) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        if (professor && !professor.academia_id) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // Check if it's a student
        const { data: aluno } = await supabase
          .from('alunos')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (aluno) {
          return NextResponse.redirect(`${origin}/aluno`)
        }

        // New user — go to onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
