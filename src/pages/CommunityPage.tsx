import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Search,
  Filter,
  Upload,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { CommunityPost, CommunityComment, CommunityLike, Pizza } from '../types';
import ImageUpload from '../components/common/ImageUpload';

const POSTS_PER_PAGE = 15;

const CommunityPage = () => {
  const { user, authUser } = useUserAuth();
  const { dispatch, state } = useApp();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'popular' | 'latest' | 'contest'>('all');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [uploadImageUrl, setUploadImageUrl] = useState('');
  const [uploadFileId, setUploadFileId] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadToppings, setUploadToppings] = useState<string[]>([]);
  const [isForContest, setIsForContest] = useState(false);
  const [contestName, setContestName] = useState('');
  const [activeContests, setActiveContests] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const availableToppings = [
    'Pepperoni',
    'Sausage',
    'Mushrooms',
    'Bell Peppers',
    'Onions',
    'Olives',
    'Bacon',
    'Chicken',
    'Ham',
    'Spinach',
    'Tomatoes',
    'Cheese',
  ];

  useEffect(() => {
    loadPosts();
    loadActiveContests();
    if (authUser) {
      loadUserLikes();
    }
  }, [filterType, authUser]);

  const loadActiveContests = async () => {
    try {
      const contestsQuery = query(
        collection(db, 'contests'),
        where('status', '==', 'active'),
        orderBy('end_date', 'asc')
      );
      const snapshot = await getDocs(contestsQuery);
      const contests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActiveContests(contests);
    } catch (error) {
      console.error('Error loading contests:', error);
    }
  };

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      let q = query(collection(db, 'community_posts'));

      if (filterType === 'popular') {
        q = query(q, orderBy('likes_count', 'desc'), limit(100));
      } else if (filterType === 'latest') {
        q = query(q, orderBy('created_at', 'desc'), limit(100));
      } else if (filterType === 'contest') {
        q = query(q, where('is_for_contest', '==', true), orderBy('created_at', 'desc'), limit(100));
      } else {
        q = query(q, orderBy('created_at', 'desc'), limit(100));
      }

      const snapshot = await getDocs(q);
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];

      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLikes = async () => {
    if (!authUser) return;

    try {
      const likesQuery = query(
        collection(db, 'community_likes'),
        where('user_id', '==', authUser.uid)
      );
      const snapshot = await getDocs(likesQuery);
      const likedPostIds = new Set(snapshot.docs.map(doc => doc.data().post_id));
      setUserLikes(likedPostIds);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!authUser) {
      alert('Silakan login untuk memberikan like');
      navigate('/login');
      return;
    }

    try {
      const isLiked = userLikes.has(postId);

      if (isLiked) {
        const likesQuery = query(
          collection(db, 'community_likes'),
          where('post_id', '==', postId),
          where('user_id', '==', authUser.uid)
        );
        const snapshot = await getDocs(likesQuery);
        snapshot.docs.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'community_likes', docSnap.id));
        });

        const postRef = doc(db, 'community_posts', postId);
        const post = posts.find(p => p.id === postId);
        if (post) {
          await updateDoc(postRef, {
            likes_count: Math.max(0, post.likes_count - 1),
          });
        }

        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });

        setPosts(prev =>
          prev.map(p =>
            p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
          )
        );
      } else {
        await addDoc(collection(db, 'community_likes'), {
          post_id: postId,
          user_id: authUser.uid,
          created_at: serverTimestamp(),
        });

        const postRef = doc(db, 'community_posts', postId);
        const post = posts.find(p => p.id === postId);
        if (post) {
          await updateDoc(postRef, {
            likes_count: post.likes_count + 1,
          });
        }

        setUserLikes(prev => new Set(prev).add(postId));

        setPosts(prev =>
          prev.map(p => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Gagal memberikan like');
    }
  };

  const handleOrderNow = (post: CommunityPost) => {
    const pizza = post.pizza_template_json;
    dispatch({ type: 'ADD_TO_CART', payload: { pizza, quantity: 1 } });
    alert('Pizza berhasil ditambahkan ke keranjang!');
    navigate('/cart');
  };

  const openComments = async (post: CommunityPost) => {
    setSelectedPost(post);
    setShowComments(true);
    await loadComments(post.id);
  };

  const loadComments = async (postId: string) => {
    try {
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('post_id', '==', postId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(commentsQuery);
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityComment[];

      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!authUser || !user || !selectedPost || !newComment.trim()) return;

    try {
      await addDoc(collection(db, 'community_comments'), {
        post_id: selectedPost.id,
        user_id: authUser.uid,
        user_name: user.username,
        comment_text: newComment.trim(),
        created_at: serverTimestamp(),
      });

      const postRef = doc(db, 'community_posts', selectedPost.id);
      await updateDoc(postRef, {
        comments_count: selectedPost.comments_count + 1,
      });

      setPosts(prev =>
        prev.map(p =>
          p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );

      setNewComment('');
      await loadComments(selectedPost.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Gagal menambahkan komentar');
    }
  };

  const handleUploadSuccess = (imageUrl: string, fileId: string) => {
    setUploadImageUrl(imageUrl);
    setUploadFileId(fileId);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  const toggleUploadTopping = (topping: string) => {
    setUploadToppings(prev =>
      prev.includes(topping) ? prev.filter(t => t !== topping) : [...prev, topping]
    );
  };

  const handleSubmitPost = async () => {
    if (!authUser || !user) {
      alert('Anda harus login terlebih dahulu');
      return;
    }

    if (!uploadImageUrl) {
      alert('Silakan upload gambar terlebih dahulu');
      return;
    }

    if (!uploadCaption.trim()) {
      alert('Caption tidak boleh kosong');
      return;
    }

    if (uploadToppings.length === 0) {
      alert('Pilih minimal 1 topping yang digunakan');
      return;
    }

    if (isForContest && !contestName) {
      alert('Pilih kontes yang ingin diikuti');
      return;
    }

    setIsUploading(true);

    try {
      const lastPizza = state.cart.length > 0 ? state.cart[0].pizza : null;
      const pizzaTemplate: Pizza = lastPizza || {
        id: Date.now().toString(),
        name: uploadCaption.substring(0, 50),
        size: 'medium',
        crust: 'thin',
        sauce: 'tomato',
        toppings: uploadToppings.map(t => ({
          id: t.toLowerCase().replace(/\s+/g, '-'),
          name: t,
          category: 'meat',
          price: 0,
          image: '🍕',
        })),
        price: 0,
        likes: 0,
        isTemplate: true,
      };

      await addDoc(collection(db, 'community_posts'), {
        image_url: uploadImageUrl,
        gdrive_file_id: uploadFileId,
        user_id: authUser.uid,
        user_name: user.username,
        user_email: authUser.email,
        caption: uploadCaption,
        toppings_used: uploadToppings,
        pizza_template_json: pizzaTemplate,
        likes_count: 0,
        comments_count: 0,
        created_at: serverTimestamp(),
        is_for_contest: isForContest,
        contest_name: isForContest ? contestName : null,
      });

      setUploadImageUrl('');
      setUploadFileId('');
      setUploadCaption('');
      setUploadToppings([]);
      setIsForContest(false);
      setContestName('');
      setShowUploadModal(false);

      alert('Post berhasil diupload!');
      loadPosts();
    } catch (error) {
      console.error('Error submitting post:', error);
      alert('Gagal mengupload post. Silakan coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.user_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesToppings =
      selectedToppings.length === 0 ||
      selectedToppings.every(topping =>
        post.toppings_used.some(used => used.toLowerCase().includes(topping.toLowerCase()))
      );

    const matchesFilterType =
      filterType !== 'contest' || post.is_for_contest === true;

    return matchesSearch && matchesToppings && matchesFilterType;
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const toggleTopping = (topping: string) => {
    setSelectedToppings(prev =>
      prev.includes(topping) ? prev.filter(t => t !== topping) : [...prev, topping]
    );
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat postingan komunitas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-yellow-100 to-red-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">
              Komunitas Pizzart
            </h1>
            <p className="text-gray-600 text-lg">
              Jelajahi kreasi pizza dari chef-chef kreatif di seluruh Indonesia!
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all"
          >
            <Upload className="w-5 h-5" />
            Upload Kreasi
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan caption atau username..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'popular', 'latest', 'contest'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type as any);
                    setCurrentPage(1);
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                    filterType === type
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all'
                    ? 'Semua'
                    : type === 'popular'
                    ? 'Populer'
                    : type === 'latest'
                    ? 'Terbaru'
                    : 'Kontes'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">Filter Topping:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableToppings.map(topping => (
                <button
                  key={topping}
                  onClick={() => toggleTopping(topping)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedToppings.includes(topping)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {topping}
                </button>
              ))}
            </div>
            {selectedToppings.length > 0 && (
              <button
                onClick={() => setSelectedToppings([])}
                className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-red-600">{posts.length}</div>
            <div className="text-gray-600 text-sm">Total Postingan</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-red-700">
              {posts.reduce((sum, p) => sum + p.likes_count, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Likes</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {posts.reduce((sum, p) => sum + p.comments_count, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Komentar</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg">
            <div className="text-2xl font-bold text-red-800">
              {posts.filter(p => p.is_for_contest).length}
            </div>
            <div className="text-gray-600 text-sm">Postingan Kontes</div>
          </div>
        </div>

        {paginatedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {paginatedPosts.map(post => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
                >
                  <div className="relative">
                    <img
                      src={post.image_url || 'https://via.placeholder.com/400x300?text=Pizza+Image'}
                      alt={post.caption}
                      className="w-full h-64 object-cover"
                    />
                    {post.is_for_contest && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Contest: {post.contest_name}
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                      by @{post.user_name}
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-800 font-medium mb-3 line-clamp-2">{post.caption}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.toppings_used.slice(0, 3).map((topping, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                        >
                          {topping}
                        </span>
                      ))}
                      {post.toppings_used.length > 3 && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          +{post.toppings_used.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 ${
                          userLikes.has(post.id) ? 'text-red-600' : 'text-gray-600'
                        } hover:text-red-700 transition-colors`}
                      >
                        <Heart
                          className="w-5 h-5"
                          fill={userLikes.has(post.id) ? 'currentColor' : 'none'}
                        />
                        <span className="font-semibold">{post.likes_count}</span>
                      </button>

                      <button
                        onClick={() => openComments(post)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-semibold">{post.comments_count}</span>
                      </button>

                      <button
                        onClick={() => handleOrderNow(post)}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Order
                      </button>
                    </div>

                    <div className="text-xs text-gray-500">
                      {post.created_at && (
                        post.created_at instanceof Timestamp
                          ? post.created_at.toDate().toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : typeof post.created_at === 'string'
                          ? new Date(post.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Invalid Date'
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Sebelumnya
                </button>

                <span className="text-gray-700 font-medium">
                  Halaman {currentPage} dari {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Selanjutnya
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Tidak ada postingan yang ditemukan
            </h3>
            <p className="text-gray-500">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </div>

      {showComments && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Komentar</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold">
                          {comment.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="font-semibold text-gray-800 text-sm">
                            @{comment.user_name}
                          </p>
                          <p className="text-gray-700 text-sm mt-1">{comment.comment_text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-3">
                          {comment.created_at && (
                            comment.created_at instanceof Timestamp
                              ? comment.created_at.toDate().toLocaleString('id-ID')
                              : typeof comment.created_at === 'string'
                              ? new Date(comment.created_at).toLocaleString('id-ID')
                              : 'Invalid Date'
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Belum ada komentar</p>
              )}
            </div>

            {authUser && user && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Upload Kreasi Pizza</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Gambar Pizza
                </label>
                <ImageUpload
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  maxSizeMB={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <textarea
                  value={uploadCaption}
                  onChange={e => setUploadCaption(e.target.value)}
                  placeholder="Ceritakan tentang kreasi pizza Anda..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topping yang Digunakan
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableToppings.map(topping => (
                    <button
                      key={topping}
                      onClick={() => toggleUploadTopping(topping)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        uploadToppings.includes(topping)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {topping}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="contestSubmission"
                    checked={isForContest}
                    onChange={e => setIsForContest(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="contestSubmission" className="text-sm font-medium text-gray-700">
                    Ikut Kontes Pizza
                  </label>
                </div>

                {isForContest && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Kontes
                    </label>
                    {activeContests.length > 0 ? (
                      <select
                        value={contestName}
                        onChange={e => setContestName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">-- Pilih Kontes --</option>
                        {activeContests.map(contest => (
                          <option key={contest.id} value={contest.name}>
                            {contest.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Tidak ada kontes aktif saat ini
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitPost}
                disabled={isUploading || !uploadImageUrl}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Mengupload...' : 'Upload Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
