import React, { useState, useEffect } from 'react';
import { Check, X, Flame, Trophy, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';

export default function HabitTracker() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = () => {
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

  const saveHabits = (updatedHabits) => {
    try {
      localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Failed to save habits:', error);
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

  const deleteHabit = (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      saveHabits(habits.filter(h => h.id !== id));
    }
  };

  const toggleHabitToday = (habitId) => {
    const today = new Date().toDateString();
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const completedDates = habit.completedDates || [];
        if (completedDates.includes(today)) {
          return { ...habit, completedDates: completedDates.filter(d => d !== today) };
        } else {
          return { ...habit, completedDates: [...completedDates, today] };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-xl text-indigo-600 animate-pulse">Loading your habits...</div>
      </div>
    );
  }

  const totalStreak = getTotalActiveStreak();
  const completionRate = getCompletionRate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Habit Tracker
            </h1>
          </div>
          <p className="text-gray-600">Build consistent habits, one day at a time</p>
        </div>

        {/* Stats Overview */}
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

        {/* Add Habit Section */}
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

        {/* Habits List */}
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
                  className={`bg-white rounded-xl shadow-md p-4 transition-all ${
                    completedToday ? 'ring-2 ring-green-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
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
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-2"
                      title="Delete habit"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleHabitToday(habit.id)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      completedToday
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {completedToday ? (
                      <>
                        <Check className="w-5 h-5" />
                        Completed Today!
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" />
                        Mark as Done
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Data saved locally in your browser</p>
        </div>
      </div>
    </div>
  );
}
