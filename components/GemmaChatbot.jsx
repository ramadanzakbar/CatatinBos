'use client';
import { useState } from 'react';
import { Send, Image as ImageIcon, Bot, Loader2, Sparkles, User, FileText, CheckCircle2, Lightbulb, PieChart, Target, X } from 'lucide-react';

export default function GemmaChatbot({ onTransactionAdded, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Halo! Saya Gemma 4 AI Financial Planner & Personal Wealth Advisor 💡\n\nSaya tidak hanya mencatat transaksi atau membaca struk belanja, tetapi juga dapat menganalisis kesehatan keuangan Anda berbasis aturan 50/30/20, menetapkan pagu anggaran, dan memproyeksikan saldo tabungan.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
        body: JSON.stringify({ message: userMsg.text, image: currentImg }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Chat Header */}
      <div className="p-4 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Gemma 4 AI Assistant
              <Sparkles size={13} className="text-amber-400" />
            </h3>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autonomous Tool Calling Active
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700 lg:hidden"
            aria-label="Tutup Chat"
          >
            <X size={18} />
          </button>
        )}
      </div>

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

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md rounded-tr-xs'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 shadow-sm rounded-tl-xs'
              }`}
            >
              {m.image && (
                <div className="mb-2 p-2 bg-black/20 rounded-xl flex items-center gap-2 text-[11px] text-blue-200 border border-white/10">
                  <FileText size={14} />
                  <span>Gambar Struk / Nota Terunggah</span>
                </div>
              )}
              <p className="whitespace-pre-line">{m.text}</p>
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
          className="cursor-pointer p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-blue-400 transition border border-transparent hover:border-slate-700"
          title="Unggah Struk / Nota"
        >
          <ImageIcon size={18} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(input)}
          placeholder="Tanya analisis atau catat transaksi (misal: Catat makan 35rb)..."
          className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
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
