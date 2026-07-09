'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

export default function AvatarUpload({
  entityId,
  nome,
  fotoUrlAtual,
  persist,
  size = 64,
}: {
  entityId: string
  nome: string
  fotoUrlAtual: string | null
  persist: (fotoUrl: string) => Promise<{ error?: string; success?: boolean } | undefined>
  size?: number
}) {
  const router = useRouter()
  const inputId = useId()
  const [fotoUrl, setFotoUrl] = useState(fotoUrlAtual)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${entityId}.${ext}`
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

  const overlaySize = Math.round(size * 0.34)

  return (
    <div>
      <label
        htmlFor={inputId}
        className="relative inline-block flex-shrink-0"
        style={{ width: size, height: size, cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
        <div className="w-full h-full rounded-full overflow-hidden" style={{ border: '1px solid var(--brand-border-str)' }}>
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold"
              style={{ background: 'var(--brand-gold-dim)', color: 'var(--brand-gold)', fontSize: size * 0.35 }}>
              {iniciais(nome)}
            </div>
          )}
        </div>
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            bottom: 0, right: 0,
            width: overlaySize, height: overlaySize,
            background: 'var(--brand-gold)',
            border: '2px solid var(--brand-fundo)',
          }}>
          <Camera size={Math.round(overlaySize * 0.55)} color="#000" strokeWidth={2.5} />
        </div>
        <input id={inputId} type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFile} />
      </label>
      {error && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
