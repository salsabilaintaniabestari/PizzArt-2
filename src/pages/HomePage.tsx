import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Users, Trophy, Sparkles, Star, ArrowRight, Zap, Heart, Crown, TrendingUp } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';

interface CommunityPost {
  id: string;
  user_name: string;
  caption: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: any;
  toppings?: string[];
}

interface Contest {
  id: string;
  name: string;
  description: string;
  prize: string;
  start_date: string;
  end_date: string;
  status?: string;
}

interface TopUser {
  user_name: string;
  total_posts: number;
  total_likes: number;
}

const HomePage = () => {
  const { authUser } = useUserAuth();
  const [trendingPizzas, setTrendingPizzas] = useState<CommunityPost[]>([]);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHomePageData();
  }, []);

  const loadHomePageData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTrendingPizzas(),
        loadActiveContest(),
        loadTopUsers()
      ]);
    } catch (error) {
      console.error('Error loading homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrendingPizzas = async () => {
    try {
      const postsQuery = query(
        collection(db, 'community_posts'),
        orderBy('likes_count', 'desc'),
        limit(3)
      );

      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];

      console.log('Trending pizzas loaded:', posts);
      setTrendingPizzas(posts);
    } catch (error) {
      console.error('Error loading trending pizzas:', error);
    }
  };

  const loadActiveContest = async () => {
    try {
      const contestsQuery = query(
        collection(db, 'contests'),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(contestsQuery);
      const contests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contest[];

      // Find active contest based on dates
      const now = new Date();
      const active = contests.find(contest => {
        const startDate = new Date(contest.start_date);
        const endDate = new Date(contest.end_date);
        return now >= startDate && now <= endDate;
      });

      console.log('Active contest loaded:', active);
      setActiveContest(active || null);
    } catch (error) {
      console.error('Error loading active contest:', error);
    }
  };

  const loadTopUsers = async () => {
    try {
      const postsQuery = query(
        collection(db, 'community_posts'),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];

      // Aggregate user statistics
      const userStats: { [key: string]: TopUser } = {};
      
      posts.forEach(post => {
        if (!userStats[post.user_name]) {
          userStats[post.user_name] = {
            user_name: post.user_name,
            total_posts: 0,
            total_likes: 0
          };
        }
        userStats[post.user_name].total_posts += 1;
        userStats[post.user_name].total_likes += post.likes_count || 0;
      });

      // Convert to array and sort by total likes
      const topUsersList = Object.values(userStats)
        .sort((a, b) => b.total_likes - a.total_likes)
        .slice(0, 3);

      console.log('Top users loaded:', topUsersList);
      setTopUsers(topUsersList);
    } catch (error) {
      console.error('Error loading top users:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent mb-6">
              Selamat Datang di Pizzart! 🍕
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Platform pizza interaktif yang menggabungkan <span className="font-semibold text-red-600">kreativitas</span>, 
              <span className="font-semibold text-red-700"> gamifikasi</span>, dan 
              <span className="font-semibold text-red-800"> teknologi</span> untuk pengalaman pemesanan pizza yang tak terlupakan!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/order"
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2"
            >
              <Sparkles size={24} />
              <span>Buat Pizza Sekarang!</span>
            </Link>
            
            <Link
              to="/community"
              className="bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg flex items-center space-x-2 border-2 border-red-300"
            >
              <Users size={24} />
              <span>Jelajahi Komunitas</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">🍕</div>
              <div className="text-3xl font-bold text-red-600">1,234</div>
              <div className="text-gray-600">Pizza Dibuat</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">👨‍🍳</div>
              <div className="text-3xl font-bold text-red-700">567</div>
              <div className="text-gray-600">Chef Kreatif</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold text-yellow-600">4.9</div>
              <div className="text-gray-600">Rating Rata-rata</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-900 via-red-800 to-red-900">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            Kenapa Memilih Pizzart? ✨
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pizza size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Kustomisasi Tanpa Batas</h3>
              <p className="text-gray-300">Buat pizza unik dengan puluhan topping dan kombinasi rasa</p>
            </div>
            
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-red-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Gamifikasi Seru</h3>
              <p className="text-gray-300">Kumpulkan poin, unlock achievement, dan ikuti kontes mingguan</p>
            </div>
            
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-yellow-500 to-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Komunitas Kreatif</h3>
              <p className="text-gray-300">Bagikan kreasi dan dapatkan inspirasi dari chef lain</p>
            </div>
            
            <div className="text-center text-white transform hover:scale-105 transition-all">
              <div className="bg-gradient-to-r from-red-600 to-red-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Kualitas Premium</h3>
              <p className="text-gray-300">Bahan segar berkualitas tinggi dengan cita rasa autentik</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-4">
              🔥 Pizza Trending
            </h2>
            <p className="text-gray-600 text-lg">Kreasi terpopuler dari komunitas Pizzart</p>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat pizza trending...</p>
            </div>
          ) : trendingPizzas.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {trendingPizzas.map((pizza, index) => (
                  <div key={pizza.id} className="bg-white rounded-3xl p-6 shadow-xl transform hover:scale-105 transition-all">
                    <div className="relative">
                      <div className="w-full h-48 rounded-2xl mb-4 overflow-hidden">
                        <img 
                          src={pizza.image_url || 'https://via.placeholder.com/400x300?text=Pizza'} 
                          alt={pizza.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <TrendingUp size={16} />
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm text-gray-500 mb-1">by @{pizza.user_name}</p>
                      <h3 className="text-xl font-bold text-gray-800 line-clamp-2">{pizza.caption}</h3>
                    </div>
                    
                    {pizza.toppings && pizza.toppings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {pizza.toppings.slice(0, 3).map((topping, idx) => (
                          <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                            {topping}
                          </span>
                        ))}
                        {pizza.toppings.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            +{pizza.toppings.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-red-600">
                          <Heart size={18} fill="currentColor" />
                          <span className="ml-1 font-semibold">{pizza.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center text-blue-600">
                          <span className="text-xl">💬</span>
                          <span className="ml-1 font-semibold">{pizza.comments_count || 0}</span>
                        </div>
                      </div>
                      <Link 
                        to="/community"
                        className="text-orange-600 font-semibold hover:text-orange-700 text-sm"
                      >
                        Lihat Detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  to="/community"
                  className="inline-flex items-center space-x-2 bg-white text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg border-2 border-red-300"
                >
                  <span>Lihat Semua Kreasi</span>
                  <ArrowRight size={20} />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <Pizza className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Belum ada pizza trending. Jadilah yang pertama!</p>
              <Link
                to="/order"
                className="inline-block mt-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all"
              >
                Buat Pizza Pertama
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Current Contest */}
      {activeContest && (
        <section className="py-20 px-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-red-500">
          <div className="container mx-auto text-center">
            <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <Trophy className="text-yellow-500 mr-2" size={48} />
                <h2 className="text-3xl font-bold text-gray-800">🏆 Kontes Aktif</h2>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-red-600 mb-2">{activeContest.name}</h3>
                <p className="text-gray-700 text-lg mb-4">{activeContest.description}</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-gray-600">Periode:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(activeContest.start_date).toLocaleDateString('id-ID')} - {new Date(activeContest.end_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-600">🏆 {activeContest.prize}</div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Link
                  to="/contests"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
                >
                  Ikuti Kontes
                </Link>
                <Link
                  to="/contests"
                  className="bg-white border-2 border-red-600 text-red-600 px-8 py-4 rounded-2xl font-bold hover:bg-red-50 transition-all transform hover:scale-105"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Different based on auth status */}
      {!authUser ? (
        <section className="py-20 px-4 bg-gradient-to-br from-yellow-100 to-red-100">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-6">
              Siap Memulai Petualangan Pizza? 🚀
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan pizza lover yang sudah merasakan pengalaman unik Pizzart!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg"
              >
                Daftar Gratis Sekarang
              </Link>
              <Link
                to="/login"
                className="bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-yellow-50 transition-all transform hover:scale-105 shadow-lg border-2 border-red-300"
              >
                Sudah Punya Akun?
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20 px-4 bg-gradient-to-br from-purple-100 via-pink-100 to-red-100">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                👑 Top Contributors
              </h2>
              <p className="text-gray-600 text-lg">Chef terbaik bulan ini yang menginspirasi komunitas!</p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat top contributors...</p>
              </div>
            ) : topUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {topUsers.map((user, index) => (
                  <div 
                    key={user.user_name} 
                    className={`bg-white rounded-3xl p-8 shadow-xl transform hover:scale-105 transition-all ${
                      index === 0 ? 'border-4 border-yellow-400' : 
                      index === 1 ? 'border-4 border-gray-400' : 
                      'border-4 border-orange-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {index === 0 && <Crown className="text-yellow-500" size={24} />}
                        <h3 className="text-2xl font-bold text-gray-800">@{user.user_name}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                          <div className="text-3xl font-bold text-red-600">{user.total_posts}</div>
                          <div className="text-sm text-gray-600">Pizza</div>
                        </div>
                        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4">
                          <div className="text-3xl font-bold text-pink-600">{user.total_likes}</div>
                          <div className="text-sm text-gray-600">Likes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg max-w-2xl mx-auto">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada data kontributor. Mulai berkreasi sekarang!</p>
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                to="/order"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105 shadow-lg"
              >
                <Sparkles size={24} />
                <span>Mulai Berkreasi!</span>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;