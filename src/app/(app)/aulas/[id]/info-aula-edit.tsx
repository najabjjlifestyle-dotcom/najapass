'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { atualizarInfoAula } from './actions'

// Edição inline da observação pros alunos + link de estudo de uma aula já
// criada. Fica sempre visível (qualquer status) porque o professor pode
// querer avisar/ajustar depois de planejar.
export default function InfoAulaEdit({
  aulaId,
  observacoesIniciais,
  videoUrlInicial,
}: {
  aulaId: string
  observacoesIniciais: string | null
  videoUrlInicial: string | null
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [obs, setObs] = useState(observacoesIniciais ?? '')
  const [video, setVideo] = useState(videoUrlInicial ?? '')
  const [erro, setErro] = useState('')
  const [isPending, startTransition] = useTransition()

  const temConteudo = Boolean(observacoesIniciais || videoUrlInicial)

  function salvar() {
    setErro('')
    startTransition(async () => {
      const res = await atualizarInfoAula(aulaId, { observacoes: obs, video_url: video })
      if (res?.error) {
        setErro(res.error)
        return
      }
      setEditando(false)
      router.refresh()
    })
  }

  function cancelar() {
    setObs(observacoesIniciais ?? '')
    setVideo(videoUrlInicial ?? '')
    setErro('')
    setEditando(false)
  }

  return (
    <div className="mx-5 mt-4 rounded-xl p-4"
      style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand-texto-muted)' }}>
          Observação para os alunos
        </p>
        {!editando && (
          <button type="button" onClick={() => setEditando(true)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-transform"
            style={{ color: 'var(--brand-gold)' }}>
            <Pencil size={11} /> {temConteudo ? 'Editar' : 'Adicionar'}
          </button>
        )}
      </div>

      {!editando ? (
        temConteudo ? (
          <div className="space-y-2">
            {observacoesIniciais && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brand-texto)' }}>
                {observacoesIniciais}
              </p>
            )}
            {videoUrlInicial && (
              <a href={videoUrlInicial} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs underline underline-offset-2"
                style={{ color: 'var(--brand-gold)' }}>
                ▶ Link de estudo
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--brand-texto-muted)' }}>
            Nenhuma observação. Toque em <strong style={{ color: 'var(--brand-gold)' }}>Adicionar</strong> para avisar algo aos alunos (ex: traga quimono azul).
          </p>
        )
      ) : (
        <div className="space-y-3">
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={3} maxLength={1000}
            placeholder="Ex: Traga quimono azul. Foco em base hoje."
            className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none"
            style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />

          <div>
            <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: 'var(--brand-texto-muted)' }}>
              Link de estudo (YouTube, etc)
            </label>
            <input value={video} onChange={e => setVideo(e.target.value)} type="url"
              placeholder="https://youtube.com/..."
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: 'var(--brand-fundo)', border: '1px solid var(--brand-border-str)', color: 'var(--brand-texto)' }} />
          </div>

          {erro && <p className="text-xs" style={{ color: '#f87171' }}>{erro}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={salvar} disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ background: 'var(--brand-gold)', color: '#000' }}>
              <Check size={13} /> {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={cancelar} disabled={isPending}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-40 active:scale-[0.98] transition-transform"
              style={{ border: '1px solid var(--brand-border)', color: 'var(--brand-texto-muted)' }}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
