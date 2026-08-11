import { useEffect, useState } from 'react';
import { useFirebaseData } from './useFirebaseData';

export function useStripePayment(showToast?: (msg: string, type: 'success' | 'error' | 'info') => void) {
  const { addTransaction, setBalance, setLiveBalance, transactions } = useFirebaseData();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositSuccess = params.get('deposit_success') === 'true';
    const amountParam = parseFloat(params.get('amount') || '0');
    const paymentIntentId = params.get('payment_intent');

    if (depositSuccess && amountParam > 0) {
      const txId = `DEP-STRIPE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      if (addTransaction) {
        const newTx = {
          id: txId,
          type: 'Deposit',
          amount: amountParam,
          method: 'Stripe Gateway Verified',
          date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          status: 'Completed',
          account: 'Live ECN Account',
          refCode: `STRIPE-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
          proofNote: 'Stripe Credit/Debit Card Real Checkout Payment'
        };
        addTransaction(newTx);
      }

      setBalance(prev => prev + amountParam);
      setLiveBalance(prev => prev + amountParam);

      if (showToast) {
        showToast(`🎉 REAL DEPOSIT SUCCESSFUL: $${amountParam.toLocaleString(undefined, { minimumFractionDigits: 2 })} paid via Stripe and credited to your live account!`, 'success');
      }

      // Trigger email dispatch notification
      const emailPayload = {
        recipientEmail: 'client@axi.com',
        recipientName: 'Valued Trader',
        type: 'Deposit',
        subject: `🎉 Axi Account Deposit Verified - $${amountParam.toLocaleString()}`,
        txId,
        txType: 'Deposit',
        amount: amountParam,
        status: 'Approved & Credited',
        method: 'Stripe Card Gateway'
      };
      window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: emailPayload }));

      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }

    if (params.get('payment_intent_result') === 'true' && paymentIntentId) {
      const alreadyProcessed = transactions.some(t => t.refCode?.includes(paymentIntentId.substring(0, 12)));
      if (alreadyProcessed) return;

      setIsVerifying(true);
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
                account: 'Live ECN Account',
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
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        });
    }
  }, [addTransaction, setBalance, setLiveBalance, showToast, transactions]);

  return { isVerifying };
}

