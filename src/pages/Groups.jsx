import { Users, Plus, ChevronRight } from 'lucide-react';

export default function Groups() {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-none">Groups</h1>
          <p className="text-on-surface-variant mt-2">Manage your shared expense groups.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all">
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-surface-container-lowest rounded-2xl p-16 text-center">
        <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users size={28} className="text-primary" />
        </div>
        <h3 className="text-xl font-headline font-bold text-on-surface mb-2">No groups yet</h3>
        <p className="text-on-surface-variant max-w-sm mx-auto mb-6">
          Create a group to quickly apply saved sets of roommates or friends to new splits.
        </p>
        <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
          Create your first group
        </button>
      </div>

      {/* Coming soon hint */}
      <div className="bg-surface-container rounded-xl p-5 flex items-center gap-4">
        <ChevronRight size={20} className="text-primary shrink-0" />
        <p className="text-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">Coming soon:</span> Group presets, member balances, and payment tracking.
        </p>
      </div>
    </div>
  );
}
