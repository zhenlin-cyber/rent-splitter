import { LayoutDashboard, Receipt, Users, Settings, Plus, Wallet } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'splits',    label: 'Splits',    icon: Receipt },
  { id: 'groups',    label: 'Groups',    icon: Users },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function SideNav({ view, onNavigate }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-low flex flex-col py-8 px-5 justify-between z-50 shadow-[1px_0_0_0_#c7c4d7]">
      <div className="flex flex-col gap-8">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-headline font-bold text-primary leading-tight">FairShare</h2>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Balanced Ledger</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = view === id || (id === 'splits' && view === 'calculator');
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left w-full
                  ${active
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
              >
                <Icon size={20} className={active ? 'text-primary' : ''} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* New Split CTA */}
      <button
        onClick={() => onNavigate('calculator')}
        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
        aria-label="New Split"
      >
        <Plus size={18} />
        New Split
      </button>
    </aside>
  );
}
