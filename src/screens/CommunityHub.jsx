import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Search,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  Image as ImageIcon,
  Video,
  MapPin,
  Sprout,
  CheckCircle,
  Plus,
  Users,
  Compass,
  AlertTriangle,
  HelpCircle,
  Bell,
  X,
  TrendingUp,
  Award,
  ChevronRight,
  Smile,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronDown
} from 'lucide-react';

export default function CommunityHub() {
  const { user, addNotification } = useFarm();

  // Active view states
  // 'feed' | 'community-detail'
  const [currentViewMode, setCurrentViewMode] = useState('feed');
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);

  // Modal / Side drawer states
  const [selectedFarmerUsername, setSelectedFarmerUsername] = useState(null);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeAiPost, setActiveAiPost] = useState(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Following' | 'Nearby' | 'Crop-wise' | 'Disease' | 'Newest' | 'Popular'
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  // Create Post states
  const [postText, setPostText] = useState('');
  const [postCrop, setPostCrop] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postAttachments, setPostAttachments] = useState([]); // Array of { name, type, url }
  const [dragActive, setDragActive] = useState(false);

  // Create Community Form states
  const [newCommName, setNewCommName] = useState('');
  const [newCommDesc, setNewCommDesc] = useState('');
  const [newCommRules, setNewCommRules] = useState('');
  const [newCommBanner, setNewCommBanner] = useState('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60');

  // Comment Reply Form state map: { [postId]: { text: '', emojiOpen: false, attachments: [] } }
  const [repliesState, setRepliesState] = useState({});

  // Mock Databases (State-driven to prevent hardcoding and support interactive updates)
  const [communities, setCommunities] = useState([
    {
      id: 'organic',
      name: 'Organic Farming',
      banner: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60',
      description: 'Discuss standard bio-fertilizers, vermicomposting, and natural pesticide solutions.',
      members: 1240,
      joined: true,
      rules: '1. Only organic topics. 2. Respect members. 3. No commercial spam.',
      admins: ['Dr. Ramesh Patel', 'Neha Khetan'],
      pinnedPost: 'Welcome to the Organic Farming group! Check out the composting guidelines pinned below.'
    },
    {
      id: 'tomato',
      name: 'Tomato Growers',
      banner: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60',
      description: 'Everything about tomato varieties, staking, leaf diseases, and high-yield methods.',
      members: 850,
      joined: true,
      rules: '1. Share clear disease pictures. 2. Specify planting season. 3. Keep discussions helpful.',
      admins: ['Suresh Kumar', 'Dr. Ramesh Patel'],
      pinnedPost: 'Alert: Bacterial Wilt spreads fast in high humidity. Stiff spray guidelines are posted.'
    },
    {
      id: 'rice',
      name: 'Rice Farmers',
      banner: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=60',
      description: 'System of Rice Intensification (SRI), water management, paddy disease, and market rates.',
      members: 1920,
      joined: false,
      rules: '1. Focus on wet/dry cultivation techniques. 2. Post seed selection tips. 3. No off-topic politics.',
      admins: ['Mohammad Ali', 'Suresh Kumar'],
      pinnedPost: 'SRI method yields up to 40% more crop weight. Read our quick manual.'
    },
    {
      id: 'hydro',
      name: 'Hydroponics',
      banner: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&auto=format&fit=crop&q=60',
      description: 'Soilless cultivation setup, nutrient solutions, pH maintenance, and vertical crop logs.',
      members: 310,
      joined: false,
      rules: '1. Share nutrient formulation logs. 2. Equipment trouble support welcome. 3. Be friendly.',
      admins: ['Dr. Ramesh Patel'],
      pinnedPost: 'Optimal pH for tomato hydroponic systems should be kept strictly between 5.5 and 6.5.'
    }
  ]);

  const [trendingHashtags] = useState([
    { tag: '#TomatoDisease', posts: 142 },
    { tag: '#OrganicFarming', posts: 89 },
    { tag: '#MonsoonTips', posts: 64 },
    { tag: '#SoilHealth', posts: 53 },
    { tag: '#DripIrrigation', posts: 31 }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'like', text: 'Dr. Ramesh Patel liked your post on Leaf Curl diagnostics.', read: false, time: '5m ago' },
    { id: 2, type: 'comment', text: 'Suresh Kumar commented: "Try using neem oil spray weekly."', read: false, time: '20m ago' },
    { id: 3, type: 'invite', text: 'You have been invited to join the Hydroponics community.', read: true, time: '1h ago' }
  ]);

  const [webinars] = useState([
    { id: 1, title: 'Preventing Monsoon Crop Rot', speaker: 'Dr. Ramesh Patel', date: 'July 24, 03:00 PM', link: '#', attendees: 142 },
    { id: 2, title: 'Organic Pest Defense Basics', speaker: 'Suresh Kumar', date: 'July 28, 11:00 AM', link: '#', attendees: 89 }
  ]);

  const [schemes] = useState([
    { id: 1, title: 'PM-KISAN 17th Installment Release', desc: 'Direct financial transfer of ₹2,000 to beneficiary accounts.', link: '#' },
    { id: 2, title: 'Subsidized Solar Water Pump Subsidy', desc: 'Apply today for a 60% subsidy under PM-KUSUM Scheme.', link: '#' }
  ]);

  const [expertProfiles, setExpertProfiles] = useState([
    {
      username: 'dr_ramesh',
      name: 'Dr. Ramesh Patel',
      role: 'Agronomy Scientist',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
      location: 'Agricultural Research Inst, Pune',
      experience: '18 Years Research & Advisory',
      crops: 'Tomatoes, Cotton, Wheat',
      followers: 2430,
      joinedGroups: ['Organic Farming', 'Tomato Growers'],
      trustScore: 98,
      following: false
    },
    {
      username: 'suresh_k',
      name: 'Suresh Kumar',
      role: 'Master Farmer',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
      location: 'Nashik, Maharashtra',
      experience: '12 Years Grape & Tomato cultivation',
      crops: 'Grapes, Tomatoes, Peppers',
      followers: 1890,
      joinedGroups: ['Tomato Growers', 'Organic Farming'],
      trustScore: 95,
      following: true
    },
    {
      username: 'neha_k',
      name: 'Neha Khetan',
      role: 'Horticulture Specialist',
      verified: false,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
      location: 'Sikar, Rajasthan',
      experience: '5 Years Greenhouses',
      crops: 'Strawberries, Leafy Greens',
      followers: 840,
      joinedGroups: ['Organic Farming', 'Hydroponics'],
      trustScore: 89,
      following: false
    }
  ]);

  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: 'Suresh Kumar',
        username: 'suresh_k',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
        verified: true,
        location: 'Nashik, Maharashtra'
      },
      time: '2h ago',
      content: 'I noticed some light spots on the lower leaves of my tomato plants today. Looks like early stage Alternaria Solani (Early Blight). Any recommendations on organic sprays before this spreads to adjacent plots? #TomatoDisease #OrganicFarming',
      crop: 'Tomatoes',
      location: 'Plot B-North',
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=60'
      ],
      aiBadge: true,
      aiAnalysis: {
        disease: 'Early Blight (Alternaria Solani)',
        confidence: 91,
        recommendation: 'Remove affected lower leaves immediately to improve ventilation. Apply copper-based organic fungicides or spray a dilution of microbial trichoderma culture.'
      },
      likes: 12,
      liked: false,
      comments: [
        {
          id: 101,
          authorName: 'Dr. Ramesh Patel',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
          time: '1h ago',
          text: 'Suresh, definitely trim those bottom leaves so they do not touch the damp soil. High moisture accelerates Alternaria spores. If it spreads, spray neem oil formulation at 2% concentration.',
          replies: []
        }
      ],
      commentsExpanded: false,
      saved: false,
      shares: 2
    },
    {
      id: 2,
      author: {
        name: 'Neha Khetan',
        username: 'neha_k',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
        verified: false,
        location: 'Sikar, Rajasthan'
      },
      time: '4h ago',
      content: 'Sharing a quick snapshot of our vertical hydroponic setup. The butterhead lettuce crop is ready for harvest this week! Nutrient PPM is stable at 650 with pH 5.8. #Hydroponics #SoilHealth',
      crop: 'Lettuce',
      location: 'Polyhouse 2',
      images: [
        'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=60'
      ],
      aiBadge: false,
      likes: 24,
      liked: true,
      comments: [],
      commentsExpanded: false,
      saved: true,
      shares: 5
    }
  ]);

  // Combined Active Community Profile
  const activeCommunity = useMemo(() => {
    if (currentViewMode !== 'community-detail') return null;
    return communities.find(c => c.id === selectedCommunityId);
  }, [currentViewMode, selectedCommunityId, communities]);

  // Combined Active User Profile
  const activeFarmerProfile = useMemo(() => {
    if (!selectedFarmerUsername) return null;
    return expertProfiles.find(f => f.username === selectedFarmerUsername) || {
      username: selectedFarmerUsername,
      name: selectedFarmerUsername === user.name ? user.name : 'Farmer Friend',
      role: 'Farmer',
      verified: false,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60',
      location: 'Local Region',
      experience: '2 Years Cultivation',
      crops: 'Mixed crops',
      followers: 12,
      joinedGroups: ['Organic Farming'],
      trustScore: 82,
      following: false
    };
  }, [selectedFarmerUsername, expertProfiles, user]);

  // Filter Timeline Posts (Search & Filter Pills & Hashtags)
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Search Query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAuthor = post.author.name.toLowerCase().includes(query);
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesCrop = post.crop && post.crop.toLowerCase().includes(query);
        const matchesDisease = post.aiAnalysis && post.aiAnalysis.disease.toLowerCase().includes(query);
        if (!matchesAuthor && !matchesContent && !matchesCrop && !matchesDisease) return false;
      }

      // 2. Hashtag filter
      if (selectedHashtag && !post.content.toLowerCase().includes(selectedHashtag.toLowerCase())) {
        return false;
      }

      // 3. Category Filter Pills
      if (activeFilter === 'Following') {
        // Find experts the user is following
        const followingUsernames = expertProfiles.filter(e => e.following).map(e => e.username);
        if (!followingUsernames.includes(post.author.username)) return false;
      }
      if (activeFilter === 'Nearby Farmers') {
        // Mock filter for items near user's state
        if (!post.author.location.toLowerCase().includes('maharashtra') && post.author.username !== 'suresh_k') return false;
      }
      if (activeFilter === 'Crop-wise') {
        if (!post.crop) return false;
      }
      if (activeFilter === 'Disease Discussions') {
        if (!post.aiBadge) return false;
      }

      // 4. Community specific page filter
      if (currentViewMode === 'community-detail' && activeCommunity) {
        // Filter posts that belong to the active community's keywords/hashtags
        const communityKeyword = activeCommunity.name.split(' ')[0].toLowerCase(); // e.g. "organic" or "tomato"
        const matchesContent = post.content.toLowerCase().includes(communityKeyword);
        const matchesCrop = post.crop && post.crop.toLowerCase().includes(communityKeyword);
        if (!matchesContent && !matchesCrop) return false;
      }

      return true;
    }).sort((a, b) => {
      if (activeFilter === 'Popular') {
        return b.likes - a.likes;
      }
      // Newest default
      return b.id - a.id;
    });
  }, [posts, searchQuery, activeFilter, selectedHashtag, currentViewMode, activeCommunity, expertProfiles]);

  // Social Toggle Operations
  const handleLike = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: p.liked ? p.likes - 1 : p.likes + 1,
          liked: !p.liked
        };
      }
      return p;
    }));
  };

  const handleSave = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, saved: !p.saved };
      }
      return p;
    }));
    addNotification("Saved", "Post added to bookmarks.", "success");
  };

  const handleShare = (postId) => {
    // Simulating API Share
    navigator.clipboard.writeText(`https://farmbuddy.com/community/post/${postId}`);
    addNotification("Copied Link", "Discussion link copied to clipboard.", "success");
    setPosts(prev => prev.map(p => {
      if (p.id === postId) return { ...p, shares: p.shares + 1 };
      return p;
    }));
  };

  const handleFollowToggle = (username) => {
    setExpertProfiles(prev => prev.map(e => {
      if (e.username === username) {
        const nextState = !e.following;
        addNotification(
          nextState ? "Followed User" : "Unfollowed User",
          nextState ? `You followed ${e.name}.` : `You unfollowed ${e.name}.`,
          "success"
        );
        return {
          ...e,
          following: nextState,
          followers: nextState ? e.followers + 1 : e.followers - 1
        };
      }
      return e;
    }));
  };

  const handleCommunityJoinToggle = (commId) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === commId) {
        const nextState = !c.joined;
        addNotification(
          nextState ? "Joined Group" : "Left Group",
          nextState ? `Joined ${c.name}.` : `Left ${c.name}.`,
          "success"
        );
        return {
          ...c,
          joined: nextState,
          members: nextState ? c.members + 1 : c.members - 1
        };
      }
      return c;
    }));
  };

  // Drag and Drop files handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileList = Array.from(e.dataTransfer.files).map(file => ({
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(file)
      }));
      setPostAttachments(prev => [...prev, ...fileList]);
    }
  };

  const triggerFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const fileList = Array.from(e.target.files).map(file => ({
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(file)
      }));
      setPostAttachments(prev => [...prev, ...fileList]);
    }
  };

  // Create Post Submit
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!postText.trim() && postAttachments.length === 0) return;

    const newPost = {
      id: posts.length + 1,
      author: {
        name: user?.name || 'Farmer Friend',
        username: user?.email ? user.email.split('@')[0] : 'me',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60',
        verified: false,
        location: postLocation || 'My Farm'
      },
      time: 'Just now',
      content: postText,
      crop: postCrop || null,
      location: postLocation || null,
      images: postAttachments.map(a => a.url),
      aiBadge: postAttachments.length > 0 && (postCrop || postText.includes('#Disease') || postText.includes('sick') || postText.includes('spot')),
      aiAnalysis: postText.includes('spot') || postText.includes('blight') ? {
        disease: 'Early Spot / Blight Suspect',
        confidence: 85,
        recommendation: 'System detected signs of foliage fungus. Avoid night watering, trim lower leaves, and apply Trichoderma organic suspension.'
      } : null,
      likes: 0,
      liked: false,
      comments: [],
      commentsExpanded: false,
      saved: false,
      shares: 0
    };

    setPosts(prev => [newPost, ...prev]);
    addNotification("Posted successfully", "Your update is live on the FarmBuddy feed.", "success");

    // Reset
    setPostText('');
    setPostCrop('');
    setPostLocation('');
    setPostAttachments([]);
  };

  // Create Community Submit
  const handleCreateCommunitySubmit = (e) => {
    e.preventDefault();
    if (!newCommName.trim()) return;

    const newGroup = {
      id: newCommName.toLowerCase().replace(/\s+/g, '-'),
      name: newCommName,
      banner: newCommBanner,
      description: newCommDesc || 'Farming hub community created by farmer.',
      members: 1,
      joined: true,
      rules: newCommRules || '1. Play nice. 2. Post farming content only.',
      admins: [user?.name || 'Admin Farmer'],
      pinnedPost: 'Welcome to our newly launched community!'
    };

    setCommunities(prev => [...prev, newGroup]);
    setShowCreateCommunityModal(false);
    setSelectedCommunityId(newGroup.id);
    setCurrentViewMode('community-detail');
    addNotification("Community Created", `"${newCommName}" launched successfully!`, "success");

    // Reset
    setNewCommName('');
    setNewCommDesc('');
    setNewCommRules('');
  };

  // Nested comments system
  const toggleComments = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, commentsExpanded: !p.commentsExpanded };
      }
      return p;
    }));
  };

  const handleReplyChange = (postId, field, value) => {
    setRepliesState(prev => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || { text: '', emojiOpen: false, attachments: [] }),
        [field]: value
      }
    }));
  };

  const handleAddReply = (postId) => {
    const postState = repliesState[postId];
    if (!postState || !postState.text.trim()) return;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newComment = {
          id: p.comments.length + 101,
          authorName: user?.name || 'Farmer Friend',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60',
          time: 'Just now',
          text: postState.text,
          replies: []
        };
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    handleReplyChange(postId, 'text', '');
  };

  const insertEmoji = (postId, emoji) => {
    const currentText = repliesState[postId]?.text || '';
    handleReplyChange(postId, 'text', currentText + emoji);
    handleReplyChange(postId, 'emojiOpen', false);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F8F6EF] dark:bg-[#0c140f] min-h-screen text-stone-900 dark:text-emerald-50 transition-colors duration-300">
      
      {/* HEADER SECTION WITH BRAND & SEARCH */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-stone-200/60 dark:border-emerald-950/20 pb-4 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-[#2E7D32]" />
            Community Hub
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Consult agriculture experts, discuss leaf disease diagnostics, and share vertical farming logs.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Main search bar */}
          <div className="relative flex-1 md:w-80">
            <Search className="h-4 w-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmers, crops, crop diseases..."
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-stone-450 focus:outline-none focus:ring-1 focus:ring-[#2E7D32] font-semibold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl hover:bg-stone-50 transition-all relative"
            >
              <Bell className="h-4.5 w-4.5 text-stone-600 dark:text-emerald-400" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#121f17] border border-stone-200 dark:border-stone-800 shadow-xl rounded-2xl p-4 z-50 space-y-3">
                <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-850 pb-2">
                  <span className="font-extrabold text-xs">Notifications</span>
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      setShowNotifications(false);
                    }}
                    className="text-[10px] text-[#2E7D32] font-bold hover:underline"
                  >
                    Mark read
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-2 rounded-xl text-[10px] ${n.read ? 'opacity-70' : 'bg-[#F8F6EF] dark:bg-emerald-950/15 border-l-2 border-[#2E7D32]'}`}>
                      <p className="font-semibold text-stone-800 dark:text-stone-200">{n.text}</p>
                      <span className="text-[8px] text-stone-400 block mt-1">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: COMMUNITIES & TRENDS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Create Community Card */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-stone-400">My Communities</h2>
              <button 
                onClick={() => setShowCreateCommunityModal(true)}
                className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-[#2E7D32] rounded-lg hover:bg-emerald-100 transition-all"
                title="Create Group"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {communities.filter(c => c.joined).map(comm => (
                <div 
                  key={comm.id}
                  onClick={() => {
                    setSelectedCommunityId(comm.id);
                    setCurrentViewMode('community-detail');
                    setSelectedHashtag(null);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-stone-50 dark:hover:bg-white/5 transition-all ${
                    currentViewMode === 'community-detail' && selectedCommunityId === comm.id ? 'bg-[#F8F6EF] dark:bg-emerald-950/10 border-l-2 border-[#2E7D32]' : ''
                  }`}
                >
                  <img src={comm.banner} alt={comm.name} className="h-8 w-8 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[11px] truncate text-stone-800 dark:text-stone-100">{comm.name}</h3>
                    <span className="text-[9px] text-stone-400">{comm.members} Members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Hashtags Widget */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2E7D32]" />
              Trending in Farming
            </h2>
            <div className="space-y-3.5">
              {trendingHashtags.map(t => (
                <div 
                  key={t.tag}
                  onClick={() => {
                    setSelectedHashtag(selectedHashtag === t.tag ? null : t.tag);
                    setCurrentViewMode('feed');
                  }}
                  className={`group flex justify-between items-center cursor-pointer ${
                    selectedHashtag === t.tag ? 'text-[#2E7D32] font-black' : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold block group-hover:text-[#2E7D32] transition-colors">{t.tag}</span>
                    <span className="text-[9px] text-stone-400 block mt-0.5">{t.posts} discussions logged</span>
                  </div>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all text-[#2E7D32]" />
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Groups (Not Joined Yet) */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-400">Discover Groups</h2>
            <div className="space-y-3">
              {communities.filter(c => !c.joined).map(comm => (
                <div key={comm.id} className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all">
                  <div 
                    onClick={() => {
                      setSelectedCommunityId(comm.id);
                      setCurrentViewMode('community-detail');
                    }}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img src={comm.banner} alt={comm.name} className="h-7 w-7 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[10px] truncate text-stone-800 dark:text-stone-100">{comm.name}</h4>
                      <span className="text-[8px] text-stone-400 block">{comm.members} Members</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCommunityJoinToggle(comm.id)}
                    className="px-2.5 py-1 text-[9px] font-bold bg-[#2E7D32] hover:bg-emerald-700 text-white rounded-lg transition-all"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER FEED: TIMELINE OR COMMUNITY DETAIL VIEW */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* COMMUNITY DETAIL BANNER HEADER */}
          {currentViewMode === 'community-detail' && activeCommunity && (
            <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] overflow-hidden shadow-sm">
              <div className="h-28 relative">
                <img src={activeCommunity.banner} alt={activeCommunity.name} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setCurrentViewMode('feed')}
                  className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-all"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                      {activeCommunity.name}
                      <CheckCircle className="h-4 w-4 text-[#2E7D32]" />
                    </h2>
                    <span className="text-[10px] text-[#2E7D32] font-extrabold mt-1 block">
                      {activeCommunity.members} ACTIVE MEMBERS
                    </span>
                  </div>
                  <button 
                    onClick={() => handleCommunityJoinToggle(activeCommunity.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeCommunity.joined 
                        ? 'border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300' 
                        : 'bg-[#2E7D32] hover:bg-[#205823] text-white'
                    }`}
                  >
                    {activeCommunity.joined ? 'Leave Community' : 'Join Community'}
                  </button>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeCommunity.description}
                </p>

                {/* Rules & Admins grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-stone-850 text-[10px]">
                  <div>
                    <span className="font-extrabold block text-stone-400 uppercase tracking-wider mb-1">Admins</span>
                    <p className="font-bold text-[#2E7D32]">{activeCommunity.admins.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-extrabold block text-stone-400 uppercase tracking-wider mb-1">Community Guidelines</span>
                    <p className="text-stone-500 italic">{activeCommunity.rules}</p>
                  </div>
                </div>

                {/* Pinned Post */}
                {activeCommunity.pinnedPost && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/25 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <span className="font-extrabold text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase mt-0.5">PINNED</span>
                    <p className="font-bold">{activeCommunity.pinnedPost}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CROP WORKFLOW FILTER PILLS (Only on main feed) */}
          {currentViewMode === 'feed' && (
            <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {['All', 'Following', 'Nearby Farmers', 'Crop-wise', 'Disease Discussions', 'Newest', 'Popular'].map(pill => (
                <button
                  key={pill}
                  onClick={() => {
                    setActiveFilter(pill);
                    setSelectedHashtag(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                    activeFilter === pill && !selectedHashtag
                      ? 'bg-[#2E7D32] text-white shadow-sm'
                      : 'bg-white dark:bg-[#121f17] text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-emerald-950/20 hover:bg-stone-50'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          {/* ACTIVE FILTER HASHTAG BANNER */}
          {selectedHashtag && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-[#2E7D32]">Showing matches for: <strong>{selectedHashtag}</strong></span>
              <button 
                onClick={() => setSelectedHashtag(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* CREATE POST CARD */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <div className="flex gap-3">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60" 
                alt="My profile" 
                className="h-10 w-10 rounded-full object-cover" 
              />
              <div className="flex-1">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What's happening in your farm today? Share logs, ask questions..."
                  className="w-full text-xs text-stone-700 dark:text-stone-100 placeholder-stone-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none h-20"
                />
              </div>
            </div>

            {/* DRAG AND DROP ZONE FOR FILES */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                dragActive ? 'border-[#2E7D32] bg-emerald-50/20' : 'border-stone-200 dark:border-stone-850 hover:bg-stone-50/50'
              }`}
            >
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                onChange={triggerFileSelect} 
                className="hidden" 
                accept="image/*,video/*"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-1.5 block">
                <ImageIcon className="h-6 w-6 text-stone-400 mx-auto" />
                <p className="text-[10px] text-stone-500">
                  <span className="font-bold text-[#2E7D32]">Click to upload</span> or drag and drop crop images/videos
                </p>
              </label>
            </div>

            {/* ATTACHMENT PREVIEWS */}
            {postAttachments.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {postAttachments.map((file, idx) => (
                  <div key={idx} className="relative h-16 rounded-lg overflow-hidden border border-stone-200">
                    {file.type === 'video' ? (
                      <div className="w-full h-full bg-black/10 flex items-center justify-center text-[8px] text-stone-600 font-bold">Video</div>
                    ) : (
                      <img src={file.url} alt="upload preview" className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={() => setPostAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* METADATA TARGETS (Crop, Plot location) */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2">
                <Sprout className="h-4 w-4 text-[#2E7D32]" />
                <select
                  value={postCrop}
                  onChange={(e) => setPostCrop(e.target.value)}
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-[10px] font-bold text-stone-600 dark:text-stone-300 w-full"
                >
                  <option value="">Link Crop Variety</option>
                  <option value="Tomatoes">Tomatoes</option>
                  <option value="Paddy Rice">Paddy Rice</option>
                  <option value="Lettuce">Lettuce</option>
                  <option value="Grapes">Grapes</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <input
                  type="text"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  placeholder="Tag Plot / Location"
                  className="bg-transparent border-0 focus:outline-none focus:ring-0 text-[10px] font-bold text-stone-600 dark:text-stone-350 w-full"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-stone-850">
              <div className="flex gap-2">
                {/* Simulated shortcuts */}
                <button className="p-1.5 rounded-lg text-stone-400 hover:text-[#2E7D32] hover:bg-stone-50">
                  <ImageIcon className="h-4.5 w-4.5" />
                </button>
                <button className="p-1.5 rounded-lg text-stone-400 hover:text-[#2E7D32] hover:bg-stone-50">
                  <Video className="h-4.5 w-4.5" />
                </button>
              </div>

              <button
                onClick={handleCreatePost}
                className="px-5 py-2.5 bg-[#2E7D32] hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                Post Update
              </button>
            </div>
          </div>

          {/* TIMELINE LIST */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 rounded-[18px] p-10 text-center text-stone-400">
                <Compass className="h-10 w-10 mx-auto opacity-40 mb-2 text-[#2E7D32]" />
                No matching discussions or logs found. Start a new topic above!
              </div>
            ) : (
              filteredPosts.map(post => {
                const commentState = repliesState[post.id] || { text: '', emojiOpen: false };
                return (
                  <div key={post.id} className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
                    
                    {/* POST AUTHOR METADATA */}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <img 
                          src={post.author.avatar} 
                          alt={post.author.name} 
                          className="h-10 w-10 rounded-full object-cover cursor-pointer hover:opacity-85 transition-opacity"
                          onClick={() => setSelectedFarmerUsername(post.author.username)}
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span 
                              onClick={() => setSelectedFarmerUsername(post.author.username)}
                              className="font-extrabold text-xs text-stone-900 dark:text-white cursor-pointer hover:underline"
                            >
                              {post.author.name}
                            </span>
                            {post.author.verified && (
                              <CheckCircle className="h-3.5 w-3.5 text-[#2E7D32] fill-emerald-50 dark:fill-stone-900" title="Verified Professional" />
                            )}
                            <span className="text-[10px] text-stone-400">@{post.author.username}</span>
                          </div>
                          
                          <span className="text-[9px] text-stone-400 block mt-0.5">
                            {post.time} • {post.author.location}
                          </span>
                        </div>
                      </div>

                      {/* Crop link badge */}
                      {post.crop && (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-[#2E7D32] text-[9px] font-black rounded-lg">
                          {post.crop}
                        </span>
                      )}
                    </div>

                    {/* POST DESCRIPTION */}
                    <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed font-medium">
                      {post.content}
                    </p>

                    {/* IMAGES GRID (Supports 1-4 images) */}
                    {post.images && post.images.length > 0 && (
                      <div className={`grid gap-2 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-850 ${
                        post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                      }`}>
                        {post.images.map((img, index) => (
                          <img 
                            key={index} 
                            src={img} 
                            alt={`Attachment ${index}`} 
                            className="w-full h-48 object-cover hover:scale-[1.01] duration-300 cursor-pointer"
                            onClick={() => {
                              if (post.aiBadge) {
                                setActiveAiPost(post);
                                setShowAiAnalysisModal(true);
                              }
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* AI ANALYTICS CORNER BADGE */}
                    {post.aiBadge && (
                      <div 
                        onClick={() => {
                          setActiveAiPost(post);
                          setShowAiAnalysisModal(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 cursor-pointer rounded-2xl flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-300 font-bold transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
                          AI Analysis Report Available
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* ACTIONS BAR (OUTLINED W/ GREEN HOVER) */}
                    <div className="flex justify-between items-center pt-3 border-t border-stone-100 dark:border-stone-850 text-stone-500 text-xs">
                      
                      {/* Like button */}
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 hover:text-emerald-600 transition-all ${
                          post.liked ? 'text-emerald-600 font-bold' : ''
                        }`}
                      >
                        <Heart className={`h-4.5 w-4.5 transition-transform duration-300 active:scale-150 ${post.liked ? 'fill-emerald-500 stroke-emerald-500' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      {/* Comment toggle button */}
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-1.5 hover:text-emerald-600 transition-all ${
                          post.commentsExpanded ? 'text-emerald-600 font-bold' : ''
                        }`}
                      >
                        <MessageCircle className="h-4.5 w-4.5" />
                        <span>{post.comments.length}</span>
                      </button>

                      {/* Share button */}
                      <button 
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-1.5 hover:text-emerald-600 transition-all"
                      >
                        <Share2 className="h-4.5 w-4.5" />
                        <span>{post.shares}</span>
                      </button>

                      {/* Bookmark button */}
                      <button 
                        onClick={() => handleSave(post.id)}
                        className={`flex items-center gap-1.5 hover:text-emerald-600 transition-all ${
                          post.saved ? 'text-emerald-600' : ''
                        }`}
                      >
                        <Bookmark className={`h-4.5 w-4.5 ${post.saved ? 'fill-emerald-500 stroke-emerald-500' : ''}`} />
                      </button>

                    </div>

                    {/* EXPANDED COMMENTS ACCORDION */}
                    {post.commentsExpanded && (
                      <div className="pt-4 border-t border-stone-100 dark:border-stone-850 space-y-4 animate-fadeIn">
                        
                        {/* Nested comments list */}
                        {post.comments.map(c => (
                          <div key={c.id} className="flex gap-2.5 text-[11px] p-2 bg-[#F8F6EF]/60 dark:bg-stone-900/40 rounded-xl">
                            <img src={c.avatar} alt={c.authorName} className="h-7 w-7 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <span className="font-extrabold text-stone-850 dark:text-stone-100">{c.authorName}</span>
                                <span className="text-[8px] text-stone-400">{c.time}</span>
                              </div>
                              <p className="text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">{c.text}</p>
                            </div>
                          </div>
                        ))}

                        {/* Reply editor form */}
                        <div className="flex gap-2 items-center relative">
                          <input
                            type="text"
                            value={commentState.text}
                            onChange={(e) => handleReplyChange(post.id, 'text', e.target.value)}
                            placeholder="Write an advice or comment..."
                            className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                          />
                          
                          {/* Quick Emoji selection */}
                          <div className="relative">
                            <button 
                              onClick={() => handleReplyChange(post.id, 'emojiOpen', !commentState.emojiOpen)}
                              className="p-1.5 text-stone-400 hover:text-stone-600"
                            >
                              <Smile className="h-4 w-4" />
                            </button>

                            {commentState.emojiOpen && (
                              <div className="absolute bottom-8 right-0 bg-white border border-stone-200 rounded-xl p-2 shadow-lg flex gap-1 z-20">
                                {['👍', '🌱', '❓', '🍃', '🙌'].map(e => (
                                  <button key={e} onClick={() => insertEmoji(post.id, e)} className="hover:scale-125 transition-transform text-xs">{e}</button>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddReply(post.id)}
                            className="px-3.5 py-1.5 bg-[#2E7D32] hover:bg-emerald-700 text-white rounded-lg font-bold text-[9px] transition-all"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: RECOMMENDATIONS & SCHEMES */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Weather Warning Widget */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-transparent border border-amber-500/30 rounded-[18px] p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 animate-bounce" />
              <h3 className="font-extrabold text-xs text-stone-800 dark:text-stone-200 uppercase tracking-wide">Weather Alert</h3>
            </div>
            <p className="text-[10px] text-stone-600 dark:text-stone-300 leading-relaxed font-semibold">
              Heavy rain forecast in Pune & Nashik divisions for next 48 hours. Ensure proper drainage in tomato plots.
            </p>
          </div>

          {/* Expert Profiles list */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-400">Suggested Experts</h2>
            <div className="space-y-3.5">
              {expertProfiles.map(exp => (
                <div key={exp.username} className="flex items-center justify-between gap-2 p-1 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all">
                  <div 
                    onClick={() => setSelectedFarmerUsername(exp.username)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img src={exp.avatar} alt={exp.name} className="h-8 w-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-0.5">
                        <span className="font-extrabold text-[10px] text-stone-850 dark:text-stone-100 truncate block">{exp.name}</span>
                        {exp.verified && <CheckCircle className="h-3 w-3 text-[#2E7D32] fill-emerald-50 dark:fill-stone-900" />}
                      </div>
                      <span className="text-[8px] text-stone-400 block truncate">{exp.role}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFollowToggle(exp.username)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${
                      exp.following 
                        ? 'border border-stone-300 dark:border-stone-700 text-stone-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300' 
                        : 'bg-[#2E7D32] hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {exp.following ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Webinars & Events Widget */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#2E7D32]" />
              Upcoming Webinars
            </h2>
            <div className="space-y-3.5">
              {webinars.map(w => (
                <div key={w.id} className="p-3 bg-stone-50 dark:bg-stone-900/40 border border-stone-150 dark:border-stone-850 rounded-xl space-y-1.5 hover:shadow-sm transition-all">
                  <h4 className="font-extrabold text-[10px] text-stone-850 dark:text-stone-150 leading-tight">{w.title}</h4>
                  <div className="flex justify-between items-center text-[8px] text-stone-400">
                    <span>Host: {w.speaker}</span>
                    <span className="text-[#2E7D32] font-extrabold">{w.date}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-stone-800 text-[8px]">
                    <span className="text-stone-400">{w.attendees} Registered</span>
                    <a href={w.link} className="text-[#2E7D32] font-black hover:underline">Register</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Govt Schemes Info Widget */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-400">Government Schemes</h2>
            <div className="space-y-3.5">
              {schemes.map(s => (
                <div key={s.id} className="space-y-1">
                  <h4 className="font-bold text-[10px] text-[#2E7D32] hover:underline cursor-pointer">{s.title}</h4>
                  <p className="text-[9px] text-stone-550 dark:text-stone-300 leading-snug">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: CREATE COMMUNITY / GROUP */}
      {showCreateCommunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-[18px] p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-850 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">Create Agriculture Community</h3>
              <button onClick={() => setShowCreateCommunityModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommunitySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Community Name</label>
                <input
                  type="text"
                  required
                  value={newCommName}
                  onChange={(e) => setNewCommName(e.target.value)}
                  placeholder="e.g. Cotton Cultivators Club"
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Description</label>
                <textarea
                  value={newCommDesc}
                  onChange={(e) => setNewCommDesc(e.target.value)}
                  placeholder="What is this community for? e.g. Sharing pest control, yield logs..."
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Community Rules & Guidelines</label>
                <textarea
                  value={newCommRules}
                  onChange={(e) => setNewCommRules(e.target.value)}
                  placeholder="Rules regarding posts, sales, or respecting members..."
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2.5 font-bold h-16 resize-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Banner Image URL</label>
                <input
                  type="text"
                  value={newCommBanner}
                  onChange={(e) => setNewCommBanner(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2 text-[10px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#2E7D32] hover:bg-emerald-700 text-white font-black transition-all"
              >
                Launch Community
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI DISEASE DIAGNOSIS PREVIEW */}
      {showAiAnalysisModal && activeAiPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] border border-stone-200 dark:border-stone-800 w-full max-w-md rounded-[18px] p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-850 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
                AI Crop Disease Diagnostic report
              </h3>
              <button onClick={() => setShowAiAnalysisModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative h-44 rounded-xl overflow-hidden border">
                <img src={activeAiPost.images[0]} alt="Sick leaf" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full">
                  Scan 100% Complete
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-stone-450 uppercase">Detected Suspect</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-700 font-extrabold px-2 py-0.5 rounded">
                    {activeAiPost.aiAnalysis?.confidence}% Confidence
                  </span>
                </div>
                <h4 className="text-base font-black text-[#2E7D32]">
                  {activeAiPost.aiAnalysis?.disease || 'Disease suspect'}
                </h4>
              </div>

              <div className="p-3 bg-[#F8F6EF] dark:bg-stone-900/60 rounded-xl space-y-2 text-[10px]">
                <span className="font-black text-stone-400 block uppercase tracking-wider">Recommended Organic Action</span>
                <p className="text-stone-650 dark:text-stone-300 leading-relaxed font-semibold">
                  {activeAiPost.aiAnalysis?.recommendation || 'Trimming diseased shoots and maintaining soil pH.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowAiAnalysisModal(false);
                    addNotification("Consultation Scheduled", "Request sent to Dr. Ramesh Patel.", "success");
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#2E7D32] hover:bg-emerald-50 text-[#2E7D32] font-bold text-xs text-center"
                >
                  Consult Expert
                </button>
                <button 
                  onClick={() => setShowAiAnalysisModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-emerald-700 text-white font-bold text-xs text-center"
                >
                  Close Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER SIDE PANEL: FARMER PROFILE PREVIEW */}
      {selectedFarmerUsername && activeFarmerProfile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-[#121f17] w-full max-w-md h-full p-6 shadow-2xl space-y-6 overflow-y-auto flex flex-col relative animate-slideLeft">
            
            <button 
              onClick={() => setSelectedFarmerUsername(null)}
              className="absolute top-4 left-4 p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center pt-8 space-y-3.5 border-b border-stone-100 dark:border-stone-850 pb-5">
              <img src={activeFarmerProfile.avatar} alt={activeFarmerProfile.name} className="h-20 w-20 rounded-full object-cover border-4 border-emerald-500/10" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-white">{activeFarmerProfile.name}</h3>
                  {activeFarmerProfile.verified && <CheckCircle className="h-4 w-4 text-[#2E7D32]" />}
                </div>
                <span className="text-[10px] text-stone-400">@{activeFarmerProfile.username}</span>
                <span className="text-[9px] text-[#2E7D32] bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full font-bold mt-2.5 inline-block">
                  {activeFarmerProfile.role}
                </span>
              </div>

              <div className="flex items-center gap-6 text-center pt-1">
                <div>
                  <span className="text-sm font-black block">{activeFarmerProfile.followers}</span>
                  <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">Followers</span>
                </div>
                <div className="w-px h-6 bg-stone-200 dark:bg-stone-800" />
                <div>
                  <span className="text-sm font-black block">{activeFarmerProfile.trustScore}%</span>
                  <span className="text-[9px] text-stone-400 uppercase font-bold tracking-wider">Trust Score</span>
                </div>
              </div>

              {activeFarmerProfile.username !== user?.email?.split('@')[0] && (
                <button 
                  onClick={() => handleFollowToggle(activeFarmerProfile.username)}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeFarmerProfile.following 
                      ? 'border border-stone-300 dark:border-stone-700 text-stone-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300' 
                      : 'bg-[#2E7D32] hover:bg-emerald-700 text-white'
                  }`}
                >
                  {activeFarmerProfile.following ? 'Following' : 'Follow Farmer'}
                </button>
              )}
            </div>

            <div className="space-y-4 flex-1">
              <h4 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">Farmer Statistics</h4>
              
              <div className="space-y-3 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                <div className="flex justify-between p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                  <span>Farm Location:</span>
                  <span className="font-extrabold text-stone-900 dark:text-white">{activeFarmerProfile.location}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                  <span>Experience:</span>
                  <span className="font-extrabold text-stone-900 dark:text-white">{activeFarmerProfile.experience}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                  <span>Primary Crops:</span>
                  <span className="font-extrabold text-stone-900 dark:text-white">{activeFarmerProfile.crops}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                  <span>Communities Joined:</span>
                  <span className="font-extrabold text-stone-900 dark:text-white">{activeFarmerProfile.joinedGroups?.join(', ') || 'Organic Farming'}</span>
                </div>
              </div>

              {/* Farmer's recent posts list preview */}
              <div className="space-y-3 pt-3">
                <h4 className="font-extrabold text-xs text-stone-400 uppercase tracking-wider">Recent Timeline Posts</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {posts.filter(p => p.author.username === activeFarmerProfile.username).map(p => (
                    <div key={p.id} className="p-3 border border-stone-150 rounded-xl space-y-1.5">
                      <span className="text-[8px] text-stone-400 block">{p.time}</span>
                      <p className="text-[10px] text-stone-750 line-clamp-2">{p.content}</p>
                    </div>
                  ))}
                  {posts.filter(p => p.author.username === activeFarmerProfile.username).length === 0 && (
                    <p className="text-[10px] text-stone-450 italic text-center">No posts indexed for this farmer yet.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
