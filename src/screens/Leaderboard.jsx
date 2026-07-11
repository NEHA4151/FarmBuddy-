import { API_BASE } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import AnimatedCounter from '../components/AnimatedCounter';
import { 
  Award, 
  Search, 
  Trophy, 
  TrendingUp, 
  User, 
  Activity, 
  ArrowLeft,
  Loader2,
  Medal,
  ThumbsUp
} from 'lucide-react';

export default function Leaderboard() {
  const { setCurrentView } = useFarm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard`);
      if (res.ok) {
        const leaderboardData = await res.json();
        setData(leaderboardData);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleBack = () => {
    setCurrentView('farmer-dashboard');
  };

  const filteredData = data.filter(farmer => 
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = data.slice(0, 3);
  const currentUser = data.find(f => f.name === 'John Doe') || {
    rank: '-',
    name: 'John Doe',
    totalPoints: 0,
    totalBadges: 0,
    trustScore: 95
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-warmSand dark:bg-stone-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-black text-stone-900 dark:text-white">
              Global Farmer Leaderboard
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-10 w-10 text-emerald-800 animate-spin" />
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Loading rankings...</span>
          </div>
        ) : (
          <>
            {/* Top 3 Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {/* Rank 2 */}
              {topThree[1] && (
                <div className="bg-white dark:bg-stone-800 border border-stone-150 dark:border-stone-700/60 p-6 rounded-3xl text-center space-y-3 order-2 md:order-1 transform hover:scale-102 transition duration-300">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-stone-700 flex items-center justify-center relative">
                    <Medal className="h-7 w-7 text-slate-400" />
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-slate-500 text-white font-black text-xs rounded-full flex items-center justify-center">2</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-950 dark:text-white text-base">{topThree[1].name}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">{topThree[1].totalBadges} Badges</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-900/50 py-1.5 px-3 rounded-xl inline-block text-xs font-black text-stone-700 dark:text-stone-300">
                    {topThree[1].totalPoints} pts
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {topThree[0] && (
                <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-stone-800 border-2 border-amber-400/60 p-8 rounded-3xl text-center space-y-4 order-1 md:order-2 shadow-md transform hover:scale-103 transition duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/10 dark:bg-amber-500/5 rounded-bl-full flex items-center justify-center pl-4 pb-4">
                    <Trophy className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center relative">
                    <Trophy className="h-10 w-10 text-amber-500 animate-pulse" />
                    <span className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-amber-500 text-white font-black text-xs rounded-full flex items-center justify-center shadow">1</span>
                  </div>
                  <div>
                    <h3 className="font-black text-stone-950 dark:text-white text-lg">{topThree[0].name}</h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 font-bold">{topThree[0].totalBadges} Badges • Trust: {topThree[0].trustScore}%</p>
                  </div>
                  <div className="bg-amber-500 text-white py-2 px-4 rounded-xl inline-block text-sm font-black shadow-sm">
                    {topThree[0].totalPoints} pts
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {topThree[2] && (
                <div className="bg-white dark:bg-stone-800 border border-stone-150 dark:border-stone-700/60 p-6 rounded-3xl text-center space-y-3 order-3 md:order-3 transform hover:scale-102 transition duration-300">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-100/40 dark:bg-stone-700 flex items-center justify-center relative">
                    <Medal className="h-7 w-7 text-amber-700/70" />
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-amber-700/80 text-white font-black text-xs rounded-full flex items-center justify-center">3</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-950 dark:text-white text-base">{topThree[2].name}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">{topThree[2].totalBadges} Badges</p>
                  </div>
                  <div className="bg-stone-50 dark:bg-stone-900/50 py-1.5 px-3 rounded-xl inline-block text-xs font-black text-stone-700 dark:text-stone-300">
                    {topThree[2].totalPoints} pts
                  </div>
                </div>
              )}
            </div>

            {/* Current Farmer Status Card */}
            <div className="bg-emerald-800 text-white p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm border border-emerald-700">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-emerald-200 uppercase tracking-widest block">Your Rank</span>
                  <h4 className="text-lg font-black">{currentUser.name} (Rank #{currentUser.rank})</h4>
                </div>
              </div>
              <div className="flex gap-6 text-xs text-emerald-100">
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-300 tracking-wider block">Total Points</span>
                  <span className="text-base font-black text-white mt-0.5 block"><AnimatedCounter value={currentUser.totalPoints} /> pts</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-300 tracking-wider block">Badges Unlocked</span>
                  <span className="text-base font-black text-white mt-0.5 block">{currentUser.totalBadges} Badges</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-emerald-300 tracking-wider block">Avg Trust Score</span>
                  <span className="text-base font-black text-white mt-0.5 block">{currentUser.trustScore}%</span>
                </div>
              </div>
            </div>

            {/* Full Rankings List */}
            <div className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-black text-stone-900 dark:text-white">All Farmer Standings</h2>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-stone-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-800 transition"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-700/50 text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      <th className="py-3.5 px-3">Rank</th>
                      <th className="py-3.5 px-3">Farmer</th>
                      <th className="py-3.5 px-3">Total Points</th>
                      <th className="py-3.5 px-3">Badges</th>
                      <th className="py-3.5 px-3">Trust Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((f) => {
                      const isMe = f.name === 'John Doe';
                      let rankBadge = null;
                      if (f.rank === 1) rankBadge = '🥇';
                      else if (f.rank === 2) rankBadge = '🥈';
                      else if (f.rank === 3) rankBadge = '🥉';
                      
                      return (
                        <tr 
                          key={f.name}
                          className={`border-b border-stone-100/50 dark:border-stone-700/30 text-xs font-bold transition hover:bg-stone-50/50 dark:hover:bg-stone-900/10 ${
                            isMe ? 'bg-emerald-500/5 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-350' : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <td className="py-3.5 px-3 font-extrabold flex items-center gap-1">
                            <span className="w-6 inline-block">{f.rank}</span>
                            <span>{rankBadge}</span>
                          </td>
                          <td className="py-3.5 px-3 font-extrabold">{f.name} {isMe && <span className="text-[9px] uppercase font-black bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 px-1.5 py-0.5 rounded ml-1.5">You</span>}</td>
                          <td className="py-3.5 px-3 font-black text-stone-900 dark:text-white">{f.totalPoints}</td>
                          <td className="py-3.5 px-3">{f.totalBadges} unlocked</td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${f.trustScore >= 95 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>{f.trustScore}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
