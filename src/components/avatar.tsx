function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

export default function Avatar({
  nome,
  fotoUrl,
  size = 32,
}: {
  nome: string
  fotoUrl?: string | null
  size?: number
}) {
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: fotoUrl ? 'transparent' : 'var(--brand-gold-dim, rgba(200,169,110,0.12))',
        color: 'var(--brand-gold, #C8A96E)',
      }}>
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </div>
  )
}
