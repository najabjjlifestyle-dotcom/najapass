import Link from 'next/link'

type Tab = {
  href: string
  label: string
  active: boolean
  badge?: number
}

export default function SectionTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="flex gap-2 px-6 pt-4 pb-4" style={{ borderBottom: '1px solid var(--brand-border)' }}>
      {tabs.map(tab => (
        <Link key={tab.href} href={tab.href}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-transform"
          style={{
            background: tab.active ? 'var(--brand-gold)' : 'transparent',
            color: tab.active ? '#000' : 'var(--brand-texto-muted)',
            border: tab.active ? 'none' : '1px solid var(--brand-border)',
          }}>
          {tab.label}
          {!!tab.badge && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: tab.active ? '#000' : 'var(--brand-gold)' }}
            />
          )}
        </Link>
      ))}
    </div>
  )
}
