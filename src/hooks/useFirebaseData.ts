import { useState, useEffect } from 'react';
import { safeStorage } from '../utils/storage';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, deleteDoc } from 'firebase/firestore';
import { TradeOrder, ClosedPosition, PriceAlert } from '../types';
import { sendTelegramAlert } from '../utils/telegram';

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States
  const [balance, setBalance] = useState<number>(0);
  const [liveBalance, setLiveBalance] = useState<number>(0);
  const [openPositions, setOpenPositions] = useState<TradeOrder[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Init user doc if not exists
        const userRef = doc(db, 'users', currentUser.uid);
        
        const unsubUser = onSnapshot(userRef, async (docSnap) => {
          let currLiveBal = 0;
          let currPracticeBal = 10000;
          if (docSnap.exists()) {
            const data = docSnap.data();
            currPracticeBal = data.balance ?? 10000;
            currLiveBal = data.liveBalance ?? 0;
            setBalance(currPracticeBal);
            setLiveBalance(currLiveBal);
          } else {
            try {
              const displayName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Axi Trader');
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName,
                photoURL: currentUser.photoURL || '',
                providerId: currentUser.providerData[0]?.providerId || 'google.com',
                balance: 10000, // Standard practice balance for new accounts
                liveBalance: 0, // Live real money balance starts clean at 0
                createdAt: Date.now()
              });
              setBalance(10000);
              setLiveBalance(0);

              // Dispatch Telegram alert for new account registration
              sendTelegramAlert('NEW_USER_REGISTRATION', '🎉 New User Registered on Axi Portal!', {
                'Email': currentUser.email || 'N/A',
                'Display Name': displayName,
                'Provider': currentUser.providerData[0]?.providerId || 'Email/Password',
                'User UID': currentUser.uid,
                'Timestamp': new Date().toUTCString()
              });
            } catch (err) {
              console.error("Error creating user profile", err);
            }
          }

          // Automatically create/update record on Admin Dashboard for every website user
          try {
            const savedStr = safeStorage.getItem('axi_registered_users');
            let userList: any[] = [];
            if (savedStr) {
              try { userList = JSON.parse(savedStr); } catch (e) {}
            }

            const email = currentUser.email || 'trader@axi.com';
            const name = currentUser.displayName || (email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Axi Trader');
            const existingIndex = userList.findIndex(item => item.id === currentUser.uid || item.email === email);

            const updatedUserObj = {
              id: currentUser.uid,
              name: name,
              email: email,
              status: existingIndex >= 0 ? (userList[existingIndex].status || 'Verified') : 'Verified',
              balance: currLiveBal,
              demoBalance: currPracticeBal,
              registeredAt: existingIndex >= 0 && userList[existingIndex].registeredAt ? userList[existingIndex].registeredAt : new Date().toISOString().replace('T', ' ').substring(0, 16),
              lastActive: 'Active Now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC)',
              provider: currentUser.providerData[0]?.providerId || 'Email/Password',
              accountNo: existingIndex >= 0 && userList[existingIndex].accountNo ? userList[existingIndex].accountNo : `AXI-MT5-${currentUser.uid.substring(0, 6).toUpperCase()}`,
              accountType: 'Pro ECN Prime',
              leverage: '1:500',
              country: 'United Kingdom'
            };

            if (existingIndex >= 0) {
              userList[existingIndex] = { ...userList[existingIndex], ...updatedUserObj };
            } else {
              userList.unshift(updatedUserObj);
              // Trigger welcome email dispatch for new registration
              const welcomeEmailPayload = {
                id: `WELCOME-REG-${Math.floor(100000 + Math.random() * 900000)}`,
                recipientEmail: email,
                recipientName: name,
                type: 'Registration',
                subject: `🎉 Welcome to Axi Trades - Account Registration Successful!`,
                timestamp: new Date().toUTCString(),
                accountNo: updatedUserObj.accountNo,
                platform: 'MT5 / ECN Webtrader'
              };
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('axi_email_trigger', { detail: welcomeEmailPayload }));
              }, 1200);
            }

            safeStorage.setItem('axi_registered_users', JSON.stringify(userList));
            window.dispatchEvent(new Event('axi_registered_user_event'));
          } catch (e) {
            console.error("Error recording user on admin dashboard:", e);
          }
        });

        // Listen to collections
        const openPosRef = collection(db, `users/${currentUser.uid}/openPositions`);
        const unsubOpenPos = onSnapshot(openPosRef, (snapshot) => {
          const positions: TradeOrder[] = [];
          snapshot.forEach((doc) => positions.push(doc.data() as TradeOrder));
          setOpenPositions(positions);
        });

        const closedPosRef = collection(db, `users/${currentUser.uid}/closedPositions`);
        const unsubClosedPos = onSnapshot(closedPosRef, (snapshot) => {
          const positions: ClosedPosition[] = [];
          snapshot.forEach((doc) => positions.push(doc.data() as ClosedPosition));
          setClosedPositions(positions);
        });

        const transRef = collection(db, `users/${currentUser.uid}/transactions`);
        const unsubTrans = onSnapshot(transRef, (snapshot) => {
          const trans: any[] = [];
          snapshot.forEach((doc) => trans.push(doc.data()));
          setTransactions(trans);
        });
        
        const alertsRef = collection(db, `users/${currentUser.uid}/priceAlerts`);
        const unsubAlerts = onSnapshot(alertsRef, (snapshot) => {
          const alerts: PriceAlert[] = [];
          snapshot.forEach((doc) => alerts.push(doc.data() as PriceAlert));
          setPriceAlerts(alerts);
        });

        setLoading(false);
        return () => {
          unsubUser(); unsubOpenPos(); unsubClosedPos(); unsubTrans(); unsubAlerts();
        };
      } else {
        setBalance(0); setLiveBalance(0);
        setOpenPositions([]); setClosedPositions([]); setTransactions([]); setPriceAlerts([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      sendTelegramAlert('USER_LOGIN', '🔓 User Signed In via Google', {
        'Email': result.user.email || 'N/A',
        'Name': result.user.displayName || 'Google User',
        'User UID': result.user.uid
      });
      return result.user;
    } catch (err: any) {
      console.error("Error logging in with Google:", err);
      throw err;
    }
  };

  const loginWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    provider.setCustomParameters({ display: 'popup' });
    try {
      const result = await signInWithPopup(auth, provider);
      sendTelegramAlert('USER_LOGIN', '🔓 User Signed In via Facebook', {
        'Email': result.user.email || 'N/A',
        'Name': result.user.displayName || 'Facebook User',
        'User UID': result.user.uid
      });
      return result.user;
    } catch (err: any) {
      console.error("Error logging in with Facebook:", err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      sendTelegramAlert('USER_LOGIN', '🔓 User Signed In via Email/Password', {
        'Email': email,
        'User UID': res.user.uid
      });
      return res;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Try creating user if missing
        try {
          const createRes = await createUserWithEmailAndPassword(auth, email, pass);
          sendTelegramAlert('USER_REGISTRATION', '🎉 New User Registered via Email/Password', {
            'Email': email,
            'User UID': createRes.user.uid
          });
          return createRes;
        } catch (createErr: any) {
          throw createErr;
        }
      }
      throw err;
    }
  };

  const logout = async () => {
    if (user) {
      sendTelegramAlert('USER_LOGOUT', '🔒 User Logged Out', {
        'Email': user.email || 'N/A',
        'User UID': user.uid
      });
    }
    await signOut(auth);
  };

  const updateBalance = async (val: number | ((prev: number) => number)) => {
    setBalance(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (user) {
        updateDoc(doc(db, 'users', user.uid), { balance: next }).catch(err => console.error(err));
      }
      return next;
    });
  };

  const updateLiveBalance = async (val: number | ((prev: number) => number)) => {
    setLiveBalance(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (user) {
        updateDoc(doc(db, 'users', user.uid), { liveBalance: next }).catch(err => console.error(err));
      }
      return next;
    });
  };

  const addOpenPosition = async (pos: TradeOrder) => {
    sendTelegramAlert('TRADE_ORDER_OPENED', `📈 Trade Order Executed: ${pos.type} ${pos.symbol}`, {
      'User': user?.email || 'Guest / Demo Trader',
      'Symbol': pos.symbol,
      'Order Type': pos.type,
      'Volume (Lots)': pos.volume ?? 0.1,
      'Entry Price': pos.entryPrice ?? pos.currentPrice
    });

    if (!user) { setOpenPositions(prev => [...prev, pos]); return; }
    await setDoc(doc(db, `users/${user.uid}/openPositions`, pos.id), pos);
  };
  
  const updateOpenPositionFirebase = async (posId: string, updates: any) => {
     if (!user) return;
     await updateDoc(doc(db, `users/${user.uid}/openPositions`, posId), updates);
  };

  const removeOpenPosition = async (posId: string) => {
    if (!user) { setOpenPositions(prev => prev.filter(p => p.id !== posId)); return; }
    await deleteDoc(doc(db, `users/${user.uid}/openPositions`, posId));
  };

  const addClosedPosition = async (pos: ClosedPosition) => {
    const isProfit = (pos.profit ?? 0) >= 0;
    sendTelegramAlert('TRADE_ORDER_CLOSED', `📉 Position Closed: ${pos.symbol} (${isProfit ? '+' : ''}$${(pos.profit ?? 0).toFixed(2)})`, {
      'User': user?.email || 'Guest Trader',
      'Symbol': pos.symbol,
      'Type': pos.type,
      'Entry Price': pos.entryPrice,
      'Exit Price': pos.exitPrice,
      'P&L': `${isProfit ? '+' : ''}$${(pos.profit ?? 0).toFixed(2)}`
    });

    if (!user) { setClosedPositions(prev => [...prev, pos]); return; }
    await setDoc(doc(db, `users/${user.uid}/closedPositions`, pos.id), pos);
  };

  const addTransaction = async (tx: any) => {
    setTransactions(prev => [tx, ...prev.filter(t => t.id !== tx.id)]);
    
    // Notify Telegram on transaction (Deposit/Withdrawal) with detailed metadata
    const isDeposit = tx.type?.toLowerCase().includes('deposit');
    const isWithdraw = tx.type?.toLowerCase().includes('withdraw');
    const emoji = isDeposit ? '💳' : isWithdraw ? '💸' : '🔄';
    const typeHeader = isDeposit ? 'DEPOSIT_INITIATED' : isWithdraw ? 'WITHDRAWAL_REQUESTED' : 'TRANSACTION_RECORDED';
    const numAmount = Number(tx.amount || 0);

    sendTelegramAlert(
      typeHeader,
      `${emoji} ${isDeposit ? 'Deposit Request Initiated' : isWithdraw ? 'Withdrawal Payout Requested' : tx.type || 'Transaction'}: $${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
      {
        'Transaction ID': tx.id || `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        'User Email': user?.email || tx.userEmail || 'trader@axi.com',
        'User Name': user?.displayName || tx.user || (user?.email ? user.email.split('@')[0].toUpperCase() : 'Axi Trader'),
        'User UID': user?.uid || 'usr_8492',
        'Amount': `$${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
        'Payment Method': tx.method || 'Standard Gateway',
        'Status': tx.status || 'Pending Verification',
        'Account': tx.account || 'Live ECN Account (#8849201)',
        'Reference / Wallet': tx.refCode || tx.txHash || 'N/A',
        'Timestamp': new Date().toUTCString()
      }
    );

    if (user) {
      try {
        await setDoc(doc(db, `users/${user.uid}/transactions`, tx.id), tx);
      } catch (err) {
        console.error("Error saving transaction", err);
      }
    }
  };
  
  const updateTransactionStatus = async (txId: string, status: string) => {
    let targetTx = transactions.find(t => t.id === txId);
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status } : t));
    
    const isApproved = status === 'Approved' || status === 'Completed';
    const isRejected = status === 'Rejected' || status === 'Declined';
    const emoji = isApproved ? '✅' : isRejected ? '❌' : '📋';

    sendTelegramAlert('TRANSACTION_STATUS_UPDATED', `${emoji} Transaction Status Changed to: ${status}`, {
      'Transaction ID': txId,
      'New Status': status,
      'User Email': user?.email || targetTx?.userEmail || 'Axi Account Holder',
      'Amount': targetTx?.amount ? `$${Number(targetTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : 'N/A',
      'Type': targetTx?.type || 'Financial Transaction',
      'Payment Method': targetTx?.method || 'N/A',
      'Updated At': new Date().toUTCString()
    });

    if (user) {
      try {
        await updateDoc(doc(db, `users/${user.uid}/transactions`, txId), { status });
      } catch (err) {
        console.error("Error updating transaction status", err);
      }
    }
  };

  const addPriceAlert = async (alert: PriceAlert) => {
    sendTelegramAlert('PRICE_ALERT_CREATED', `🔔 Price Alert Set for ${alert.symbol}`, {
      'User': user?.email || 'Guest',
      'Symbol': alert.symbol,
      'Target Price': alert.targetPrice,
      'Condition': alert.condition
    });

    if (!user) { setPriceAlerts(prev => [...prev, alert]); return; }
    await setDoc(doc(db, `users/${user.uid}/priceAlerts`, alert.id), alert);
  };
  
  const removePriceAlert = async (alertId: string) => {
    if (!user) { setPriceAlerts(prev => prev.filter(p => p.id !== alertId)); return; }
    await deleteDoc(doc(db, `users/${user.uid}/priceAlerts`, alertId));
  };
  
  const updatePriceAlertFirebase = async (alertId: string, updates: any) => {
     if (!user) return;
     await updateDoc(doc(db, `users/${user.uid}/priceAlerts`, alertId), updates);
  };
  
  // Setters for local state when not authenticated so the app doesn't break
  const setOpenPositionsLocal = (val: any) => { setOpenPositions(val); };

  return {
    user, loading,
    balance, setBalance: updateBalance,
    liveBalance, setLiveBalance: updateLiveBalance,
    openPositions, addOpenPosition, removeOpenPosition, updateOpenPositionFirebase, setOpenPositions: setOpenPositionsLocal,
    closedPositions, addClosedPosition,
    transactions, addTransaction, updateTransactionStatus, setTransactions,
    priceAlerts, addPriceAlert, removePriceAlert, updatePriceAlertFirebase,
    loginWithGoogle, loginWithFacebook, loginWithEmail, logout
  };
}
