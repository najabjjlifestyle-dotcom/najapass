import Link from 'next/link'

const COR_MAPA: Record<string, string> = {
  orange: '#F97316',
  yellow: '#FBBF24',
  blue: '#60A5FA',
}

export default function InsightCard({
  cor,
  href,
  children,
}: {
  cor: 'orange' | 'yellow' | 'blue'
  href?: string
  children: React.ReactNode
}) {
  const conteudo = (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px]" style={{ background: 'var(--brand-surf)' }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: COR_MAPA[cor] }} />
      <p className="text-[11px] leading-relaxed" style={{ color: '#888' }}>{children}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block active:opacity-70 transition-opacity">
        {conteudo}
      </Link>
    )
  }

  return conteudo
}
