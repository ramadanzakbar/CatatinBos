'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Image as ImageIcon,
  Mic,
  Bot,
  Loader2,
  Sparkles,
  User,
  FileText,
  CheckCircle2,
  Lightbulb,
  PieChart,
  Target,
  X,
  ExternalLink,
  TrendingUp,
  CreditCard,
  Zap,
  Share2,
  Wallet,
  Plus,
  History,
  MessageSquare,
  Trash2,
  ChevronLeft
} from 'lucide-react';

export default function GemmaChatbot({ onTransactionAdded, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Halo! Saya **Gemma 4 AI Financial Planner & Personal Wealth Advisor** 💡\n\nSaya dapat membantu Anda:\n* **Mencatat Transaksi** otomatis & analisis struk belanja\n* **Analisis Kesehatan Keuangan** berbasis aturan *50/30/20*\n* **Menetapkan Pagu Anggaran** per kategori\n* **Proyeksi Cashflow** & target tabungan 6 bulan ke depan',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const timerRef = useRef(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSessions(data.data);
        if (!currentSessionId) {
          loadSession(data.data[0].id);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat sesi chat:', e.message);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      setLoading(true);
      setCurrentSessionId(sessionId);
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      const data = await res.json();
      if (data.success && data.data?.messages) {
        setMessages(data.data.messages);
      }
      setShowHistory(false);
    } catch (e) {
      console.warn('Gagal memuat detail sesi:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Sesi Chat Baru' }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSessions((prev) => [data.data, ...prev]);
        setCurrentSessionId(data.data.id);
        setMessages(data.data.messages || [
          {
            role: 'assistant',
            text: 'Halo! Saya **Gemma 4 AI Financial Planner & Personal Wealth Advisor** 💡\n\nSesi chat baru telah dibuat. Ada yang bisa saya bantu?',
          }
        ]);
      }
      setShowHistory(false);
    } catch (e) {
      console.warn('Gagal membuat sesi baru:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const updated = sessions.filter((s) => s.id !== sessionId);
        setSessions(updated);
        if (currentSessionId === sessionId) {
          if (updated.length > 0) {
            loadSession(updated[0].id);
          } else {
            handleCreateNewSession();
          }
        }
      }
    } catch (e) {
      console.warn('Gagal menghapus sesi:', e.message);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result.split(',')[1]); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setInput('Merekam suara...');
      timerRef.current = setTimeout(() => {
        setIsRecording(false);
        setInput('Catat makan siang Rp 45.000 di Kopi Kenangan');
      }, 3000);
    } else {
      setIsRecording(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const handleSendPrompt = async (promptText, imagePayload = selectedImage) => {
    const textToSend = promptText || input;
    if (!textToSend && !imagePayload) return;

    const userMsg = { role: 'user', text: textToSend, image: imagePayload };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const currentImg = imagePayload;
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          image: currentImg,
          sessionId: currentSessionId,
        }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.sessionId) setCurrentSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.reply,
            executedTools: data.executedTools || [],
          }
        ]);
        fetchSessions(); // Refresh list of session titles
        if (onTransactionAdded) onTransactionAdded();
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Gagal memproses pesan.' }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Terjadi kesalahan koneksi sistem.' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderToolIcon = (name) => {
    switch (name) {
      case 'add_transaction':
        return <CreditCard size={15} className="text-emerald-400" />;
      case 'split_bill':
        return <Share2 size={15} className="text-blue-400" />;
      case 'manage_savings_goal':
        return <Wallet size={15} className="text-amber-400" />;
      case 'set_budget_limit':
        return <PieChart size={15} className="text-indigo-400" />;
      case 'analyze_financial_health':
      case 'generate_cashflow_forecast':
        return <TrendingUp size={15} className="text-purple-400" />;
      default:
        return <Zap size={15} className="text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-xl relative">
      {/* Chat Header */}
      <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Gemma 4 AI Assistant
              <Sparkles size={13} className="text-amber-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Memory Context & History Active
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              showHistory
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
            }`}
            title="Riwayat Sesi Chat"
          >
            <History size={15} />
            <span className="hidden sm:inline">Riwayat Chat</span>
          </button>

          <button
            onClick={handleCreateNewSession}
            className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition border border-blue-500/40 text-xs font-medium flex items-center gap-1 shadow-md shadow-blue-500/20"
            title="Buat Sesi Chat Baru"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Sesi Baru</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700 xl:hidden"
              aria-label="Tutup Chat"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* History Drawer Overlay / Sidebar */}
      {showHistory && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-2xl flex flex-col animate-in fade-in slide-in-from-top duration-200">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <History size={18} className="text-indigo-400" />
              <span>Daftar Sesi Chat & Riwayat</span>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-3 border-b border-slate-800/80">
            <button
              onClick={handleCreateNewSession}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Plus size={16} />
              <span>Mulai Sesi Percakapan Baru</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">Belum ada riwayat sesi chat.</div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => loadSession(s.id)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                    currentSessionId === s.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-xl ${
                        currentSessionId === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <MessageSquare size={16} />
                    </div>
                    <div className="truncate">
                      <h4 className="font-semibold text-xs truncate">{s.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(s.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
                    title="Hapus Sesi"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex items-start space-x-2.5 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className="max-w-[88%] space-y-2">
              {/* Tool Execution Cards */}
              {m.executedTools && m.executedTools.length > 0 && (
                <div className="space-y-2">
                  {m.executedTools.map((tool, tIdx) => (
                    <div
                      key={tIdx}
                      className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-3 shadow-lg backdrop-blur-md transition hover:border-indigo-500/60"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            {renderToolIcon(tool.name)}
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-200 block">{tool.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Tool: {tool.name}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> SUCCESS
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-medium">{tool.summary}</p>

                      {tool.actionUrl && (
                        <a
                          href={tool.actionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition shadow-md shadow-emerald-600/20"
                        >
                          <span>{tool.actionLabel || 'Lihat / Bagikan'}</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Main Message Bubble */}
              <div
                className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md rounded-tr-xs'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 shadow-sm rounded-tl-xs'
                }`}
              >
                {m.image && (
                  <div className="mb-2.5 p-2 bg-black/20 rounded-xl flex items-center gap-2 text-[11px] text-blue-200 border border-white/10">
                    <FileText size={14} />
                    <span>Gambar Struk / Nota Terunggah</span>
                  </div>
                )}

                {m.role === 'user' ? (
                  <p className="whitespace-pre-line">{m.text}</p>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-white bg-indigo-500/20 px-1 py-0.5 rounded border border-indigo-500/30" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2 text-slate-200 pl-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2 text-slate-200 pl-1" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-normal" {...props} />,
                      a: ({ node, ...props }) => (
                        <a
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }) => (
                        <code
                          className="bg-slate-950 border border-slate-700/70 px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-300"
                          {...props}
                        />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-2.5 rounded-xl border border-slate-700">
                          <table className="w-full text-left text-[11px] border-collapse bg-slate-900" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => <th className="bg-slate-800 p-2 font-semibold text-slate-200 border-b border-slate-700" {...props} />,
                      td: ({ node, ...props }) => <td className="p-2 border-b border-slate-800 text-slate-300" {...props} />,
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs shrink-0">
              <Bot size={14} />
            </div>
            <div className="bg-slate-800/90 text-slate-300 border border-slate-700/60 rounded-2xl rounded-tl-xs p-3 text-xs flex items-center space-x-2.5">
              <Loader2 className="animate-spin text-blue-400" size={15} />
              <span className="animate-pulse">Gemma 4 menganalisis & memanggil Tool Calling...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-slate-300 text-[11px]">
        <button
          onClick={() => handleSendPrompt('Analisis kesehatan keuanganku dan alokasi 50/30/20')}
          className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-indigo-500/50 text-indigo-300 transition shrink-0"
        >
          <Lightbulb size={13} className="text-amber-400" />
          <span>Analisis Kesehatan</span>
        </button>

        <button
          onClick={() => handleSendPrompt('Atur pagu anggaran kategori Makanan sebesar 1.500.000')}
          className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-blue-500/50 text-blue-300 transition shrink-0"
        >
          <PieChart size={13} className="text-blue-400" />
          <span>Set Budget Makanan</span>
        </button>

        <button
          onClick={() => handleSendPrompt('Hitung proyeksi cash flow dan tabunganku untuk 6 bulan ke depan')}
          className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-emerald-500/50 text-emerald-300 transition shrink-0"
        >
          <Target size={13} className="text-emerald-400" />
          <span>Forecast 6 Bulan</span>
        </button>
      </div>

      {/* Upload Preview Badge */}
      {selectedImage && (
        <div className="px-4 py-2 bg-blue-950/40 border-t border-slate-800 flex items-center justify-between text-xs text-blue-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-blue-400" /> Struk siap diproses oleh Gemma AI
          </span>
          <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-white font-bold text-xs">
            Batal
          </button>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 bg-slate-800/50 border-t border-slate-800 flex items-center space-x-2">
        <label
          className="cursor-pointer p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
          title="Unggah Struk / Nota"
        >
          <ImageIcon size={18} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        <button
          onClick={handleVoiceRecord}
          className={`p-2 rounded-xl transition ${
            isRecording ? 'text-rose-400 bg-rose-500/20 animate-pulse' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
          }`}
          title="Bicara / Rekam Suara"
        >
          <Mic size={18} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(input)}
          placeholder="Tanya analisis atau catat transaksi (misal: Catat makan 35rb)..."
          className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
        />

        <button
          onClick={() => handleSendPrompt(input)}
          disabled={loading}
          className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
