'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

export default function AvatarUpload({
  alunoId,
  nome,
  fotoUrlAtual,
  persist,
  size = 64,
}: {
  alunoId: string
  nome: string
  fotoUrlAtual: string | null
  persist: (fotoUrl: string) => Promise<{ error?: string; success?: boolean } | undefined>
  size?: number
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fotoUrl, setFotoUrl] = useState(fotoUrlAtual)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${alunoId}.${ext}`
    const supabase = createClient()

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError('Erro ao enviar foto.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`

    const result = await persist(publicUrl)
    setUploading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setFotoUrl(publicUrl)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative rounded-full overflow-hidden flex-shrink-0 disabled:opacity-50"
        style={{ width: size, height: size, border: '1px solid var(--brand-border-str)' }}>
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold"
            style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)' }}>
            {iniciais(nome)}
          </div>
        )}
      </button>
      <div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="text-xs uppercase tracking-widest underline underline-offset-2 disabled:opacity-50"
          style={{ color: 'var(--brand-texto-muted)' }}>
          {uploading ? 'Enviando...' : 'Trocar foto'}
        </button>
        {error && <p className="text-xs mt-1" style={{ color: '#f87171' }}>{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
