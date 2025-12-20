import React, { useState, useEffect } from 'react';
import { Check, X, Flame, Trophy, Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { db, auth, googleProvider } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  // Auth listener

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // User signed in → load data
                setLoading(true);
                loadHabitsFromFirebase(currentUser.uid);
            } else {
                setHabits([]);
                setSelectedHabit(null);
                setCurrentMonth(new Date());
                setSyncing(false);
                setError('');
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);


  // Real-time sync
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.habits) {
            setHabits(data.habits);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Sync error:', error);
        setError('Sync error. Check connection.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const loadHabitsFromFirebase = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.habits) {
          setHabits(data.habits);
        }
      }
    } catch (error) {
      console.error('Error loading:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveHabitsToFirebase = async (updatedHabits) => {
    if (!user) return;

    try {
      setSyncing(true);
      setError('');
      
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

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Popup blocked. Allow popups.');
      } else {
        setError('Sign in failed. Try again.');
      }
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
    saveHabitsToFirebase(updatedHabits);
  };

  // [Copy all the calculation functions from the artifact above]
  const calculateStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sortedDates = completedDates.map(d => new Date(d)).sort((a, b) => b - a);
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    for (let date of sortedDates) {
      date.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) streak++;
      else if (diffDays === streak + 1) continue;
      else break;
    }
    return streak;
  };

  const calculateLongestStreak = (completedDates) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sortedDates = completedDates.map(d => new Date(d)).sort((a, b) => a - b);
    let maxStreak = 1, currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays = Math.floor((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
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
    return completedDates && completedDates.includes(new Date().toDateString());
  };

  const getTotalActiveStreak = () => {
    return habits.reduce((sum, h) => sum + calculateStreak(h.completedDates), 0);
  };

  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    return Math.round((habits.filter(h => isCompletedToday(h.completedDates)).length / habits.length) * 100);
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
                onClick={(e) => {
                  e.stopPropagation();
                  deleteHabit(habit.id);
                }}
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
        {/* Demo Notice */}
        <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> This is a preview. For real Firebase sync, use the code in your local project.
          </p>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Habit Tracker
            </h1>
          </div>
          <p className="text-gray-600">Build consistent habits, one day at a time</p>
          
          <div className="mt-3 flex flex-col items-center gap-2">
            {!user ? (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google (Demo)
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <User className="w-5 h-5 text-indigo-500" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-800">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-xs text-gray-600">{syncing ? 'Syncing...' : 'Synced'}</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
            
            {error && (
              <div className="mt-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
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
            {!user && (
              <p className="text-sm text-indigo-600 mt-3">
                💡 Sign in to sync across all your devices
              </p>
            )}
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
          <p>{user ? `Demo: Synced as ${user.email}` : 'Sign in to sync across devices'}</p>
        </div>
      </div>
    </div>
  );
}
