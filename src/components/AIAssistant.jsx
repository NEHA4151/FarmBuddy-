import { API_BASE } from '../apiConfig';
import React, { useState, useRef, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  CloudSun, 
  Activity, 
  Sparkles,
  Leaf, 
  Bot,
  Image as ImageIcon,
  Upload,
  History,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  Droplet,
  Cpu,
  FileText,
  Plus,
  Award
} from 'lucide-react';

export default function AIAssistant() {
  const { telemetry, batches, refreshBatches, currentView, setCurrentView, currentBatchId, setCurrentBatchId, generateReport, logBatchEvent, user } = useFarm();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'vision', 'history'

  // Text Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am FarmBuddy AI, your agronomic assistant. Ask me anything about crop cycles, disease prevention, or weather alerts!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Vision State
  const [imagePreview, setImagePreview] = useState(null);
  const [visionQuery, setVisionQuery] = useState("What disease is this and what should I do?");
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [visionResult, setVisionResult] = useState(null);

  // History State
  const [aiHistory, setAiHistory] = useState({ chats: [], voice: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current && activeTab === 'chat') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/history?farmer_id=${user?.farmerId || user?.id || 'FMR-0921'}`);
      if (res.ok) {
        const data = await res.json();
        setAiHistory(data);
      }
    } catch (err) {
      console.error('Failed to load AI history:', err);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Send text query to backend
  const handleSendText = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const lowerText = text.toLowerCase();
    if (lowerText.includes('generate report') || lowerText.includes('download report') || lowerText.includes('export report') || lowerText.includes('export data')) {
      setTimeout(() => {
        generateReport('FarmBuddy_Chat_Report_2026.csv');
      }, 500);
    }

    let queryWithContext = text;
    if (currentView && currentView.startsWith('workflow-')) {
      queryWithContext = `[Context: User is viewing ${currentView.replace('workflow-', '')} workflow module for batch ${currentBatchId}] ${text}`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'text', 
          query: queryWithContext,
          farmer_id: user?.farmerId || user?.id || 'FMR-0921'
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error('API error');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Sorry, I had trouble communicating with the server. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
    setIsTyping(false);
  };

  // Image Upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setVisionResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Analyze crop leaf image
  const handleAnalyzeImage = async () => {
    if (!imagePreview) return;
    setAnalyzingImage(true);
    setVisionResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          query: visionQuery,
          image: imagePreview,
          farmer_id: user?.farmerId || user?.id || 'FMR-0921'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVisionResult(data);
        if (currentBatchId && logBatchEvent) {
          await logBatchEvent(
            'Disease Scan Detected',
            `Crop Disease Warning: ${data.issue || 'Unknown'}`,
            `Gemini Vision detected issue: ${data.issue || 'Unknown'} with ${data.confidence || 0}% confidence. Recommendations: ${data.recommendations || ''}`,
            'Warning',
            -15.0
          );
        }
      } else {
        alert("Failed to analyze image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error analyzing image.");
    }
    setAnalyzingImage(false);
  };

  // Send voice command text to backend
  const getChatTopic = (chat) => {
    if (chat.input_type === 'image') {
      return chat.detected_issue || 'Tomato Disease Detection';
    }
    const q = String(chat.user_query).toLowerCase();
    if (q.includes('disease') || q.includes('blight') || q.includes('rot') || q.includes('spot') || q.includes('mold') || q.includes('fungus')) {
      return 'Tomato Disease Detection';
    }
    if (q.includes('irrigation') || q.includes('water') || q.includes('moisture') || q.includes('drip') || q.includes('watering')) {
      return 'Irrigation Planning';
    }
    if (q.includes('pest') || q.includes('insect') || q.includes('aphid') || q.includes('mite') || q.includes('bug') || q.includes('pesticide') || q.includes('neem')) {
      return 'Pest Control Suggestions';
    }
    if (q.includes('fertilizer') || q.includes('nutrient') || q.includes('fertilize') || q.includes('biogrow') || q.includes('soil')) {
      return 'Fertilizer Recommendation';
    }
    return 'General Agronomic Consultation';
  };

  const triggerShortcut = (text) => {
    setActiveTab('chat');
    handleSendText(text);
  };

  const handleSelectHistoryChat = (chat) => {
    setActiveTab('chat');
    
    const cleanQuery = String(chat.user_query).replace(/^\[Context:.*?\]\s*/, '');
    const userMsg = {
      id: chat.id,
      sender: 'user',
      text: chat.input_type === 'image' ? `[Image Analysis] ${cleanQuery}` : cleanQuery,
      timestamp: new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    let aiText = chat.ai_response;
    if (chat.input_type === 'image' && chat.recommendations) {
      aiText = `${chat.ai_response}\n\n**Recommendations:**\n${chat.recommendations}`;
    }
    
    const aiMsg = {
      id: chat.id + '_ai',
      sender: 'ai',
      text: aiText,
      timestamp: new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([userMsg, aiMsg]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 rounded-full bg-gradient-to-tr from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg border border-emerald-500/10 flex items-center justify-center relative group"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          
          {!isOpen && (
            <div className="absolute right-16 bg-stone-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-stone-850">
              Ask FarmBuddy AI ✨
            </div>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 w-[420px] max-w-[calc(100vw-2rem)] h-[560px] bg-white dark:bg-stone-850 border border-borders dark:border-emerald-950/20 rounded-3xl shadow-xl overflow-hidden flex flex-col z-50"
          >
            {/* Header */}
            <div className="pt-5 pb-4 px-4 border-b border-borders dark:border-stone-800 bg-gradient-to-r from-primary/5 to-transparent flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-sans">
                    FarmBuddy AI
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  </h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase">Multimodal Assistant v3.0</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar Navigation Tabs */}
            <div className="flex border-b border-borders dark:border-stone-800 text-[11px] font-bold bg-[#F8F6ED]/40 dark:bg-stone-900/10">
              <button 
                onClick={() => setActiveTab('chat')} 
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  activeTab === 'chat' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-450 bg-white dark:bg-stone-850' 
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                Chat
              </button>
              <button 
                onClick={() => setActiveTab('vision')} 
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  activeTab === 'vision' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-450 bg-white dark:bg-stone-850' 
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                Vision (Crop)
              </button>
              <button 
                onClick={() => setActiveTab('history')} 
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                  activeTab === 'history' 
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-450 bg-white dark:bg-stone-850' 
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                History Logs
              </button>
            </div>

            {/* Tab 1: Text Chat */}
            {activeTab === 'chat' && (
              <>
                {/* Shortcuts */}
                <div className="px-3 py-2 border-b border-borders dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap bg-stone-50/50 dark:bg-stone-900/10">
                  {(() => {
                    const shortcuts = (() => {
                      switch (currentView) {
                        case 'workflow-calendar':
                          return [
                            { text: "Why did my trust score decrease?", label: "Trust Deductions", icon: <AlertCircle className="h-3 w-3 text-red-500" /> },
                            { text: "When is my next watering task?", label: "Next Water Cycle", icon: <CalendarIcon className="h-3 w-3 text-blue-500" /> },
                            { text: "How do I complete a task?", label: "Task Guide", icon: <CheckCircle className="h-3 w-3 text-emerald-500" /> }
                          ];
                        case 'workflow-log':
                          return [
                            { text: "How do I upload field reports?", label: "Upload Help", icon: <Upload className="h-3 w-3 text-primary" /> },
                            { text: "Explain the visual form inputs", label: "Form Guide", icon: <Layers className="h-3 w-3 text-amber-500" /> },
                            { text: "Verify this timeline log authenticity", label: "Verification", icon: <Activity className="h-3 w-3 text-emerald-500" /> }
                          ];
                        case 'workflow-health':
                          return [
                            { text: "Why is my crop health rating 85%?", label: "Health Score", icon: <Leaf className="h-3 w-3 text-green-500" /> },
                            { text: "How to improve trust score?", label: "Improve Trust", icon: <Sparkles className="h-3 w-3 text-amber-500" /> },
                            { text: "Show current risk warning alerts", label: "Warnings", icon: <AlertCircle className="h-3 w-3 text-red-500" /> }
                          ];
                        case 'workflow-sensors':
                          return [
                            { text: "Explain low soil moisture anomaly", label: "Moisture Alert", icon: <Droplet className="h-3 w-3 text-blue-500" /> },
                            { text: "Are sensor readings within target ranges?", label: "Limits Guide", icon: <Cpu className="h-3 w-3 text-primary" /> },
                            { text: "How often do sensor logs update?", label: "Logs Info", icon: <Activity className="h-3 w-3 text-emerald-500" /> }
                          ];
                        case 'workflow-analytics':
                          return [
                            { text: "Show yield prediction explanation", label: "Yield Help", icon: <Leaf className="h-3 w-3 text-green-500" /> },
                            { text: "What is my task completion rate?", label: "Completion Rate", icon: <CheckCircle className="h-3 w-3 text-emerald-500" /> },
                            { text: "Explain water usage trend", label: "Water usage", icon: <Droplet className="h-3 w-3 text-blue-500" /> }
                          ];
                        case 'workflow-export':
                          return [
                            { text: "Which formats are supported for download?", label: "Export Formats", icon: <Upload className="h-3 w-3 text-primary" /> },
                            { text: "What is a crop passport?", label: "Crop Passport", icon: <FileText className="h-3 w-3 text-emerald-500" /> }
                          ];
                        default:
                          return [
                            { text: "How do I register a new crop batch?", label: "Register Batch", icon: <Plus className="h-3 w-3 text-primary" /> },
                            { text: "What is a crop trust score?", label: "Trust Score Info", icon: <Award className="h-3 w-3 text-amber-500" /> },
                            { text: "How to prevent leaf disease?", label: "Pest Control", icon: <Leaf className="h-3 w-3 text-green-500" /> },
                            { text: "Explain ledger hash security", label: "Blockchain", icon: <Sparkles className="h-3 w-3 text-primary" /> }
                          ];
                      }
                    })();

                    return shortcuts.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => triggerShortcut(s.text)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold bg-white dark:bg-stone-850 border border-borders dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-primary transition"
                      >
                        {s.icon}
                        {s.label}
                      </button>
                    ));
                  })()}
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8F6ED]/20 dark:bg-stone-900/10">
                  {messages.map((m) => (
                    <div 
                      key={m.id}
                      className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-emerald-800 text-white rounded-br-none shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-850 dark:text-stone-100 rounded-bl-none border border-borders dark:border-stone-700'
                      }`}>
                        <div className="whitespace-pre-line font-medium">{m.text}</div>
                        <span className={`block text-[9px] mt-1.5 ${
                          m.sender === 'user' ? 'text-stone-300 text-right' : 'text-stone-400 dark:text-stone-500'
                        }`}>
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-stone-50 dark:bg-stone-800 border border-borders dark:border-stone-700 rounded-2xl rounded-bl-none p-3.5 flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Text input bar */}
                <div className="p-3.5 border-t border-borders dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendText(inputText); }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask about fertilizer, soil, pest, or harvest..."
                      className="flex-1 bg-white dark:bg-stone-800 border border-borders dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white disabled:bg-stone-100 disabled:text-stone-400 dark:disabled:bg-stone-800 dark:disabled:text-stone-600 transition"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Tab 2: Vision Analysis */}
            {activeTab === 'vision' && (
              <div className="flex-1 overflow-y-auto p-5 bg-[#F8F6ED]/20 dark:bg-stone-900/10 space-y-5">
                <div className="bg-white dark:bg-stone-800 p-4 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-sm space-y-4">
                  <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">
                    Upload Crop Image
                  </span>
                  
                  {/* File Selector */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl cursor-pointer bg-stone-50 dark:bg-stone-900/30 hover:bg-stone-100 dark:hover:bg-stone-900/50 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-stone-400 mb-2" />
                        <p className="text-xs font-bold text-stone-500">Click to upload crop or leaf image</p>
                        <p className="text-[10px] text-stone-400">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange} 
                      />
                    </label>
                  </div>

                  {/* Preview of Image */}
                  {imagePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-borders h-36 bg-stone-50">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                      <button 
                        onClick={() => { setImagePreview(null); setVisionResult(null); }}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Query Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-stone-400 uppercase tracking-widest block">Question about image</label>
                    <input 
                      type="text" 
                      value={visionQuery}
                      onChange={(e) => setVisionQuery(e.target.value)}
                      placeholder="e.g. What leaf disease is this?"
                      className="w-full bg-[#FAFAFA] dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAnalyzeImage}
                    disabled={!imagePreview || analyzingImage}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {analyzingImage ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4.5 w-4.5" />
                        Analyze Crop Image
                      </>
                    )}
                  </button>
                </div>

                {/* Analysis Results Display */}
                {visionResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-stone-800 p-4 border border-emerald-500/20 rounded-2xl shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-borders dark:border-stone-700 pb-2">
                      <div>
                        <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider block">Diagnosis</span>
                        <h4 className="font-extrabold text-stone-905 dark:text-stone-100 text-sm">{visionResult.issue}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-extrabold text-stone-400 uppercase block">Confidence</span>
                        <span className="text-xs font-black text-emerald-600">{visionResult.confidence}%</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-2">
                      <span className="font-extrabold text-stone-400 block uppercase text-[9px] tracking-wider">AI Detailed Analysis</span>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed font-sans">{visionResult.response}</p>
                    </div>

                    <div className="text-xs space-y-2 border-t border-borders dark:border-stone-700 pt-3">
                      <span className="font-extrabold text-stone-400 block uppercase text-[9px] tracking-wider">Recommendations</span>
                      <p className="text-[11px] text-stone-650 dark:text-stone-300 font-sans leading-relaxed whitespace-pre-line bg-stone-50 dark:bg-stone-900/30 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                        {visionResult.recommendations}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Tab 3: History Logs */}
            {activeTab === 'history' && (
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8F6ED]/20 dark:bg-stone-900/10 flex flex-col space-y-4">
                <div className="flex items-center gap-1.5 border-b border-borders dark:border-stone-800 pb-2">
                  <History className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
                    Previous AI Consultation Topics
                  </h4>
                </div>

                {loadingHistory ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                    <span className="text-[11px] text-stone-400">Loading history logs...</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {!aiHistory.chats || aiHistory.chats.filter(c => c.input_type !== 'voice').length === 0 ? (
                      <div className="py-16 text-center text-xs text-stone-450 border border-dashed border-borders rounded-2xl">
                        No previous consultation topics saved yet.
                      </div>
                    ) : (
                      aiHistory.chats.filter(c => c.input_type !== 'voice').map((chat) => {
                        const topicTitle = getChatTopic(chat);
                        return (
                          <button
                            key={chat.id}
                            type="button"
                            onClick={() => handleSelectHistoryChat(chat)}
                            className="w-full text-left p-3.5 bg-white dark:bg-stone-800 border border-borders dark:border-stone-750 hover:border-emerald-600 dark:hover:border-emerald-600 hover:shadow-sm rounded-2xl transition-all flex items-center justify-between group active:scale-[0.99]"
                          >
                            <div className="space-y-1">
                              <span className="text-[11px] font-extrabold text-stone-900 dark:text-stone-100 block">
                                {topicTitle}
                              </span>
                              <span className="text-[9px] text-stone-400 font-semibold uppercase tracking-wider block">
                                {new Date(chat.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-stone-50 group-hover:bg-primary/10 text-stone-400 group-hover:text-primary transition-all">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
