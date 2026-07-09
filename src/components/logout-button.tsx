'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] transition-transform"
      style={{ border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
      <LogOut size={16} />
      {loading ? 'Saindo...' : 'Sair da conta'}
    </button>
  )
}
