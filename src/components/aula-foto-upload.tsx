'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Baseado no AvatarUpload, mas retangular e no bucket 'aulas-fotos'.
// Path: aulas/<aulaId>.<ext> — a pasta 'aulas' bate com a policy de storage.
export default function AulaFotoUpload({
  aulaId,
  fotoUrlAtual,
  persist,
}: {
  aulaId: string
  fotoUrlAtual: string | null
  persist: (fotoUrl: string) => Promise<{ error?: string; success?: boolean } | undefined>
}) {
  const router = useRouter()
  const inputId = useId()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const temFoto = Boolean(fotoUrlAtual)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${aulaId}/foto.${ext}`
    const supabase = createClient()

    const { error: uploadError } = await supabase.storage
      .from('aulas-fotos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setError('Erro ao enviar foto.')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('aulas-fotos').getPublicUrl(path)
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`

    const result = await persist(publicUrl)
    setUploading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        className={`flex items-center justify-center gap-2 w-full rounded-2xl py-3 uppercase tracking-widest text-xs font-bold transition-transform active:scale-[0.98] ${temFoto ? 'absolute bottom-2 right-2 w-auto px-3 py-2' : ''}`}
        style={{
          cursor: uploading ? 'default' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          background: temFoto ? 'rgba(0,0,0,0.6)' : 'var(--brand-gold-dim)',
          border: temFoto ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--brand-gold-border)',
          color: temFoto ? '#fff' : 'var(--brand-gold)',
          ...(temFoto ? {} : { position: 'relative' as const }),
        }}>
        <Camera size={16} strokeWidth={2.5} />
        {uploading ? 'Enviando...' : temFoto ? 'Trocar' : 'Adicionar foto da turma'}
        <input id={inputId} type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading} onChange={handleFile} />
      </label>
      {error && <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
