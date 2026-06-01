import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { calculateSplit } from '../utils/calculateSplit.js';
import { Wallet, Users, DollarSign, Home, Utensils, Plane, Box, AlertTriangle, Plus } from 'lucide-react';

function getCategoryColor(cat) {
  switch (cat) {
    case 'Rent':   return 'bg-primary/10 text-primary';
    case 'Food':   return 'bg-orange-100 text-orange-600';
    case 'Travel': return 'bg-sky-100 text-sky-600';
    default:       return 'bg-surface-container text-on-surface-variant';
  }
}

function getCategoryIcon(cat) {
  switch (cat) {
    case 'Rent':   return <Home size={15} />;
    case 'Food':   return <Utensils size={15} />;
    case 'Travel': return <Plane size={15} />;
    default:       return <Box size={15} />;
  }
}

export default function SharedSplit() {
  const { shareId } = useParams();
  const [split, setSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!db) { setError('App not configured.'); setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'shared', shareId));
        if (!snap.exists()) setError('This split was not found or has been removed.');
        else setSplit(snap.data());
      } catch (err) {
        console.error(err);
        setError('Failed to load split. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [shareId]);

  const results = useMemo(() => {
    if (!split) return [];
    return calculateSplit(split.expenses || [], split.roommates || []);
  }, [split]);

  const totalCost = useMemo(() => {
    if (!split) return 0;
    return (split.expenses || []).reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  }, [split]);

  const currency = split?.currency || '$';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-on-surface-variant">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading split…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant p-8 max-w-md w-full text-center space-y-4">
          <div className="bg-error-container p-3 rounded-full w-fit mx-auto">
            <AlertTriangle size={28} className="text-error" />
          </div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Split Not Found</h2>
          <p className="text-on-surface-variant text-sm">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Plus size={16} /> Open FairShare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Header */}
      <header className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
              <Wallet size={18} className="text-on-primary" />
            </div>
            <div>
              <h1 className="text-sm font-headline font-bold text-primary leading-tight">FairShare</h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Shared split · read-only</p>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
          >
            Open app →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {/* Split meta card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">{split.name}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">{split.date}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${getCategoryColor(split.category)}`}>
              {getCategoryIcon(split.category)}
              {split.category || 'Other'}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5"><Users size={14} /> {(split.roommates || []).length} people</span>
            <span className="text-outline-variant">·</span>
            <span className="flex items-center gap-1.5"><DollarSign size={14} /> {currency}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total</span>
          </div>
        </div>

        {/* Per-person breakdown */}
        <div className="bg-gradient-to-br from-on-surface to-inverse-surface rounded-2xl shadow-xl text-inverse-on-surface p-5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
            <Users size={13} /> Each person owes
          </h3>
          <div className="space-y-5">
            {results.map(person => (
              <div key={person.id}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="font-semibold text-slate-200">{person.name}</span>
                  <span className="text-xl font-extrabold text-white">{currency}{person.totalShare.toFixed(2)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                  <div
                    className="h-full bg-primary-fixed-dim rounded-full transition-all duration-500"
                    style={{ width: `${totalCost > 0 ? (person.totalShare / totalCost) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 pl-2 border-l-2 border-white/10 space-y-0.5">
                  {person.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="truncate pr-2">{item.name}</span>
                      <span>{currency}{item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense list */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
          <div className="px-5 py-3 border-b border-outline-variant bg-surface-container-low">
            <h3 className="text-sm font-bold text-on-surface">Expenses</h3>
          </div>
          <div className="divide-y divide-outline-variant/50">
            {(split.expenses || []).map((expense, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    {expense.name.toLowerCase().includes('rent') ? <Home size={15} /> : <DollarSign size={15} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{expense.name}</p>
                    <p className="text-xs text-on-surface-variant capitalize">
                      Split by {expense.method.startsWith('single-') ? 'one person' : expense.method}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-on-surface">{currency}{parseFloat(expense.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-2">
          <p className="text-xs text-on-surface-variant mb-3">Want to split your own expenses?</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <Wallet size={16} /> Try FairShare for free
          </Link>
        </div>
      </main>
    </div>
  );
}
