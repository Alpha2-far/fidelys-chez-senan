import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  const [shopId, setShopId] = useState(null)
  const [configId, setConfigId] = useState(null)
  
  const [shopName, setShopName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#C17A2B')
  const [thresholdAmount, setThresholdAmount] = useState(500000)
  const [voucherAmount, setVoucherAmount] = useState(50000)
  const [voucherValidityDays, setVoucherValidityDays] = useState(150)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Load shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', 'chez-senan')
        .single()
      
      if (shopError) throw shopError
      
      setShopId(shop.id)
      setShopName(shop.shop_name)
      setPrimaryColor(shop.primary_color || '#C17A2B')

      // Load config
      const { data: config, error: configError } = await supabase
        .from('reward_config')
        .select('*')
        .eq('shop_id', shop.id)
        .single()
      
      if (configError) throw configError
      
      setConfigId(config.id)
      setThresholdAmount(config.threshold_amount)
      setVoucherAmount(config.voucher_amount)
      setVoucherValidityDays(config.voucher_validity_days)

    } catch (err) {
      setError('Erreur lors du chargement des paramètres')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // 1. Update shop
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          shop_name: shopName,
          primary_color: primaryColor
        })
        .eq('id', shopId)

      if (shopError) throw shopError

      // 2. Update config
      const { error: configError } = await supabase
        .from('reward_config')
        .update({
          threshold_amount: parseInt(thresholdAmount),
          voucher_amount: parseInt(voucherAmount),
          voucher_validity_days: parseInt(voucherValidityDays)
        })
        .eq('id', configId)

      if (configError) throw configError

      setSuccess('Paramètres sauvegardés avec succès. Les modifications sont immédiates.')
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de la boutique</h1>
        <p className="text-gray-500 mt-1">Personnalisez l'apparence et les règles de fidélité de votre boutique.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700">
          <p className="font-medium">Erreur</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700">
          <p className="font-medium">Succès</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Identité visuelle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
            Identité visuelle
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  required
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border border-gray-300 p-0.5"
                />
                <input
                  type="text"
                  required
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="w-32 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm uppercase"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Cette couleur sera utilisée sur la carte de fidélité de vos clients.</p>
            </div>
          </div>
        </div>

        {/* Règles de fidélité */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            Règles de fidélité
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palier d'achat (FCFA)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={thresholdAmount}
                  onChange={(e) => setThresholdAmount(e.target.value)}
                  className="w-full pl-4 pr-16 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="absolute right-4 top-2.5 text-gray-500">FCFA</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Montant cumulé nécessaire pour débloquer un bon.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant du bon offert (FCFA)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={voucherAmount}
                  onChange={(e) => setVoucherAmount(e.target.value)}
                  className="w-full pl-4 pr-16 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="absolute right-4 top-2.5 text-gray-500">FCFA</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée de validité du bon (jours)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  required
                  value={voucherValidityDays}
                  onChange={(e) => setVoucherValidityDays(e.target.value)}
                  className="w-full pl-4 pr-16 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="absolute right-4 top-2.5 text-gray-500">Jours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Nombre de jours avant l'expiration du bon après sa génération.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Sauvegarde...
              </>
            ) : (
              'Enregistrer les modifications'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
