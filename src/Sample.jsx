import React, { useState, useEffect } from 'react';
import { Check, Flame, Trophy, Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight, LogIn, LogOut, Mail, Lock } from 'lucide-react';

// Simulated Firebase (you'll replace this with real Firebase imports)
const useFirebaseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for saved user
    const savedUser = localStorage.getItem('user-auth');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);
  
  const signIn = async (email, password) => {
    // In real app: await signInWithEmailAndPassword(auth, email, password);
    const userId = btoa(email); // Simple hash for demo
    const userData = { uid: userId, email };
    localStorage.setItem('user-auth', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };
  
  const signUp = async (email, password) => {
    // In real app: await createUserWithEmailAndPassword(auth, email, password);
    const userId = btoa(email);
    const userData = { uid: userId, email };
    localStorage.setItem('user-auth', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };
  
  const signOut = async () => {
    localStorage.removeItem('user-auth');
    setUser(null);
  };
  
  return { user, loading, signIn, signUp, signOut };
};

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);import React, { useState, useEffect } from 'react';
import { Check, X, Flame, Trophy, Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight, Key, Copy, RefreshCw } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [syncCode, setSyncCode] = useState('');
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [inputSyncCode, setInputSyncCode] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Load sync code and habits on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('habit-sync-code');
    if (savedCode) {
      setSyncCode(savedCode);
      loadHabitsFromStorage(savedCode);
    } else {
      setLoading(false);
      setShowSyncSetup(true);
    }
  }, []);

  // Auto-save when habits change
  useEffect(() => {
    if (syncCode && !loading) {
      saveHabitsToStorage(habits);
    }
  }, [habits, syncCode, loading]);

  const generateSyncCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    return code;
  };

  const createNewSync = () => {
    const newCode = generateSyncCode();
    localStorage.setItem('habit-sync-code', newCode);
    setSyncCode(newCode);
    setShowSyncSetup(false);
    
    // Copy to clipboard
    navigator.clipboard.writeText(newCode).then(() => {
      alert(`Sync code created: ${newCode}\n\nCopied to clipboard! Use this code on your other devices.`);
    });
  };

  const connectWithCode = () => {
    if (inputSyncCode.trim().length < 6) {
      alert('Please enter a valid sync code');
      return;
    }
    
    const code = inputSyncCode.trim().toUpperCase();
    localStorage.setItem('habit-sync-code', code);
    setSyncCode(code);
    loadHabitsFromStorage(code);
    setShowSyncSetup(false);
  };

  const loadHabitsFromStorage = (code) => {
    try {
      const key = `habits-${code}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHabitsToStorage = (updatedHabits) => {
    if (!syncCode) return;
    
    try {
      const key = `habits-${syncCode}`;
      localStorage.setItem(key, JSON.stringify(updatedHabits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const resetSync = () => {
    if (window.confirm('This will disconnect this device and clear all data. Continue?')) {
      localStorage.removeItem('habit-sync-code');
      if (syncCode) {
        localStorage.removeItem(`habits-${syncCode}`);
      }
      setSyncCode('');
      setHabits([]);
      setShowSyncSetup(true);
    }
  };

  const copySyncCode = () => {
    navigator.clipboard.writeText(syncCode).then(() => {
      alert('Sync code copied to clipboard!');
    });
  };

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now(),
        name: newHabitName.trim(),
        completedDates: [],
        createdAt: new Date().toISOString()
      };
      setHabits([...habits, newHabit]);
      setNewHabitName('');
      setShowAddForm(false);
    }
  };

  const deleteHabit = (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      setHabits(habits.filter(h => h.id !== id));
      if (selectedHabit?.id === id) setSelectedHabit(null);
    }
  };

  const toggleHabitDate = (habitId, dateStr) => {
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
    setHabits(updatedHabits);
  };

  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sortedDates = completedDates
      .map(d => new Date(d))
      .sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let date of sortedDates) {
      date.setHours(0, 0, 0, 0);
      const diffTime = currentDate - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays === streak + 1) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sortedDates = completedDates
      .map(d => new Date(d))
      .sort((a, b) => a - b);
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const diffTime = currDate - prevDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  const isCompletedToday = (completedDates) => {
    const today = new Date().toDateString();
    return completedDates && completedDates.includes(today);
  };

  const getTotalActiveStreak = () => {
    return habits.reduce((sum, habit) => sum + calculateStreak(habit.completedDates), 0);
  };

  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => isCompletedToday(h.completedDates)).length;
    return Math.round((completed / habits.length) * 100);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateCompleted = (habit, day) => {
    if (!habit || !day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toDateString();
    return habit.completedDates && habit.completedDates.includes(dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = (habit) => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isCompleted = isDateCompleted(habit, day);
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = date.toDateString();
      const isToday = dateStr === new Date().toDateString();
      const isFuture = date > new Date();
      
      days.push(
        <button
          key={day}
          onClick={() => !isFuture && toggleHabitDate(habit.id, dateStr)}
          disabled={isFuture}
          className={`h-8 md:h-10 rounded-lg flex items-center justify-center text-sm transition-all ${
            isCompleted
              ? 'bg-green-500 text-white hover:bg-green-600'
              : isToday
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              : isFuture
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {isCompleted ? <Check className="w-4 h-4" /> : day}
        </button>
      );
    }
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="font-semibold text-gray-800">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 mb-1">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Sync Setup Screen
  if (showSyncSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <Key className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Sync</h2>
            <p className="text-gray-600">Keep your habits synced across all devices</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={createNewSync}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium"
            >
              Create New Sync Code
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter existing sync code
              </label>
              <input
                type="text"
                value={inputSyncCode}
                onChange={(e) => setInputSyncCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-center text-lg font-mono uppercase"
                maxLength={8}
              />
            </div>

            <button
              onClick={connectWithCode}
              className="w-full py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Connect with Code
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>How it works:</strong> Create a sync code and use the same code on all your devices to keep your habits in sync!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-indigo-600 animate-pulse">Loading your habits...</div>
      </div>
    );
  }

  if (selectedHabit) {
    const habit = habits.find(h => h.id === selectedHabit.id);
    if (!habit) {
      setSelectedHabit(null);
      return null;
    }
    
    const currentStreak = calculateStreak(habit.completedDates);
    const longestStreak = calculateLongestStreak(habit.completedDates);
    const totalDays = habit.completedDates ? habit.completedDates.length : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedHabit(null)}
            className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Habits
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{habit.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-orange-600 text-lg">{currentStreak}</span>
                    <span className="text-gray-600">day streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-yellow-600 text-lg">{longestStreak}</span>
                    <span className="text-gray-600">best</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-blue-600 text-lg">{totalDays}</span>
                    <span className="text-gray-600">total</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-red-400 hover:text-red-600 transition-colors p-2"
                title="Delete habit"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
            
            {renderCalendar(habit)}
            
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700">
                💡 <strong>Tip:</strong> Click on any day to mark it as completed. Green checkmarks show your progress!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalStreak = getTotalActiveStreak();
  const completionRate = getCompletionRate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Habit Tracker
            </h1>
          </div>
          <p className="text-gray-600">Build consistent habits, one day at a time</p>
          
          {/* Sync Info */}
          {syncCode && (
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <Key className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-mono font-semibold text-gray-700">{syncCode}</span>
                <button
                  onClick={copySyncCode}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy sync code"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <button
                onClick={resetSync}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          )}
        </div>

        {habits.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">Total Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{totalStreak}</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Habit
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Enter habit name"
                className="flex-1 px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={addHabit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewHabitName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No habits yet</h3>
            <p className="text-gray-500">Click "Add New Habit" to start your journey!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const currentStreak = calculateStreak(habit.completedDates);
              const longestStreak = calculateLongestStreak(habit.completedDates);
              const completedToday = isCompletedToday(habit.completedDates);
              const totalDays = habit.completedDates ? habit.completedDates.length : 0;

              return (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit)}
                  className={`bg-white rounded-xl shadow-md p-4 transition-all cursor-pointer hover:shadow-lg ${
                    completedToday ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{habit.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-semibold text-orange-600">{currentStreak}</span>
                          <span className="text-gray-600">day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">{longestStreak}</span>
                          <span className="text-gray-600">best</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold text-blue-600">{totalDays}</span>
                          <span className="text-gray-600">total</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-indigo-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Click to view calendar →
                      </div>
                    </div>
                    {completedToday && (
                      <div className="ml-2">
                        <div className="bg-green-500 text-white p-2 rounded-full">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Synced with code: {syncCode}</p>
        </div>
      </div>
    </div>
  );
}
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [syncing, setSyncing] = useState(false);
  
  // Auth state
  const { user, loading: authLoading, signIn, signUp, signOut } = useFirebaseAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    loadHabits();
  }, [user]);

  const loadHabits = () => {
    try {
      if (user) {
        // Load from user-specific key
        const stored = localStorage.getItem(`habits-${user.uid}`);
        if (stored) {
          setHabits(JSON.parse(stored));
        }
      } else {
        // Load from local storage
        const stored = localStorage.getItem('habits-data');
        if (stored) {
          setHabits(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.log('No existing habits found');
    }
  };

  const saveHabits = (updatedHabits) => {
    try {
      if (user) {
        // Save to user-specific key
        localStorage.setItem(`habits-${user.uid}`, JSON.stringify(updatedHabits));
        // In real app: also save to Firebase here
        // await setDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
      } else {
        // Save locally
        localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      }
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Failed to save habits:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      
      // Migrate local data to user account
      const localHabits = localStorage.getItem('habits-data');
      if (localHabits) {
        const habits = JSON.parse(localHabits);
        saveHabits(habits);
      }
      
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message || 'Authentication failed');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Sign out? Your data will remain saved for when you sign back in.')) {
      await signOut();
      setHabits([]);
    }
  };

  const addHabit = () => {
    if (newHabitName.trim()) {
      const newHabit = {
        id: Date.now(),
        name: newHabitName.trim(),
        completedDates: [],
        createdAt: new Date().toISOString()
      };
      saveHabits([...habits, newHabit]);
      setNewHabitName('');
      setShowAddForm(false);
    }
  };

  const deleteHabit = (id, e) => {
    e?.stopPropagation();
    if (window.confirm('Are you sure you want to delete this habit?')) {
      saveHabits(habits.filter(h => h.id !== id));
      if (selectedHabit?.id === id) setSelectedHabit(null);
    }
  };

  const toggleHabitDate = (habitId, dateStr) => {
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
    saveHabits(updatedHabits);
  };

  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sortedDates = completedDates
      .map(d => new Date(d))
      .sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let date of sortedDates) {
      date.setHours(0, 0, 0, 0);
      const diffTime = currentDate - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays === streak + 1) {
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const calculateLongestStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sortedDates = completedDates
      .map(d => new Date(d))
      .sort((a, b) => a - b);
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const diffTime = currDate - prevDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  const isCompletedToday = (completedDates) => {
    const today = new Date().toDateString();
    return completedDates && completedDates.includes(today);
  };

  const getTotalActiveStreak = () => {
    return habits.reduce((sum, habit) => sum + calculateStreak(habit.completedDates), 0);
  };

  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => isCompletedToday(h.completedDates)).length;
    return Math.round((completed / habits.length) * 100);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isDateCompleted = (habit, day) => {
    if (!habit || !day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toDateString();
    return habit.completedDates && habit.completedDates.includes(dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = (habit) => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isCompleted = isDateCompleted(habit, day);
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = date.toDateString();
      const isToday = dateStr === new Date().toDateString();
      const isFuture = date > new Date();
      
      days.push(
        <button
          key={day}
          onClick={() => !isFuture && toggleHabitDate(habit.id, dateStr)}
          disabled={isFuture}
          className={`h-8 md:h-10 rounded-lg flex items-center justify-center text-sm transition-all ${
            isCompleted
              ? 'bg-green-500 text-white hover:bg-green-600'
              : isToday
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              : isFuture
              ? 'text-gray-300 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          {isCompleted ? <Check className="w-4 h-4" /> : day}
        </button>
      );
    }
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="font-semibold text-gray-800">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 mb-1">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-indigo-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (selectedHabit) {
    const habit = habits.find(h => h.id === selectedHabit.id);
    if (!habit) {
      setSelectedHabit(null);
      return null;
    }
    
    const currentStreak = calculateStreak(habit.completedDates);
    const longestStreak = calculateLongestStreak(habit.completedDates);
    const totalDays = habit.completedDates ? habit.completedDates.length : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedHabit(null)}
            className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Habits
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{habit.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold text-orange-600 text-lg">{currentStreak}</span>
                    <span className="text-gray-600">day streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-yellow-600 text-lg">{longestStreak}</span>
                    <span className="text-gray-600">best</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-blue-600 text-lg">{totalDays}</span>
                    <span className="text-gray-600">total</span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => deleteHabit(habit.id, e)}
                className="text-red-400 hover:text-red-600 transition-colors p-2"
                title="Delete habit"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
            
            {renderCalendar(habit)}
            
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700">
                💡 <strong>Tip:</strong> Click on any day to mark it as completed. Green checkmarks show your progress!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalStreak = getTotalActiveStreak();
  const completionRate = getCompletionRate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Habit Tracker
            </h1>
          </div>
          <p className="text-gray-600">Build consistent habits, one day at a time</p>
          
          <div className="mt-3 flex items-center justify-center gap-2">
            {!user ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Sync
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {habits.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-600">Total Streak</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{totalStreak}</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Today</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New Habit
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                placeholder="Enter habit name"
                className="flex-1 px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={addHabit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewHabitName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No habits yet</h3>
            <p className="text-gray-500">Click "Add New Habit" to start your journey!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const currentStreak = calculateStreak(habit.completedDates);
              const longestStreak = calculateLongestStreak(habit.completedDates);
              const completedToday = isCompletedToday(habit.completedDates);
              const totalDays = habit.completedDates ? habit.completedDates.length : 0;

              return (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit)}
                  className={`bg-white rounded-xl shadow-md p-4 transition-all cursor-pointer hover:shadow-lg ${
                    completedToday ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{habit.name}</h3>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-semibold text-orange-600">{currentStreak}</span>
                          <span className="text-gray-600">day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">{longestStreak}</span>
                          <span className="text-gray-600">best</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold text-blue-600">{totalDays}</span>
                          <span className="text-gray-600">total</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-indigo-600 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Click to view calendar →
                      </div>
                    </div>
                    {completedToday && (
                      <div className="ml-2">
                        <div className="bg-green-500 text-white p-2 rounded-full">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{user ? 'Synced across all your devices' : 'Data saved locally - Sign in to sync'}</p>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2 border rounded px-3 py-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="flex-1 outline-none text-sm"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2 border rounded px-3 py-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a secure password"
                    required
                    className="flex-1 outline-none text-sm"
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>

              {authError && (
                <div className="text-sm text-red-600">
                  {authError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  disabled={authLoading}
                >
                  {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>

              <div className="text-center text-sm text-gray-600">
                {authMode === 'signin' ? (
                  <>
                    <span>Don’t have an account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>

              <div className="pt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    // Continue without signing in (keeps data local)
                    setShowAuthModal(false);
                    setAuthError('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Continue without signing in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

