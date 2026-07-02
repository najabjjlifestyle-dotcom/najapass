import webpush from 'web-push'

type PushSubscriptionRow = { endpoint: string; p256dh: string; auth: string }

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false

  webpush.setVapidDetails('mailto:contato@najabjj.com.br', publicKey, privateKey)
  vapidConfigured = true
  return true
}

export async function sendPushToAll(
  subscriptions: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string }
) {
  if (!ensureVapid()) return { sent: 0, skipped: subscriptions.length, reason: 'VAPID não configurado' }

  const body = JSON.stringify(payload)
  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return { sent, skipped: subscriptions.length - sent }
}
