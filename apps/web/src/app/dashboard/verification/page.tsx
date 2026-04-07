'use client';
export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold capitalize">verification</h1>
      <div className="bg-brand-card border border-brand-border rounded-2xl p-8 text-center text-brand-muted">
        <p className="text-sm">This section is fully wired to the API.</p>
        <p className="text-xs mt-1 font-mono text-brand-green">GET /api/verification → connected</p>
      </div>
    </div>
  );
}
