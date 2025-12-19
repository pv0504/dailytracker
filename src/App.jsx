// import React, { useState, useEffect } from 'react';
// import { Check, X, Flame, Trophy, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';
//
// export default function HabitTracker() {
//   const [habits, setHabits] = useState([]);
//   const [newHabitName, setNewHabitName] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [showAddForm, setShowAddForm] = useState(false);
//
//   useEffect(() => {
//     loadHabits();
//   }, []);
//
//   const loadHabits = () => {
//     try {
//       const stored = localStorage.getItem('habits-data');
//       if (stored) {
//         setHabits(JSON.parse(stored));
//       }
//     } catch (error) {
//       console.log('No existing habits found');
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   const saveHabits = (updatedHabits) => {
//     try {
//       localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
//       setHabits(updatedHabits);
//     } catch (error) {
//       console.error('Failed to save habits:', error);
//     }
//   };
//
//   const addHabit = () => {
//     if (newHabitName.trim()) {
//       const newHabit = {
//         id: Date.now(),
//         name: newHabitName.trim(),
//         completedDates: [],
//         createdAt: new Date().toISOString()
//       };
//       saveHabits([...habits, newHabit]);
//       setNewHabitName('');
//       setShowAddForm(false);
//     }
//   };
//
//   const deleteHabit = (id) => {
//     if (window.confirm('Are you sure you want to delete this habit?')) {
//       saveHabits(habits.filter(h => h.id !== id));
//     }
//   };
//
//   const toggleHabitToday = (habitId) => {
//     const today = new Date().toDateString();
//     const updatedHabits = habits.map(habit => {
//       if (habit.id === habitId) {
//         const completedDates = habit.completedDates || [];
//         if (completedDates.includes(today)) {
//           return { ...habit, completedDates: completedDates.filter(d => d !== today) };
//         } else {
//           return { ...habit, completedDates: [...completedDates, today] };
//         }
//       }
//       return habit;
//     });
//     saveHabits(updatedHabits);
//   };
//
//   const calculateStreak = (completedDates) => {
//     if (!completedDates || completedDates.length === 0) return 0;
//     
//     const sortedDates = completedDates
//       .map(d => new Date(d))
//       .sort((a, b) => b - a);
//     
//     let streak = 0;
//     let currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0);
//     
//     for (let date of sortedDates) {
//       date.setHours(0, 0, 0, 0);
//       const diffTime = currentDate - date;
//       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//       
//       if (diffDays === streak) {
//         streak++;
//       } else if (diffDays === streak + 1) {
//         continue;
//       } else {
//         break;
//       }
//     }
//     
//     return streak;
//   };
//
//   const calculateLongestStreak = (completedDates) => {
//     if (!completedDates || completedDates.length === 0) return 0;
//     
//     const sortedDates = completedDates
//       .map(d => new Date(d))
//       .sort((a, b) => a - b);
//     
//     let maxStreak = 1;
//     let currentStreak = 1;
//     
//     for (let i = 1; i < sortedDates.length; i++) {
//       const prevDate = sortedDates[i - 1];
//       const currDate = sortedDates[i];
//       const diffTime = currDate - prevDate;
//       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//       
//       if (diffDays === 1) {
//         currentStreak++;
//         maxStreak = Math.max(maxStreak, currentStreak);
//       } else if (diffDays > 1) {
//         currentStreak = 1;
//       }
//     }
//     
//     return maxStreak;
//   };
//
//   const isCompletedToday = (completedDates) => {
//     const today = new Date().toDateString();
//     return completedDates && completedDates.includes(today);
//   };
//
//   const getTotalActiveStreak = () => {
//     return habits.reduce((sum, habit) => sum + calculateStreak(habit.completedDates), 0);
//   };
//
//   const getCompletionRate = () => {
//     if (habits.length === 0) return 0;
//     const completed = habits.filter(h => isCompletedToday(h.completedDates)).length;
//     return Math.round((completed / habits.length) * 100);
//   };
//
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
//         <div className="text-xl text-indigo-600 animate-pulse">Loading your habits...</div>
//       </div>
//     );
//   }
//
//   const totalStreak = getTotalActiveStreak();
//   const completionRate = getCompletionRate();
//
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 pb-20">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-6">
//           <div className="flex items-center justify-center gap-3 mb-2">
//             <Flame className="w-10 h-10 text-orange-500" />
//             <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//               Habit Tracker
//             </h1>
//           </div>
//           <p className="text-gray-600">Build consistent habits, one day at a time</p>
//         </div>
//
//         {/* Stats Overview */}
//         {habits.length > 0 && (
//           <div className="grid grid-cols-2 gap-4 mb-6">
//             <div className="bg-white rounded-xl shadow-md p-4">
//               <div className="flex items-center gap-2 mb-1">
//                 <Flame className="w-5 h-5 text-orange-500" />
//                 <span className="text-sm text-gray-600">Total Streak</span>
//               </div>
//               <div className="text-2xl font-bold text-orange-600">{totalStreak}</div>
//             </div>
//             <div className="bg-white rounded-xl shadow-md p-4">
//               <div className="flex items-center gap-2 mb-1">
//                 <TrendingUp className="w-5 h-5 text-green-500" />
//                 <span className="text-sm text-gray-600">Today</span>
//               </div>
//               <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
//             </div>
//           </div>
//         )}
//
//         {/* Add Habit Section */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-6">
//           {!showAddForm ? (
//             <button
//               onClick={() => setShowAddForm(true)}
//               className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] font-medium"
//             >
//               <Plus className="w-5 h-5" />
//               Add New Habit
//             </button>
//           ) : (
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={newHabitName}
//                 onChange={(e) => setNewHabitName(e.target.value)}
//                 onKeyPress={(e) => e.key === 'Enter' && addHabit()}
//                 placeholder="Enter habit name"
//                 className="flex-1 px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
//                 autoFocus
//               />
//               <button
//                 onClick={addHabit}
//                 className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
//               >
//                 Add
//               </button>
//               <button
//                 onClick={() => {
//                   setShowAddForm(false);
//                   setNewHabitName('');
//                 }}
//                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
//               >
//                 Cancel
//               </button>
//             </div>
//           )}
//         </div>
//
//         {/* Habits List */}
//         {habits.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-md p-12 text-center">
//             <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">No habits yet</h3>
//             <p className="text-gray-500">Click "Add New Habit" to start your journey!</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {habits.map(habit => {
//               const currentStreak = calculateStreak(habit.completedDates);
//               const longestStreak = calculateLongestStreak(habit.completedDates);
//               const completedToday = isCompletedToday(habit.completedDates);
//               const totalDays = habit.completedDates ? habit.completedDates.length : 0;
//
//               return (
//                 <div
//                   key={habit.id}
//                   className={`bg-white rounded-xl shadow-md p-4 transition-all ${
//                     completedToday ? 'ring-2 ring-green-400' : ''
//                   }`}
//                 >
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1">
//                       <h3 className="text-lg font-bold text-gray-800 mb-2">{habit.name}</h3>
//                       <div className="flex flex-wrap gap-3 text-sm">
//                         <div className="flex items-center gap-1">
//                           <Flame className="w-4 h-4 text-orange-500" />
//                           <span className="font-semibold text-orange-600">{currentStreak}</span>
//                           <span className="text-gray-600">day</span>
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <Trophy className="w-4 h-4 text-yellow-500" />
//                           <span className="font-semibold text-yellow-600">{longestStreak}</span>
//                           <span className="text-gray-600">best</span>
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <Calendar className="w-4 h-4 text-blue-500" />
//                           <span className="font-semibold text-blue-600">{totalDays}</span>
//                           <span className="text-gray-600">total</span>
//                         </div>
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => deleteHabit(habit.id)}
//                       className="text-red-400 hover:text-red-600 transition-colors p-2"
//                       title="Delete habit"
//                     >
//                       <Trash2 className="w-5 h-5" />
//                     </button>
//                   </div>
//
//                   <button
//                     onClick={() => toggleHabitToday(habit.id)}
//                     className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
//                       completedToday
//                         ? 'bg-green-500 text-white hover:bg-green-600'
//                         : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                     }`}
//                   >
//                     {completedToday ? (
//                       <>
//                         <Check className="w-5 h-5" />
//                         Completed Today!
//                       </>
//                     ) : (
//                       <>
//                         <X className="w-5 h-5" />
//                         Mark as Done
//                       </>
//                     )}
//                   </button>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//
//         {/* Footer */}
//         <div className="text-center mt-8 text-gray-500 text-sm">
//           <p>Data saved locally in your browser</p>
//         </div>
//       </div>
//     </div>
//   );
// }
// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  Check,
  X,
  Flame,
  Trophy,
  Plus,
  Trash2,
  Calendar,
  Download,
  Upload,
  Edit2,
} from "lucide-react";

/* ---------- Helpers ---------- */
const STORAGE_KEY = "habit-tracker-v1";

const todayISO = () => {
  const d = new Date();
  // get YYYY-MM-DD (local)
  const year = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${m}-${day}`;
};

const addDaysISO = (isoDate, delta) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

/* ---------- Storage ---------- */
const loadHabitsFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("load error", e);
    return [];
  }
};

const saveHabitsToStorage = (habits) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error("save error", e);
  }
};

/* ---------- Streak Calculations ---------- */
const calculateCurrentStreak = (dates = []) => {
  const set = new Set((dates || []).map((d) => d));
  let streak = 0;
  let day = todayISO();
  while (set.has(day)) {
    streak++;
    day = addDaysISO(day, -1);
  }
  return streak;
};

const calculateLongestStreak = (dates = []) => {
  if (!dates || dates.length === 0) return 0;
  const uniq = Array.from(new Set(dates)).sort(); // ascending YYYY-MM-DD works
  let maxS = 1;
  let curr = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = uniq[i - 1];
    const cur = uniq[i];
    if (addDaysISO(prev, 1) === cur) {
      curr++;
      if (curr > maxS) maxS = curr;
    } else {
      curr = 1;
    }
  }
  return maxS;
};

/* ---------- Component ---------- */
export default function App() {
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    setHabits(loadHabitsFromStorage());
  }, []);

  useEffect(() => {
    saveHabitsToStorage(habits);
  }, [habits]);

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    const newHabit = {
      id: Date.now(),
      name,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setHabits((s) => [newHabit, ...s]);
    setNewHabitName("");
    setShowAddForm(false);
  };

  const deleteHabit = (id) => {
    if (!confirm("Delete this habit?")) return;
    setHabits((s) => s.filter((h) => h.id !== id));
  };

  const toggleToday = (id) => {
    const d = todayISO();
    setHabits((list) =>
      list.map((h) => {
        if (h.id !== id) return h;
        const set = new Set(h.completedDates || []);
        if (set.has(d)) {
          set.delete(d);
        } else {
          set.add(d);
        }
        return { ...h, completedDates: Array.from(set).sort() };
      })
    );
  };

  const startEdit = (h) => {
    setEditingId(h.id);
    setEditName(h.name);
  };
  const saveEdit = () => {
    setHabits((s) => s.map((h) => (h.id === editingId ? { ...h, name: editName } : h)));
    setEditingId(null);
    setEditName("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const exportJSON = () => {
    const data = JSON.stringify(habits, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "habits-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) throw new Error("Bad file");
        // Basic validation: ensure fields exist
        const cleaned = parsed.map((h) => ({
          id: h.id ?? Date.now() + Math.random(),
          name: h.name ?? "Untitled",
          completedDates: Array.isArray(h.completedDates) ? [...new Set(h.completedDates)] : [],
          createdAt: h.createdAt ?? new Date().toISOString(),
        }));
        setHabits(cleaned);
        alert("Import successful");
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Flame className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Habit Tracker</h1>
          </div>
          <p className="text-gray-600">Build consistent habits, one day at a time</p>
        </div>

        {/* Add / Import / Export */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex gap-3 items-center">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add New Habit
            </button>
          ) : (
            <div className="flex gap-2 w-full">
              <input
                className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                placeholder="Enter habit name"
                autoFocus
              />
              <button onClick={addHabit} className="px-4 py-3 bg-green-500 text-white rounded-xl">
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewHabitName("");
                }}
                className="px-4 py-3 bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={exportJSON}
              className="px-3 py-2 bg-white border rounded-xl flex items-center gap-2"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <label className="px-3 py-2 bg-white border rounded-xl flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => importJSON(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        {/* Habits */}
        {habits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No habits yet</h3>
            <p className="text-gray-500">Click "Add New Habit" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((h) => {
              const current = calculateCurrentStreak(h.completedDates || []);
              const best = calculateLongestStreak(h.completedDates || []);
              const total = new Set(h.completedDates || []).size;
              const doneToday = (h.completedDates || []).includes(todayISO());

              return (
                <div
                  key={h.id}
                  className={`bg-white rounded-2xl shadow p-4 transition transform hover:scale-[1.01] ${
                    doneToday ? "ring-2 ring-green-400" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-800">{h.name}</h3>
                        <button
                          title="Edit"
                          onClick={() => startEdit(h)}
                          className="text-gray-400 hover:text-gray-700 p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" /> <strong>{current}</strong> day
                          streak
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" /> <strong>{best}</strong> best
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" /> <strong>{total}</strong> total
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => deleteHabit(h.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleToday(h.id)}
                    className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
                      doneToday ? "bg-green-500 text-white hover:bg-green-600" : "bg-gray-100"
                    }`}
                  >
                    {doneToday ? (
                      <>
                        <Check className="w-5 h-5" /> Completed Today
                      </>
                    ) : (
                      <>
                        <X className="w-5 h-5" /> Mark as Done
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Edit modal-like inline */}
        {editingId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h4 className="font-semibold mb-3">Edit Habit</h4>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-gray-200">
                  Cancel
                </button>
                <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Saved locally. Export or sync for backup.</p>
        </div>
      </div>
    </div>
  );
}

