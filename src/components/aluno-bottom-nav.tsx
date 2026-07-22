'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Layers, ClipboardList, User } from 'lucide-react'

const ITEMS = [
  { href: '/aluno', Icon: Home, label: 'Home' },
  { href: '/aluno/tecnicas', Icon: Layers, label: 'Técnicas' },
  { href: '/aluno/historico', Icon: ClipboardList, label: 'Histórico' },
  { href: '/aluno/perfil', Icon: User, label: 'Perfil' },
] as const

export default function AlunoBottomNav() {
  const pathname = usePathname()

  if (
    pathname === '/aluno/sem-conta' ||
    pathname === '/aluno/celebracao' ||
    pathname.startsWith('/aluno/aula/')
  ) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{
        background: 'var(--brand-surf)',
        borderColor: 'var(--brand-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {ITEMS.map(({ href, Icon, label }) => {
        const active = href === '/aluno'
          ? pathname === '/aluno'
          : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 active:opacity-60 transition-opacity"
          >
            <Icon
              size={22}
              style={{
                color: active ? 'var(--brand-gold)' : 'var(--brand-texto-muted)',
                strokeWidth: active ? 2.5 : 1.5,
              }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: active ? 'var(--brand-gold)' : 'var(--brand-texto-muted)' }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
