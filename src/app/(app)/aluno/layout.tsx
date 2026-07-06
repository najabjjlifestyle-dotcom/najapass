import AlunoBottomNav from '@/components/aluno-bottom-nav'

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--brand-fundo)', minHeight: '100dvh' }}>
      <div className="pb-20">
        {children}
      </div>
      <AlunoBottomNav />
    </div>
  )
}
