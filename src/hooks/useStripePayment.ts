import { useEffect, useState } from 'react';
import { useFirebaseData } from './useFirebaseData';

/**
 * useStripePayment
 *
 * IMPORTANT — Admin-manual-credit flow:
 * Stripe only COLLECTS the payment into the Stripe balance. It does NOT credit
 * the user's trading balance. The server records the confirmed payment in
 * pendingDeposits.json and notifies the admin (Telegram). The admin must then
 * manually credit the exact paid amount to the user from the Admin Dashboard.
 *
 * On the client we therefore:
 *   - record the transaction as "Pending Admin Credit" (NOT Approved)
 *   - do NOT touch setLiveBalance / setBalance
 *   - tell the user their payment was received and is pending admin credit
 */
export function useStripePayment(showToast?: (msg: string, type: 'success' | 'error' | 'info') => void) {
  const { addTransaction, user } = useFirebaseData();
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
            userId: user?.uid || user?.email || 'anonymous'
          })
        });

        const data = await response.json();
        if (data.verified && data.amount > 0) {
          const paidAmount = data.amount;
          const txId = data.txId || `DEP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const refCode = data.refCode || `STRIPE-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

          // Record as a PENDING transaction — admin will credit the balance manually.
          if (addTransaction) {
            const newTx = {
              id: txId,
              type: 'Deposit',
              amount: paidAmount,
              method: 'Stripe Card Gateway',
              date: new Date().toISOString().replace('T', ' ').substring(0, 19),
              status: 'Pending Admin Credit',
              account: 'Live ECN Account',
              refCode: refCode,
              proofNote: 'Stripe Card Payment received • Pending Admin Balance Credit'
            };
            addTransaction(newTx);
          }

          // NOTE: Deliberately do NOT credit setLiveBalance / setBalance here.
          // The admin credits the exact paid amount manually after confirming
          // receipt in Stripe.

          if (showToast) {
            showToast(
              `✅ PAYMENT RECEIVED: $${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} confirmed by Stripe (Ref: ${refCode}). Your account balance will be credited by our admin team shortly after verification.`,
              'success'
            );
          }

          const emailPayload = {
            recipientEmail: user?.email || 'client@axi.com',
            recipientName: user?.displayName || 'Valued Trader',
            type: 'DepositPending',
            subject: `Deposit Payment Received - $${paidAmount.toLocaleString()} Pending Admin Credit`,
            txId,
            txType: 'Deposit',
            amount: paidAmount,
            status: 'Pending Admin Credit',
            method: 'Stripe Card Gateway',
            refCode
          };
          window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: emailPayload }));
        } else {
          if (showToast) showToast(data.message || 'Deposit could not be verified by the payment gateway. If you believe this is an error, please contact support with your transaction reference.', 'error');
        }
      } catch (err) {
        console.error('Failed to verify deposit with server:', err);
        if (showToast) showToast('Failed to verify deposit with server.', 'error');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyDepositOnServer();
  }, [addTransaction, showToast, user]);

  return { isVerifying };
}
