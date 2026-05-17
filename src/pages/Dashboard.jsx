import { TrendingUp, Clock, CheckCircle, Users, Receipt, ArrowRight, CircleDollarSign } from 'lucide-react';

export default function Dashboard({ savedSplits = [], groups = [], onNavigate, onToggleStatus }) {
  const totalSplits = savedSplits.length;
  const settledCount = savedSplits.filter(s => s.status === 'settled').length;
  const pendingCount = savedSplits.filter(s => s.status !== 'settled').length;
  const activeGroups = groups.length;

  const totalAmount = savedSplits.reduce((sum, split) => {
    const t = split.total ?? split.expenses?.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) ?? 0;
    return sum + t;
  }, 0);

  const pendingAmount = savedSplits
    .filter(s => s.status !== 'settled')
    .reduce((sum, split) => {
      const t = split.total ?? split.expenses?.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) ?? 0;
      return sum + t;
    }, 0);

  const recentSplits = savedSplits.slice(0, 5);

  const currency = savedSplits[0]?.currency ?? '$';

  const fmt = (n) => `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-none">Dashboard</h1>
        <p className="text-on-surface-variant mt-2">Your financial overview at a glance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={CircleDollarSign} label="Total Tracked" value={fmt(totalAmount)} iconColor="text-primary" bg="bg-primary-fixed" />
        <StatCard icon={Receipt} label="Total Splits" value={totalSplits} iconColor="text-primary" bg="bg-primary-fixed" />
        <StatCard icon={Clock} label="Pending" value={pendingCount} sub={pendingAmount > 0 ? fmt(pendingAmount) : null} iconColor="text-on-surface-variant" bg="bg-surface-container" />
        <StatCard icon={CheckCircle} label="Settled" value={settledCount} iconColor="text-primary" bg="bg-primary-fixed" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent splits */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-headline font-bold text-on-surface">Recent Splits</h2>
            {totalSplits > 0 && (
              <button onClick={() => onNavigate('splits')} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </button>
            )}
          </div>

          {recentSplits.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
              <TrendingUp size={40} className="mx-auto text-on-surface-variant/30 mb-3" />
              <p className="text-on-surface-variant font-medium mb-4">No splits yet. Create one to get started.</p>
              <button
                onClick={() => onNavigate('calculator')}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Create your first split
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSplits.map(split => {
                const amount = split.total ?? split.expenses?.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0) ?? 0;
                const settled = split.status === 'settled';
                return (
                  <div key={split.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${settled ? 'bg-primary-fixed' : 'bg-surface-container'}`}>
                        <Receipt size={16} className={settled ? 'text-primary' : 'text-on-surface-variant'} />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{split.name}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{split.date} · {split.category} · {split.roommates?.length ?? 0} people</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-bold text-on-surface">{fmt(amount)}</p>
                      <button
                        onClick={() => onToggleStatus(split.id)}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
                          settled
                            ? 'bg-primary-fixed text-primary hover:bg-primary hover:text-white'
                            : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed hover:text-primary'
                        }`}
                      >
                        {settled ? 'Settled' : 'Pending'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Groups sidebar */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-headline font-bold text-on-surface">Groups</h2>
            <button onClick={() => onNavigate('groups')} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
              <Users size={32} className="mx-auto text-on-surface-variant/30 mb-3" />
              <p className="text-sm text-on-surface-variant font-medium mb-4">No groups yet.</p>
              <button
                onClick={() => onNavigate('groups')}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                Create a group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <div key={group.id} className="bg-surface-container-lowest rounded-xl px-4 py-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-on-surface text-sm">{group.name}</p>
                      <p className="text-xs text-on-surface-variant">{group.members?.length ?? 0} members</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconColor, bg }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon size={20} className={iconColor} />
      </div>
      <p className="text-3xl font-headline font-black text-on-surface">{value}</p>
      {sub && <p className="text-sm font-semibold text-on-surface-variant">{sub}</p>}
      <p className="text-sm text-on-surface-variant font-medium mt-1">{label}</p>
    </div>
  );
}
