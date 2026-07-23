'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { postarResenha, deletarResenha } from './actions'

type Resenha = {
  id: string
  texto: string
  criado_em: string
  aluno_id: string | null
  aluno_nome: string
  aluno_foto: string | null
}

function Avatar({ nome, foto, size = 32 }: { nome: string; foto: string | null; size?: number }) {
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={foto} alt={nome}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    )
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{
        width: size, height: size,
        background: 'var(--brand-gold-dim)',
        border: '1px solid var(--brand-gold-border)',
        color: 'var(--brand-gold)',
        fontSize: size * 0.38,
      }}>
      {nome.charAt(0)}
    </div>
  )
}

function tempoRelativo(dataStr: string): string {
  const diff = Date.now() - new Date(dataStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(dataStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function ResenhaSection({
  aulaId,
  alunoId,
  alunoNome,
  alunoFoto,
  resenhasIniciais,
}: {
  aulaId: string
  alunoId: string
  alunoNome: string
  alunoFoto: string | null
  resenhasIniciais: Resenha[]
}) {
  const [resenhas, setResenhas] = useState<Resenha[]>(resenhasIniciais)
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const maxChars = 280

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [texto])

  function handlePostar() {
    if (!texto.trim() || isPending) return
    const textoLocal = texto.trim()
    const novaResenha: Resenha = {
      id: crypto.randomUUID(),
      texto: textoLocal,
      criado_em: new Date().toISOString(),
      aluno_id: alunoId,
      aluno_nome: alunoNome,
      aluno_foto: alunoFoto,
    }
    setResenhas(prev => [...prev, novaResenha])
    setTexto('')

    startTransition(async () => {
      const res = await postarResenha(aulaId, textoLocal)
      if (res?.error) {
        setResenhas(prev => prev.filter(r => r.id !== novaResenha.id))
        setTexto(textoLocal)
      }
    })
  }

  function handleDeletar(resenhaId: string) {
    setResenhas(prev => prev.filter(r => r.id !== resenhaId))
    startTransition(async () => {
      await deletarResenha(resenhaId, aulaId)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePostar()
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2">
        <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
        <p className="text-[10px] font-bold uppercase tracking-widest px-3"
          style={{ color: 'var(--brand-texto-muted)' }}>
          🗣 Cantinho da Resenha
        </p>
        <div style={{ flex: 1, height: 1, background: 'var(--brand-border)' }} />
      </div>

      {/* Lista */}
      {resenhas.length === 0 ? (
        <div className="rounded-2xl py-8 text-center"
          style={{ background: 'var(--brand-surf)', border: '1px dashed var(--brand-border)' }}>
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm font-medium" style={{ color: 'var(--brand-texto)' }}>
            Ninguém falou nada ainda.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--brand-texto-muted)' }}>
            Seja o primeiro a comentar esse treino!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenhas.map(r => {
            const eMinha = r.aluno_id === alunoId
            return (
              <div key={r.id} className="flex gap-3 items-start group">
                <Avatar nome={r.aluno_nome} foto={r.aluno_foto} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5"
                    style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-bold" style={{ color: 'var(--brand-texto)' }}>
                        {r.aluno_nome.split(' ')[0]}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[9px]" style={{ color: 'var(--brand-texto-muted)' }}>
                          {tempoRelativo(r.criado_em)}
                        </p>
                        {eMinha && (
                          <button
                            onClick={() => handleDeletar(r.id)}
                            disabled={isPending}
                            className="text-[10px] opacity-40 group-active:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-20 active:opacity-100"
                            style={{ color: '#888' }}
                            aria-label="Deletar">
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--brand-texto)' }}>
                      {r.texto}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Avatar nome={alunoNome} foto={alunoFoto} size={34} />
        <div className="flex-1 rounded-2xl px-3 py-2 flex items-end gap-2"
          style={{ background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value.slice(0, maxChars))}
            onKeyDown={handleKeyDown}
            placeholder="O que achou do treino? 🥋"
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
            style={{ color: 'var(--brand-texto)', minHeight: 24 }}
          />
          {texto.length > 240 && (
            <span className="text-[9px] flex-shrink-0 mb-0.5"
              style={{ color: texto.length >= maxChars ? '#DC2626' : 'var(--brand-texto-muted)' }}>
              {maxChars - texto.length}
            </span>
          )}
        </div>
        <button
          onClick={handlePostar}
          disabled={isPending || !texto.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm disabled:opacity-30 transition-opacity active:scale-95"
          style={{ background: 'var(--brand-gold)', color: '#000' }}
          aria-label="Enviar resenha">
          ↑
        </button>
      </div>
      <p className="text-[9px] text-center" style={{ color: '#333' }}>
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </div>
  )
}
