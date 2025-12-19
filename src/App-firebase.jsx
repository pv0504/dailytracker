import React, { useState, useEffect } from 'react';
import { Check, X, Flame, Trophy, Plus, Trash2, Calendar, TrendingUp, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadHabitsFromFirebase(currentUser.uid);
      } else {
        loadHabitsFromLocal();
      }
    });
    return unsubscribe;
  }, []);

  // Real-time sync listener
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.habits) {
            setHabits(data.habits);
            localStorage.setItem('habits-data', JSON.stringify(data.habits));
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to habits:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const loadHabitsFromLocal = () => {
    try {
      const stored = localStorage.getItem('habits-data');
      if (stored) {
        setHabits(JSON.parse(stored));
      }
    } catch (error) {
      console.log('No existing habits found');
    } finally {
      setLoading(false);
    }
  };

  const loadHabitsFromFirebase = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.habits) {
          setHabits(data.habits);
          localStorage.setItem('habits-data', JSON.stringify(data.habits));
        }
      } else {
        // First time, try to migrate from localStorage
        const stored = localStorage.getItem('habits-data');
        if (stored) {
          const localHabits = JSON.parse(stored);
          await saveHabitsToFirebase(localHabits, uid);
          setHabits(localHabits);
        }
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
      loadHabitsFromLocal();
    } finally {
      setLoading(false);
    }
  };

  const saveHabitsToFirebase = async (updatedHabits, uid = user?.uid) => {
    if (!uid) {
      // Save locally if not logged in
      localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
      return;
    }

    try {
      setSyncing(true);
      await setDoc(doc(db, 'users', uid), {
        habits: updatedHabits,
        lastUpdated: new Date().toISOString()
      });
      localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Failed to save habits:', error);
      alert('Failed to sync. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setHabits([]);
      localStorage.removeItem('habits-data');
    } catch (error) {
      console.error('Sign out error:', error);
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
      saveHabitsToFirebase([...habits, newHabit]);
      setNewHabitName('');
      setShowAddForm(false);
    }
  };

  const deleteHabit = (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
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
          
          {/* Sync Status */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {!user ? (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
              >
                <LogIn className="w-4 h-4" />
                Enable Sync
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-gray-600">{syncing ? 'Syncing...' : 'Synced'}</span>
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
          <p>{user ? 'Synced across all your devices' : 'Data saved locally'}</p>
        </div>
      </div>
    </div>
  );
}
// ```
//
// ### **Step 5: Firebase Security Rules**
//
// In Firebase Console → Firestore → Rules:
// ```
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }
