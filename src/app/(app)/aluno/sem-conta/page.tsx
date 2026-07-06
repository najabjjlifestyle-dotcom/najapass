import { UserX } from 'lucide-react'

export default function AlunoSemContaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--brand-fundo)' }}>
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <UserX size={28} style={{ color: 'var(--brand-texto-muted)' }} />
        </div>
        <p className="font-bold text-lg uppercase tracking-wider" style={{ color: 'var(--brand-texto)' }}>
          Conta não vinculada
        </p>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--brand-texto-muted)' }}>
          Peça ao seu professor para cadastrar seu e-mail no sistema.
        </p>
      </div>
    </div>
  )
}
