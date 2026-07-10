'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

const className = 'flex items-center justify-center w-10 h-10 rounded-full active:scale-90 transition-transform flex-shrink-0'
const style = { background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }

export default function BackButton({ href, useBack = false }: { href: string; useBack?: boolean }) {
  const router = useRouter()

  if (useBack) {
    return (
      <button type="button" onClick={() => router.back()} className={className} style={style}>
        <ChevronLeft size={18} style={{ color: 'var(--brand-texto-muted)' }} />
      </button>
    )
  }

  return (
    <Link href={href} className={className} style={style}>
      <ChevronLeft size={18} style={{ color: 'var(--brand-texto-muted)' }} />
    </Link>
  )
}
