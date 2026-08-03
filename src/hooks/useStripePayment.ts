import { useEffect, useState } from 'react';
import { useFirebaseData } from './useFirebaseData';

export function useStripePayment(showToast?: (msg: string, type: 'success' | 'error' | 'info') => void) {
  const { addTransaction, setBalance, setLiveBalance, transactions } = useFirebaseData();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    
    if (params.get('payment_intent_result') === 'true' && paymentIntentId) {
      // Check if we already processed this
      const alreadyProcessed = transactions.some(t => t.refCode?.includes(paymentIntentId.substring(0, 12)));
      if (alreadyProcessed) return;

      setIsVerifying(true);
      // Securely fetch status from backend
      fetch(`/api/stripe/payment-intent/${paymentIntentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'succeeded') {
            const amount = data.amount;
            if (amount > 0 && addTransaction) {
              const newTx = {
                id: `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                type: 'Deposit',
                amount: amount,
                method: 'Stripe Secure Payment (Verified)',
                date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                status: 'Completed',
                account: 'Live ECN Account (#8849201)',
                refCode: paymentIntentId.substring(0, 12),
                proofNote: 'Stripe Gateway Authorized'
              };
              addTransaction(newTx);
              setBalance(prev => prev + amount);
              setLiveBalance(prev => prev + amount);
              if (showToast) showToast(`Payment Successful! Credited $${amount.toLocaleString()} USD to your account.`, 'success');
            }
          } else {
             if (showToast) showToast(`Payment ${data.status}. Please try again if not successful.`, 'info');
          }
        })
        .catch(err => {
          console.error("Failed to verify payment intent", err);
          if (showToast) showToast('Failed to verify payment status with server.', 'error');
        })
        .finally(() => {
          setIsVerifying(false);
          // Clean up the URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        });
    }
  }, [addTransaction, setBalance, setLiveBalance, showToast, transactions]);

  return { isVerifying };
}
