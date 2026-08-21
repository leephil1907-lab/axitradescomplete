import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Check, 
  Send, 
  X, 
  Sparkles, 
  Volume2, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Tag,
  Share2,
  Bookmark
} from 'lucide-react';

export interface VoiceNote {
  id: string;
  title: string;
  transcript: string;
  category: 'Trading Note' | 'Support Request' | 'Market Analysis' | 'General';
  createdAt: string;
  durationSeconds: number;
  audioUrl?: string;
}

interface VoiceNoteRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSubmitSupportTicket?: (ticket: { topic: string; priority: string; message: string }) => void;
  savedNotes?: VoiceNote[];
  onSaveNote?: (note: VoiceNote) => void;
  onDeleteNote?: (id: string) => void;
  initialCategory?: 'Trading Note' | 'Support Request' | 'Market Analysis' | 'General';
  initialText?: string;
}

export default function VoiceNoteRecorderModal({
  isOpen,
  onClose,
  showToast,
  onSubmitSupportTicket,
  savedNotes = [],
  onSaveNote,
  onDeleteNote,
  initialCategory = 'Trading Note',
  initialText = ''
}: VoiceNoteRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [noteTitle, setNoteTitle] = useState('');
  const [category, setCategory] = useState<'Trading Note' | 'Support Request' | 'Market Analysis' | 'General'>(initialCategory);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');
  const [webSpeechSupported, setWebSpeechSupported] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [audioVolume, setAudioVolume] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check Web Speech API browser availability on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWebSpeechSupported(false);
    }
  }, []);

  // Update initial text if provided
  useEffect(() => {
    if (initialText && !transcript) {
      setTranscript(initialText);
    }
  }, [initialText]);

  // Clean up timer and media recorders on unmount or close
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  const stopAllMedia = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }
  };

  const startRecording = async () => {
    setMicPermissionDenied(false);
    setTranscript('');
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    // 1. Request microphone stream for audio recording & audio visualization waveform
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup AudioContext for live volume visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioVolume(avg);
          animFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (e) {
        console.warn('Audio visualization not supported', e);
      }

      // Setup MediaRecorder for audio playback
      try {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
      } catch (e) {
        console.warn('MediaRecorder error', e);
      }

    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      setMicPermissionDenied(true);
      if (showToast) {
        showToast('Microphone access required for speech recording.', 'error');
      }
    }

    // 2. Setup Web Speech API Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript((finalTranscript + interimTranscript).trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          // Restart if still marked recording
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }
        };

        recognition.start();
      } catch (e) {
        console.error('Speech Recognition start error:', e);
      }
    }

    setIsRecording(true);
    setIsPaused(false);

    // Start Recording Timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    if (showToast) {
      showToast('🎙️ Voice recording started. Speak clearly into your microphone.', 'info');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }

    if (showToast && transcript) {
      showToast('✅ Speech transcribed to text successfully!', 'success');
    }
  };

  const handleCopyText = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    if (showToast) showToast('Transcribed text copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAsNote = () => {
    if (!transcript.trim()) {
      if (showToast) showToast('Please record or type some speech content before saving.', 'error');
      return;
    }

    const title = noteTitle.trim() || `${category} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    const newNote: VoiceNote = {
      id: `NOTE-${Date.now()}`,
      title,
      transcript: transcript.trim(),
      category,
      createdAt: new Date().toLocaleString(),
      durationSeconds: recordingTime,
      audioUrl: audioUrl || undefined
    };

    if (onSaveNote) {
      onSaveNote(newNote);
    }

    if (showToast) showToast(`📝 Note "${title}" saved to Voice Notebook!`, 'success');

    setNoteTitle('');
    setActiveTab('history');
  };

  const handleSubmitAsSupport = () => {
    if (!transcript.trim()) {
      if (showToast) showToast('Please dictate your support request message before submitting.', 'error');
      return;
    }

    if (onSubmitSupportTicket) {
      onSubmitSupportTicket({
        topic: category === 'Support Request' ? 'Technical MetaTrader Help' : 'General Inquiry',
        priority: 'Normal',
        message: transcript.trim()
      });
      if (showToast) showToast('🚀 Voice support ticket submitted directly to Axi Helpdesk!', 'success');
      onClose();
    } else {
      if (showToast) showToast('Support ticket system initialized with voice details.', 'info');
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isRecording ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30'}`}>
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-100">Voice Note & Speech-to-Text Dictation</h3>
                  <span className="bg-emerald-950 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-800/60 uppercase">
                    Web Speech API
                  </span>
                </div>
                <p className="text-xs text-slate-400">Record voice notes, market analysis, or dictate support requests in real-time.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3">
            <button
              onClick={() => setActiveTab('record')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'record'
                  ? 'border-brand-yellow text-brand-yellow'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> Live Dictation
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'border-brand-yellow text-brand-yellow'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" /> Saved Voice Notes ({savedNotes.length})
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
            {activeTab === 'record' && (
              <div className="space-y-5">
                {/* Microphone Recording Console */}
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4 relative overflow-hidden">
                  
                  {/* Visualizer Wave & Timer */}
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="relative">
                      {/* Live Volume Pulsing Ring */}
                      {isRecording && (
                        <div 
                          className="absolute inset-0 rounded-full bg-red-500/20 blur-md transition-all duration-75"
                          style={{ transform: `scale(${1 + Math.min(audioVolume / 80, 0.8)})` }}
                        />
                      )}

                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                          isRecording 
                            ? 'bg-red-500 text-white hover:bg-red-600 scale-105 shadow-red-500/30' 
                            : 'bg-brand-yellow text-slate-950 hover:bg-yellow-400 hover:scale-105 shadow-amber-500/20'
                        }`}
                      >
                        {isRecording ? (
                          <Square className="w-8 h-8 fill-current" />
                        ) : (
                          <Mic className="w-8 h-8" />
                        )}
                      </button>
                    </div>

                    <div>
                      <div className="text-2xl font-mono font-black tracking-wider text-slate-100">
                        {formatTime(recordingTime)}
                      </div>
                      <p className="text-xs font-semibold text-slate-400 mt-1">
                        {isRecording ? (
                          <span className="text-red-400 flex items-center justify-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Recording audio... Speak into microphone
                          </span>
                        ) : (
                          <span>Click the microphone button to start voice dictation</span>
                        )}
                      </p>
                    </div>

                    {/* Audio Volume Meters Bar */}
                    {isRecording && (
                      <div className="flex items-center gap-1 h-6 pt-1">
                        {[...Array(16)].map((_, idx) => {
                          const heightFactor = Math.max(15, Math.sin(idx + Date.now() / 200) * 100 * (audioVolume / 100));
                          return (
                            <div
                              key={idx}
                              className="w-1.5 bg-red-500 rounded-full transition-all duration-100"
                              style={{ height: `${Math.min(100, Math.max(20, heightFactor))}%` }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Audio Playback Element if recorded */}
                  {audioUrl && !isRecording && (
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-3">
                      <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-brand-yellow" /> Playback Recording:
                      </span>
                      <audio src={audioUrl} controls className="h-8 max-w-xs" />
                    </div>
                  )}

                  {micPermissionDenied && (
                    <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2 text-left">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Microphone Access Blocked:</strong> Please allow microphone permissions in your browser header address bar to enable live speech-to-text recording.
                      </div>
                    </div>
                  )}
                </div>

                {/* Transcribed Text Editor Area */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-yellow" /> Transcribed Speech Content
                    </label>

                    {transcript && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyText}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied' : 'Copy Text'}
                        </button>

                        <button
                          onClick={() => setTranscript('')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <textarea
                    rows={5}
                    placeholder="Your spoken words will appear here automatically as you talk... Or type manually to edit."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-yellow text-slate-100 text-xs sm:text-sm rounded-xl p-3.5 focus:outline-none font-sans leading-relaxed"
                  />
                </div>

                {/* Note Parameters & Action Buttons */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Note Title (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Gold Scalping Strategy / MT5 Deposit Query"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-brand-yellow"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 mb-1 block">Category Tag</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-brand-yellow cursor-pointer"
                      >
                        <option value="Trading Note">Trading Note</option>
                        <option value="Support Request">Support Request</option>
                        <option value="Market Analysis">Market Analysis</option>
                        <option value="General">General Note</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={handleSaveAsNote}
                      disabled={!transcript.trim()}
                      className="w-full sm:w-1/2 bg-brand-yellow text-slate-950 hover:bg-yellow-400 font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
                    >
                      <Bookmark className="w-4 h-4" /> Save to Voice Notebook
                    </button>

                    <button
                      onClick={handleSubmitAsSupport}
                      disabled={!transcript.trim()}
                      className="w-full sm:w-1/2 bg-red-600 text-white hover:bg-red-500 font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" /> Submit as Support Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {savedNotes.length === 0 ? (
                  <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800">
                    <Mic className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-300">No Voice Notes Saved Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Record speech using the Live Dictation tab above to create instant trading logs, analysis, or support queries.
                    </p>
                    <button
                      onClick={() => setActiveTab('record')}
                      className="px-4 py-2 bg-brand-yellow text-slate-950 font-bold text-xs rounded-lg hover:bg-yellow-400"
                    >
                      Record Your First Note
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{note.title}</span>
                            <span className="bg-slate-800 text-brand-yellow text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {note.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {note.createdAt}
                            </span>

                            {onDeleteNote && (
                              <button
                                onClick={() => onDeleteNote(note.id)}
                                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 whitespace-pre-wrap leading-relaxed">
                          "{note.transcript}"
                        </p>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          {note.audioUrl ? (
                            <audio src={note.audioUrl} controls className="h-6 max-w-xs" />
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Speech duration: {formatTime(note.durationSeconds || 0)}
                            </span>
                          )}

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(note.transcript);
                              if (showToast) showToast('Note copied to clipboard!', 'success');
                            }}
                            className="text-brand-yellow hover:underline text-xs font-bold flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy Text
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-yellow" /> Powered by HTML5 Web Speech Recognition
            </span>
            <button onClick={onClose} className="hover:text-slate-300 font-bold transition-colors">
              Close Window
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
