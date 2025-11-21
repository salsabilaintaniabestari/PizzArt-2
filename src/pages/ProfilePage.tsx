import React, { useState } from 'react';
import { User, Trophy, Pizza, Star, Calendar, Award, Target, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ProfilePage = () => {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'pizzas' | 'achievements' | 'stats'>('overview');

  const user = state.user;
  if (!user) return null;

  const userStats = {
    totalPizzas: 23,
    totalLikes: 456,
    totalOrders: 18,
    favoriteTopping: 'Pepperoni',
    memberSince: 'January 2025',
    rank: 'Pizza Master',
  };

  const achievements = [
    { id: 1, name: 'First Pizza', description: 'Buat pizza pertama kamu', icon: '🍕', unlocked: true, points: 50 },
    { id: 2, name: 'Social Butterfly', description: 'Dapatkan 100 likes', icon: '❤️', unlocked: true, points: 100 },
    { id: 3, name: 'Pizza Master', description: 'Buat 20 pizza', icon: '👨‍🍳', unlocked: true, points: 200 },
    { id: 4, name: 'Contest Winner', description: 'Menang kontes', icon: '🏆', unlocked: false, points: 500 },
    { id: 5, name: 'Flavor Explorer', description: 'Coba semua topping', icon: '🌟', unlocked: false, points: 300 },
    { id: 6, name: 'Community Star', description: 'Dapatkan 1000 likes', icon: '⭐', unlocked: false, points: 1000 },
  ];

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const completionRate = (unlockedAchievements.length / achievements.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white mb-8">
          <div className="flex items-center space-x-6">
            <div className="bg-white bg-opacity-20 p-6 rounded-full">
              <User size={48} />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">@{user.username}</h1>
              <p className="opacity-90 mb-2">{user.email}</p>
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <span className="font-semibold">{userStats.rank}</span>
                </div>
                <div className="flex items-center">
                  <Trophy size={16} className="mr-1" />
                  <span>{user.points} Poin</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span>Member since {userStats.memberSince}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'pizzas', label: 'My Pizzas', icon: Pizza },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'stats', label: 'Statistics', icon: TrendingUp },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-2xl p-6 text-center">
                  <Pizza size={32} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold">{userStats.totalPizzas}</div>
                  <div className="text-sm opacity-90">Total Pizza</div>
                </div>
                
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-2xl p-6 text-center">
                  <Star size={32} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold">{userStats.totalLikes}</div>
                  <div className="text-sm opacity-90">Total Likes</div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white rounded-2xl p-6 text-center">
                  <Trophy size={32} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold">{user.points}</div>
                  <div className="text-sm opacity-90">Total Poin</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-2xl p-6 text-center">
                  <Target size={32} className="mx-auto mb-2" />
                  <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
                  <div className="text-sm opacity-90">Achievement</div>
                </div>
              </div>
            )}

            {activeTab === 'pizzas' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Pizza Kreasi Saya</h3>
                  <button className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-pink-600 transition-all">
                    Buat Pizza Baru
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.communityPizzas.slice(0, 6).map((pizza) => (
                    <div key={pizza.id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-lg transition-all">
                      <div className="w-full h-32 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl mb-4 flex items-center justify-center text-4xl">
                        🍕
                      </div>
                      <h4 className="font-bold text-gray-800 mb-1">{pizza.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{pizza.size} • {pizza.toppings.length} toppings</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-pink-600">
                          <Star size={16} fill="currentColor" />
                          <span className="ml-1 font-semibold">{pizza.likes}</span>
                        </div>
                        <div className="font-bold text-green-600">Rp {pizza.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Achievement Progress</h3>
                  <div className="bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-pink-500 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-600 mt-2">
                    {unlockedAchievements.length} dari {achievements.length} achievement unlocked ({completionRate.toFixed(0)}%)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`rounded-2xl p-6 text-center transition-all transform hover:scale-105 ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <div className="text-4xl mb-3">{achievement.icon}</div>
                      <h4 className="font-bold mb-2">{achievement.name}</h4>
                      <p className="text-sm opacity-90 mb-3">{achievement.description}</p>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        achievement.unlocked 
                          ? 'bg-white bg-opacity-20' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        +{achievement.points} pts
                      </div>
                      {!achievement.unlocked && (
                        <div className="mt-2">
                          <div className="w-6 h-6 mx-auto bg-gray-300 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">Pizza Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h4 className="font-bold text-gray-800 mb-4">Favorite Toppings</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'Pepperoni', count: 12, percentage: 85 },
                          { name: 'Mushrooms', count: 8, percentage: 60 },
                          { name: 'Cheese', count: 6, percentage: 45 },
                          { name: 'Bacon', count: 4, percentage: 30 },
                        ].map((topping) => (
                          <div key={topping.name} className="flex items-center justify-between">
                            <span className="text-gray-700">{topping.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-2 bg-orange-500 rounded-full"
                                  style={{ width: `${topping.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{topping.count}x</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h4 className="font-bold text-gray-800 mb-4">Pizza Size Preference</h4>
                      <div className="space-y-3">
                        {[
                          { size: 'Large', count: 14, percentage: 60 },
                          { size: 'Medium', count: 7, percentage: 30 },
                          { size: 'Small', count: 2, percentage: 10 },
                        ].map((size) => (
                          <div key={size.size} className="flex items-center justify-between">
                            <span className="text-gray-700">{size.size}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-2 bg-gray-200 rounded-full">
                                <div 
                                  className="h-2 bg-pink-500 rounded-full"
                                  style={{ width: `${size.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{size.count}x</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl p-6">
                  <div className="bg-gradient-to-r from-red-800 to-red-900 text-white rounded-2xl p-6">
                    <h4 className="font-bold mb-4">Monthly Progress</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">8</div>
                        <div className="text-sm opacity-80">Pizzas Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">156</div>
                        <div className="text-sm opacity-80">Likes Received</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">320</div>
                        <div className="text-sm opacity-80">Points Earned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">2</div>
                        <div className="text-sm opacity-80">Achievements</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;