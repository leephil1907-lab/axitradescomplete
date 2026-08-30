import { useState, useEffect } from 'react';
import { safeStorage } from '../utils/storage';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, deleteDoc } from 'firebase/firestore';
import { TradeOrder, ClosedPosition, PriceAlert, UserPaymentMethod, KYCStatus } from '../types';
import { sendTelegramAlert } from '../utils/telegram';

export function useFirebaseData() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Account Ledger & State (Empty defaults: $0.00)
  const [balance, setBalance] = useState<number>(0);
  const [liveBalance, setLiveBalance] = useState<number>(0);
  const [kycStatus, setKycStatus] = useState<KYCStatus>('NOT_STARTED');
  const [openPositions, setOpenPositions] = useState<TradeOrder[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethod[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['BTCUSD', 'EURUSD', 'XAUUSD', 'AAPL']);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Init or load user doc
        const userRef = doc(db, 'users', currentUser.uid);
        
        const unsubUser = onSnapshot(userRef, async (docSnap) => {
          let currLiveBal = 0;
          let currPracticeBal = 0;
          let currKyc: KYCStatus = 'NOT_STARTED';

          if (docSnap.exists()) {
            const data = docSnap.data();
            currPracticeBal = data.balance ?? 0;
            currLiveBal = data.liveBalance ?? 0;
            currKyc = data.kycStatus || 'NOT_STARTED';
            setBalance(currPracticeBal);
            setLiveBalance(currLiveBal);
            setKycStatus(currKyc);
          } else {
            try {
              const displayName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Trader');
              await setDoc(userRef, {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName,
                photoURL: currentUser.photoURL || '',
                providerId: currentUser.providerData[0]?.providerId || 'email',
                balance: 0, // Clean ledger: starting at $0.00
                liveBalance: 0, // Clean live ledger: starting at $0.00
                kycStatus: 'NOT_STARTED',
                createdAt: Date.now()
              });
              setBalance(0);
              setLiveBalance(0);
              setKycStatus('NOT_STARTED');

              // Dispatch Telegram alert for new account registration
              sendTelegramAlert('NEW_USER_REGISTRATION', '🎉 New User Registered on Axi Portal', {
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

          // Update record on Admin Dashboard with real KYC status and live balances
          try {
            const savedStr = safeStorage.getItem('axi_registered_users');
            let userList: any[] = [];
            if (savedStr) {
              try { userList = JSON.parse(savedStr); } catch (e) {}
            }

            const email = currentUser.email || '';
            const name = currentUser.displayName || (email ? email.split('@')[0].toUpperCase() : 'Trader');
            const existingIndex = userList.findIndex(item => item.id === currentUser.uid || (email && item.email === email));

            const updatedUserObj = {
              id: currentUser.uid,
              name: name,
              email: email,
              status: currKyc === 'VERIFIED' ? 'Verified' : currKyc === 'PENDING' ? 'Under Review' : 'Unverified',
              kycStatus: currKyc,
              balance: currLiveBal,
              demoBalance: currPracticeBal,
              registeredAt: existingIndex >= 0 && userList[existingIndex].registeredAt ? userList[existingIndex].registeredAt : new Date().toISOString().replace('T', ' ').substring(0, 16),
              lastActive: 'Active Now (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC)',
              provider: currentUser.providerData[0]?.providerId || 'Email/Password',
              accountNo: existingIndex >= 0 && userList[existingIndex].accountNo ? userList[existingIndex].accountNo : `AXI-MT5-${currentUser.uid.substring(0, 6).toUpperCase()}`,
              accountType: 'Standard ECN Account',
              leverage: '1:500',
              country: 'International'
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

        const paymentMethodsRef = collection(db, `users/${currentUser.uid}/paymentMethods`);
        const unsubPaymentMethods = onSnapshot(paymentMethodsRef, (snapshot) => {
          const methods: UserPaymentMethod[] = [];
          snapshot.forEach((doc) => methods.push(doc.data() as UserPaymentMethod));
          setPaymentMethods(methods);
        });

        const watchlistRef = collection(db, `users/${currentUser.uid}/watchlist`);
        const unsubWatchlist = onSnapshot(watchlistRef, (snapshot) => {
          const symbols: string[] = [];
          snapshot.forEach((doc) => symbols.push(doc.id));
          if (symbols.length > 0) {
            setWatchlist(symbols);
          }
        });

        setLoading(false);
        return () => {
          unsubUser(); unsubOpenPos(); unsubClosedPos(); unsubTrans(); unsubAlerts(); unsubPaymentMethods(); unsubWatchlist();
        };
      } else {
        setBalance(0); setLiveBalance(0); setKycStatus('NOT_STARTED');
        setOpenPositions([]); setClosedPositions([]); setTransactions([]); setPriceAlerts([]); setPaymentMethods([]);
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
      const res = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
      sendTelegramAlert('USER_LOGIN', '🔓 User Signed In via Email/Password', {
        'Email': email.trim().toLowerCase(),
        'User UID': res.user.uid
      });
      return res;
    } catch (err: any) {
      // A failed login is a failed login. Never auto-register or mutate the account.
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

  // Real KYC Submission Workflow
  const submitKYCApplication = async (docType: string, fileName: string, fileDataUrl?: string) => {
    if (!user) return;
    const submissionId = `KYC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Set user doc to PENDING
    setKycStatus('PENDING');
    await updateDoc(doc(db, 'users', user.uid), { kycStatus: 'PENDING' });

    // Store in kyc_submissions collection
    const kycRecord = {
      id: submissionId,
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || 'Trader',
      docType,
      fileName,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      fileDataUrl: fileDataUrl || null
    };

    await setDoc(doc(db, 'kyc_submissions', submissionId), kycRecord);

    sendTelegramAlert('KYC_SUBMISSION_RECEIVED', `📋 New KYC Document Submitted by ${user.email}`, {
      'Submission ID': submissionId,
      'User': user.email || 'N/A',
      'Document Type': docType,
      'File Name': fileName,
      'Status': 'PENDING_ADMIN_AUDIT'
    });
  };

  // Payment Methods Subcollection Management
  const addPaymentMethod = async (method: Omit<UserPaymentMethod, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const methodId = `PM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newMethod: UserPaymentMethod = {
      ...method,
      id: methodId,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, `users/${user.uid}/paymentMethods`, methodId), newMethod);
    setPaymentMethods(prev => [newMethod, ...prev]);

    sendTelegramAlert('PAYMENT_METHOD_ADDED', `💳 User Saved Payment Method: ${newMethod.title}`, {
      'User': user.email || 'N/A',
      'Type': newMethod.type,
      'Title': newMethod.title
    });
  };

  const removePaymentMethod = async (methodId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/paymentMethods`, methodId));
    setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
  };

  // Watchlist Management
  const toggleWatchlist = async (symbol: string) => {
    if (!user) {
      setWatchlist(prev => prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]);
      return;
    }
    const isPresent = watchlist.includes(symbol);
    const watchlistDocRef = doc(db, `users/${user.uid}/watchlist`, symbol);
    if (isPresent) {
      await deleteDoc(watchlistDocRef);
      setWatchlist(prev => prev.filter(s => s !== symbol));
    } else {
      await setDoc(watchlistDocRef, { symbol, addedAt: new Date().toISOString() });
      setWatchlist(prev => [...prev, symbol]);
    }
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
        'Account': tx.account || 'Live ECN Account',
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
  
  const setOpenPositionsLocal = (val: any) => { setOpenPositions(val); };

  return {
    user, loading,
    balance, setBalance: updateBalance,
    liveBalance, setLiveBalance: updateLiveBalance,
    kycStatus, submitKYCApplication,
    paymentMethods, addPaymentMethod, removePaymentMethod,
    watchlist, toggleWatchlist,
    openPositions, addOpenPosition, removeOpenPosition, updateOpenPositionFirebase, setOpenPositions: setOpenPositionsLocal,
    closedPositions, addClosedPosition,
    transactions, addTransaction, updateTransactionStatus, setTransactions,
    priceAlerts, addPriceAlert, removePriceAlert, updatePriceAlertFirebase,
    loginWithGoogle, loginWithFacebook, loginWithEmail, logout
  };
}
