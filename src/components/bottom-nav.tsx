'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Início' },
  { href: '/alunos', Icon: Users, label: 'Alunos' },
  { href: '/aulas', Icon: ClipboardList, label: 'Histórico' },
  { href: '/perfil', Icon: User, label: 'Perfil' },
]

const HIDDEN_PREFIXES = ['/aluno', '/onboarding', '/boas-vindas']

export default function BottomNav() {
  const pathname = usePathname()

  if (HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix))) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: 'var(--brand-surf)',
        borderTop: '1px solid var(--brand-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      }}>
      {NAV_ITEMS.map(({ href, Icon, label }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full active:opacity-60 transition-opacity"
            style={{ color: active ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[9px] uppercase tracking-wider font-bold" style={{ opacity: active ? 1 : 0.5 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
