import Link from 'next/link'

// Server Component — só Links estáticos, sem interatividade.
// Mostrada em `/` pra quem não está logado (quem já tem conta é
// redirecionado antes de chegar aqui).
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-fundo)' }}>

      {/* ── Cobra ── */}
      <div className="flex justify-center pt-12">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/cobra.webp"
            alt="NajaBJJ"
            className="w-36 object-contain select-none"
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: 'linear-gradient(to top, var(--brand-fundo), rgba(8,8,8,0.8), transparent)' }}
          />
        </div>
      </div>

      {/* ── Branding ── */}
      <div className="text-center px-6 pt-2 pb-8">
        <h1 className="text-3xl font-bold uppercase tracking-widest" style={{ color: 'var(--brand-texto)' }}>
          Naja BJJ
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] mt-0.5" style={{ color: 'var(--brand-texto-muted)' }}>
          NajaPass
        </p>
      </div>

      {/* ── Pitch ── */}
      <div className="flex-1 px-6 space-y-4">
        <p className="text-center text-lg font-bold leading-snug" style={{ color: 'var(--brand-texto)' }}>
          A evolução do Jiu-Jitsu,<br />
          registrada treino após treino.
        </p>

        <div style={{ borderTop: '1px solid var(--brand-border)' }} />

        <div className="rounded-2xl p-4" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: 'var(--brand-gold)' }}>
            Para Professores
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-texto-sec)' }}>
            Abra aulas, registre técnicas e acompanhe quem está evoluindo — em menos de um minuto por treino.
          </p>
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: 'var(--brand-gold)' }}>
            Para Alunos
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--brand-texto-sec)' }}>
            Veja sua frequência, técnicas aprendidas e toda a sua história no tatame.
          </p>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="px-6 pt-6 space-y-3" style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}>
        <Link
          href="/login?role=professor"
          className="block w-full text-center py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-transform active:scale-[0.98]"
          style={{ background: 'var(--brand-gold)', color: '#000' }}
        >
          Sou Professor
        </Link>
        <Link
          href="/login?role=aluno"
          className="block w-full text-center py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-transform active:scale-[0.98]"
          style={{ background: 'transparent', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }}
        >
          Sou Aluno
        </Link>
        {/* Entrada pra quem já tem conta — /login sem role roteia pelo
            perfil existente (dashboard / aluno / aguardando aprovação). */}
        <Link href="/login"
          className="block text-center text-xs pt-2 uppercase tracking-widest active:opacity-70 transition-opacity"
          style={{ color: 'var(--brand-texto-sec)' }}>
          Já tenho conta · <span style={{ color: 'var(--brand-gold)' }}>Entrar →</span>
        </Link>
      </div>
    </div>
  )
}
