'use client';
import { useEffect, useState } from 'react';
import { numbersApi } from '@/lib/api';
import { useNumbersStore } from '@/store';
import toast from 'react-hot-toast';
import { Phone, Plus, Trash2, RefreshCw, Globe, Clock, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
];

const NUMBER_TYPES = [
  { value: 'burner', label: 'Burner (24h)', desc: 'Single-day use' },
  { value: 'rental', label: 'Rental (30d)', desc: 'Monthly rental' },
  { value: 'verification', label: 'Verification', desc: 'One-time OTP' },
];

export default function NumbersPage() {
  const { numbers, setNumbers, addNumber, removeNumber, loading, setLoading } = useNumbersStore();
  const [showModal, setShowModal] = useState(false);
  const [country, setCountry] = useState('US');
  const [type, setType] = useState('burner');
  const [available, setAvailable] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    numbersApi.list().then((r) => setNumbers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const search = async () => {
    setSearching(true);
    try {
      const r = await numbersApi.search(country);
      setAvailable(r.data.slice(0, 6));
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const provision = async (phoneNumber: string) => {
    setProvisioning(phoneNumber);
    try {
      const r = await numbersApi.provision({ phoneNumber, type, countryCode: country });
      addNumber(r.data);
      setShowModal(false);
      toast.success(`Number ${phoneNumber} provisioned!`);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Provision failed'); }
    finally { setProvisioning(null); }
  };

  const release = async (id: string, number: string) => {
    if (!confirm(`Release ${number}? This cannot be undone.`)) return;
    try {
      await numbersApi.release(id);
      removeNumber(id);
      toast.success('Number released');
    } catch { toast.error('Failed to release'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Phone Numbers</h1>
          <p className="text-sm text-brand-muted mt-0.5">{numbers.length} number{numbers.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-green text-black text-sm font-semibold px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all">
          <Plus size={15}/> Get Number
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-brand-card border border-brand-border rounded-2xl animate-pulse"/>)}
        </div>
      ) : numbers.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center">
          <Phone size={32} className="text-brand-muted mx-auto mb-4"/>
          <h3 className="font-semibold mb-1">No numbers yet</h3>
          <p className="text-brand-muted text-sm mb-4">Get your first private phone number</p>
          <button onClick={() => setShowModal(true)} className="bg-brand-green text-black text-sm font-semibold px-4 py-2 rounded-xl">
            Get Started
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {numbers.map((n) => (
            <div key={n.id} className="bg-brand-card border border-brand-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-brand-green"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-sm">{n.number}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-brand-muted">{n.countryCode} · {n.type}</span>
                  {n.expiresAt && (
                    <span className="text-xs text-yellow-400 flex items-center gap-1">
                      <Clock size={10}/>
                      {formatDistanceToNow(new Date(n.expiresAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${n.status === 'active' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-border text-brand-muted'}`}>
                  {n.status}
                </span>
                <button onClick={() => release(n.id, n.number)} className="text-brand-muted hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-5">Get a Number</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-brand-muted mb-2">Country</label>
                <div className="grid grid-cols-3 gap-2">
                  {COUNTRIES.map((c) => (
                    <button key={c.code} onClick={() => setCountry(c.code)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${country === c.code ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-brand-border text-brand-muted hover:border-brand-muted'}`}>
                      <span className="text-base">{c.flag}</span>
                      <span className="block text-xs mt-0.5">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-2">Number Type</label>
                <div className="space-y-2">
                  {NUMBER_TYPES.map((t) => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${type === t.value ? 'border-brand-green bg-brand-green/10' : 'border-brand-border hover:border-brand-muted'}`}>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-brand-muted">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={search} disabled={searching}
                className="w-full flex items-center justify-center gap-2 border border-brand-border rounded-xl py-3 text-sm hover:border-brand-green hover:text-brand-green transition-all disabled:opacity-50">
                {searching ? <RefreshCw size={14} className="animate-spin"/> : <Search size={14}/>}
                {searching ? 'Searching...' : 'Search Available Numbers'}
              </button>
              {available.length > 0 && (
                <div className="space-y-2">
                  {available.map((n) => (
                    <button key={n.number} onClick={() => provision(n.number)} disabled={!!provisioning}
                      className="w-full flex items-center justify-between px-4 py-3 border border-brand-border rounded-xl hover:border-brand-green hover:bg-brand-green/5 transition-all disabled:opacity-50">
                      <span className="font-mono text-sm">{n.number}</span>
                      <span className="text-xs text-brand-green">{provisioning === n.number ? 'Provisioning...' : 'Select →'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
