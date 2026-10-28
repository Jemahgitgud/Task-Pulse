import React, { useState, useEffect } from 'react';
import {
  X,
  Wifi,
  Radio,
  Copy,
  Check,
  QrCode,
  RotateCw,
  Smartphone,
  Laptop,
  ShieldCheck,
  Zap,
  ExternalLink,
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { P2PSyncStats } from '../types';

interface P2PSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: P2PSyncStats;
  onChangeRoom: (newRoom: string) => void;
  onSyncNow: () => void;
}

export const P2PSyncModal: React.FC<P2PSyncModalProps> = ({
  isOpen,
  onClose,
  stats,
  onChangeRoom,
  onSyncNow,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState(stats.roomId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'guide' | 'advanced'>('guide');

  const isConnected = stats.connectedPeersCount > 0;
  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareablePairLink = `${currentUrl}?room=${encodeURIComponent(stats.roomId)}`;

  // Generate QR code whenever pairing link changes
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(shareablePairLink, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR code generation error:', err));
  }, [shareablePairLink, isOpen]);

  useEffect(() => {
    setCustomRoomInput(stats.roomId);
  }, [stats.roomId]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareablePairLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(stats.roomId).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRoomInput.trim()) {
      onChangeRoom(customRoomInput.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Radio className="w-5 h-5 animate-pulse text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Sambungan Peranti · Device Link (P2P)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Direct WebRTC Browser Sync
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Status Pill */}
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : stats.state === 'connecting'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>
                {isConnected
                  ? `Tersambung (${stats.connectedPeersCount} Peranti Lain Bersedia)`
                  : 'Menunggu peranti kedua menyertai...'}
              </span>
            </div>

            {stats.pingMs !== undefined && isConnected && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>{stats.pingMs}ms latensi P2P</span>
              </span>
            )}
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Cara Sambung (3 Langkah)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'advanced'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kod Bilik & Diagnostik
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'guide' ? (
            <>
              {/* Visual 3-Step Walkthrough */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Buka Kamera Telefon & Imbas Kod QR
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Halakan kamera telefon anda ke kod QR di bawah dan buka pautan yang dipaparkan.
                    </p>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                  {qrDataUrl ? (
                    <div className="p-2.5 rounded-2xl bg-white shadow-md border border-slate-200 inline-block mb-3">
                      <img
                        src={qrDataUrl}
                        alt="Imbas Kod QR untuk Sambung"
                        className="w-44 h-44 object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center mb-3">
                      <QrCode className="w-10 h-10 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Imbas terus dengan Telefon Pintar anda
                    </span>
                    <p className="text-[10px] text-slate-500">
                      Tiada muat turun aplikasi atau log masuk diperlukan. Berfungsi pada Chrome, Safari & Edge.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Atau Masukkan Kod Bilik Segerak (Sync Code)
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 select-all tracking-wider">
                        {stats.roomId}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Disalin!' : 'Salin Kod'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                      Automatik Segerak Secara Langsung
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                      Sebaik sahaja kedua-dua peranti berada dalam bilik yang sama, sebarang tugasan yang ditambah, dipadam atau diselesaikan akan dikemaskini sepantas kilat antara komputer dan telefon!
                    </p>
                  </div>
                </div>
              </div>

              {/* 1-Tap Copy Full Link */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Pautan Berjaya Disalin!' : 'Salin Pautan Penuh Pasangan'}</span>
                </button>
                <button
                  type="button"
                  onClick={onSyncNow}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition shrink-0 flex items-center gap-1.5"
                  title="Segerak Manual Segera"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Segerak Sekarang</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Custom Room Configuration */}
              <form onSubmit={handleSaveRoom} className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                  Tukar Kod / Nama Bilik P2P
                </label>
                <p className="text-[11px] text-slate-500">
                  Pastikan kedua-dua peranti menggunakan nama bilik yang sama persis:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    placeholder="Contoh: RUMAH-2026 atau TASK-88"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase font-bold text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shrink-0"
                  >
                    Simpan Bilik
                  </button>
                </div>
              </form>

              {/* Technical Diagnostics */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Maklumat Saluran WebRTC (P2P Enkripsi)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">ID Peranti Tempatan</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate block mt-0.5">{stats.peerId}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Status Saluran Data</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 capitalize mt-0.5 block">{stats.channelReadyState || stats.state}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Paket Dihantar</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{stats.messagesSent || 0}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Paket Diterima</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{stats.messagesReceived || 0}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                  🔒 Data dihantar secara terus antara pelayar peranti tanpa melalui pangkalan data awan (zero-cloud storage), memastikan privasi 100% terjamin.
                </p>
              </div>
            </>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              {isConnected ? '🟢 Segerak aktif' : '🟡 Menunggu rakan peranti'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
