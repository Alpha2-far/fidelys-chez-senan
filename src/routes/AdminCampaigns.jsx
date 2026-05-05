import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [destinationUrl, setDestinationUrl] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [shopId, setShopId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: shop } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', 'chez-senan')
        .single()
      
      if (shop) {
        setShopId(shop.id)
        const { data: list } = await supabase
          .from('campaigns')
          .select('*')
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false })
        
        if (list) setCampaigns(list)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    setShowConfirm(false)
    setError(null)
    setSuccess(null)
    setIsSending(true)

    try {
      // 1. Create campaign in DB
      const { data: campaign, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          shop_id: shopId,
          title,
          body,
          destination_url: destinationUrl || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      // 2. Trigger edge function to send push
      const { data: session } = await supabase.auth.getSession()
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({
          campaign_id: campaign.id,
          shop_id: shopId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi')
      }

      setSuccess(`Campagne envoyée avec succès à ${result.sent_count} client(s).`)
      setTitle('')
      setBody('')
      setDestinationUrl('')
      
      // Refresh list
      fetchData()

    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campagnes Push</h1>
        <p className="text-gray-500 mt-1">Envoyez des notifications directement sur le téléphone de vos clients.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle campagne</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la notification</label>
              <input
                type="text"
                maxLength={50}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Soldes exceptionnelles !"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                required
                maxLength={150}
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Ex: Profitez de -20% sur toute la boutique ce weekend."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lien optionnel (URL)</label>
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500 mt-1">Laissez vide pour rediriger vers la carte de fidélité du client.</p>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSending || !title || !body}
              className="w-full mt-4 py-2.5 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              Préparer l'envoi
            </button>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h2>
          <div className="bg-gray-100 rounded-3xl p-4 max-w-sm mx-auto border-4 border-gray-200 shadow-inner relative" style={{ height: '400px' }}>
            <div className="absolute top-12 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {title || 'Titre de la notification'}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {body || 'Votre message s\'affichera ici.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historique des campagnes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date d'envoi</th>
                <th className="px-6 py-3 font-medium">Titre</th>
                <th className="px-6 py-3 font-medium">Message</th>
                <th className="px-6 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Chargement...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Aucune campagne envoyée.</td></tr>
              ) : (
                campaigns.map(c => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {c.sent_at ? new Date(c.sent_at).toLocaleString() : 'En attente'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{c.title}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{c.body}</td>
                    <td className="px-6 py-4">
                      {c.sent_at ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Envoyé
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Erreur
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer l'envoi</h3>
            <p className="text-gray-600 mb-6">
              Cette notification sera envoyée à tous les clients ayant activé les notifications pour votre boutique. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSend}
                className="flex-1 py-2 px-4 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
              >
                Confirmer l'envoi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
