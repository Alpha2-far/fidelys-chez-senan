import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Html5Qrcode } from 'html5-qrcode';

export default function AdminPurchase() {
  const [mode, setMode] = useState('qr'); // 'qr' or 'phone'
  
  // Phone search state
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Selected customer state
  const [customer, setCustomer] = useState(null);
  const [rewardConfig, setRewardConfig] = useState(null);
  
  // Purchase state
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  // Load reward config when a customer is selected
  useEffect(() => {
    if (customer && !rewardConfig) {
      supabase.from('reward_config').select('*').eq('shop_id', customer.shop_id).single()
        .then(({ data }) => setRewardConfig(data));
    }
  }, [customer, rewardConfig]);

  // Phone search debounce
  useEffect(() => {
    if (phoneSearch.length < 3) {
      setSearchResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('customers')
        .select('*')
        .ilike('phone', `%${phoneSearch}%`)
        .limit(5);
      
      setSearchResults(data || []);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [phoneSearch]);

  // QR Scanner logic
  useEffect(() => {
    let html5QrCode;

    if (mode === 'qr' && !customer) {
      html5QrCode = new Html5Qrcode("reader");
      
      html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Extract access token from URL
          try {
            let accessToken = decodedText;
            if (decodedText.includes('/carte/')) {
              const parts = decodedText.split('/carte/');
              accessToken = parts[1].split('/')[0].split('?')[0];
            }
            
            // Stop scanning once we got a code
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
            
            const { data } = await supabase
              .from('customers')
              .select('*')
              .eq('access_token', accessToken)
              .single();
              
            if (data) {
              setCustomer(data);
            } else {
              setError('Client introuvable depuis ce QR code.');
              // We could potentially restart it here, but waiting for user action is safer
            }
          } catch {
            setError('Erreur lors de la lecture du QR code.');
          }
        },
        () => {
          // Ignore normal scan errors (no qr code found yet)
        }
      ).catch(() => {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [mode, customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer || !amount || isNaN(amount) || parseInt(amount) <= 0) return;

    setIsSubmitting(true);
    setError('');
    setSuccessResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('credit-purchase', {
        body: {
          customer_id: customer.id,
          shop_id: customer.shop_id,
          amount: parseInt(amount)
        }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setSuccessResult(data);
      setCustomer({ ...customer, total_spent: data.new_total_spent });
      setAmount('');
      setShowConfirm(false);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSelection = () => {
    setCustomer(null);
    setSuccessResult(null);
    setPhoneSearch('');
    setAmount('');
    setShowConfirm(false);
  };

  const fmt = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Enregistrer un achat</h1>

      {!customer ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Rechercher par téléphone
            </button>
            <button 
              onClick={() => setMode('qr')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'qr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Scanner QR
            </button>
          </div>

          {mode === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Ex: 51234567..."
              />
              
              {isSearching && <p className="text-sm text-gray-500 mt-2">Recherche...</p>}
              
              {searchResults.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-xl divide-y overflow-hidden">
                  {searchResults.map(res => (
                    <button
                      key={res.id}
                      onClick={() => setCustomer(res)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition text-left"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{res.name}</p>
                        <p className="text-sm text-gray-500">{res.phone}</p>
                      </div>
                      <div className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                        Sélectionner
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'qr' && (
            <div>
              <div id="reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300"></div>
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Client sélectionné</p>
                <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                <p className="text-gray-500 text-sm">{customer.phone}</p>
              </div>
              <button 
                onClick={resetSelection}
                className="text-sm text-gray-500 hover:text-gray-900 underline"
              >
                Changer
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mt-4">
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm text-gray-600">Achats cumulés</p>
                <p className="text-lg font-bold text-gray-900">{fmt(customer.total_spent)} FCFA</p>
              </div>
              
              {rewardConfig && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Prochain bon de {fmt(rewardConfig.voucher_amount)} F</span>
                    <span className="font-medium text-primary-600">
                      {Math.min(100, Math.round(((customer.total_spent % rewardConfig.threshold_amount) / rewardConfig.threshold_amount) * 100))}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(((customer.total_spent % rewardConfig.threshold_amount) / rewardConfig.threshold_amount) * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-right text-gray-400 mt-1">
                    Plus que {fmt(rewardConfig.threshold_amount - (customer.total_spent % rewardConfig.threshold_amount))} FCFA
                  </p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant de l'achat (FCFA)
            </label>
            <input
              type="tel"
              required
              value={amount ? fmt(amount) : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setAmount(raw);
              }}
              className="w-full px-4 py-4 text-2xl font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900"
              placeholder="Ex: 50 000"
            />
            
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

            {!showConfirm ? (
              <button
                type="button"
                onClick={() => { if (amount && parseInt(amount) > 0) setShowConfirm(true) }}
                disabled={!amount}
                className="mt-6 w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl disabled:opacity-50 transition-colors text-lg"
              >
                Valider l'achat
              </button>
            ) : (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">Confirmer l'enregistrement ?</p>
                <p className="text-sm text-amber-800 mb-4">
                  <span className="font-bold">{fmt(amount)} FCFA</span> pour <span className="font-bold">{customer.name}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Confirmer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </form>

          {successResult && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-green-900">Achat enregistré !</h3>
              </div>
              
              <p className="text-green-800 mb-4">
                Le solde du client a été mis à jour : <strong>{fmt(successResult.new_total_spent)} FCFA</strong>
              </p>

              {successResult.vouchers_generated > 0 && (
                <div className="bg-white/60 p-4 rounded-xl border border-green-200 space-y-3">
                  <p className="font-bold text-green-900 text-center">🎉 NOUVEAU(X) BON(S) GÉNÉRÉ(S) !</p>
                  {successResult.vouchers.map(v => (
                    <div key={v.code} className="bg-white p-3 rounded-lg border border-green-200 flex justify-between items-center shadow-sm">
                      <span className="font-medium text-gray-600">Bon de {fmt(v.amount_total)} F</span>
                      <span className="font-mono text-xl font-bold tracking-widest text-gray-900">{v.code}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={resetSelection}
                className="mt-6 w-full py-3 bg-white text-green-700 font-bold border border-green-300 rounded-xl hover:bg-green-50 transition"
              >
                Nouvel enregistrement
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
