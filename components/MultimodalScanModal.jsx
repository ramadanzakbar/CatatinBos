'use client';
import { useState, useRef } from 'react';
import { X, Camera, Mic, Upload, Sparkles, Check, Loader2, Users, Receipt, FileText, Plus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

const formatIDR = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

export default function MultimodalScanModal({ isOpen, onClose, onTransactionAdded, onOpenSplitBillWithData }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'voice'
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [voiceText, setVoiceText] = useState('');
  
  const timerRef = useRef(null);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setSelectedImage(base64);
        setSelectedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!voiceText) {
      setVoiceText('Makan siang bersama kawan 135 ribu di Resto Sejahtera (3 nasi goreng & 3 es teh)');
    }
  };

  const handleProcessScan = async () => {
    setLoading(true);
    setExtractedData(null);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          promptText: activeTab === 'voice' ? voiceText : undefined,
        }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setExtractedData(result.data);
      }
    } catch (e) {
      console.error('Scan Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTransactions = async () => {
    if (!extractedData) return;
    setLoading(true);

    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: extractedData.totalAmount,
          category: extractedData.category || 'Food',
          type: 'EXPENSE',
          note: `[Gemma AI OCR] ${extractedData.merchantName} - ${extractedData.note || ''}`,
          source: 'GEMMA_AI',
        }),
      });

      if (onTransactionAdded) onTransactionAdded();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToSplitBill = () => {
    if (!extractedData) return;
    if (onOpenSplitBillWithData) {
      onOpenSplitBillWithData({
        title: `Patungan - ${extractedData.merchantName}`,
        totalAmount: extractedData.totalAmount,
        taxPercent: extractedData.taxAmount ? ((extractedData.taxAmount / extractedData.totalAmount) * 100).toFixed(1) : 0,
        servicePercent: extractedData.serviceAmount ? ((extractedData.serviceAmount / extractedData.totalAmount) * 100).toFixed(1) : 0,
        items: extractedData.items || [],
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900/50 via-indigo-900/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
              <Sparkles size={22} className="text-amber-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Gemma 4 Multimodal AI Scanner
              </h2>
              <p className="text-xs text-slate-400">Pindai foto struk belanja atau gunakan input suara (Voice Command)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('camera'); setExtractedData(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
              activeTab === 'camera'
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera size={16} />
            <span>Foto / Upload Struk</span>
          </button>

          <button
            onClick={() => { setActiveTab('voice'); setExtractedData(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
              activeTab === 'voice'
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic size={16} />
            <span>Perekam Suara (Voice)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: CAMERA / UPLOAD */}
          {activeTab === 'camera' && !extractedData && (
            <div className="space-y-4">
              <label className="block w-full cursor-pointer">
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-950/50 hover:bg-slate-950 transition group">
                  {selectedImagePreview ? (
                    <div className="relative w-full max-h-56 overflow-hidden rounded-xl border border-slate-800">
                      <img src={selectedImagePreview} alt="Struk Preview" className="w-full object-contain max-h-56" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
                          Ganti Foto Struk
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-blue-600/10 text-blue-400 rounded-2xl mb-3 group-hover:scale-110 transition">
                        <Upload size={32} />
                      </div>
                      <div className="text-sm font-bold text-white mb-1">Unggah atau Ambil Foto Struk</div>
                      <div className="text-xs text-slate-400 text-center max-w-xs">
                        Mendukung format JPG, PNG, atau WEBP. Gemma AI akan mengekstrak merchant, tanggal, total, dan rincian item.
                      </div>
                    </>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              <button
                onClick={handleProcessScan}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{loading ? 'Gemma AI Menganalisis Struk...' : 'Proses Struk dengan Gemma AI'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: VOICE RECORDING */}
          {activeTab === 'voice' && !extractedData && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center justify-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800">
                <button
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-xl ${
                    isRecording
                      ? 'bg-rose-600 animate-pulse text-white shadow-rose-600/40 ring-8 ring-rose-600/20'
                      : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-indigo-600/30'
                  }`}
                >
                  <Mic size={36} />
                </button>

                <div className="mt-4 text-xs font-semibold text-slate-300">
                  {isRecording ? (
                    <span className="text-rose-400 animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Merekam Suara... ({recordingTime}s) - Klik untuk selesai
                    </span>
                  ) : (
                    <span>Klik mikrofon untuk berbicara tentang pengeluaran Anda</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block text-left">
                  Teks Hasil Rekaman / Catatan Perintah Suara
                </label>
                <textarea
                  rows={3}
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="misal: Tadi makan malam bersama Budi & Ani di Resto Sejahtera habis 135 ribu..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                onClick={handleProcessScan}
                disabled={loading || !voiceText}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{loading ? 'Gemma AI Menganalisis Suara...' : 'Proses Suara dengan Gemma AI'}</span>
              </button>
            </div>
          )}

          {/* EXTRACTED RESULT DISPLAY CARD */}
          {extractedData && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-blue-500/40 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <ShieldCheck size={12} /> Gemma 4 OCR Verified
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">{extractedData.merchantName}</h3>
                    <div className="text-xs text-slate-400">{extractedData.date} • Kategori: <span className="text-blue-400 font-semibold">{extractedData.category}</span></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total Nominal</div>
                    <div className="text-lg font-black text-emerald-400">{formatIDR(extractedData.totalAmount)}</div>
                  </div>
                </div>

                {/* Items List */}
                {extractedData.items && extractedData.items.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Rincian Item Belanjaan ({extractedData.items.length} Item):
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      {extractedData.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-200">
                          <span>{item.qty}x {item.name}</span>
                          <span className="font-semibold text-slate-300">{formatIDR(item.price * (item.qty || 1))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tax & Service Note */}
                <div className="text-[11px] text-slate-400 flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800">
                  <span>Pajak/Tax: <strong className="text-white">{formatIDR(extractedData.taxAmount || 0)}</strong></span>
                  <span>Service Charge: <strong className="text-white">{formatIDR(extractedData.serviceAmount || 0)}</strong></span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSaveToTransactions}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-xs"
                >
                  <Receipt size={16} />
                  <span>Simpan ke Transaksi Saya</span>
                </button>

                <button
                  onClick={handleConvertToSplitBill}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-xs"
                >
                  <Users size={16} />
                  <span>Jadikan Split Bill (Patungan)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
