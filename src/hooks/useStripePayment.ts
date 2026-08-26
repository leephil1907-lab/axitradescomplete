import { useEffect, useState } from 'react';
import { useFirebaseData } from './useFirebaseData';

export function useStripePayment(showToast?: (msg: string, type: 'success' | 'error' | 'info') => void) {
  const { addTransaction, setBalance, setLiveBalance, transactions, user } = useFirebaseData();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositSuccess = params.get('deposit_success') === 'true';
    const amountParam = parseFloat(params.get('amount') || '0');
    const paymentIntentId = params.get('payment_intent');
    const sessionId = params.get('session_id');

    if (!depositSuccess && !paymentIntentId && !sessionId) return;

    // Immediately clean URL to prevent replay attacks
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    const verifyDepositOnServer = async () => {
      setIsVerifying(true);
      try {
        const response = await fetch('/api/stripe/verify-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            sessionId,
            amount: amountParam,
            userId: user?.uid || 'anonymous'
          })
        });

        const data = await response.json();
        if (data.verified && data.amount > 0) {
          const creditedAmount = data.amount;
          const txId = data.txId || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

          if (addTransaction) {
            const newTx = {
              id: txId,
              type: 'Deposit',
              amount: creditedAmount,
              method: 'Stripe Gateway Verified',
              date: new Date().toISOString().replace('T', ' ').substring(0, 19),
              status: 'Pending Verification',
              account: 'Live ECN Account',
              refCode: data.refCode || `STRIPE-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
              proofNote: 'Stripe Card Checkout Payment • Pending Settlement Review'
            };
            addTransaction(newTx);
          }

          if (showToast) {
            showToast(`💳 DEPOSIT SUBMITTED: $${creditedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} processed via Stripe and submitted for verification (Ref: ${txId}).`, 'info');
          }

          const emailPayload = {
            recipientEmail: user?.email || 'client@axi.com',
            recipientName: user?.displayName || 'Valued Trader',
            type: 'Deposit',
            subject: `Deposit Payment Submitted - $${creditedAmount.toLocaleString()}`,
            txId,
            txType: 'Deposit',
            amount: creditedAmount,
            status: 'Pending Verification',
            method: 'Stripe Card Gateway'
          };
          window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: emailPayload }));
        } else {
          if (showToast) showToast(data.message || 'Deposit could not be verified by payment gateway.', 'error');
        }
      } catch (err) {
        console.error('Failed to verify deposit with server:', err);
        if (showToast) showToast('Failed to verify deposit with server.', 'error');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyDepositOnServer();
  }, [addTransaction, setBalance, setLiveBalance, showToast, user]);

  return { isVerifying };
}

