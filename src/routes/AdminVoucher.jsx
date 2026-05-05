import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminVoucher() {
  const [code, setCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch voucher details when code is 6 characters
  useEffect(() => {
    const fetchVoucher = async () => {
      const cleanCode = code.toUpperCase().trim();
      if (cleanCode.length !== 6) {
        setVoucher(null);
        setCustomer(null);
        setError('');
        setSuccessMessage(null);
        return;
      }

      setIsLoading(true);
      setError('');
      setSuccessMessage(null);

      try {
        const { data: vData, error: vError } = await supabase
          .from('vouchers')
          .select('*')
          .eq('code', cleanCode)
          .single();

        if (vError || !vData) {
          throw new Error('Code bon introuvable.');
        }

        if (vData.status === 'used') {
          throw new Error('Ce bon a déjà été entièrement utilisé.');
        }

        if (new Date(vData.expires_at) < new Date()) {
          throw new Error('Ce bon est expiré.');
        }

        setVoucher(vData);

        // Fetch customer info
        const { data: cData } = await supabase
          .from('customers')
          .select('name, phone')
          .eq('id', vData.customer_id)
          .single();
        
        if (cData) {
          setCustomer(cData);
        }

      } catch (err) {
        setError(err.message);
        setVoucher(null);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoucher();
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!voucher || !amount) return;

    const useAmount = parseInt(amount);
    
    if (isNaN(useAmount) || useAmount <= 0) {
      setError('Montant invalide.');
      return;
    }

    if (useAmount > voucher.amount_remaining) {
      setError(`Le montant ne peut pas dépasser le solde disponible (${voucher.amount_remaining} F).`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data, error: fnError } = await supabase.functions.invoke('validate-voucher', {
        body: {
          code: voucher.code,
          shop_id: voucher.shop_id,
          amount_to_use: useAmount
        }
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setSuccessMessage(`Le bon a été débité avec succès. Nouveau solde : ${data.amount_remaining} FCFA.`);
      setAmount('');
      
      // Update local voucher state
      setVoucher(prev => ({
        ...prev,
        amount_used: prev.amount_used + useAmount,
        amount_remaining: data.amount_remaining,
        status: data.new_status
      }));

    } catch (err) {
      setError(err.message || 'Erreur lors de la validation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Valider un bon</h1>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Code du bon (6 caractères)
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          className="w-full px-4 py-4 text-3xl text-center tracking-[0.5em] font-mono font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-lg"
          placeholder="Entrez le code"
          maxLength={6}
        />
        
        {isLoading && <p className="text-sm text-gray-500 mt-3 text-center">Vérification en cours...</p>}
        {error && <p className="text-red-500 text-sm mt-3 text-center bg-red-50 p-2 rounded-lg">{error}</p>}
      </div>

      {voucher && !error && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary-200 bg-primary-50/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <h2 className="text-xl font-bold text-gray-900">{customer?.name || '...'}</h2>
                <p className="text-gray-500 text-sm">{customer?.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Expire le</p>
                <p className="font-medium text-gray-900">
                  {new Date(voucher.expires_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 mt-4 border border-primary-100 flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600">Solde disponible</p>
                <p className="text-2xl font-bold text-primary-600">{fmt(voucher.amount_remaining)} FCFA</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                sur {fmt(voucher.amount_total)} F initial
              </div>
            </div>
          </div>

          {voucher.status !== 'used' && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant à débiter (FCFA)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max={voucher.amount_remaining}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-4 text-2xl font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 pr-24"
                  placeholder="Montant..."
                />
                <button
                  type="button"
                  onClick={() => setAmount(voucher.amount_remaining.toString())}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                >
                  Max
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !amount || parseInt(amount) > voucher.amount_remaining}
                className="mt-6 w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl disabled:opacity-50 transition-colors text-lg"
              >
                {isSubmitting ? 'Validation...' : 'Valider ce montant'}
              </button>
            </form>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
