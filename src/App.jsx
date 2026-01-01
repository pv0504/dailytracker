import React, { useState, useEffect } from 'react';
import { 
  Check, Flame, Plus, Trash2, ChevronLeft, ChevronRight, 
  LogOut, User, LayoutGrid, Calendar as CalendarIcon 
} from 'lucide-react';
import { db, auth, googleProvider } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  // --- Auth & Data Loading ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        loadHabitsFromFirebase(currentUser.uid);
      } else {
        setHabits([]);
        setCurrentMonth(new Date());
        setSyncing(false);
        setError('');
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.habits) setHabits(data.habits);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Sync error:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const loadHabitsFromFirebase = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().habits) {
        setHabits(docSnap.data().habits);
      }
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabitsToFirebase = async (updatedHabits) => {
    if (!user) return;
    try {
      setSyncing(true);
      await setDoc(doc(db, 'users', user.uid), {
        habits: updatedHabits,
        lastUpdated: new Date().toISOString(),
        email: user.email,
        displayName: user.displayName
      });
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Save failed:', error);
      setError('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // --- Actions ---

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError('Sign in failed. Try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit = {
      id: Date.now(),
      name: newHabitName.trim(),
      completedDates: [],
      createdAt: new Date().toISOString()
    };
    saveHabitsToFirebase([...habits, newHabit]);
    setNewHabitName('');
    setShowAddForm(false);
  };

  const deleteHabit = (id) => {
    if (window.confirm('Delete this habit?')) {
      saveHabitsToFirebase(habits.filter(h => h.id !== id));
    }
  };

  const toggleHabitDate = (habitId, day) => {
    // Construct the date string for the specific day in the current viewed month
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = targetDate.toDateString();
    
    // Prevent toggling future dates
    if (targetDate > new Date()) return;

    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completedDates = habit.completedDates || [];
        if (completedDates.includes(dateStr)) {
          return { ...habit, completedDates: completedDates.filter(d => d !== dateStr) };
        } else {
          return { ...habit, completedDates: [...completedDates, dateStr] };
        }
      }
      return habit;
    });
    saveHabitsToFirebase(updatedHabits);
  };

  // --- Helpers & Calculation ---

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return daysInMonth;
  };

  const getDayLabel = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toLocaleDateString('en-US', { weekday: 'narrow' }); // Returns M, T, W...
  };

  const isDateCompleted = (habit, day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return habit.completedDates && habit.completedDates.includes(date.toDateString());
  };

  const getMonthlyCompletionCount = (habit) => {
    if (!habit.completedDates) return 0;
    const currentMonthStr = currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
    return habit.completedDates.filter(dateStr => {
      const d = new Date(dateStr);
      return d.toLocaleString('default', { month: 'short', year: 'numeric' }) === currentMonthStr;
    }).length;
  };

  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sortedDates = completedDates.map(d => new Date(d)).sort((a, b) => b - a);
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Check if today is completed, if not, check yesterday to start streak counting
    const todayStr = currentDate.toDateString();
    const hasToday = completedDates.includes(todayStr);
    
    // If today is not done, we temporarily shift "current" to yesterday to check if streak is alive
    if (!hasToday) {
       currentDate.setDate(currentDate.getDate() - 1);
    }

    for (let date of sortedDates) {
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) streak++; // Matches current sequence
      else if (diffDays > streak) break; // Gap found
    }
    return streak;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // --- Render Helpers ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-indigo-600 animate-pulse font-medium">Loading Tracker...</div>
      </div>
    );
  }

  const daysInCurrentMonth = getDaysInMonth(currentMonth);
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
      
      {/* --- Top Navigation Bar --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo area */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
               <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Habit Tracker</h1>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={previousMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="w-32 text-center font-semibold text-gray-700 text-sm">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-white rounded shadow-sm transition-all text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            {!user ? (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-gray-700">{user.displayName}</div>
                    <div className={`text-[10px] ${syncing ? 'text-amber-500' : 'text-green-600'} flex items-center justify-end gap-1`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                       {syncing ? 'Saving...' : 'Synced'}
                    </div>
                 </div>
                 <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                   <LogOut className="w-5 h-5" />
                 </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full p-4 md:p-6">
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* --- The Grid --- */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden relative">
          
          {/* Scrollable Container */}
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full border-collapse">
                
                {/* Table Header */}
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {/* Habit Name Column Header */}
                    <th className="sticky left-0 z-20 bg-gray-50 p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 min-w-[180px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      Habits
                    </th>

                    {/* Days Headers */}
                    {daysArray.map((day) => {
                       const isToday = isCurrentMonth && day === today.getDate();
                       return (
                        <th key={day} className={`p-2 min-w-[36px] text-center border-b border-gray-100 ${isToday ? 'bg-indigo-50' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-gray-400 font-medium">{getDayLabel(day)}</span>
                            <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 bg-indigo-100 w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-700'}`}>
                              {day}
                            </span>
                          </div>
                        </th>
                      );
                    })}

                    {/* Stats Header */}
                    <th className="sticky right-0 z-20 bg-gray-50 p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-l border-gray-200 min-w-[100px] shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                      Score
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white divide-y divide-gray-100">
                  {habits.length === 0 ? (
                    <tr>
                      <td colSpan={daysInCurrentMonth + 2} className="p-12 text-center text-gray-400">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No habits yet. Add one below!</p>
                      </td>
                    </tr>
                  ) : (
                    habits.map((habit) => {
                      const score = getMonthlyCompletionCount(habit);
                      const streak = calculateStreak(habit.completedDates);
                      
                      return (
                        <tr key={habit.id} className="hover:bg-gray-50/50 transition-colors group">
                          
                          {/* Habit Name Cell */}
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 p-3 border-r border-gray-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-medium text-gray-800 truncate max-w-[140px]" title={habit.name}>
                                    {habit.name}
                                </div>
                                <button 
                                    onClick={() => deleteHabit(habit.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                <span className="text-[10px] text-orange-600 font-medium">{streak} day streak</span>
                            </div>
                          </td>

                          {/* Days Cells */}
                          {daysArray.map((day) => {
                            const completed = isDateCompleted(habit, day);
                            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isFuture = dateObj > new Date();
                            const isToday = isCurrentMonth && day === today.getDate();

                            return (
                              <td 
                                key={day} 
                                className={`p-1 text-center border-r border-gray-50 last:border-r-0 ${isToday ? 'bg-indigo-50/30' : ''}`}
                              >
                                <button
                                  onClick={() => toggleHabitDate(habit.id, day)}
                                  disabled={isFuture}
                                  className={`
                                    w-6 h-6 md:w-8 md:h-8 rounded-[4px] flex items-center justify-center transition-all duration-200
                                    ${completed 
                                      ? 'bg-indigo-500 text-white shadow-sm hover:bg-indigo-600' 
                                      : 'bg-gray-100 text-transparent hover:bg-gray-200'
                                    }
                                    ${isFuture ? 'opacity-30 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                                  `}
                                >
                                  <Check className={`w-3 h-3 md:w-4 md:h-4 ${completed ? 'scale-100' : 'scale-0'} transition-transform`} />
                                </button>
                              </td>
                            );
                          })}

                          {/* Stats Cell */}
                          <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 p-3 text-center border-l border-gray-200 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-sm font-bold text-gray-700">{score}</span>
                                <span className="text-[10px] text-gray-400">/ {daysInCurrentMonth}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* --- Add Habit Footer --- */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            {!showAddForm ? (
                <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                >
                <Plus className="w-5 h-5" />
                <span>Add New Habit</span>
                </button>
            ) : (
                <div className="flex gap-2 max-w-md">
                <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                    placeholder="Enter habit name..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                />
                <button
                    onClick={addHabit}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 font-medium shadow-sm"
                >
                    Add
                </button>
                <button
                    onClick={() => {
                    setShowAddForm(false);
                    setNewHabitName('');
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 font-medium shadow-sm"
                >
                    Cancel
                </button>
                </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
