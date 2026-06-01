import { useState } from 'react';
import { Users, Plus, Trash2, ArrowRight, X, UserPlus, Pencil, CheckCheck } from 'lucide-react';

function GroupModal({ title, initial, onSave, onClose, saving, saved }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [members, setMembers] = useState(
    initial?.members?.length ? [...initial.members] : [{ name: '', sqFt: 100, percentage: 0 }]
  );

  const addMember = () => setMembers(prev => [...prev, { name: '', sqFt: 100, percentage: 0 }]);
  const removeMember = (i) => setMembers(prev => prev.filter((_, idx) => idx !== i));
  const updateMember = (i, field, value) =>
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const canSave = name.trim() && members.some(m => m.name.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/30">
          <h3 className="font-headline font-bold text-lg text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Apartment 3B"
              className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-on-surface">Members</label>
              <button
                onClick={addMember}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <UserPlus size={14} /> Add Member
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Sq Ft</div>
                <div className="col-span-3">%</div>
                <div className="col-span-1" />
              </div>

              {members.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={m.name}
                      onChange={e => updateMember(i, 'name', e.target.value)}
                      placeholder={`Person ${i + 1}`}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={m.sqFt}
                      onChange={e => updateMember(i, 'sqFt', e.target.value)}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={m.percentage}
                      onChange={e => updateMember(i, 'percentage', e.target.value)}
                      className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeMember(i)}
                      disabled={members.length === 1}
                      className="text-on-surface-variant/40 hover:text-error disabled:opacity-20 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/30 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, members)}
            disabled={saving || !canSave}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-50
              ${saved
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-emerald-50'
                : 'bg-primary text-white shadow-primary/20 hover:bg-primary/90'
              }`}
          >
            {saving
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Saving…</span>
              : saved
                ? <span className="flex items-center gap-2"><CheckCheck size={15} /> Saved!</span>
                : title
            }
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Groups({ groups = [], onCreate, onUpdate, onDelete, onLoad }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);

  const [editingGroup, setEditingGroup] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved] = useState(false);

  const handleCreate = async (name, members) => {
    setCreateSaving(true);
    await onCreate(name, members.filter(m => m.name.trim()).map(m => ({
      name: m.name.trim(), sqFt: parseFloat(m.sqFt) || 100, percentage: parseFloat(m.percentage) || 0,
    })));
    setCreateSaving(false);
    setCreateOpen(false);
  };

  const handleUpdate = async (name, members) => {
    if (!editingGroup) return;
    setEditSaving(true);
    await onUpdate(editingGroup.id, name, members.filter(m => m.name.trim()).map(m => ({
      name: m.name.trim(), sqFt: parseFloat(m.sqFt) || 100, percentage: parseFloat(m.percentage) || 0,
    })));
    setEditSaving(false);
    setEditSaved(true);
    setTimeout(() => { setEditSaved(false); setEditingGroup(null); }, 1200);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-none">Groups</h1>
          <p className="text-on-surface-variant mt-2">Save roommate presets for quick splits.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <Plus size={16} /> Create Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-primary" />
          </div>
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2">No groups yet</h3>
          <p className="text-on-surface-variant max-w-sm mx-auto mb-6">
            Create a group to quickly load a saved set of roommates into the calculator.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            Create your first group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map(group => (
            <div key={group.id} className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center shrink-0">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-on-surface">{group.name}</h3>
                    <p className="text-xs text-on-surface-variant">{group.members?.length ?? 0} members</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingGroup(group); setEditSaved(false); }}
                    className="p-1.5 text-on-surface-variant/50 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    aria-label="Edit group"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(group.id)}
                    className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                    aria-label="Delete group"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(group.members ?? []).map((m, i) => (
                  <span key={i} className="text-xs font-semibold bg-surface-container text-on-surface-variant px-3 py-1 rounded-full">
                    {m.name}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onLoad(group)}
                className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container transition-all"
              >
                Use in Calculator <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <GroupModal
          title="Create Group"
          onSave={handleCreate}
          onClose={() => setCreateOpen(false)}
          saving={createSaving}
          saved={false}
        />
      )}

      {editingGroup && (
        <GroupModal
          title="Update Group"
          initial={editingGroup}
          onSave={handleUpdate}
          onClose={() => setEditingGroup(null)}
          saving={editSaving}
          saved={editSaved}
        />
      )}
    </div>
  );
}
