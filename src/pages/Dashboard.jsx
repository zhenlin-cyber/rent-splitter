import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard({ savedSplits = [] }) {
  const totalSplits = savedSplits.length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-none">Dashboard</h1>
        <p className="text-on-surface-variant mt-2">Your financial overview at a glance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Splits', value: totalSplits, icon: Receipt2, color: 'text-primary', bg: 'bg-primary-fixed' },
          { label: 'Active Groups', value: 0, icon: Users2, color: 'text-secondary', bg: 'bg-secondary-container' },
          { label: 'Pending', value: 0, icon: Clock, color: 'text-on-surface-variant', bg: 'bg-surface-container' },
          { label: 'Settled', value: 0, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary-fixed' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-3xl font-headline font-black text-on-surface">{value}</p>
            <p className="text-sm text-on-surface-variant font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent splits */}
      <div>
        <h2 className="text-xl font-headline font-bold text-on-surface mb-4">Recent Splits</h2>
        {savedSplits.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
            <TrendingUp size={40} className="mx-auto text-on-surface-variant/30 mb-3" />
            <p className="text-on-surface-variant font-medium">No splits yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedSplits.slice(0, 5).map(split => (
              <div key={split.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold text-on-surface">{split.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{split.date} · {split.category}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-fixed text-primary">{split.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Receipt2({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>
    </svg>
  );
}
function Users2({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
