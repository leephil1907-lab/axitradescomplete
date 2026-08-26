import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, CheckCheck, Minimize2, Sparkles, Headset, ShieldCheck, ExternalLink, Mic, MicOff, Star, UserCheck, RefreshCw, MessageCircle } from 'lucide-react';
import { ViewType } from '../types';
import { openTawkToChat } from '../utils/tawkto';

interface Message {
  id: string;
  sender: 'bot' | 'user' | 'admin';
  text: string;
  time: string;
  actions?: { label: string; action: () => void }[];
}

interface FloatingLiveSupportWidgetProps {
  setView: (view: ViewType) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AXI_BOT_LOGO = (
  <div className="w-8 h-8 rounded-xl bg-[#E3000F] flex items-center justify-center text-white font-black text-xs shadow-md tracking-tighter">
    axi<span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] ml-0.5" />
  </div>
);

export default function FloatingLiveSupportWidget({ setView, showToast }: FloatingLiveSupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [isListening, setIsListening] = useState(false);
  
  // Admin Transfer & Live Chat State
  const [isTransferredToAdmin, setIsTransferredToAdmin] = useState(false);
  const [adminConnected, setAdminConnected] = useState(false);
  
  // Post-chat rating survey
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Welcome to Axi Official Client Desk. 👋 I am your 24/7 Axi Desk Assistant. How can I assist with your trading account today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Listen for admin replies from Admin Dashboard via localStorage event
  useEffect(() => {
    const handleAdminReply = (e: any) => {
      const savedAdminMsg = localStorage.getItem('axi_latest_admin_chat_reply');
      if (savedAdminMsg) {
        try {
          const parsed = JSON.parse(savedAdminMsg);
          setMessages(prev => [...prev, {
            id: `admin-${Date.now()}`,
            sender: 'admin',
            text: parsed.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          setAdminConnected(true);
          if (!isOpen || isMinimized) {
            setUnreadCount(prev => prev + 1);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('axi_admin_reply_event', handleAdminReply);
    return () => window.removeEventListener('axi_admin_reply_event', handleAdminReply);
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (showToast) showToast('Web Speech API is not supported in this browser.', 'error');
      return;
    }

    if (isListening) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        speechRecognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let startText = inputText ? inputText + ' ' : '';

        recognition.onresult = (event: any) => {
          let currentSpeech = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentSpeech += event.results[i][0].transcript;
          }
          setInputText((startText + currentSpeech).trim());
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
        setIsListening(true);
        if (showToast) showToast('🎙️ Voice dictation active... Speak now.', 'info');
      } catch (e) {
        if (showToast) showToast('Microphone permission denied.', 'error');
      }
    }
  };

  const triggerTransferToAdmin = () => {
    setIsTransferredToAdmin(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user transfer message
    const transferMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: '🎧 Requesting Transfer to Live Admin Desk Specialist',
      time
    };

    const botAckMsg: Message = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: '🔄 Alert dispatched! Transfer request broadcasted to Admin Control Panel & Live Chat Desk. A Senior Compliance Admin is joining your session shortly.',
      time
    };

    setMessages(prev => [...prev, transferMsg, botAckMsg]);

    // Dispatch event to local storage for Admin Dashboard to pick up
    const transferPayload = {
      id: `chat_session_${Date.now()}`,
      user: 'Trader Client #8849',
      email: 'trader@axi.com',
      requestedAt: new Date().toLocaleTimeString(),
      messages: [...messages, transferMsg, botAckMsg]
    };
    localStorage.setItem('axi_active_chat_transfer', JSON.stringify(transferPayload));
    window.dispatchEvent(new Event('axi_chat_transfer_event'));

    if (showToast) showToast('🎧 Live Admin Transfer alert sent to Admin Dashboard!', 'success');
  };

  const handleQuickOptionClick = (optionLabel: string, replyText: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: optionLabel,
      time
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText.trim();
    setInputText('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time
    };

    setMessages(prev => [...prev, userMsg]);

    // If transferred to admin, broadcast user message to admin
    if (isTransferredToAdmin) {
      const chatPayload = {
        id: `chat_session_latest`,
        user: 'Trader Client #8849',
        email: 'trader@axi.com',
        text: query,
        time
      };
      localStorage.setItem('axi_user_latest_chat_message', JSON.stringify(chatPayload));
      window.dispatchEvent(new Event('axi_user_chat_message_event'));
    }

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      
      let answer = getBotResponse(query);
      if (query.toLowerCase().includes('admin') || query.toLowerCase().includes('agent') || query.toLowerCase().includes('human')) {
        triggerTransferToAdmin();
        return;
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  const getBotResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('kyc') || q.includes('verify') || q.includes('document')) {
      return '📄 KYC Verification: Documents are auto-audited in 15–30 mins. Upload your ID or Utility bill under Settings → KYC Verification tab for instant verified badge.';
    }

    if (q.includes('deposit') || q.includes('fund') || q.includes('card') || q.includes('wire')) {
      return '💳 Deposit & Cashier: We support Debit Cards, Bank Wire, Skrill, and Crypto deposits at 0% fees. Navigate to Funds view to initiate a secure deposit.';
    }

    if (q.includes('withdraw') || q.includes('payout')) {
      return '🏧 Withdrawals: Disbursals process within 1–24 hours to your verified account under strict regulation.';
    }

    if (q.includes('select') || q.includes('prop')) {
      return '🚀 Axi Select: Qualified traders get up to $1,000,000 in capital allocation with a 90% profit share and zero registration fees!';
    }

    return `Thank you for reaching out! Regarding "${query}", our desk team is monitoring all account operations 24/7. Click "Transfer to Admin" below if you require direct support.`;
  };

  const handleEndChatSession = () => {
    setShowRatingPrompt(true);
  };

  const handleSubmitRating = () => {
    setRatingSubmitted(true);
    setTimeout(() => {
      setShowRatingPrompt(false);
      setRatingSubmitted(false);
      setRating(0);
      setFeedbackText('');
      setIsOpen(false);
      if (showToast) showToast('🌟 Thank you for rating your Axi support experience!', 'success');
    }, 1800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      
      {/* Trigger Button when Closed or Minimized */}
      {(!isOpen || isMinimized) && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setUnreadCount(0);
          }}
          className="bg-slate-900 hover:bg-black text-white p-3.5 rounded-full shadow-2xl flex items-center gap-3 border-2 border-slate-700 cursor-pointer relative group"
        >
          <div className="relative">
            {AXI_BOT_LOGO}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>

          <div className="hidden sm:flex flex-col text-left pr-1">
            <span className="text-xs font-black uppercase tracking-wider text-white">Axi Support Desk</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 24/7 Live Online
            </span>
          </div>

          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-brand-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="w-[360px] sm:w-[410px] h-[550px] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white mb-2 relative"
          >
            {/* Header */}
            <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E3000F] flex items-center justify-center text-white font-black text-sm shadow-md tracking-tighter border border-emerald-500/50">
                    axi<span className="w-1.5 h-1.5 rounded-full bg-[#FFCC00] ml-0.5" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm uppercase tracking-tight text-white">Axi Live Desk</h4>
                    <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                      {adminConnected ? 'Admin Connected' : isTransferredToAdmin ? 'Admin Dispatched' : 'AI & Human Ready'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">FCA & ASIC Regulated • Official Support</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleEndChatSession}
                  className="p-1.5 text-xs text-amber-400 hover:bg-slate-800 rounded-lg transition font-bold"
                  title="End Chat & Rate Experience"
                >
                  End Chat
                </button>
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Option Buttons Toolbar */}
            <div className="bg-slate-950/80 p-2 border-b border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  const opened = openTawkToChat();
                  if (opened && showToast) {
                    showToast('💬 Launching Tawk.to Live Support Desk...', 'info');
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black border border-emerald-400/60 px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1 shadow-sm"
              >
                <MessageCircle className="w-3 h-3 text-white" /> Tawk.to Live Agent
              </button>

              <button
                onClick={() => handleQuickOptionClick('💳 Deposit & Cashier Help', 'Deposit methods reflect instantly. Click Funds in the sidebar to deposit via debit card, wire, or crypto.')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0"
              >
                💳 Deposit Help
              </button>

              <button
                onClick={() => handleQuickOptionClick('📄 KYC Verification Status', 'KYC approvals process within 15 mins. Upload passport/utility bill in Settings -> KYC tab.')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0"
              >
                📄 KYC Status
              </button>

              <button
                onClick={() => handleQuickOptionClick('💸 Withdrawal Inquiry', 'Withdrawals are audited and released within 1-24 hours under strict regulatory compliance.')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition cursor-pointer shrink-0"
              >
                💸 Withdrawals
              </button>

              <button
                onClick={triggerTransferToAdmin}
                className="bg-brand-red hover:bg-brand-red-hover text-white border border-brand-red/50 px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
              >
                <Headset className="w-3 h-3 text-white" /> Transfer to Admin
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/95 text-xs">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                    <span className="font-bold">
                      {msg.sender === 'user' ? 'You' : msg.sender === 'admin' ? '🛡️ Compliance Admin' : 'Axi Desk Assistant'}
                    </span>
                    <span>• {msg.time}</span>
                  </div>

                  <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-red text-white rounded-tr-none font-medium shadow-md'
                      : msg.sender === 'admin'
                      ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-100 rounded-tl-none shadow-md'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-[11px] bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 w-fit">
                  <Bot className="w-4 h-4 text-brand-red animate-pulse" />
                  <span>Axi Specialist is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-500/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isListening ? 'Stop Dictation' : 'Speech-to-Text Voice Dictation'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-brand-yellow" />}
              </button>

              <input 
                type="text"
                placeholder={isListening ? "🎙️ Dictating..." : "Type your message or click an option above..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-brand-red rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-brand-red hover:bg-brand-red-hover disabled:opacity-40 text-white p-2.5 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Footer Trust Bar */}
            <div className="bg-slate-950 px-3 py-1.5 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> SSL 256-bit Encrypted
              </span>
              <button 
                onClick={triggerTransferToAdmin} 
                className="text-slate-400 hover:text-white font-bold underline"
              >
                Admin Desk Active
              </button>
            </div>

            {/* Post-Chat Rating Modal Overlay */}
            <AnimatePresence>
              {showRatingPrompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-6 flex flex-col items-center justify-center text-center"
                >
                  {!ratingSubmitted ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                        <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                      </div>

                      <h3 className="text-base font-black text-white">Rate Your Support Session</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        How satisfied were you with Axi Client Desk support today?
                      </p>

                      {/* Interactive 5 Stars */}
                      <div className="flex items-center gap-2 my-4">
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                          <button
                            key={starIndex}
                            type="button"
                            onClick={() => setRating(starIndex)}
                            className="p-1 hover:scale-125 transition cursor-pointer"
                          >
                            <Star
                              className={`w-7 h-7 ${
                                starIndex <= rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Optional feedback or comments..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-400 resize-none h-20"
                      />

                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={handleSubmitRating}
                          disabled={rating === 0}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer"
                        >
                          Submit Rating
                        </button>
                        <button
                          onClick={() => setShowRatingPrompt(false)}
                          className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                        <CheckCheck className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-base font-black text-white">Thank You!</h3>
                      <p className="text-xs text-slate-300">Your feedback helps us continuously improve Axi Client Desk.</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
