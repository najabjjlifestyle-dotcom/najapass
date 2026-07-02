'use client'

import { useEffect, useState } from 'react'
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
      <p className="text-[10px] text-white/30">Notificações bloqueadas no navegador.</p>
    )
  }

  return (
    <button
      onClick={status === 'subscribed' ? desativar : ativar}
      disabled={loading}
      className="text-[10px] uppercase tracking-widest underline underline-offset-2 disabled:opacity-40 text-white/40">
      {loading ? '...' : status === 'subscribed' ? 'Desativar notificações' : 'Ativar notificações'}
    </button>
  )
}
