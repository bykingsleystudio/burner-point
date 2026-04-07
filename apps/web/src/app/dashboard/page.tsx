'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import api from '@/lib/api';
import { Phone, MessageSquare, CreditCard, TrendingUp, Shield, Zap, Globe, Lock } from 'lucide-react';

interface Stats { totalNumbers: number; totalMessages: number; walletBalanceKobo: number; activeNumbers: number; }

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalNumbers: 0, totalMessages: 0, walletBalanceKobo: 0, activeNumbers: 0 });

  useEffect(() => {
    Promise.all([api.get('/numbers'), api.get('/users/me/wallet')])
      .then(([numbersRes, walletRes]) => {
        const numbers = numbersRes.data;
        setStats({
          totalNumbers: numbers.length,
          activeNumbers: numbers.filter((n: any) => n.status === 'active').length,
          totalMessages: numbers.reduce((sum: number, n: any) => sum + n.smsReceived, 0),
          walletBalanceKobo: walletRes.data.balanceKobo,
        });
      }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Active Numbers', value: stats.activeNumbers, icon: Phone, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { label: 'Messages Received', value: stats.totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Wallet Balance', value: `₦${(stats.walletBalanceKobo / 100).toLocaleString()}`, icon: CreditCard, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Total Numbers', value: stats.totalNumbers, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  const features = [
    { icon: Shield, title: 'End-to-end Privacy', desc: 'Your real identity is never exposed' },
    { icon: Zap, title: 'Instant OTP', desc: 'AI extracts OTPs in under 1 second' },
    { icon: Globe, title: 'Global Numbers', desc: 'US, UK, NG, CA, AU and more' },
    { icon: Lock, title: 'Zero Logs', desc: 'We never store your messages' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Good {getGreeting()}, <span className="text-brand-green">{user?.firstName}</span> 👋
        </h1>
        <p className="text-brand-muted text-sm mt-1">Here's your privacy dashboard overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-brand-card border border-brand-border rounded-2xl p-4">
            <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon size={16} className={card.color}/>
            </div>
            <p className="text-2xl font-bold mb-0.5">{card.value}</p>
            <p className="text-xs text-brand-muted">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/numbers', label: 'Get a number', icon: Phone },
            { href: '/dashboard/verification', label: 'Quick verify', icon: Shield },
            { href: '/dashboard/credits', label: 'Add credits', icon: CreditCard },
            { href: '/dashboard/inbox', label: 'View inbox', icon: MessageSquare },
          ].map((a) => (
            <a key={a.href} href={a.href}
              className="bg-brand-card border border-brand-border rounded-xl p-4 flex items-center gap-3 hover:border-brand-green/40 hover:bg-brand-green/5 transition-all group">
              <div className="w-8 h-8 bg-brand-dark rounded-lg flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                <a.icon size={14} className="text-brand-muted group-hover:text-brand-green transition-colors"/>
              </div>
              <span className="text-sm font-medium">{a.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Why BurnerPoint</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-7 h-7 bg-brand-green/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon size={13} className="text-brand-green"/>
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-brand-muted mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
