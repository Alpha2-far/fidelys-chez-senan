import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

const fmt = (n) => (n || 0).toLocaleString('fr-FR')
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtMonth = (d) => new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
const daysLeft = (d) => Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000))

function QRCanvas({ url }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && url) QRCode.toCanvas(ref.current, url, { width: 200, margin: 2, color: { dark: '#3b1f0a', light: '#ffffff' } })
  }, [url])
  return <canvas ref={ref} className="mx-auto rounded-xl" />
}

function VoucherItem({ v, shop }) {
  const [show, setShow] = useState(false)
  const t = useRef(null)
  const reveal = () => { setShow(true); clearTimeout(t.current); t.current = setTimeout(() => setShow(false), 10000) }
  useEffect(() => () => clearTimeout(t.current), [])
  const partial = v.status === 'partially_used'
  const days = daysLeft(v.expires_at)
  const primaryColor = shop?.primary_color || '#C17A2B'
  
  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-primary-500/10 border border-primary-100 overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, #E8A84C, ${primaryColor})` }} />
      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${partial ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {partial ? 'En cours d\'utilisation' : 'Disponible'}
          </span>
          <span className={`text-[11px] font-semibold ${days <= 30 ? 'text-red-500' : 'text-gray-400'}`}>
            {days > 0 ? `${days} jour${days > 1 ? 's' : ''}` : 'Expire'}
          </span>
        </div>
        <p className="text-center text-3xl font-extrabold text-gray-900 mb-0.5">{fmt(v.amount_total)} <span className="text-base font-normal text-gray-400">FCFA</span></p>
        {partial && <p className="text-center text-sm text-amber-600 font-medium">Solde restant : {fmt(v.amount_remaining)} FCFA</p>}
        <div className="mt-4 bg-primary-50 rounded-xl p-3 text-center border border-primary-100">
          <p className="text-[10px] uppercase tracking-widest text-primary-400 mb-1.5">Code du bon</p>
          <p className={`text-2xl font-mono font-black tracking-[.3em] text-primary-900 transition-all duration-300 ${!show ? 'blur-[8px] select-none' : ''}`}>{v.code}</p>
          {!show ? <button onClick={reveal} className="mt-2 px-5 py-1.5 text-[11px] font-bold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-all shadow-sm shadow-primary-500/25">Reveler le code</button>
            : <p className="mt-2 text-[11px] text-emerald-600 font-semibold animate-pulse">Visible 10 secondes</p>}
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-3">Valide jusqu'au {fmtDate(v.expires_at)}</p>
      </div>
    </div>
  )
}

// ========== PAGES ==========
function HomePage({ customer, shop, rewardConfig, vouchers, cardUrl, setTab }) {
  const threshold = rewardConfig?.threshold_amount || 500000
  const voucherAmt = rewardConfig?.voucher_amount || 50000
  const total = customer.total_spent || 0
  const cycle = total % threshold
  const pct = Math.min(100, Math.round((cycle / threshold) * 100))
  const remain = threshold - cycle
  const shopName = shop?.shop_name || 'Chez Sena'
  const primaryColor = shop?.primary_color || '#C17A2B'

  const justCompletedCycle = total > 0 && cycle === 0
  const encouragementText = justCompletedCycle
    ? <span>Bravo ! Nouveau cycle commence. Gardez votre rythme !</span>
    : total === 0
    ? <span>Faites votre premier achat pour commencer a cumuler !</span>
    : pct >= 90
    ? <span>Vous y etes presque ! Encore <span className="font-bold" style={{ color: primaryColor }}>{fmt(remain)} FCFA</span> et c&apos;est gagne !</span>
    : pct >= 75
    ? <span>Bientot ! Plus que <span className="font-bold" style={{ color: primaryColor }}>{fmt(remain)} FCFA</span> pour votre bon de {fmt(voucherAmt)} FCFA.</span>
    : pct >= 50
    ? <span>Plus de la moitie ! Encore <span className="font-bold" style={{ color: primaryColor }}>{fmt(remain)} FCFA</span> et vous decrochez un bon.</span>
    : pct >= 25
    ? <span>Bon depart ! Encore <span className="font-bold" style={{ color: primaryColor }}>{fmt(remain)} FCFA</span> pour votre bon de {fmt(voucherAmt)} FCFA !</span>
    : <span>Encore <span className="font-bold" style={{ color: primaryColor }}>{fmt(remain)} FCFA</span> et vous debloquez un bon de {fmt(voucherAmt)} FCFA !</span>

  return (
    <div className="pb-24 flex-1 overflow-y-auto">
      {/* Header gradient */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${primaryColor} 50%, ${primaryColor}ea 100%)` }}>
        <div className="absolute inset-0">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute top-20 -left-10 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-10 w-20 h-20 rounded-full bg-black/5" />
        </div>
        <div className="relative px-5 pt-8 pb-20">
          <div className="mb-4">
            <h1 className="text-[28px] font-black text-white tracking-tight leading-none uppercase">
              {shopName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}
            </h1>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-[13px] font-medium mb-0.5">Bienvenue,</p>
              <p className="text-[18px] font-bold text-white leading-tight">{customer.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main card - overlapping header */}
      <div className="px-4 -mt-14 relative z-10 mb-5">
        <div className="bg-white rounded-[24px] shadow-lg shadow-gray-200/50 border border-gray-100/80 overflow-hidden">
          <div className="p-5">
            {/* Solde */}
            <div className="text-center mb-5">
              <p className="text-[12px] text-gray-500 font-medium mb-1">Vos achats cumules</p>
              <p className="text-[38px] font-black text-gray-900 leading-none tracking-tight">{fmt(total)}</p>
              <p className="text-gray-400 text-[11px] font-semibold uppercase mt-1">FCFA</p>
            </div>

            {/* Progress */}
            <div className="bg-gradient-to-r from-primary-50/50 to-amber-50/50 rounded-xl p-3 mb-4 border border-primary-50">
              <div className="flex justify-between text-[11px] mb-2">
                <span className="text-gray-600 font-medium">Prochain bon de {fmt(voucherAmt)} F</span>
                <span className="text-primary-700 font-bold">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}dd)` }} />
              </div>
              <p className="text-[12px] text-gray-700 font-medium mt-2.5 text-center leading-snug">
                {encouragementText}
              </p>
            </div>

            {/* Infos */}
            <div className="flex justify-between border-t border-gray-100 pt-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Titulaire</p>
                <p className="text-[12px] font-bold text-gray-800 mt-0.5">{customer.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Depuis</p>
                <p className="text-[12px] font-bold text-gray-800 mt-0.5">{fmtMonth(customer.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR */}
      <div className="px-4 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
            </div>
            <h2 className="text-[14px] font-bold text-gray-900">Votre QR Code</h2>
          </div>
          <div className="flex justify-center">
            <QRCanvas url={cardUrl} />
          </div>
          <p className="text-[11px] text-gray-500 text-center mt-3">Presentez ce code au vendeur lors de vos achats</p>
        </div>
      </div>

      {/* Vouchers preview */}
      {vouchers.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[14px] font-bold text-gray-900">Mes bons</h2>
            {vouchers.length > 1 && <button onClick={() => setTab('rewards')} className="text-[11px] text-primary-600 font-semibold">Tout voir</button>}
          </div>
          <VoucherItem v={vouchers[0]} shop={shop} />
        </div>
      )}
    </div>
  )
}

function HistoryPage({ transactions, onBack }) {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="bg-white px-5 pt-8 pb-4 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Historique</h1>
      </div>
      <div className="p-4 space-y-2">
        {transactions.length === 0 ? <p className="text-center text-gray-400 text-sm py-16">Aucune transaction pour le moment.</p>
          : transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'purchase' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <svg className={`w-4 h-4 ${t.type === 'purchase' ? 'text-emerald-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.type === 'purchase' ? 'M12 4.5v15m7.5-7.5h-15' : 'M5 12h14'} />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">{t.type === 'purchase' ? 'Achat credite' : 'Bon utilise'}</p>
                  <p className="text-[10px] text-gray-400">{fmtDate(t.created_at)}</p>
                </div>
              </div>
              <p className={`text-[13px] font-bold ${t.type === 'purchase' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {t.type === 'purchase' ? '+' : '-'}{fmt(t.amount)} F
              </p>
            </div>
          ))}
      </div>
    </div>
  )
}

function RewardsPage({ vouchers, shop, onBack }) {
  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <div className="bg-white px-5 pt-8 pb-4 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900">Recompenses</h1>
      </div>
      <div className="p-4 space-y-4">
        {vouchers.length === 0 ? <p className="text-center text-gray-400 text-sm py-16">Aucun bon actif pour le moment.</p>
          : vouchers.map(v => <VoucherItem key={v.id} v={v} shop={shop} />)}
      </div>
    </div>
  )
}

import { requestNotificationPermission, subscribeToPushNotifications } from '../lib/push'

// ========== MAIN ==========
export default function ClientCard() {
  const { accessToken } = useParams()
  const [customer, setCustomer] = useState(null)
  const [shop, setShop] = useState(null)
  const [rewardConfig, setRewardConfig] = useState(null)
  const [vouchers, setVouchers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState('home')

  const cardUrl = typeof window !== 'undefined' ? `${window.location.origin}/carte/${accessToken}` : ''

  const load = useCallback(async () => {
    if (!accessToken) return
    const { data: c, error } = await supabase.from('customers').select('id, name, phone, total_spent, shop_id, created_at, push_subscription').eq('access_token', accessToken).single()
    if (error || !c) { setNotFound(true); setLoading(false); return }
    setCustomer(c)
    const [s, r, v, t] = await Promise.all([
      supabase.from('shops').select('shop_name, primary_color').eq('id', c.shop_id).single(),
      supabase.from('reward_config').select('threshold_amount, voucher_amount, voucher_validity_days').eq('shop_id', c.shop_id).single(),
      supabase.from('vouchers').select('*').eq('customer_id', c.id).in('status', ['active', 'partially_used']).order('generated_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('customer_id', c.id).order('created_at', { ascending: false }).limit(50)
    ])
    if (s.data) setShop(s.data)
    if (r.data) setRewardConfig(r.data)
    if (v.data) setVouchers(v.data)
    if (t.data) setTransactions(t.data)
    setLoading(false)

    localStorage.setItem('fidelys_access_token', accessToken)

    // Request push notifications
    setTimeout(async () => {
      const granted = await requestNotificationPermission()
      if (granted && !c.push_subscription) {
        await subscribeToPushNotifications(c.id)
      }
    }, 2000)

  }, [accessToken])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex justify-center sm:py-8">
      <div className="w-full max-w-[400px] bg-gray-50 min-h-screen sm:min-h-[800px] sm:h-[800px] sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-gray-900 overflow-hidden flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-100 flex justify-center sm:py-8">
      <div className="w-full max-w-[400px] bg-gray-50 min-h-screen sm:min-h-[800px] sm:h-[800px] sm:rounded-[40px] sm:shadow-2xl sm:border-[8px] sm:border-gray-900 overflow-hidden flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-sm text-gray-500">Contactez votre vendeur pour un nouveau lien.</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center sm:py-8">
      {/* Phone container */}
      <div className="w-full max-w-[400px] bg-gray-50 min-h-screen sm:min-h-0 sm:h-[800px] sm:rounded-[40px] sm:shadow-[0_20px_50px_rgba(0,0,0,0.1)] sm:border-[8px] sm:border-gray-900 overflow-hidden relative flex flex-col">
        
        {/* Content area */}
        {tab === 'home' && <HomePage customer={customer} shop={shop} rewardConfig={rewardConfig} vouchers={vouchers} cardUrl={cardUrl} setTab={setTab} />}
        {tab === 'history' && <HistoryPage transactions={transactions} onBack={() => setTab('home')} />}
        {tab === 'rewards' && <RewardsPage vouchers={vouchers} shop={shop} onBack={() => setTab('home')} />}

        {/* Bottom nav */}
        <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around py-2.5 px-4 pb-4 sm:pb-2.5">
            {[
              { id: 'home', label: 'Accueil', d: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
              { id: 'history', label: 'Historique', d: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'rewards', label: 'Recompenses', d: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' }
            ].map(n => (
              <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-1 relative min-w-[64px] py-1">
                <svg className={`w-5 h-5 transition-colors ${tab === n.id ? 'text-primary-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={n.d} />
                </svg>
                <span className={`text-[10px] font-semibold transition-colors ${tab === n.id ? 'text-primary-600' : 'text-gray-400'}`}>{n.label}</span>
                {n.id === 'rewards' && vouchers.length > 0 && <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-primary-500 text-[8px] font-bold flex items-center justify-center text-white">{vouchers.length}</span>}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
