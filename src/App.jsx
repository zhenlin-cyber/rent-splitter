import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { signOut, db } from './firebase.js';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { 
  Users, 
  DollarSign, 
  Maximize, 
  Percent, 
  Calculator, 
  Plus, 
  Trash2, 
  PieChart, 
  Save,
  RotateCcw,
  Check,
  Zap,
  Home,
  Trash,
  Smartphone,
  Monitor,
  Layout,
  UserCircle,
  FolderOpen,
  ArrowRight,
  X,
  Utensils,
  Plane,
  Box,
  Archive,
  AlertTriangle
} from 'lucide-react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, variant = 'primary', children, className = "", icon: Icon, size = 'normal', disabled=false }) => {
  const baseStyle = "flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizeStyles = {
    normal: "px-4 py-2",
    small: "px-2 py-1 text-[10px] h-7"
  };
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200",
    danger: "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600"
  };

  const handleClick = (e) => {
    try { console.log('Button clicked', { variant, children, size, disabled }); } catch (err) {}
    if (disabled) return;
    if (typeof onClick === 'function') onClick(e);
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={disabled}
      className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={size === 'small' ? 14 : 18} />}
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function RentSplitter() {
  // --- State Management ---
  const [view, setView] = useState('calculator'); // 'calculator', 'splits', 'profiles'
  const [currency, setCurrency] = useState('$');
  const [isMobile, setIsMobile] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  
  // Data State
  const [expenses, setExpenses] = useState([
    { id: 1, name: 'Monthly Rent', amount: 2400, method: 'sqft' },
    { id: 2, name: 'Electric & Utilities', amount: 150, method: 'equal' },
    { id: 3, name: 'Internet', amount: 60, method: 'equal' },
  ]);

  const [roommates, setRoommates] = useState([
    { id: 1, name: 'Alex', sqFt: 180, percentage: 40, manualAdjustment: 0 },
    { id: 2, name: 'Jordan', sqFt: 140, percentage: 35, manualAdjustment: 0 },
    { id: 3, name: 'Taylor', sqFt: 120, percentage: 25, manualAdjustment: 0 },
  ]);

  // New Data Stores
  const [savedSplits, setSavedSplits] = useState([]);
  const DEFAULT_PROFILES = [
    { id: 1, name: 'Alex', defaultSqFt: 180, defaultPercentage: 0 },
    { id: 2, name: 'Jordan', defaultSqFt: 140, defaultPercentage: 0 },
    { id: 3, name: 'Taylor', defaultSqFt: 120, defaultPercentage: 0 },
  ];

  // Start empty; we'll seed defaults only the first time the app runs.
  const [profiles, setProfiles] = useState([]);

  const [notification, setNotification] = useState(null);

  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      showNotification('Signed out');
    } catch (err) {
      showNotification(err?.message || 'Sign out failed');
      console.error(err);
    }
  };

  const AuthButtons = () => {
    if (loading) return null;
    if (user) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleSignOut} className="text-sm">Sign out</Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link to="/login"><Button variant="secondary" className="text-sm">Login</Button></Link>
        <Link to="/signup"><Button variant="primary" className="text-sm">Sign up</Button></Link>
      </div>
    );
  };
  
  // Modals State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // For selecting profile
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false); // For saving split
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false); // For creating profile
  
  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  const [newSplitData, setNewSplitData] = useState({ name: '', category: 'Rent' });
  const [isSavingSplit, setIsSavingSplit] = useState(false);
  const [newProfileData, setNewProfileData] = useState({ name: '', defaultSqFt: 100, defaultPercentage: 0 });

  // --- Persistence ---
  useEffect(() => {
    const loadLocal = () => {
      const savedData = localStorage.getItem('rentSplitterData_v3');
      const initialized = localStorage.getItem('rentSplitterData_initialized_v3');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.roommates) setRoommates(parsed.roommates);
        if (parsed.savedSplits) setSavedSplits(parsed.savedSplits);
        if (parsed.profiles) setProfiles(parsed.profiles);
      } else {
        // If user has never run the app locally, seed example profiles once.
        if (!initialized) {
          setProfiles(DEFAULT_PROFILES);
          // Persist the seeded defaults so they don't reappear after user intentionally clears profiles
          localStorage.setItem('rentSplitterData_v3', JSON.stringify({ profiles: DEFAULT_PROFILES }));
          localStorage.setItem('rentSplitterData_initialized_v3', 'true');
        }
      }
    };

    // If user is signed in and Firestore `db` is available, load splits from Firestore
    if (user && db) {
      const fetchSplits = async () => {
        try {
          const colRef = collection(db, 'users', user.uid, 'splits');
          const snap = await getDocs(colRef);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // show newest first to match local behavior
          const remoteSplits = docs.reverse();
          setSavedSplits(remoteSplits);

          // Migrate any local-only splits to Firestore to preserve user's data across sign-outs
          try {
            const savedData = localStorage.getItem('rentSplitterData_v3');
            const localSplits = savedData ? (JSON.parse(savedData).savedSplits || []) : [];
            if (localSplits.length > 0) {
              // For each local split, if not present remotely (by name+date+category), add it
              for (const ls of localSplits) {
                const exists = remoteSplits.some(rs => rs.name === ls.name && rs.date === ls.date && rs.category === ls.category);
                if (!exists) {
                  try {
                    const added = await addDoc(colRef, {
                      name: ls.name,
                      category: ls.category,
                      date: ls.date,
                      expenses: ls.expenses,
                      roommates: ls.roommates,
                      currency: ls.currency
                    });
                    const saved = { id: added.id, name: ls.name, category: ls.category, date: ls.date, expenses: ls.expenses, roommates: ls.roommates, currency: ls.currency };
                    setSavedSplits(prev => [saved, ...prev]);
                  } catch (err) {
                    console.error('Failed to migrate local split to Firestore', err);
                  }
                }
              }
              // Clear local savedSplits to avoid repeated migration
              try {
                const parsed = savedData ? JSON.parse(savedData) : {};
                delete parsed.savedSplits;
                localStorage.setItem('rentSplitterData_v3', JSON.stringify(parsed));
              } catch (e) {
                console.error('Failed to clear local savedSplits after migration', e);
              }
            }
          } catch (e) {
            console.error('Error during local->remote migration', e);
          }
        } catch (err) {
          console.error('Failed to load splits from Firestore', err);
          showNotification('Failed to load saved splits');
          loadLocal();
        }
      };
      fetchSplits();

      // Also load profiles from Firestore and migrate any local profiles
      const fetchProfiles = async () => {
        try {
          const profilesCol = collection(db, 'users', user.uid, 'profiles');
          const snap = await getDocs(profilesCol);
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setProfiles(docs);

          // Migrate any local-only profiles to Firestore
          try {
            const savedData = localStorage.getItem('rentSplitterData_v3');
            const localProfiles = savedData ? (JSON.parse(savedData).profiles || []) : [];
            if (localProfiles.length > 0) {
              for (const lp of localProfiles) {
                const exists = docs.some(rp => rp.name === lp.name && Number(rp.defaultSqFt) === Number(lp.defaultSqFt) && Number(rp.defaultPercentage) === Number(lp.defaultPercentage));
                if (!exists) {
                  try {
                    const added = await addDoc(profilesCol, {
                      name: lp.name,
                      defaultSqFt: lp.defaultSqFt,
                      defaultPercentage: lp.defaultPercentage
                    });
                    const saved = { id: added.id, name: lp.name, defaultSqFt: lp.defaultSqFt, defaultPercentage: lp.defaultPercentage };
                    setProfiles(prev => [saved, ...prev]);
                  } catch (err) {
                    console.error('Failed to migrate local profile to Firestore', err);
                  }
                }
              }
              // Clear local profiles to avoid repeated migration
              try {
                const parsed = savedData ? JSON.parse(savedData) : {};
                delete parsed.profiles;
                localStorage.setItem('rentSplitterData_v3', JSON.stringify(parsed));
              } catch (e) {
                console.error('Failed to clear local profiles after migration', e);
              }
            }
          } catch (e) {
            console.error('Error during local->remote profile migration', e);
          }
        } catch (err) {
          console.error('Failed to load profiles from Firestore', err);
        }
      };
      fetchProfiles();
    } else {
      loadLocal();
    }
  }, [user]);

  const saveToLocal = () => {
    localStorage.setItem('rentSplitterData_v3', JSON.stringify({
      expenses,
      roommates,
      savedSplits,
      profiles
    }));
  };

  // Auto-save whenever critical data changes
  useEffect(() => {
    saveToLocal();
  }, [expenses, roommates, savedSplits, profiles]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Helper for Confirmation ---
  const requestConfirmation = (title, message, onConfirmAction) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // --- Action Handlers ---

  // 1. Calculator Actions
  const resetData = () => {
    requestConfirmation("Reset Calculator", "Are you sure you want to reset all data?", () => {
      setExpenses([{ id: 1, name: 'Monthly Rent', amount: 0, method: 'sqft' }]);
      setRoommates([{ id: 1, name: 'Me', sqFt: 100, percentage: 100, manualAdjustment: 0 }]);
      showNotification("Calculator reset");
    });
  };

  const addRoommate = () => {
    const newId = Math.max(...roommates.map(r => r.id), 0) + 1;
    setRoommates([...roommates, { id: newId, name: `Roommate ${newId}`, sqFt: 100, percentage: 0, manualAdjustment: 0 }]);
  };

  const addRoommateFromProfile = (profile) => {
    const newId = Math.max(...roommates.map(r => r.id), 0) + 1;
    setRoommates([...roommates, { 
      id: newId, 
      name: profile.name, 
      sqFt: profile.defaultSqFt || 100, 
      percentage: profile.defaultPercentage || 0, 
      manualAdjustment: 0 
    }]);
    setIsProfileModalOpen(false);
    showNotification(`Added ${profile.name}`);
  };

  const removeRoommate = (id) => {
    if (roommates.length > 1) {
      setRoommates(roommates.filter(r => r.id !== id));
      // Safety: If an expense was assigned to this specific person, reset it to 'equal'
      setExpenses(expenses.map(e => 
        e.method === `single-${id}` ? { ...e, method: 'equal' } : e
      ));
    }
  };

  const updateRoommate = (id, field, value) => {
    setRoommates(roommates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addExpense = () => {
    const newId = Math.max(...expenses.map(e => e.id), 0) + 1;
    setExpenses([...expenses, { id: newId, name: 'New Category', amount: 0, method: 'equal' }]);
  };

  const removeExpense = (id) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const updateExpense = (id, field, value) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // 2. Split Manager Actions
  const openSaveModal = () => {
    setNewSplitData({ name: `Split ${savedSplits.length + 1}`, category: 'Rent' });
    setIsSaveModalOpen(true);
  };

  const confirmSaveSplit = async () => {
    console.log('confirmSaveSplit called', { user, db, newSplitData });
    if (!newSplitData.name.trim()) return showNotification('Please enter a split name');

    const nameNorm = newSplitData.name.trim().toLowerCase();
    // Local duplicate check
    const existsLocal = savedSplits.some(s => s.name && s.name.trim().toLowerCase() === nameNorm);
    if (existsLocal) return showNotification('A split with that name already exists');

    const newSplit = {
      name: newSplitData.name,
      category: newSplitData.category,
      date: new Date().toLocaleDateString(),
      expenses,
      roommates,
      currency
    };

    setIsSavingSplit(true);
    try {
      // If user is signed in and Firestore available, persist there (check remote duplicates first)
      if (user && db) {
        try {
          const colRef = collection(db, 'users', user.uid, 'splits');
          const q = query(colRef, where('name', '==', newSplitData.name.trim()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setIsSavingSplit(false);
            return showNotification('A split with that name already exists');
          }

          console.log('attempting remote save to Firestore', { uid: user.uid });
          const docRef = await addDoc(colRef, newSplit);
          console.log('remote save success', { id: docRef.id });
          const saved = { id: docRef.id, ...newSplit };
          setSavedSplits(prev => [saved, ...prev]);
          setIsSaveModalOpen(false);
          showNotification(`Saved to ${newSplitData.category}`);
          return;
        } catch (err) {
          console.error('Failed to save split to Firestore', err);
          showNotification('Failed to save split remotely — saved locally instead');
          // fallthrough to local save
        }
      } else {
        console.log('remote save skipped — user or db missing', { userPresent: !!user, dbPresent: !!db });
      }

      // Fallback: save locally
      const localSplit = { id: Date.now(), ...newSplit };
      setSavedSplits(prev => [localSplit, ...prev]);
      setIsSaveModalOpen(false);
      showNotification(`Saved to ${newSplitData.category}`);
    } finally {
      setIsSavingSplit(false);
    }
  };

  const loadSplit = (split) => {
    requestConfirmation("Load Split", `Load "${split.name}"? This will overwrite your current calculator.`, () => {
      setExpenses(split.expenses);
      setRoommates(split.roommates);
      if (split.currency) setCurrency(split.currency);
      setView('calculator');
      showNotification("Split loaded successfully");
    });
  };

  const deleteSplit = (id) => {
    requestConfirmation("Delete Split", "Are you sure you want to delete this saved split?", () => {
      // Remove locally first for responsive UI
      setSavedSplits(savedSplits.filter(s => s.id !== id));
      // If it's a remote user split, also delete from Firestore
      if (user && db) {
        (async () => {
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'splits', id));
          } catch (err) {
            console.error('Failed to delete split from Firestore', err);
            showNotification('Failed to delete remote split');
          }
        })();
      }
      showNotification("Split deleted");
    });
  };

  // 3. Profile Manager Actions
  const openAddProfileModal = () => {
    setNewProfileData({ name: '', defaultSqFt: 100, defaultPercentage: 0 });
    setIsAddProfileModalOpen(true);
  };

  const confirmAddProfile = async () => {
    if (!newProfileData.name.trim()) return;

    const nameNorm = newProfileData.name.trim().toLowerCase();
    // Local duplicate check
    const existsLocal = profiles.some(p => p.name && p.name.trim().toLowerCase() === nameNorm);
    if (existsLocal) return showNotification('A profile with that name already exists');

    // Remote duplicate check
    if (user && db) {
      try {
        const profilesCol = collection(db, 'users', user.uid, 'profiles');
        const q = query(profilesCol, where('name', '==', newProfileData.name.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) return showNotification('A profile with that name already exists');
      } catch (err) {
        console.error('Failed to check remote profiles', err);
        // proceed — we don't want a remote check failure to block local save
      }
    }

    const newProfileLocal = {
      id: Date.now(),
      name: newProfileData.name,
      defaultSqFt: parseFloat(newProfileData.defaultSqFt) || 0,
      defaultPercentage: parseFloat(newProfileData.defaultPercentage) || 0
    };

    // Optimistic local add
    setProfiles(prev => [...prev, newProfileLocal]);
    setIsAddProfileModalOpen(false);
    showNotification("Profile created");

    // If user signed in, attempt to persist to Firestore and replace local id with remote id
    if (user && db) {
      (async () => {
        try {
          const profilesCol = collection(db, 'users', user.uid, 'profiles');
          const docRef = await addDoc(profilesCol, {
            name: newProfileLocal.name,
            defaultSqFt: newProfileLocal.defaultSqFt,
            defaultPercentage: newProfileLocal.defaultPercentage
          });
          setProfiles(prev => prev.map(p => p.id === newProfileLocal.id ? { id: docRef.id, name: newProfileLocal.name, defaultSqFt: newProfileLocal.defaultSqFt, defaultPercentage: newProfileLocal.defaultPercentage } : p));
        } catch (err) {
          console.error('Failed to save profile to Firestore', err);
          showNotification('Saved profile locally (remote save failed)');
        }
      })();
    }
  };

  const deleteProfile = (id) => {
    requestConfirmation("Delete Profile", "Are you sure you want to delete this profile?", () => {
      const profileToDelete = profiles.find(p => p.id === id);
      setProfiles(prev => prev.filter(p => p.id !== id));

      // If this profile exists remotely, attempt to delete from Firestore.
      // Handle both cases: local numeric id (need to find remote doc by fields) or remote string id.
      if (user && db) {
        (async () => {
          try {
            if (typeof id === 'string') {
              await deleteDoc(doc(db, 'users', user.uid, 'profiles', id));
            } else if (profileToDelete) {
              const profilesCol = collection(db, 'users', user.uid, 'profiles');
              const q = query(profilesCol,
                where('name', '==', profileToDelete.name),
                where('defaultSqFt', '==', profileToDelete.defaultSqFt),
                where('defaultPercentage', '==', profileToDelete.defaultPercentage)
              );
              const snap = await getDocs(q);
              for (const d of snap.docs) {
                try {
                  await deleteDoc(doc(db, 'users', user.uid, 'profiles', d.id));
                } catch (err) {
                  console.error('Failed to delete matched remote profile', err);
                }
              }
            }
          } catch (err) {
            console.error('Failed to delete profile from Firestore', err);
            showNotification('Failed to delete remote profile');
          }
        })();
      }
      showNotification("Profile deleted");
    });
  };

  const updateProfile = (id, field, value) => {
    const parsedValue = (field === 'defaultSqFt' || field === 'defaultPercentage') ? (value === '' ? 0 : parseFloat(value)) : value;
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, [field]: parsedValue } : p));

    // If this profile exists in Firestore (string id), persist the change remotely
    if (user && db && typeof id === 'string') {
      (async () => {
        try {
          await updateDoc(doc(db, 'users', user.uid, 'profiles', id), { [field]: parsedValue });
        } catch (err) {
          console.error('Failed to update profile in Firestore', err);
          showNotification('Failed to update remote profile');
        }
      })();
    }
  };


  // --- Derived State for UI visibility ---
  const showSqFt = expenses.some(e => e.method === 'sqft');
  const showPercentage = expenses.some(e => e.method === 'percentage');
  const totalCost = expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  
  // Filter saved splits
  const filteredSplits = savedSplits.filter(s => 
    activeCategoryFilter === 'All' || (s.category || 'Other') === activeCategoryFilter
  );

  // --- Calculation Logic ---
  const calculationResults = useMemo(() => {
    const totalSqFt = roommates.reduce((acc, r) => acc + (parseFloat(r.sqFt) || 0), 0);
    const count = roommates.length;
    
    const results = roommates.map(r => ({
      ...r,
      totalShare: 0,
      breakdown: []
    }));

    expenses.forEach(expense => {
      const amount = parseFloat(expense.amount) || 0;
      
      // Check if this expense is assigned to a single person
      if (expense.method.startsWith('single-')) {
          const payerId = parseInt(expense.method.split('-')[1]);
          results.forEach(person => {
              if (person.id === payerId) {
                  person.totalShare += amount;
                  person.breakdown.push({ name: expense.name, amount: amount });
              }
          });
          return; // Skip standard distribution logic below
      }

      // Standard distribution logic
      results.forEach(person => {
        let expenseShare = 0;
        switch (expense.method) {
          case 'equal': expenseShare = amount / count; break;
          case 'sqft':
            const rSqFt = parseFloat(person.sqFt) || 0;
            const sqFtPercent = totalSqFt > 0 ? (rSqFt / totalSqFt) : 0;
            expenseShare = sqFtPercent * amount;
            break;
          case 'percentage':
            const rPercent = parseFloat(person.percentage) || 0;
            expenseShare = (rPercent / 100) * amount;
            break;
          default: expenseShare = amount / count;
        }
        person.totalShare += expenseShare;
        if (expenseShare > 0) {
            person.breakdown.push({ name: expense.name, amount: expenseShare });
        }
      });
    });

    results.forEach(person => {
      const adjustment = parseFloat(person.manualAdjustment) || 0;
      person.totalShare += adjustment;
      if (adjustment !== 0) {
        person.breakdown.push({ name: 'Manual Adjustment', amount: adjustment });
      }
    });

    return results;
  }, [expenses, roommates]);

  const calculatedTotal = calculationResults.reduce((acc, r) => acc + r.totalShare, 0);
  const finalDiscrepancy = (totalCost + roommates.reduce((acc, r) => acc + (parseFloat(r.manualAdjustment)||0), 0)) - calculatedTotal;

  // --- Render Helpers ---

  const renderTabs = () => (
    <div className={`flex gap-1 p-1 bg-slate-200/50 rounded-lg mx-auto mb-4 ${isMobile ? 'max-w-full text-xs' : 'max-w-md text-sm'}`}>
      <button 
        onClick={() => setView('calculator')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold transition-all ${view === 'calculator' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <Calculator size={isMobile ? 14 : 16} /> Calculator
      </button>
      <button 
        onClick={() => setView('splits')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold transition-all ${view === 'splits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <FolderOpen size={isMobile ? 14 : 16} /> My Splits
      </button>
      <button 
        onClick={() => setView('profiles')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold transition-all ${view === 'profiles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <Users size={isMobile ? 14 : 16} /> Profiles
      </button>
    </div>
  );

  const getCategoryIcon = (cat) => {
      switch(cat) {
          case 'Rent': return <Home size={16} />;
          case 'Food': return <Utensils size={16} />;
          case 'Travel': return <Plane size={16} />;
          default: return <Box size={16} />;
      }
  };

  const getCategoryColor = (cat) => {
      switch(cat) {
          case 'Rent': return 'bg-indigo-100 text-indigo-600';
          case 'Food': return 'bg-orange-100 text-orange-600';
          case 'Travel': return 'bg-sky-100 text-sky-600';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20 flex flex-col">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
          <div className={`mx-auto px-4 py-3 flex items-center justify-between transition-all duration-300 ${isMobile ? 'max-w-[375px]' : 'max-w-7xl'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Calculator className="text-white" size={isMobile ? 18 : 24} />
            </div>
            <div>
                <h1 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-slate-900`}>FairShare</h1>
            </div>
          </div>

           <div className="flex items-center gap-2">
             <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
               <button onClick={() => setIsMobile(false)} className={`p-1.5 rounded-md ${!isMobile ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Monitor size={16} /></button>
               <button onClick={() => setIsMobile(true)} className={`p-1.5 rounded-md ${isMobile ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><Smartphone size={16} /></button>
             </div>
             {/* Auth buttons */}
             <AuthButtons />
           </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-rose-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce-in ring-4 ring-rose-300/30 max-w-xl">
          <AlertTriangle size={20} />
          <div className="font-semibold">{notification}</div>
        </div>
      )}

      <main className={`mx-auto px-4 py-6 space-y-6 transition-all duration-300 ease-in-out ${isMobile ? 'max-w-[375px] bg-white border-x-8 border-slate-900 min-h-[800px] shadow-2xl rounded-b-[2rem]' : 'max-w-7xl w-full'}`}>
        
        {renderTabs()}

        {/* --- VIEW: CALCULATOR --- */}
        {view === 'calculator' && (
          <div className="animate-in fade-in duration-300">
             
             {/* Toolbar */}
             <div className="flex justify-end gap-2 mb-4">
                <Button variant="ghost" onClick={resetData} icon={RotateCcw} size="small" className="text-slate-500">Reset</Button>
                <Button variant="secondary" onClick={openSaveModal} icon={Save} size="small">Save Split</Button>
             </div>

            {/* Layout: Grid with stretch alignment */}
            <div className={`flex flex-col items-stretch ${isMobile ? 'gap-2' : 'gap-8'}`} style={{ flexDirection: isMobile ? 'column' : 'row' }}>
                
              {/* 1. Expenses Configuration */}
                <Card className={`${isMobile ? 'p-0 overflow-visible min-h-[300px]' : 'p-0 overflow-visible h-full min-h-[500px] md:w-1/2'} flex flex-col`} style={{ flexBasis: isMobile ? 'auto' : '50%' }}>
                    <div className={`${isMobile ? 'p-3' : 'p-5'} border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl shrink-0`}>
                      <h2 className={`${isMobile ? 'text-xs' : 'text-lg'} font-semibold flex items-center gap-2`}>
                        <DollarSign size={isMobile ? 14 : 24} className="text-emerald-500" />
                        Expenses
                      </h2>
                      <div className="flex items-center gap-4">
                        {/* Inline total displayed horizontally with the header on larger screens */}
                        <div className={`${isMobile ? 'hidden' : 'flex flex-col items-end mr-2'}`}>
                          <span className="text-slate-500 text-sm">Total</span>
                          <span className="font-bold text-lg">{currency}{totalCost.toLocaleString()}</span>
                        </div>
                        {!isMobile && (
                          <select 
                            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 cursor-pointer focus:ring-1 focus:ring-indigo-500"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                          >
                            <option value="$">USD</option>
                            <option value="€">EUR</option>
                            <option value="£">GBP</option>
                            <option value="¥">JPY</option>
                          </select>
                        )}
                        <Button variant="secondary" onClick={addExpense} icon={Plus} size={isMobile ? 'small' : 'normal'} className={isMobile ? "h-6 w-6 p-0" : "text-xs py-1.5 h-8"}>
                          {isMobile ? '' : 'Add'}
                        </Button>
                      </div>
                    </div>

                    <div className={`${isMobile ? 'p-2 space-y-2' : 'p-4 space-y-3'} flex-1 flex flex-col`}>
                        {!isMobile && (
                            <div className="hidden sm:flex px-1 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <div className="flex-1 min-w-[120px]">Category</div>
                                <div className="w-28 pl-4">Cost</div>
                                <div className="w-36 pl-4">Split Method</div>
                                <div className="w-8"></div> 
                            </div>
                        )}
                        <div className="flex-1">
                          {expenses.map((expense) => (
                              /* Mobile: 12-col Grid. Desktop: Flex Row */
                              <div key={expense.id} className={`bg-white border border-slate-200 rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-200 items-center ${isMobile ? 'grid grid-cols-12 gap-1 p-1.5' : 'flex gap-1 p-3 flex-col sm:flex-row'}`}>
                                  
                                  {/* Name Input */}
                                    <div className={`${isMobile ? 'col-span-5' : 'flex-1 w-full min-w-[120px]'}`}>
                                      <div className={`relative ${isMobile ? 'h-7' : ''} rounded-md`}>
                                        {/* Wrapper owns the border so the icon appears contained */}
                                        <div className={`absolute inset-0 border border-slate-200 rounded-md bg-white ${isMobile ? '' : ''} focus-within:ring-0`}></div>

                                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${isMobile ? 'hidden' : 'block'}`}>
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-indigo-600 ring-1 ring-slate-200 shadow-sm">
                                          {expense.name.toLowerCase().includes('rent') ? <Home size={16}/> : 
                                          expense.name.toLowerCase().includes('electr') ? <Zap size={16}/> :
                                          <DollarSign size={16}/>}
                                          </div>
                                        </div>

                                        <input 
                                          type="text" 
                                          value={expense.name}
                                          onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                                          className={`relative w-full bg-transparent font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 ${isMobile ? 'pl-1 pr-1 py-0 text-[10px] h-7' : 'pl-12 pr-3 py-2 text-sm'}`}
                                          placeholder="Name"
                                        />
                                      </div>
                                    </div>

                                  {/* Amount Input */}
                                  <div className={`relative ${isMobile ? 'col-span-3' : 'w-full sm:w-28'}`}>
                                      <span className={`absolute left-1 top-1/2 -translate-y-1/2 text-slate-500 font-medium ${isMobile ? 'text-[9px]' : 'text-sm left-3'}`}>{currency}</span>
                                      <input 
                                          type="number" 
                                          value={expense.amount}
                                          onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                                          className={`w-full bg-white font-bold text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-md shadow-sm focus:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isMobile ? 'pl-3 pr-0 py-0 text-[10px] h-7' : 'pl-7 pr-3 py-2 text-sm'}`}
                                          placeholder="0"
                                      />
                                  </div>

                                  {/* Method Select */}
                                  <div className={`${isMobile ? 'col-span-3' : 'w-full sm:w-36'}`}>
                                      <select
                                          value={expense.method}
                                          onChange={(e) => updateExpense(expense.id, 'method', e.target.value)}
                                          className={`w-full text-slate-700 bg-white border border-slate-200 rounded-md shadow-sm focus:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${isMobile ? 'px-0 py-0 text-[9px] h-7' : 'px-3 py-2 text-sm'}`}
                                      >
                                          <option value="equal">{isMobile ? 'Eq' : 'Equal'}</option>
                                          <option value="sqft">{isMobile ? 'Sq' : 'Sq Ft'}</option>
                                          <option value="percentage">{isMobile ? '%' : 'Percent'}</option>
                                          <optgroup label="Assign to...">
                                              {roommates.map(r => (
                                                  <option key={r.id} value={`single-${r.id}`}>
                                                      Assign: {isMobile ? r.name.substring(0, 3) : r.name}
                                                  </option>
                                              ))}
                                          </optgroup>
                                      </select>
                                  </div>

                                  {/* Delete Button */}
                                  <div className={`${isMobile ? 'col-span-1 flex justify-center' : ''}`}>
                                    <button onClick={() => removeExpense(expense.id)} className={`text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors ${isMobile ? 'p-1' : 'p-2'}`}>
                                        <Trash2 size={isMobile ? 12 : 16} />
                                    </button>
                                  </div>
                              </div>
                          ))}
                        </div>
                            {/* Total moved to header for horizontal layout; keep spacer to push content */}
                            <div className={`mt-auto ${isMobile ? 'pt-2 text-[10px]' : 'pt-3 text-sm'}`}></div>
                    </div>
                </Card>

                {/* 2. Breakdown Dashboard */}
                <div className={`h-full ${isMobile ? 'min-h-[300px]' : 'min-h-[500px] md:w-1/2'}`} style={{ flexBasis: isMobile ? 'auto' : '50%' }}>
                  <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl h-full flex flex-col justify-between ${isMobile ? 'p-3' : 'p-6'}`}>
                        <div>
                            <div className={`flex justify-between items-end border-b border-slate-700 ${isMobile ? 'mb-3 pb-2' : 'mb-6 pb-4'}`}>
                                <div>
                                    <h3 className={`font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2 ${isMobile ? 'text-[9px]' : 'text-sm'}`}>
                                    <PieChart size={isMobile ? 12 : 16} /> Total
                                    </h3>
                                    <p className={`font-bold ${isMobile ? 'text-lg' : 'text-3xl'}`}>{currency}{totalCost.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className={`${isMobile ? 'space-y-3' : 'space-y-6'}`}>
                                {calculationResults.map((person) => (
                                <div key={person.id} className="relative group/breakdown">
                                    <div className={`flex justify-between items-center ${isMobile ? 'mb-1' : 'mb-2'}`}>
                                    <span className={`font-medium text-slate-200 ${isMobile ? 'text-[10px]' : 'text-lg'}`}>{person.name}</span>
                                    <span className={`font-bold text-white ${isMobile ? 'text-xs' : 'text-xl'}`}>
                                        {currency}{person.totalShare.toFixed(isMobile ? 0 : 2)}
                                    </span>
                                    </div>
                                    <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${isMobile ? 'h-1.5 mb-1.5' : 'h-2 mb-2'}`}>
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${totalCost > 0 ? (person.totalShare / totalCost) * 100 : 0}%` }}></div>
                                    </div>
                                    <div className={`text-slate-400 pl-1 border-l-2 border-slate-700 ${isMobile ? 'text-[8px] space-y-0.5 mt-0.5' : 'text-xs space-y-1 mt-2'}`}>
                                        {person.breakdown.map((item, idx) => (
                                            <div key={idx} className="flex justify-between hover:text-slate-300 transition-colors">
                                                <span className="truncate pr-2">{item.name}</span>
                                                <span>{currency}{item.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            {Math.abs(finalDiscrepancy) > 0.05 && (
                                <div className={`rounded-lg flex items-center justify-between ${isMobile ? 'mt-3 p-1.5 text-[9px]' : 'mt-6 p-3 text-sm'} ${finalDiscrepancy > 0 ? 'bg-amber-500/20 text-amber-200' : 'bg-rose-500/20 text-rose-200'}`}>
                                <span>{isMobile ? 'Left:' : 'Unallocated:'}</span>
                                <span className="font-bold">{currency}{Math.abs(finalDiscrepancy).toFixed(0)}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Roommates Configuration */}
            <section className="mt-8">
                 <Card className="p-0">
                    <div className={`${isMobile ? 'p-3' : 'p-5'} border-b border-slate-100 flex justify-between items-center bg-slate-50/50`}>
                        <h2 className={`${isMobile ? 'text-xs' : 'text-lg'} font-semibold flex items-center gap-2`}>
                            <Users className="text-indigo-500" size={isMobile ? 14 : 24} />
                            Roommates
                        </h2>
                        <div className="flex gap-2">
                           {profiles.length > 0 && (
                             <Button variant="secondary" onClick={() => setIsProfileModalOpen(true)} icon={UserCircle} size={isMobile ? 'small' : 'normal'} className={isMobile ? "h-6 p-1.5" : "text-xs py-1.5 h-8"}>
                                {isMobile ? '' : 'From Profiles'}
                             </Button>
                           )}
                           <Button variant="secondary" onClick={addRoommate} icon={Plus} size={isMobile ? 'small' : 'normal'} className={isMobile ? "h-6 w-6 p-0" : "text-xs py-1.5 h-8"}>
                               {isMobile ? '' : 'Add New'}
                           </Button>
                        </div>
                    </div>
                    
                    <div className={`${isMobile ? 'px-2 py-2 text-[8px] grid grid-cols-12 gap-1' : 'px-6 py-3 text-xs grid grid-cols-12 gap-6'} bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider`}>
                        <div className="col-span-3">Name</div>
                        <div className={`col-span-9 grid grid-cols-3 ${isMobile ? 'gap-1' : 'gap-6'}`}>
                            <div className={showSqFt ? 'block' : 'opacity-25'}>Sq Ft</div>
                            <div className={showPercentage ? 'block' : 'opacity-25'}>%</div>
                            <div>Adj</div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                    {roommates.map((person) => (
                        <div key={person.id} className={`${isMobile ? 'p-2' : 'p-4 md:p-6'} hover:bg-slate-50 transition-colors group`}>
                        <div className={`grid grid-cols-12 items-center ${isMobile ? 'gap-1' : 'gap-6'}`}>
                            <div className="col-span-3 flex items-center gap-1">
                                {!isMobile && (
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-lg ring-1 ring-white/20">
                                    {person.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 relative">
                                    <input 
                                    type="text" 
                                    value={person.name}
                                    onChange={(e) => updateRoommate(person.id, 'name', e.target.value)}
                                    className={`w-full font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 px-0 outline-none transition-all ${isMobile ? 'text-[10px] py-1 h-7' : 'text-base py-1'}`}
                                    />
                                    <button onClick={() => removeRoommate(person.id)} className={`absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-all ${isMobile ? 'p-0 text-[10px]' : 'p-2 opacity-0 group-hover:opacity-100'}`}>
                                    <Trash2 size={isMobile ? 12 : 16} />
                                    </button>
                                </div>
                            </div>
                            <div className={`col-span-9 grid grid-cols-3 ${isMobile ? 'gap-1' : 'gap-6'}`}>
                                <div className={`relative ${!showSqFt ? 'opacity-40 grayscale' : ''}`}>
                                    <input 
                                        type="number" 
                                        value={person.sqFt}
                                        onChange={(e) => updateRoommate(person.id, 'sqFt', e.target.value)}
                                        disabled={!showSqFt}
                                        className={`w-full bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed ${isMobile ? 'px-1 py-1 text-[10px] h-7' : 'px-3 py-2 text-sm'}`}
                                        placeholder="Sq"
                                    />
                                </div>
                                <div className={`relative ${!showPercentage ? 'opacity-40 grayscale' : ''}`}>
                                    <input 
                                        type="number" 
                                        min="0"
                                        max="100"
                                        value={person.percentage}
                                        onChange={(e) => updateRoommate(person.id, 'percentage', e.target.value)}
                                        disabled={!showPercentage}
                                        className={`w-full bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:cursor-not-allowed ${isMobile ? 'px-1 py-1 text-[10px] h-7' : 'px-3 py-2 text-sm'}`}
                                        placeholder="%"
                                    />
                                </div>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={person.manualAdjustment}
                                        onChange={(e) => updateRoommate(person.id, 'manualAdjustment', e.target.value)}
                                        className={`w-full bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${isMobile ? 'px-1 py-1 text-[10px] h-7' : 'px-3 py-2 text-sm'} ${person.manualAdjustment !== 0 ? 'font-bold text-indigo-600 border-indigo-200 bg-indigo-50' : ''}`}
                                        placeholder="+/-"
                                    />
                                </div>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                </Card>
            </section>
          </div>
        )}

        {/* --- VIEW: MY SPLITS (ARCHIVE) --- */}
        {view === 'splits' && (
          <div className="animate-in fade-in duration-300">
            <Card className="p-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900">My Saved Splits</h2>
                   <p className="text-sm text-slate-500">Archive by category</p>
                 </div>
                 <Button onClick={openSaveModal} icon={Plus}>Save Current</Button>
               </div>

               {/* Category Tabs */}
               <div className="flex flex-wrap gap-2 mb-6">
                 {['All', 'Rent', 'Food', 'Travel', 'Other'].map(cat => (
                   <button
                     key={cat}
                     onClick={() => setActiveCategoryFilter(cat)}
                     className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                       activeCategoryFilter === cat 
                         ? 'bg-indigo-600 text-white border-indigo-600' 
                         : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>

               {savedSplits.length === 0 ? (
                 <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <FolderOpen size={48} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No saved splits yet.</p>
                 </div>
               ) : (
                 <>
                    {filteredSplits.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 italic">No splits found in this category.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredSplits.map(split => {
                              const category = split.category || 'Other';
                              return (
                                <div key={split.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative group">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <div className={`p-1.5 rounded-md ${getCategoryColor(category)}`}>
                                              {getCategoryIcon(category)}
                                          </div>
                                          <h3 className="font-bold text-slate-800">{split.name}</h3>
                                      </div>
                                      <button onClick={() => deleteSplit(split.id)} className="text-slate-300 hover:text-rose-500">
                                          <Trash2 size={16} />
                                      </button>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-4 pl-9">
                                      <p>{split.date}</p>
                                      <p>{split.roommates?.length || 0} Roommates • {split.expenses?.length || 0} Expenses</p>
                                    </div>
                                    <Button variant="secondary" onClick={() => loadSplit(split)} className="w-full text-xs" icon={ArrowRight}>Load Split</Button>
                                </div>
                              );
                          })}
                      </div>
                    )}
                 </>
               )}
            </Card>
          </div>
        )}

        {/* --- VIEW: PROFILES --- */}
        {view === 'profiles' && (
          <div className="animate-in fade-in duration-300">
             <Card className="p-6">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900">People Profiles</h2>
                   <p className="text-sm text-slate-500">Manage pre-set roommates for quick addition</p>
                 </div>
                 <Button onClick={openAddProfileModal} icon={Plus}>Add Profile</Button>
               </div>

               <div className="divide-y divide-slate-100">
                 {profiles.map(profile => (
                    <div key={profile.id} className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4 group">
                       <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                             {profile.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <h4 className="font-semibold text-slate-900">{profile.name}</h4>
                             <p className="text-xs text-slate-500">
                               Default: {profile.defaultSqFt || 100} sq ft • {profile.defaultPercentage || 0}%
                             </p>
                          </div>
                       </div>
                       
                       <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
                          <div className="flex items-center gap-2">
                             <div className="flex flex-col items-end">
                                <label className="text-[10px] text-slate-400 uppercase font-semibold">Sq Ft</label>
                                <input 
                                  type="number" 
                                  className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={profile.defaultSqFt}
                                  onChange={(e) => updateProfile(profile.id, 'defaultSqFt', e.target.value)}
                                />
                             </div>
                             <div className="flex flex-col items-end">
                                <label className="text-[10px] text-slate-400 uppercase font-semibold">%</label>
                                <input 
                                  type="number" 
                                  className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={profile.defaultPercentage}
                                  onChange={(e) => updateProfile(profile.id, 'defaultPercentage', e.target.value)}
                                />
                             </div>
                          </div>
                          <button onClick={() => deleteProfile(profile.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 ml-2">
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                 ))}
                 {profiles.length === 0 && (
                    <div className="text-center py-8 text-slate-400 italic">No profiles added yet.</div>
                 )}
               </div>
            </Card>
          </div>
        )}

      </main>

      {/* --- MODALS --- */}
      
      {/* 4. Confirmation Modal (Generic) */}
      <Modal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        title={confirmConfig.title}
      >
        <div className="space-y-4">
           <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                 <AlertTriangle size={24} />
              </div>
              <p className="text-slate-600 text-sm pt-1">{confirmConfig.message}</p>
           </div>
           <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}>Cancel</Button>
              <Button variant="danger" onClick={confirmConfig.onConfirm}>Confirm</Button>
           </div>
        </div>
      </Modal>

      {/* 1. Profile Selection Modal */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        title="Add from Profiles"
      >
         <div className="grid gap-2">
            {profiles.map(p => (
               <button 
                 key={p.id}
                 onClick={() => addRoommateFromProfile(p)}
                 className="flex items-center gap-3 w-full p-3 text-left hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all"
               >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                     {p.name.charAt(0)}
                  </div>
                  <div>
                     <p className="font-semibold text-sm text-slate-900">{p.name}</p>
                     <p className="text-xs text-slate-500">{p.defaultSqFt} sq ft • {p.defaultPercentage}% share</p>
                  </div>
               </button>
            ))}
            {profiles.length === 0 && (
               <p className="text-center text-slate-500 text-sm py-4">No profiles found. Create them in the "Profiles" tab.</p>
            )}
         </div>
      </Modal>

      {/* 2. Save Split Modal */}
      <Modal 
        isOpen={isSaveModalOpen} 
        onClose={() => setIsSaveModalOpen(false)} 
        title="Save to Archive"
      >
         <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Split Name</label>
              <input 
                 type="text" 
                 className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="e.g. October Rent"
                 value={newSplitData.name}
                 onChange={(e) => setNewSplitData({...newSplitData, name: e.target.value})}
                 autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <div className="grid grid-cols-2 gap-2">
                 {['Rent', 'Food', 'Travel', 'Other'].map(cat => (
                   <button
                     key={cat}
                     onClick={() => setNewSplitData({...newSplitData, category: cat})}
                     className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                       newSplitData.category === cat 
                         ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' 
                         : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                     }`}
                   >
                     <div className={`text-slate-500 ${newSplitData.category === cat ? 'text-indigo-600' : ''}`}>
                        {cat === 'Rent' && <Home size={16} />}
                        {cat === 'Food' && <Utensils size={16} />}
                        {cat === 'Travel' && <Plane size={16} />}
                        {cat === 'Other' && <Box size={16} />}
                     </div>
                     {cat}
                   </button>
                 ))}
              </div>
            </div>
            <div className="pt-2">
               <Button onClick={confirmSaveSplit} className="w-full" icon={Archive}>Save to Archive</Button>
            </div>
         </div>
      </Modal>

      {/* 3. Add Profile Modal */}
      <Modal
        isOpen={isAddProfileModalOpen}
        onClose={() => setIsAddProfileModalOpen(false)}
        title="Create New Profile"
      >
        <div className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input 
                 type="text" 
                 className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                 placeholder="e.g. John Doe"
                 value={newProfileData.name}
                 onChange={(e) => setNewProfileData({...newProfileData, name: e.target.value})}
                 autoFocus
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Default Sq Ft</label>
                 <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="100"
                    value={newProfileData.defaultSqFt}
                    onChange={(e) => setNewProfileData({...newProfileData, defaultSqFt: e.target.value})}
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Default Share %</label>
                 <div className="relative">
                    <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
                        placeholder="0"
                        value={newProfileData.defaultPercentage}
                        onChange={(e) => setNewProfileData({...newProfileData, defaultPercentage: e.target.value})}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                 </div>
              </div>
           </div>
           <div className="pt-2">
               <Button onClick={confirmAddProfile} className="w-full" icon={Plus}>Create Profile</Button>
           </div>
        </div>
      </Modal>

    </div>
  );
}