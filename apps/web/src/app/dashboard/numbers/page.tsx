'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Clock, Phone, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { numbersApi } from '@/lib/api';
import { useNumbersStore } from '@/store';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'AU', name: 'Australia' },
];

const NUMBER_TYPES = [
  { value: 'verification', label: 'Verification', desc: 'One-time SMS or voice OTP' },
  { value: 'burner', label: 'Non-renewable rental', desc: 'Temporary 1-14 day access' },
  { value: 'rental', label: 'Renewable rental', desc: 'Monthly continuity and recovery' },
];

type AvailableNumber = {
  number: string;
};

export default function NumbersPage() {
  const { numbers, setNumbers, addNumber, removeNumber, loading, setLoading } = useNumbersStore();
  const [showModal, setShowModal] = useState(false);
  const [country, setCountry] = useState('US');
  const [type, setType] = useState('verification');
  const [available, setAvailable] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    numbersApi.list().then((r) => setNumbers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [setLoading, setNumbers]);

  const search = async () => {
    setSearching(true);
    try {
      const r = await numbersApi.search(country);
      setAvailable(r.data.slice(0, 6));
    } catch {
      toast.error('Number search failed');
    } finally {
      setSearching(false);
    }
  };

  const provision = async (phoneNumber: string) => {
    setProvisioning(phoneNumber);
    try {
      const r = await numbersApi.provision({
        phoneNumber,
        type,
        countryCode: country,
        idempotencyKey: crypto.randomUUID(),
      });
      addNumber(r.data);
      setShowModal(false);
      toast.success(`Number ${phoneNumber} provisioned`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Provisioning failed');
    } finally {
      setProvisioning(null);
    }
  };

  const release = async (id: string, number: string) => {
    if (!confirm(`Release ${number}? This cannot be undone.`)) return;
    try {
      await numbersApi.release(id);
      removeNumber(id);
      toast.success('Number released');
    } catch {
      toast.error('Failed to release number');
    }
  };

  const filteredNumbers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return numbers.filter((number) => {
      const matchesStatus = statusFilter === 'all' || number.status === statusFilter;
      const matchesType = typeFilter === 'all' || number.type === typeFilter;
      const matchesQuery = !normalized || [number.number, number.countryCode, number.type, number.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStatus && matchesType && matchesQuery;
    });
  }, [numbers, query, statusFilter, typeFilter]);

  const visibleTypes = useMemo(() => Array.from(new Set(numbers.map((number) => number.type).filter(Boolean))), [numbers]);
  const visibleStatuses = useMemo(() => Array.from(new Set(numbers.map((number) => number.status).filter(Boolean))), [numbers]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-green">Number control</p>
          <h1 className="mt-1 text-xl font-bold">Phone Numbers</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-muted">
            Real-number access for verification, rentals, and private conversation control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex min-h-11 items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-opacity-90"
        >
          <Plus size={15} />
          Get Number
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg border border-brand-border bg-brand-card" />)}
        </div>
      ) : numbers.length === 0 ? (
        <div className="rounded-lg border border-brand-border bg-brand-card p-12 text-center">
          <Phone size={32} className="mx-auto mb-4 text-brand-muted" />
          <h3 className="mb-1 font-semibold">No private numbers yet</h3>
          <p className="mb-4 text-sm text-brand-muted">Get your first number for verification or rental access.</p>
          <button type="button" onClick={() => setShowModal(true)} className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-black">
            Get Started
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-bp-lg border border-brand-border bg-brand-card p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <span className="sr-only">Search active numbers</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-green" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search number, country, type, or status"
                  className="bp-input pl-11"
                />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="bp-input lg:w-44" aria-label="Filter by number status">
                <option value="all">All statuses</option>
                {visibleStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="bp-input lg:w-52" aria-label="Filter by number type">
                <option value="all">All number types</option>
                {visibleTypes.map((numberType) => <option key={numberType} value={numberType}>{numberType}</option>)}
              </select>
            </div>
            <p className="mt-3 text-xs text-brand-muted">
              Showing {filteredNumbers.length} of {numbers.length} numbers across verification, rentals, and conversation workflows.
            </p>
          </div>

          <div className="grid gap-3">
          {filteredNumbers.map((n) => (
            <div key={n.id} className="flex items-center gap-4 rounded-lg border border-brand-border bg-brand-card p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-green/10">
                <Phone size={16} className="text-brand-green" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold">{n.number}</p>
                <div className="mt-0.5 flex items-center gap-3">
                  <span className="text-xs text-brand-muted">{n.countryCode} - {n.type}</span>
                  {n.expiresAt ? (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(n.expiresAt), { addSuffix: true })}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${n.status === 'active' ? 'bg-brand-green/15 text-brand-green' : 'bg-brand-border text-brand-muted'}`}>
                  {n.status}
                </span>
                <button type="button" onClick={() => release(n.id, n.number)} className="p-1 text-brand-muted transition-colors hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredNumbers.length === 0 ? (
            <div className="rounded-bp-lg border border-brand-border bg-brand-card p-8 text-center">
              <Search size={24} className="mx-auto text-brand-muted" />
              <p className="mt-3 text-sm text-brand-muted">No numbers match the current filters.</p>
            </div>
          ) : null}
          </div>
        </div>
      )}

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020806]/70 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-lg border border-brand-border bg-brand-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Get a private number</h2>
            <p className="mb-5 mt-1 text-sm leading-6 text-brand-muted">Choose the country and lifecycle that match your privacy need.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs text-brand-muted">Country</label>
                <div className="grid grid-cols-3 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCountry(c.code)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${country === c.code ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-brand-border text-brand-muted hover:border-brand-muted'}`}
                    >
                      <span className="font-mono text-sm font-semibold">{c.code}</span>
                      <span className="mt-0.5 block truncate text-xs">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs text-brand-muted">Number Type</label>
                <div className="space-y-2">
                  {NUMBER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${type === t.value ? 'border-brand-green bg-brand-green/10' : 'border-brand-border hover:border-brand-muted'}`}
                    >
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-brand-muted">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={search}
                disabled={searching}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border py-3 text-sm transition-all hover:border-brand-green hover:text-brand-green disabled:opacity-50"
              >
                {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                {searching ? 'Searching...' : 'Search Available Numbers'}
              </button>

              {available.length > 0 ? (
                <div className="space-y-2">
                  {available.map((n) => (
                    <button
                      key={n.number}
                      type="button"
                      onClick={() => provision(n.number)}
                      disabled={!!provisioning}
                      className="flex w-full items-center justify-between rounded-lg border border-brand-border px-4 py-3 transition-all hover:border-brand-green hover:bg-brand-green/5 disabled:opacity-50"
                    >
                      <span className="font-mono text-sm">{n.number}</span>
                      <span className="text-xs text-brand-green">{provisioning === n.number ? 'Provisioning...' : 'Select'}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
