import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { signOut, getSession } from '../lib/auth'
import { supabase } from '../lib/supabase'

const NAV_ITEMS = [
  { label: 'Tableau de bord', path: '/admin', icon: 'home' },
  { label: 'Nouveau client', path: '/admin/customers/new', icon: 'user-plus' },
  // Les items suivants seront ajoutes dans les phases futures
  // { label: 'Enregistrer un achat', path: '/admin/purchase', icon: 'shopping-cart' },
  // { label: 'Valider un bon', path: '/admin/voucher', icon: 'ticket' },
  // { label: 'Campagnes', path: '/admin/campaigns', icon: 'megaphone' },
  // { label: 'Parametres', path: '/admin/settings', icon: 'settings' },
]

function NavIcon({ name, className = 'w-5 h-5' }) {
  const icons = {
    home: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
    'user-plus': <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />,
    'shopping-cart': <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />,
    ticket: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />,
    megaphone: <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H6.75a1.5 1.5 0 01-1.5-1.5V10.5a1.5 1.5 0 011.5-1.5h1.5c.704 0 1.402-.03 2.09-.09m0 6.93c.574.054 1.15.09 1.73.09 2.122 0 4.164-.285 6.11-.822M10.34 8.16c.574-.054 1.15-.09 1.73-.09 2.122 0 4.164.285 6.11.822M18.18 8.068A17.412 17.412 0 0119.5 12a17.36 17.36 0 01-1.32 3.932M18.18 8.068A2.18 2.18 0 0119.5 6h.75a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0120.25 18H19.5a2.18 2.18 0 01-1.32-1.932" />,
    settings: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />,
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  )
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [shopName, setShopName] = useState('...')
  const [shopId, setShopId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [recentCustomers, setRecentCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getSession().then((session) => {
      if (session) setUser(session.user)
    })
    // Charger le nom de la boutique
    supabase.from('shops').select('id, shop_name').limit(1).single()
      .then(({ data }) => {
        if (data) {
          setShopName(data.shop_name)
          setShopId(data.id)
        }
      })
  }, [])

  // Charger les 5 derniers clients quand on a le shop_id
  useEffect(() => {
    if (!shopId) return
    setLoadingCustomers(true)
    supabase
      .from('customers')
      .select('id, name, phone, created_at, access_token')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!error && data) setRecentCustomers(data)
        setLoadingCustomers(false)
      })
  }, [shopId])

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{shopName}</p>
                <p className="text-xs text-gray-500">Administration</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <NavIcon name={item.icon} className={`w-5 h-5 ${isActive ? 'text-primary-500' : ''}`} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User info + logout */}
          <div className="p-3 border-t border-gray-100">
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Deconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Tableau de bord</h2>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {location.pathname === '/admin' ? (
            <div className="max-w-4xl space-y-6">
              {/* Carte de bienvenue + action rapide */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 shadow-md shadow-primary-500/20 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      Bienvenue sur Fidelys
                    </h3>
                    <p className="text-primary-100 text-sm">
                      Gerez la fidelite de vos clients depuis cet espace.
                    </p>
                  </div>
                  <Link
                    to="/admin/customers/new"
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Nouveau client
                  </Link>
                </div>
              </div>

              {/* Bouton mobile */}
              <Link
                to="/admin/customers/new"
                className="sm:hidden flex items-center justify-center gap-2 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all shadow-md shadow-primary-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Inscrire un nouveau client
              </Link>

              {/* Derniers clients inscrits */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Derniers clients inscrits</h4>
                  <span className="text-xs text-gray-400">{recentCustomers.length} dernier{recentCustomers.length > 1 ? 's' : ''}</span>
                </div>

                {loadingCustomers ? (
                  <div className="p-6 flex items-center justify-center">
                    <svg className="animate-spin w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : recentCustomers.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">Aucun client inscrit pour l'instant.</p>
                    <Link
                      to="/admin/customers/new"
                      className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Inscrire votre premier client
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentCustomers.map((c) => (
                      <li key={c.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-primary-600">
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs text-gray-400 hidden sm:block">
                            {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/carte/${c.access_token}`
                              navigator.clipboard.writeText(link).catch(() => {})
                            }}
                            title="Copier le lien de la carte"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
