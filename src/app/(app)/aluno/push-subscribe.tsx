'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { salvarPushSubscription, removerPushSubscription } from './actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'subscribed' | 'unsupported' | 'denied'>('checking')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'idle')
    }
    check()
  }, [])

  async function ativar() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await salvarPushSubscription({ endpoint: json.endpoint, keys: json.keys })
      setStatus('subscribed')
    } finally {
      setLoading(false)
    }
  }

  async function desativar() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await removerPushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'checking' || status === 'unsupported') return null

  if (status === 'denied') {
    return (
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        title="Notificações bloqueadas"
        style={{ width: 38, height: 38, background: 'var(--brand-surf)', border: '1px solid var(--brand-border)' }}>
        <BellOff size={16} style={{ color: 'var(--brand-texto-muted)' }} />
      </div>
    )
  }

  return (
    <button
      onClick={status === 'subscribed' ? desativar : ativar}
      disabled={loading}
      className="rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform disabled:opacity-40"
      title={status === 'subscribed' ? 'Desativar notificações' : 'Ativar notificações'}
      style={{
        width: 38, height: 38,
        background: status === 'subscribed' ? 'var(--brand-gold-dim)' : 'var(--brand-surf)',
        border: `1px solid ${status === 'subscribed' ? 'var(--brand-gold-border)' : 'var(--brand-border)'}`,
      }}>
      {loading
        ? <span style={{ fontSize: 12, color: 'var(--brand-texto-muted)' }}>…</span>
        : status === 'subscribed'
          ? <Bell size={16} style={{ color: 'var(--brand-gold)' }} />
          : <BellOff size={16} style={{ color: 'var(--brand-texto-muted)' }} />
      }
    </button>
  )
}
