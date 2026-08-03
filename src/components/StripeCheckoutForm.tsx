import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';

interface StripeCheckoutFormProps {
  amount: number;
  currency: string;
  onSuccess: (receiptInfo: any) => void;
  onCancel: () => void;
}

export function StripeCheckoutForm({ amount, currency, onSuccess, onCancel }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Elements automatically gathers AddressElement data to attach to the payment request
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '?payment_intent_result=true',
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess({
        id: paymentIntent.id,
        method: 'Stripe Secure Payment',
        amount: (paymentIntent.amount / 100),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        refCode: paymentIntent.client_secret?.substring(0, 10) || '',
      });
      setIsProcessing(false);
    } else {
      setErrorMessage('Payment status: ' + paymentIntent?.status);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Secure Payment Details
        </h4>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Billing Address</label>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <AddressElement options={{ mode: 'billing' }} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Card Information</label>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2">
            <PaymentElement options={{ layout: 'tabs' }} />
          </div>
        </div>
      </div>
      
      {errorMessage && (
        <div className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-200 dark:border-red-500/20">
          {errorMessage}
        </div>
      )}
      
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-[#E3000F] hover:bg-red-700 text-white font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay ${amount.toLocaleString()} {currency.toUpperCase()} Securely <Lock className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
