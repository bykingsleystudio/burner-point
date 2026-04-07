'use client';
import { useEffect, useState } from 'react';
import { developerApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

export default function ApiPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    developerApi.keys().then((r) => setKeys(r.data)).finally(() => setLoading(false));
  }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const r = await developerApi.createKey({ name: newKeyName, scopes: ['read', 'write'] });
      setKeys((k) => [...k, r.data]);
      setRevealedKey(r.data.rawKey);
      setNewKeyName('');
      toast.success('API key created! Copy it now — it won\'t be shown again.');
    } catch { toast.error('Failed to create key'); }
    finally { setCreating(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm('Revoke this key?')) return;
    await developerApi.revokeKey(id);
    setKeys((k) => k.filter((key) => key.id !== id));
    toast.success('Key revoked');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">API Keys</h1>
        <p className="text-sm text-brand-muted mt-1">Build with BurnerPoint. Base URL: <code className="font-mono text-brand-green">{process.env.NEXT_PUBLIC_API_URL}</code></p>
      </div>

      {revealedKey && (
        <div className="bg-brand-green/10 border border-brand-green/30 rounded-2xl p-4">
          <p className="text-xs font-semibold text-brand-green mb-2">Your new API key (copy now — shown once):</p>
          <div className="flex items-center gap-2">
            <code className="font-mono text-xs bg-brand-black px-3 py-2 rounded-xl flex-1 overflow-auto">{revealedKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success('Copied!'); }}
              className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors">
              <Copy size={14}/>
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. Production)" onKeyDown={(e) => e.key === 'Enter' && createKey()}
          className="flex-1 bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-sm placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"/>
        <button onClick={createKey} disabled={creating || !newKeyName.trim()}
          className="flex items-center gap-2 bg-brand-green text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all">
          <Plus size={14}/> Create
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-brand-card border border-brand-border rounded-xl animate-pulse"/>)}</div>
      ) : keys.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center text-brand-muted">
          <Key size={24} className="mx-auto mb-2"/>
          <p className="text-sm">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="bg-brand-card border border-brand-border rounded-xl px-4 py-3 flex items-center gap-3">
              <Key size={14} className="text-brand-muted flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{k.name}</p>
                <p className="font-mono text-xs text-brand-muted">{k.keyPrefix}••••••••</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <span>{k.usageCount} calls</span>
              </div>
              <button onClick={() => revoke(k.id)} className="text-brand-muted hover:text-red-400 transition-colors p-1">
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
