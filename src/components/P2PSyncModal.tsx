import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Copy,
  Check,
  QrCode,
  RotateCw,
  ShieldCheck,
  Zap,
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
  const currentUrl =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const shareablePairLink = `${currentUrl}?room=${encodeURIComponent(stats.roomId)}`;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center safe-modal-overlay bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-auto safe-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                  Multi-Device Sync (P2P)
                </span>
                <h3 className="text-base font-bold text-white">
                  Pair Phone & Computer
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-2 font-semibold ${
                isConnected ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>
                {isConnected
                  ? `Connected (${stats.connectedPeersCount} ${
                      stats.connectedPeersCount === 1 ? 'device' : 'devices'
                    } online)`
                  : 'Waiting for another device to join...'}
              </span>
            </span>

            {stats.pingMs !== undefined && isConnected && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 tabular-nums">
                <Zap className="w-3.5 h-3.5" />
                <span>{stats.pingMs}ms</span>
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Scan QR / Pair
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
            Room Code & Status
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'guide' ? (
            <>
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
                {qrDataUrl ? (
                  <div className="p-2.5 rounded-2xl bg-white shadow-sm border border-slate-200 inline-block mb-3">
                    <img
                      src={qrDataUrl}
                      alt="Scan QR code to pair device"
                      className="w-40 h-40 object-contain rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <QrCode className="w-10 h-10 text-slate-400" />
                  </div>
                )}

                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Scan with your phone camera to open the same task list
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  No sign-in required. Changes sync automatically across browsers in the same room.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Current Room Code
                  </span>
                  <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 select-all">
                    {stats.roomId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 min-h-[40px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Pairing Link Copied' : 'Copy Pairing Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={onSyncNow}
                  className="min-h-[40px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold transition shrink-0 flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <form
                onSubmit={handleSaveRoom}
                className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px] block">
                  Custom Room Code
                </label>
                <p className="text-[11px] text-slate-500">
                  Enter the exact same room code on both devices to link them:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    placeholder="e.g. HOME-2026"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase font-bold text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shrink-0"
                  >
                    Save Room
                  </button>
                </div>
              </form>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Connection Details</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Device ID
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                      {stats.peerId}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Channel State
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 capitalize mt-0.5 block">
                      {stats.channelReadyState || stats.state}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Messages Sent
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block tabular-nums">
                      {stats.messagesSent || 0}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Messages Received
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block tabular-nums">
                      {stats.messagesReceived || 0}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
