import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Users, Gift, Calendar, Star, Award, Filter, Image } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { Contest, CommunityPost } from '../types';

const ContestPage = () => {
  const { authUser } = useUserAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'past'>('active');
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [contestSubmissions, setContestSubmissions] = useState<CommunityPost[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    loadContests();
    loadAllSubmissions();
  }, []);

  // Load all submissions once for participant count
  const loadAllSubmissions = async () => {
    try {
      const submissionsQuery = query(
        collection(db, 'community_posts'),
        where('is_for_contest', '==', true)
      );

      const snapshot = await getDocs(submissionsQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];

      console.log('All contest submissions loaded:', submissions);
      setAllSubmissions(submissions);
    } catch (error) {
      console.error('Error loading all submissions:', error);
    }
  };

  const loadContests = async () => {
    setIsLoading(true);
    try {
      // Load ALL contests first without status filter
      const allContestsQuery = query(
        collection(db, 'contests'),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(allContestsQuery);
      const contestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contest[];

      console.log('Loaded contests from Firestore:', contestsData);

      // Categorize contests based on dates
      const now = new Date();
      const categorizedContests = contestsData.map(contest => {
        const startDate = new Date(contest.start_date);
        const endDate = new Date(contest.end_date);
        
        let status: 'active' | 'upcoming' | 'finished';
        if (now < startDate) {
          status = 'upcoming';
        } else if (now >= startDate && now <= endDate) {
          status = 'active';
        } else {
          status = 'finished';
        }

        return { ...contest, status };
      });

      console.log('Categorized contests:', categorizedContests);
      setContests(categorizedContests);
    } catch (error) {
      console.error('Error loading contests:', error);
      alert('Gagal memuat kontes. Error: ' + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContestSubmissions = async (contestName: string) => {
    try {
      console.log('Loading submissions for contest:', contestName);
      
      const submissionsQuery = query(
        collection(db, 'community_posts'),
        where('is_for_contest', '==', true),
        where('contest_name', '==', contestName),
        orderBy('likes_count', 'desc')
      );

      const snapshot = await getDocs(submissionsQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];

      console.log(`Loaded ${submissions.length} submissions for contest: ${contestName}`);
      setContestSubmissions(submissions);
    } catch (error) {
      console.error('Error loading contest submissions:', error);
      
      // Fallback: try without orderBy if composite index doesn't exist
      try {
        console.log('Trying fallback query without orderBy...');
        const fallbackQuery = query(
          collection(db, 'community_posts'),
          where('is_for_contest', '==', true),
          where('contest_name', '==', contestName)
        );

        const snapshot = await getDocs(fallbackQuery);
        const submissions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as CommunityPost[];

        // Sort manually
        submissions.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        
        console.log(`Loaded ${submissions.length} submissions (fallback) for contest: ${contestName}`);
        setContestSubmissions(submissions);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        setContestSubmissions([]);
      }
    }
  };

  const handleJoinContest = (contest: Contest) => {
    if (!authUser) {
      alert('Silakan login untuk mengikuti kontes');
      navigate('/login');
      return;
    }

    alert(
      `Untuk mengikuti kontes "${contest.name}", silakan upload pizza Anda di halaman Community dan aktifkan toggle "Ikut Kontes".`
    );
    navigate('/community');
  };

  const handleViewSubmissions = async (contest: Contest) => {
    setSelectedContest(contest);
    await loadContestSubmissions(contest.name);
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getParticipantCount = (contestName: string) => {
    return allSubmissions.filter(s => s.contest_name === contestName).length;
  };

  const activeContests = contests.filter(c => c.status === 'active');
  const upcomingContests = contests.filter(c => c.status === 'upcoming');
  const pastContests = contests.filter(c => c.status === 'finished');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat kontes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Pizza Contests
          </h1>
          <p className="text-gray-600 text-lg">
            Tunjukkan kreativitasmu dan menangkan hadiah menarik!
          </p>
        </div>

        {activeContests.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 text-white mb-8 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-4">
                  <Trophy className="mr-2" size={32} />
                  <span className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    KONTES AKTIF
                  </span>
                </div>

                <h2 className="text-3xl font-bold mb-4">{activeContests[0].name}</h2>
                <p className="text-lg mb-6 opacity-90">{activeContests[0].description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                    <Clock size={24} className="mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {getTimeRemaining(activeContests[0].end_date)}
                    </div>
                    <div className="text-sm opacity-80">hari tersisa</div>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                    <Users size={24} className="mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {getParticipantCount(activeContests[0].name)}
                    </div>
                    <div className="text-sm opacity-80">peserta</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleJoinContest(activeContests[0])}
                    className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
                  >
                    Ikuti Kontes
                  </button>
                  <button
                    onClick={() => setShowRules(true)}
                    className="border-2 border-white text-white px-6 py-3 rounded-2xl font-bold hover:bg-white hover:text-orange-600 transition-all"
                  >
                    Lihat Aturan
                  </button>
                  <button
                    onClick={() => handleViewSubmissions(activeContests[0])}
                    className="border-2 border-white text-white px-6 py-3 rounded-2xl font-bold hover:bg-white hover:text-orange-600 transition-all"
                  >
                    Lihat Submisi
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-3xl p-6 mb-4">
                  <Gift className="mx-auto mb-4" size={64} />
                  <div className="text-2xl font-bold mb-2">Hadiah Utama</div>
                  <div className="text-3xl font-bold">{activeContests[0].prize}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="flex border-b">
            {[
              { id: 'active', label: 'Kontes Aktif', count: activeContests.length },
              { id: 'upcoming', label: 'Akan Datang', count: upcomingContests.length },
              { id: 'past', label: 'Selesai', count: pastContests.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'active' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Kontes yang Sedang Berlangsung</h3>
                {activeContests.length > 0 ? (
                  <div className="space-y-4">
                    {activeContests.map(contest => (
                      <div key={contest.id} className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-2xl font-bold text-orange-900 mb-2">{contest.name}</h4>
                            <p className="text-orange-800 mb-4">{contest.description}</p>
                            <div className="flex items-center gap-4 text-sm text-orange-700">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Berakhir: {new Date(contest.end_date).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Gift className="w-4 h-4" />
                                <span>{contest.prize}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{getParticipantCount(contest.name)} peserta</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleJoinContest(contest)}
                            className="px-6 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                          >
                            Ikuti Kontes
                          </button>
                          <button
                            onClick={() => handleViewSubmissions(contest)}
                            className="px-6 py-2 bg-white border-2 border-orange-600 text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
                          >
                            Lihat Submisi ({getParticipantCount(contest.name)})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                    <Trophy className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                    <p className="text-orange-800">Tidak ada kontes aktif saat ini. Tunggu kontes berikutnya!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Kontes Mendatang</h3>
                {upcomingContests.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingContests.map(contest => (
                      <div key={contest.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800 text-lg">{contest.name}</h4>
                          <p className="text-gray-600 text-sm mb-2">{contest.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Mulai: {new Date(contest.start_date).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Gift className="w-4 h-4" />
                              <span>{contest.prize}</span>
                            </div>
                          </div>
                        </div>
                        <button className="text-orange-600 text-sm font-semibold hover:text-orange-700 px-4 py-2 bg-orange-50 rounded-lg">
                          Set Reminder
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada kontes yang akan datang</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Kontes Selesai</h3>
                {pastContests.length > 0 ? (
                  <div className="space-y-4">
                    {pastContests.map(contest => (
                      <div key={contest.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg">{contest.name}</h4>
                            <p className="text-gray-600 text-sm mb-2">{contest.description}</p>
                            {contest.winner_post_id && (
                              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-lg inline-flex">
                                <Award className="w-4 h-4" />
                                <span>Pemenang telah ditentukan</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-green-600 font-semibold">{contest.prize}</div>
                            <button
                              onClick={() => handleViewSubmissions(contest)}
                              className="text-orange-600 text-sm font-semibold hover:text-orange-700 mt-2"
                            >
                              Lihat Submisi
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada kontes yang selesai</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Star className="mr-2 text-yellow-500" />
            Cara Ikut Kontes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Buat Pizza</h4>
              <p className="text-gray-600 text-sm">
                Gunakan pizza builder untuk membuat kreasi sesuai tema kontes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-pink-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Upload ke Community</h4>
              <p className="text-gray-600 text-sm">
                Upload foto pizza Anda dan aktifkan toggle untuk mengikuti kontes
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Menangkan Hadiah</h4>
              <p className="text-gray-600 text-sm">
                Pizza dengan likes terbanyak akan menjadi pemenang
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-3xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">Achievement Kontes</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'First Timer', desc: 'Ikut kontes pertama', points: 50 },
              { name: 'Top 10', desc: 'Masuk 10 besar', points: 100 },
              { name: 'Podium Finisher', desc: 'Masuk 3 besar', points: 200 },
              { name: 'Contest Winner', desc: 'Juara kontes', points: 500 },
            ].map((achievement, index) => (
              <div key={index} className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">
                  {index === 0 ? '🎖️' : index === 1 ? '🥉' : index === 2 ? '🥈' : '🥇'}
                </div>
                <h4 className="font-bold mb-1">{achievement.name}</h4>
                <p className="text-sm opacity-80 mb-2">{achievement.desc}</p>
                <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  +{achievement.points} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showRules && activeContests.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Aturan Kontes</h3>
              <button
                onClick={() => setShowRules(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="prose max-w-none">
              <h4 className="text-xl font-bold text-orange-600 mb-3">{activeContests[0].name}</h4>
              <div className="whitespace-pre-wrap text-gray-700 mb-6">{activeContests[0].rules}</div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-6">
                <h5 className="font-bold text-orange-900 mb-2">Hadiah:</h5>
                <p className="text-orange-800">{activeContests[0].prize}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <h5 className="font-bold text-blue-900 mb-2">Periode:</h5>
                <p className="text-blue-800">
                  {new Date(activeContests[0].start_date).toLocaleDateString('id-ID')} -{' '}
                  {new Date(activeContests[0].end_date).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="w-full mt-6 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {selectedContest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{selectedContest.name}</h3>
                <p className="text-gray-600">Submisi Kontes ({contestSubmissions.length} peserta)</p>
              </div>
              <button
                onClick={() => {
                  setSelectedContest(null);
                  setContestSubmissions([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {contestSubmissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contestSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-orange-400 transition-all"
                  >
                    {index < 3 && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-2 font-bold">
                        {index === 0 ? '🥇 Peringkat 1' : index === 1 ? '🥈 Peringkat 2' : '🥉 Peringkat 3'}
                      </div>
                    )}
                    <div className="relative">
                      <img
                        src={submission.image_url || 'https://via.placeholder.com/400x300?text=Pizza'}
                        alt={submission.caption}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-800 mb-2">@{submission.user_name}</p>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{submission.caption}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-red-600">
                          <span className="font-bold">{submission.likes_count}</span>
                          <span className="text-sm">likes</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <span className="font-bold">{submission.comments_count}</span>
                          <span className="text-sm">komentar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Belum ada submisi untuk kontes ini</p>
                <p className="text-gray-500 text-sm mt-2">Jadilah yang pertama mengikuti kontes ini!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestPage;