import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-10 h-10 rounded-full active:scale-90 transition-transform flex-shrink-0"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <ChevronLeft size={18} style={{ color: 'var(--brand-texto-muted)' }} />
    </Link>
  )
}
