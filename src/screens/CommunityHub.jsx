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
  X,
  Smile,
  Calendar,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Play,
  Droplet,
  Clock,
  MoreHorizontal
} from 'lucide-react';

export default function CommunityHub() {
  const { user, addNotification, currentBatchId, batches } = useFarm();

  // Find active batch in context
  const activeBatch = useMemo(() => {
    return batches?.find(b => b.id === currentBatchId) || null;
  }, [batches, currentBatchId]);

  const activeCrop = activeBatch ? activeBatch.cropType : 'Tomatoes';

  // Extract clean keyword for routing group and post filtering
  const cropKeyword = useMemo(() => {
    const lower = activeCrop.toLowerCase();
    if (lower.includes('tomato')) return 'tomato';
    if (lower.includes('rice') || lower.includes('paddy')) return 'rice';
    if (lower.includes('sweet potato') || lower.includes('potato')) return 'sweet potato';
    if (lower.includes('apple')) return 'apple';
    if (lower.includes('coffee')) return 'coffee';
    return lower;
  }, [activeCrop]);

  // Modal / Side drawer states
  const [selectedFarmerUsername, setSelectedFarmerUsername] = useState(null);
  const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
  const [activeAiPost, setActiveAiPost] = useState(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  // Create Post states
  const [postText, setPostText] = useState('');
  const [postAttachments, setPostAttachments] = useState([]); // Array of { name, type, url }

  // Comment Reply Form state map: { [postId]: { text: '', emojiOpen: false } }
  const [repliesState, setRepliesState] = useState({});

  // Dynamic Community Group Config based on Crop Type
  const communities = useMemo(() => {
    const list = [];
    if (cropKeyword === 'tomato') {
      list.push({
        id: 'tomato',
        name: '[Tomato Growers]',
        iconType: 'leaf',
        banner: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=60',
        description: 'Discuss vine pruning, tomato blights, and organic treatment logs.',
        members: 1240,
        rules: '1. Only tomato topics. 2. Share organic pest control tips. 3. No commercial spam.',
        admins: ['Soil Dr. Amit', 'Farmer Priya'],
        pinnedPost: 'Welcome to the Tomato Growers group! Composting guide is updated below.'
      });
    } else if (cropKeyword === 'rice') {
      list.push({
        id: 'rice',
        name: '[Rice Farmers]',
        iconType: 'map-pin',
        banner: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop&q=60',
        description: 'Paddy water management, SRI, and southern monsoon crop logs.',
        members: 850,
        rules: '1. Rice and SRI topics. 2. Post seasonal water levels.',
        admins: ['Aman Amit', 'Mser Nrii'],
        pinnedPost: 'SRI method yields up to 40% more crop weight. Read our quick manual.'
      });
    } else if (cropKeyword === 'sweet potato') {
      list.push({
        id: 'sweet-potato',
        name: '[Sweet Potato Hub]',
        iconType: 'map-pin',
        banner: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60',
        description: 'Root growth logs, curing techniques, and sweet potato disease diagnostics.',
        members: 310,
        rules: '1. Share root logs. 2. Curing steps recommendations.',
        admins: ['Soil Dr. Amit'],
        pinnedPost: 'Optimal curing temperature is 29°C with 90% humidity for 5-7 days.'
      });
    } else if (cropKeyword === 'apple') {
      list.push({
        id: 'apple',
        name: '[Apple Growers]',
        iconType: 'leaf',
        banner: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60',
        description: 'Best practices for pruning, harvesting, and pest control of Honeycrisp apples.',
        members: 420,
        rules: '1. Apple pruning timelines only. 2. Organic pest control guides.',
        admins: ['Soil Dr. Amit'],
        pinnedPost: 'Summer pruning guidelines for maximizing sun exposure are uploaded.'
      });
    } else if (cropKeyword === 'coffee') {
      list.push({
        id: 'coffee',
        name: '[Coffee Growers]',
        iconType: 'droplet',
        banner: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=800&auto=format&fit=crop&q=60',
        description: 'Shade management, coffee rust monitoring, and harvest processing.',
        members: 280,
        rules: '1. Focus on quality cherries. 2. Share rust alerts.',
        admins: ['Soil Dr. Amit'],
        pinnedPost: 'Coffee rust preventive spray schedule has been updated for this monsoon.'
      });
    } else {
      // Dynamic fallback
      list.push({
        id: 'dynamic',
        name: `[${activeCrop} Growers]`,
        iconType: 'leaf',
        banner: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60',
        description: `Discussion group dedicated to ${activeCrop} cultivation and farming logs.`,
        members: 150,
        rules: '1. Respect all farmers. 2. Keep posts relevant to this crop.',
        admins: ['Soil Dr. Amit'],
        pinnedPost: `Welcome to the ${activeCrop} Growers community!`
      });
    }
    return list;
  }, [cropKeyword, activeCrop]);

  const activeCommunity = communities[0];

  // Dynamic Trending Hashtags based on Crop
  const trendingHashtags = useMemo(() => {
    if (cropKeyword === 'tomato') {
      return [
        { tag: '#TomatoDisease', posts: 142 },
        { tag: '#OrganicFarming', posts: 89 },
        { tag: '#SoilHealth', posts: 53 }
      ];
    } else if (cropKeyword === 'rice') {
      return [
        { tag: '#SRIMethod', posts: 110 },
        { tag: '#MonsoonSowing', posts: 95 },
        { tag: '#PaddyWater', posts: 42 }
      ];
    } else if (cropKeyword === 'apple') {
      return [
        { tag: '#AppleThinning', posts: 64 },
        { tag: '#OrchardPest', posts: 38 },
        { tag: '#SoilHealth', posts: 24 }
      ];
    } else if (cropKeyword === 'sweet potato') {
      return [
        { tag: '#CuringGuide', posts: 45 },
        { tag: '#RootHealth', posts: 29 },
        { tag: '#SoilHealth', posts: 12 }
      ];
    } else if (cropKeyword === 'coffee') {
      return [
        { tag: '#CoffeeRust', posts: 72 },
        { tag: '#CherryMaturation', posts: 51 },
        { tag: '#SoilHealth', posts: 33 }
      ];
    }
    return [
      { tag: '#CropCare', posts: 31 },
      { tag: '#FarmingLogs', posts: 18 },
      { tag: '#SoilHealth', posts: 10 }
    ];
  }, [cropKeyword]);

  // Suggested Experts List
  const [expertProfiles, setExpertProfiles] = useState([
    {
      username: 'SoilnFalter',
      name: 'Soil Dr. Amit',
      role: 'Agronomy Specialist',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
      location: 'Agricultural Research Inst, Pune',
      experience: '15 Years Soil Health Research',
      crops: 'Soil Nutrition, Fertilizers',
      followers: 2430,
      joinedGroups: ['[Organic Growers]'],
      trustScore: 98,
      following: false
    },
    {
      username: 'FaimFater',
      name: 'Aman Amit',
      role: 'Paddy Expert',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
      location: 'Nashik, Maharashtra',
      experience: '10 Years Rice Cultivation',
      crops: 'Basmati Rice, SRI Method',
      followers: 1890,
      joinedGroups: ['[South India Hub]'],
      trustScore: 94,
      following: false
    },
    {
      username: 'PriyaFarm',
      name: 'Mser Nrii',
      role: 'Pest Specialist',
      verified: false,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
      location: 'Coimbatore, TN',
      experience: '6 Years Integrated Pest Mgmt',
      crops: 'Chili, Grapes, Tomatoes',
      followers: 840,
      joinedGroups: ['[Hydroponic Hub]'],
      trustScore: 88,
      following: false
    }
  ]);

  // Combined Posts Database
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: 'Farmer Priya',
        username: 'PriyaFarms',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60',
        verified: true,
        location: 'Pune, Maharashtra'
      },
      time: '2h ago',
      content: 'Anyone else seeing this type of leaf curl on their vine tomatoes?',
      crop: 'Tomatoes',
      location: 'Plot B-North',
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=60'
      ],
      aiBadge: true,
      aiAnalysis: {
        disease: 'Early Blight (Alternaria Solani)',
        confidence: 91,
        recommendation: 'Remove affected lower leaves immediately to improve ventilation. Apply copper-based organic fungicides.'
      },
      likes: 12,
      liked: false,
      comments: [
        {
          id: 101,
          authorName: 'Soil Dr. Amit',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
          time: '1h ago',
          text: 'Priya, definitely trim those bottom leaves so they do not touch the damp soil. High moisture accelerates Alternaria spores. neem oil spray at 2% is also effective.',
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
        name: 'Rakesh',
        username: 'RakeshFarmBuddy',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
        verified: true,
        location: 'Satara, Maharashtra'
      },
      time: '4h ago',
      content: 'Final harvest coming soon for our paddy crops!',
      crop: 'Paddy Rice',
      location: 'Plot D-South',
      videoUrl: 'mock_video',
      videoThumbnail: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=60',
      aiBadge: false,
      likes: 24,
      liked: true,
      comments: [],
      commentsExpanded: false,
      saved: true,
      shares: 5
    },
    {
      id: 3,
      author: {
        name: 'Suresh Kumar',
        username: 'SureshGrower',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60',
        verified: true,
        location: 'Shimla, HP'
      },
      time: '1d ago',
      content: 'Thinning the Honeycrisp apples to ensure better fruit size and sugar concentration.',
      crop: 'Organic Honeycrisp Apples',
      location: 'Plot A-West',
      images: [
        'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=60'
      ],
      aiBadge: false,
      likes: 18,
      liked: false,
      comments: [],
      commentsExpanded: false,
      saved: false,
      shares: 1
    },
    {
      id: 4,
      author: {
        name: 'Ramesh Patel',
        username: 'RameshAgri',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
        verified: true,
        location: 'Anand, Gujarat'
      },
      time: '2d ago',
      content: 'Curing sweet potatoes under 30°C temperature for proper skin healing.',
      crop: 'Japanese Sweet Potatoes',
      location: 'Plot C-East',
      images: [
        'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=600&auto=format&fit=crop&q=60'
      ],
      aiBadge: false,
      likes: 15,
      liked: false,
      comments: [],
      commentsExpanded: false,
      saved: false,
      shares: 3
    },
    {
      id: 5,
      author: {
        name: 'Coffee Master',
        username: 'CoffeeFm',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60',
        verified: true,
        location: 'Coorg, Karnataka'
      },
      time: '3d ago',
      content: 'Coffee cherries are maturing well. Shade canopy index is perfect.',
      crop: 'Premium Arabica Coffee',
      location: 'Hills-Slope B',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=60'
      ],
      aiBadge: false,
      likes: 31,
      liked: false,
      comments: [],
      commentsExpanded: false,
      saved: false,
      shares: 4
    }
  ]);

  // Combined Active User Profile
  const activeFarmerProfile = useMemo(() => {
    if (!selectedFarmerUsername) return null;
    return expertProfiles.find(f => f.username === selectedFarmerUsername) || {
      username: selectedFarmerUsername,
      name: selectedFarmerUsername === 'PriyaFarms' ? 'Farmer Priya' : 'Rakesh',
      role: 'Farmer',
      verified: true,
      avatar: selectedFarmerUsername === 'PriyaFarms' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60',
      location: 'Maharashtra Region',
      experience: '5 Years Cultivation',
      crops: activeCrop,
      followers: 430,
      joinedGroups: [activeCommunity.name],
      trustScore: 92,
      following: false
    };
  }, [selectedFarmerUsername, expertProfiles, activeCrop, activeCommunity]);

  // Dynamic Webinar Topic based on Crop
  const activeWebinarTopic = useMemo(() => {
    if (cropKeyword === 'tomato') {
      return 'Webinar: Tomato Blight Organic Control & Ventilation';
    } else if (cropKeyword === 'rice') {
      return 'Webinar: Drip Irrigation & SRI Paddy Cultivation';
    } else if (cropKeyword === 'apple') {
      return 'Webinar: Maximizing Orchard Quality & Thinning';
    } else if (cropKeyword === 'sweet potato') {
      return 'Webinar: Curing & Storage Techniques';
    } else if (cropKeyword === 'coffee') {
      return 'Webinar: Managing Coffee Rust in Monsoons';
    }
    return 'Webinar: Soil Health & Canopy Index Management';
  }, [cropKeyword]);

  // Filter Timeline Posts (Lock to active crop category!)
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // Dynamic Crop Filtering
      const postCropLower = post.crop ? post.crop.toLowerCase() : '';
      
      if (cropKeyword === 'tomato') {
        if (!postCropLower.includes('tomato')) return false;
      } else if (cropKeyword === 'rice') {
        if (!postCropLower.includes('rice') && !postCropLower.includes('paddy')) return false;
      } else if (cropKeyword === 'sweet potato') {
        if (!postCropLower.includes('sweet potato') && !postCropLower.includes('potato')) return false;
      } else if (cropKeyword === 'apple') {
        if (!postCropLower.includes('apple')) return false;
      } else if (cropKeyword === 'coffee') {
        if (!postCropLower.includes('coffee')) return false;
      } else {
        // Fallback match using normalized keyword
        if (!postCropLower.includes(cropKeyword)) return false;
      }

      // Search Query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesAuthor = post.author.name.toLowerCase().includes(query);
        const matchesContent = post.content.toLowerCase().includes(query);
        if (!matchesAuthor && !matchesContent) return false;
      }

      // Hashtag filter
      if (selectedHashtag && !post.content.toLowerCase().includes(selectedHashtag.toLowerCase())) {
        return false;
      }

      return true;
    }).sort((a, b) => b.id - a.id);
  }, [posts, searchQuery, selectedHashtag, cropKeyword]);

  // Social actions
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
    addNotification("Bookmarked", "Discussion added to saved list.", "success");
  };

  const handleShare = (postId) => {
    navigator.clipboard.writeText(`https://farmbuddy.uvfarms.in/community/post/${postId}`);
    addNotification("Copied Link", "Link copied to clipboard.", "success");
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
          nextState ? "Followed Expert" : "Unfollowed",
          nextState ? `Following ${e.name}` : `Unfollowed ${e.name}`,
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
        location: activeBatch?.location || 'My Farm'
      },
      time: 'Just now',
      content: postText,
      crop: activeCrop, // AUTO FIXED TO ACTIVE CROP CYCLE!
      location: activeBatch?.location || null,
      images: postAttachments.map(a => a.url),
      aiBadge: postText.includes('spot') || postText.includes('curl') || postText.includes('blight'),
      aiAnalysis: postText.includes('spot') || postText.includes('blight') ? {
        disease: 'Early Spot / Blight Suspect',
        confidence: 85,
        recommendation: 'System detected signs of foliage fungus. Trim lower leaves and spray organic suspension.'
      } : null,
      likes: 0,
      liked: false,
      comments: [],
      commentsExpanded: false,
      saved: false,
      shares: 0
    };

    setPosts(prev => [newPost, ...prev]);
    addNotification("Posted successfully", `Your update is live in the ${activeCrop} Community feed.`, "success");
    setPostText('');
    setPostAttachments([]);
  };

  // Comments toggles & updates
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
        ...(prev[postId] || { text: '', emojiOpen: false }),
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

  const renderGroupIcon = (type) => {
    switch (type) {
      case 'map-pin':
        return <MapPin className="h-4.5 w-4.5 text-[#2E7D32]" />;
      case 'droplet':
        return <Droplet className="h-4.5 w-4.5 text-[#2E7D32]" />;
      default:
        return <Sprout className="h-4.5 w-4.5 text-[#2E7D32]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#F8F6EF] dark:bg-[#0c140f] min-h-screen text-stone-900 dark:text-emerald-50 transition-colors duration-300">
      
      {/* 3-COLUMN STRUCTURE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: ACTIVE GROUP INFO & HASHTAGS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Group Highlight (Read-only) */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-stone-900 dark:text-white">Active Community</h2>
            <div className="space-y-3">
              {communities.map(comm => (
                <div 
                  key={comm.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F8F6EF]/60 dark:bg-emerald-950/10 border-l-4 border-[#2E7D32]"
                >
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                    {renderGroupIcon(comm.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-xs truncate text-stone-850 dark:text-stone-100">{comm.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Trending Topics */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-stone-900 dark:text-white">Trending Topics</h2>
            <div className="space-y-3 font-semibold text-xs text-stone-600 dark:text-stone-300">
              {trendingHashtags.map(t => (
                <div 
                  key={t.tag}
                  onClick={() => {
                    setSelectedHashtag(selectedHashtag === t.tag ? null : t.tag);
                  }}
                  className={`cursor-pointer hover:text-[#2E7D32] transition-colors py-1 block ${
                    selectedHashtag === t.tag ? 'text-[#2E7D32] font-black' : ''
                  }`}
                >
                  {t.tag}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER TIMELINE FEED */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Section title */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold tracking-tight">Community Hub</h1>
          </div>

          {/* CREATE POST INPUT BAR ROW (Auto-tagged to active Crop and Plot) */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#121f17] p-3.5 border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] shadow-sm">
            <div className="relative flex-1">
              <input
                type="text"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder={`Post updates about ${activeCrop}...`}
                className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full pl-5 pr-4 py-2 text-xs placeholder-stone-450 focus:outline-none focus:ring-1 focus:ring-[#2E7D32] font-semibold"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => addNotification("Attach Image", "Local image selection trigger.", "info")}
                className="p-2 bg-[#1b4332] text-white hover:bg-emerald-950 rounded-xl transition-all"
                title="Upload Image"
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => addNotification("Attach Video", "Local video selection trigger.", "info")}
                className="p-2 bg-[#1b4332] text-white hover:bg-emerald-950 rounded-xl transition-all"
                title="Upload Video"
              >
                <Video className="h-3.5 w-3.5" />
              </button>
              {postText.trim() && (
                <button
                  onClick={handleCreatePost}
                  className="px-4 py-1.5 bg-[#2E7D32] hover:bg-emerald-700 text-white rounded-full text-xs font-black transition-all shadow-sm"
                >
                  Post
                </button>
              )}
            </div>
          </div>

          {/* SELECTED HASHTAG FILTER */}
          {selectedHashtag && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-bold text-[#2E7D32]">Showing matches for: <strong>{selectedHashtag}</strong></span>
              <button onClick={() => setSelectedHashtag(null)} className="text-stone-400 hover:text-stone-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ISOLATED COMMUNITY BANNER & DETAILS */}
          {activeCommunity && (
            <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] overflow-hidden shadow-sm">
              <div className="h-24 relative">
                <img src={activeCommunity.banner} alt={activeCommunity.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                      {activeCommunity.name}
                      <CheckCircle className="h-3.5 w-3.5 text-[#2E7D32]" />
                    </h2>
                    <span className="text-[9px] text-[#2E7D32] font-black block mt-0.5">
                      {activeCommunity.members} Members
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed cursor-default select-none">
                  {activeCommunity.description}
                </p>

                {/* Admins & Guidelines */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-stone-850 text-[10px]">
                  <div>
                    <span className="font-extrabold block text-stone-400 uppercase tracking-wider mb-1">Admins</span>
                    <p className="font-bold text-[#2E7D32]">{activeCommunity.admins.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-extrabold block text-stone-400 uppercase tracking-wider mb-1">Guidelines</span>
                    <p className="text-stone-500 italic">{activeCommunity.rules}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE FEED */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-8 text-center text-stone-400">
                <Users className="h-8 w-8 mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-bold">No discussions logged for {activeCrop} yet.</p>
                <p className="text-[10px] text-stone-400 mt-1">Be the first to share an update or ask a question above!</p>
              </div>
            ) : (
              filteredPosts.map(post => {
                const commentState = repliesState[post.id] || { text: '', emojiOpen: false };
                return (
                  <div key={post.id} className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
                    
                    {/* Top row */}
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <img 
                          src={post.author.avatar} 
                          alt={post.author.name} 
                          className="h-10 w-10 rounded-full object-cover cursor-pointer"
                          onClick={() => setSelectedFarmerUsername(post.author.username)}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              onClick={() => setSelectedFarmerUsername(post.author.username)}
                              className="font-black text-xs text-stone-900 dark:text-white cursor-pointer hover:underline"
                            >
                              {post.author.name}
                            </span>
                            {post.author.verified && (
                              <CheckCircle className="h-3.5 w-3.5 text-[#2E7D32]" />
                            )}
                            <span className="text-[10px] text-stone-400">@{post.author.username}</span>
                            <span className="text-[10px] text-stone-300 dark:text-stone-750">•</span>
                            <span className="text-[9px] text-[#2E7D32] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded font-extrabold">
                              <Sprout className="h-2.5 w-2.5" />
                              Verified
                            </span>
                          </div>
                          <span className="text-[9px] text-stone-400 block mt-0.5">{post.time} • {post.author.location}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => addNotification("Action", "More options placeholder.", "info")} 
                        className="text-stone-400 hover:text-stone-600"
                      >
                        <MoreHorizontal className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Content text */}
                    <p className="text-xs text-stone-750 dark:text-stone-200 leading-relaxed font-semibold">
                      {post.content}
                    </p>

                    {/* Images / Videos */}
                    {post.images && post.images.length > 0 && !post.videoUrl && (
                      <div className="rounded-2xl overflow-hidden border border-stone-100">
                        <img 
                          src={post.images[0]} 
                          alt="Crop log" 
                          className="w-full h-64 object-cover cursor-pointer"
                          onClick={() => {
                            if (post.aiBadge) {
                              setActiveAiPost(post);
                              setShowAiAnalysisModal(true);
                            }
                          }}
                        />
                      </div>
                    )}

                    {post.videoUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-stone-150 h-56 bg-stone-900">
                        <img src={post.videoThumbnail} alt="video thumbnail" className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button 
                            onClick={() => addNotification("Video Playing", "Simulating video playback player.", "info")}
                            className="p-4 bg-emerald-600 text-white rounded-full hover:scale-115 transition-transform shadow-lg"
                          >
                            <Play className="h-6 w-6 fill-white" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Leaf Scan Report tag */}
                    {post.aiBadge && (
                      <div 
                        onClick={() => {
                          setActiveAiPost(post);
                          setShowAiAnalysisModal(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 cursor-pointer rounded-xl flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-350 font-bold transition-all"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
                          AI Leaf disease diagnosis report available
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* Solid dark-green actions bar with white icons */}
                    <div className="flex justify-between items-center bg-[#1b4332] rounded-xl px-5 py-2.5 text-white text-xs select-none">
                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 hover:text-emerald-300 transition-colors"
                        title="Replies"
                      >
                        <MessageCircle className="h-4.5 w-4.5" />
                        {post.comments.length > 0 && <span>{post.comments.length}</span>}
                      </button>

                      <button 
                        onClick={() => handleShare(post.id)}
                        className="flex items-center gap-1 hover:text-emerald-300 transition-colors font-extrabold text-[10px]"
                        title="Retweet"
                      >
                        <Share2 className="h-4 w-4 rotate-90" />
                        <span>RT</span>
                      </button>

                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 hover:text-emerald-300 transition-colors ${
                          post.liked ? 'text-emerald-300 font-bold' : ''
                        }`}
                        title="Like"
                      >
                        <Heart className={`h-4.5 w-4.5 ${post.liked ? 'fill-white stroke-white' : ''}`} />
                        <span>{post.likes}</span>
                      </button>

                      <button 
                        onClick={() => handleSave(post.id)}
                        className="hover:text-emerald-300 transition-colors"
                        title="Bookmark"
                      >
                        <Bookmark className={`h-4.5 w-4.5 ${post.saved ? 'fill-white stroke-white' : ''}`} />
                      </button>
                    </div>

                    {/* Comments block */}
                    {post.commentsExpanded && (
                      <div className="pt-3 space-y-3.5 border-t border-stone-100 dark:border-stone-850 animate-fadeIn text-[11px]">
                        {post.comments.map(c => (
                          <div key={c.id} className="flex gap-2.5 p-2 bg-[#F8F6EF]/60 dark:bg-stone-900/40 rounded-xl">
                            <img src={c.avatar} alt={c.authorName} className="h-7 w-7 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <span className="font-extrabold text-stone-850 dark:text-stone-100">{c.authorName}</span>
                                <span className="text-[8px] text-stone-400">{c.time}</span>
                              </div>
                              <p className="text-stone-600 dark:text-stone-300 mt-0.5">{c.text}</p>
                            </div>
                          </div>
                        ))}

                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={commentState.text}
                            onChange={(e) => handleReplyChange(post.id, 'text', e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-xl px-3 py-2 text-[10px] focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddReply(post.id)}
                            className="px-3.5 py-1.5 bg-[#2E7D32] hover:bg-[#1b4332] text-white rounded-lg font-bold text-[9px] transition-all"
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

        {/* RIGHT COLUMN: SUGGESTED EXPERTS & WEBINAR */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Suggested Experts */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 dark:text-white">Suggested Connections</h2>
              <span className="text-[10px] text-stone-400 block mt-0.5">People to follow</span>
            </div>

            <div className="space-y-4">
              {expertProfiles.map(exp => (
                <div key={exp.username} className="flex items-center justify-between gap-2 p-0.5 rounded-xl hover:bg-stone-50 dark:hover:bg-white/5 transition-all">
                  <div 
                    onClick={() => setSelectedFarmerUsername(exp.username)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <img src={exp.avatar} alt={exp.name} className="h-9 w-9 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-0.5">
                        <span className="font-extrabold text-[11px] text-stone-850 dark:text-stone-100 truncate block">{exp.name}</span>
                        {exp.verified && <CheckCircle className="h-3 w-3 text-[#2E7D32]" />}
                      </div>
                      <span className="text-[9px] text-stone-400 block truncate">@{exp.username}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFollowToggle(exp.username)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all ${
                      exp.following 
                        ? 'border border-stone-300 dark:border-stone-700 text-stone-500' 
                        : 'bg-[#2E7D32] hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {exp.following ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Webinar/Event based on crop */}
          <div className="bg-white dark:bg-[#121f17] border border-stone-200/60 dark:border-emerald-950/10 rounded-[18px] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-black text-stone-900 dark:text-white">Community Events</h2>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl space-y-2">
              <span className="text-[9px] font-bold text-[#2E7D32] block uppercase tracking-wider">Online Webinar</span>
              <h4 className="font-extrabold text-xs text-stone-900 dark:text-stone-150 leading-tight">
                {activeWebinarTopic}
              </h4>
              <div className="flex items-center gap-3 pt-2 border-t border-stone-200/40 dark:border-stone-800 text-[9px] text-stone-500 font-bold">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-[#2E7D32]" /> Aug 10, 2026</span>
                <span>|</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#2E7D32]" /> 6:00 PM</span>
              </div>
            </div>
          </div>


        </div>

      </div>

      {/* MODAL: AI DISEASE DIAGNOSIS DETAILS */}
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
                  {activeAiPost.aiAnalysis?.recommendation || 'Trimming diseased shoots and maintaining ventilation.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowAiAnalysisModal(false);
                    addNotification("Consultation Scheduled", "Request sent to Soil Dr. Amit.", "success");
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

      {/* DRAWER: USER PROFILE VIEW */}
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
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[#2E7D32] hover:bg-emerald-700 text-white"
                >
                  Follow Farmer
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
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
