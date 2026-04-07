'use client';
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { useNumbersStore } from '@/store';
import { numbersApi } from '@/lib/api';
import { MessageSquare, Send, Shield, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface Message {
  id: string; from: string; to: string; body: string;
  direction: string; status: string; createdAt: string;
  aiClassification?: string; extractedOtp?: string; isSpam?: boolean;
}

export default function InboxPage() {
  const { numbers, setNumbers } = useNumbersStore();
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendBody, setSendBody] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    numbersApi.list().then((r) => {
      setNumbers(r.data);
      if (r.data.length) setSelectedNumberId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedNumberId) return;
    setLoading(true);
    api.get('/messages', { params: { phoneNumberId: selectedNumberId } })
      .then((r) => { setMessages(r.data); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedNumberId]);

  const selectedNumber = numbers.find((n) => n.id === selectedNumberId);

  const sendMessage = async () => {
    if (!sendBody.trim() || !sendTo.trim() || !selectedNumber) return;
    setSending(true);
    try {
      const r = await api.post('/messages', { to: sendTo, from: selectedNumber.number, body: sendBody });
      setMessages((m) => [...m, r.data]);
      setSendBody('');
    } catch { } finally { setSending(false); }
  };

  return (
    <div className="flex h-full gap-4 -m-6" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Number list sidebar */}
      <div className="w-52 border-r border-brand-border overflow-y-auto bg-brand-dark flex-shrink-0 p-3">
        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider px-2 mb-3">Numbers</p>
        {numbers.map((n) => (
          <button key={n.id} onClick={() => setSelectedNumberId(n.id)}
            className={clsx('w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1 transition-all', selectedNumberId === n.id ? 'bg-brand-green/10 text-brand-green' : 'text-brand-muted hover:text-white hover:bg-brand-card')}>
            <p className="font-mono font-medium text-xs">{n.number}</p>
            <p className="text-[10px] mt-0.5 opacity-70">{n.countryCode} · {n.status}</p>
          </button>
        ))}
        {numbers.length === 0 && (
          <p className="text-xs text-brand-muted px-2">No numbers yet</p>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        {selectedNumber ? (
          <>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-brand-border">
              <span className="font-mono font-semibold text-sm">{selectedNumber.number}</span>
              <span className="text-xs text-brand-muted">{selectedNumber.type}</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-5 h-5 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin"/>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-brand-muted">
                  <MessageSquare size={24} className="mb-2"/>
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={clsx('max-w-sm', m.direction === 'outbound' ? 'ml-auto' : '')}>
                    {m.isSpam && <p className="text-xs text-red-400 mb-1 flex items-center gap-1"><Shield size={10}/> Spam detected</p>}
                    {m.extractedOtp && (
                      <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl px-3 py-2 mb-1 flex items-center gap-2">
                        <Zap size={12} className="text-brand-green"/>
                        <span className="font-mono font-bold text-brand-green text-lg">{m.extractedOtp}</span>
                        <span className="text-xs text-brand-muted">OTP</span>
                      </div>
                    )}
                    <div className={clsx('rounded-2xl px-4 py-2.5 text-sm', m.direction === 'outbound' ? 'bg-brand-green/15 text-white' : 'bg-brand-card border border-brand-border')}>
                      {m.body}
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1 px-1">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</p>
                  </div>
                ))
              )}
              <div ref={bottomRef}/>
            </div>
            {/* Compose */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-3 space-y-2">
              <input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="Recipient number (+1...)" className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors font-mono"/>
              <div className="flex gap-2">
                <input value={sendBody} onChange={(e) => setSendBody(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"/>
                <button onClick={sendMessage} disabled={sending || !sendBody.trim()} className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity">
                  <Send size={14} className="text-black"/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-brand-muted">
            <MessageSquare size={36} className="mb-3"/>
            <p>Select a number to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}
