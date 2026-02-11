
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PROJECTS } from './constants';
import { VideoProject, GenerationStatus, GeneratedContent, ActiveTab } from './types';
import { generateKidsVideo, generateKidsAudio, decodeAudioData } from './services/geminiService';
import ApiKeyPrompt from './components/ApiKeyPrompt';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('presets');
  const [selectedProject, setSelectedProject] = useState<VideoProject>(PROJECTS[0]);
  const [customVisual, setCustomVisual] = useState('');
  const [customAudio, setCustomAudio] = useState('');
  
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [content, setContent] = useState<GeneratedContent>({});
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const checkApiKey = useCallback(async () => {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      setShowKeyPrompt(true);
      return false;
    }
    return true;
  }, []);

  const playAudio = async (base64: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const buffer = await decodeAudioData(bytes, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Audio playback failed", err);
    }
  };

  const handleGenerate = async () => {
    const hasKey = await checkApiKey();
    if (!hasKey) return;

    const visualPrompt = activeTab === 'custom' ? customVisual : selectedProject.visualPrompt;
    const audioPrompt = activeTab === 'custom' ? customAudio : selectedProject.audioPrompt;

    if (!visualPrompt.trim()) {
      alert("Please describe what should happen in your video!");
      return;
    }

    setStatus('generating-video');
    setLoadingMsg('Bringing your story to life...');
    setContent({});

    try {
      // 1. Generate Video
      const videoUrl = await generateKidsVideo(visualPrompt);
      
      // 2. Generate Audio (only if prompt exists)
      let audioBase64 = undefined;
      if (audioPrompt.trim()) {
        setStatus('generating-audio');
        setLoadingMsg('Adding magical voices and sounds...');
        audioBase64 = await generateKidsAudio(audioPrompt, 
          selectedProject.id === 'sleepy-star' ? 'Puck' : 'Kore');
      }
      
      setContent({ videoUrl, audioUrl: audioBase64 });
      setStatus('completed');
      
      if (audioBase64) {
        playAudio(audioBase64);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setShowKeyPrompt(true);
      }
      setStatus('error');
      setContent({ error: err.message || 'The magic sparkles got a bit tangled. Let\'s try again!' });
    }
  };

  const loadingMessages = [
    "Waking up the imagination...",
    "Painting with all the colors of the rainbow...",
    "Finding the perfect friendly faces...",
    "Making everything bright and happy...",
    "Sprinkling a little extra magic..."
  ];

  useEffect(() => {
    let interval: any;
    if (status !== 'idle' && status !== 'completed' && status !== 'error') {
      let idx = 0;
      interval = setInterval(() => {
        setLoadingMsg(loadingMessages[idx % loadingMessages.length]);
        idx++;
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="min-h-screen pb-20">
      {showKeyPrompt && <ApiKeyPrompt onSuccess={() => { setShowKeyPrompt(false); setStatus('idle'); }} />}

      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 mb-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-pink-500 to-yellow-400 p-2 rounded-xl">
            <i className="fas fa-wand-sparkles text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            KiddoStudio <span className="text-pink-500">Magic</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={() => window.location.reload()}
             className="text-gray-400 hover:text-gray-800 transition-colors"
          >
            <i className="fas fa-rotate-right"></i>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Tab Switcher & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex overflow-hidden">
            <button 
              onClick={() => { setActiveTab('presets'); setStatus('idle'); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'presets' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <i className="fas fa-book-open"></i> Stories
            </button>
            <button 
              onClick={() => { setActiveTab('custom'); setStatus('idle'); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'custom' ? 'bg-pink-500 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <i className="fas fa-hat-wizard"></i> Custom
            </button>
          </div>

          {activeTab === 'presets' ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <i className="fas fa-star text-yellow-400"></i> Choose a Story
              </h2>
              <div className="space-y-3">
                {PROJECTS.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setSelectedProject(proj);
                      if (status === 'completed') setStatus('idle');
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all border-2 flex items-center gap-4 ${
                      selectedProject.id === proj.id 
                        ? `${proj.color.replace('bg-', 'border-')} ${proj.color.replace('bg-', 'bg-')}/10` 
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-sm ${proj.color}`}>
                      <i className={`fas ${proj.icon}`}></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 line-clamp-1">{proj.title.split('🌟')[0].split('🐘')[0].split('🌙')[0]}</h3>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{proj.focus}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <i className="fas fa-pencil-alt text-pink-500"></i> Create Your Own
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">What should we see?</label>
                  <textarea 
                    value={customVisual}
                    onChange={(e) => setCustomVisual(e.target.value)}
                    placeholder="E.g. A happy purple dinosaur dancing in a candy land with chocolate rivers..."
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 focus:bg-white rounded-2xl p-4 text-gray-700 text-sm h-32 transition-all outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">What should we hear? (Optional)</label>
                  <textarea 
                    value={customAudio}
                    onChange={(e) => setCustomAudio(e.target.value)}
                    placeholder="E.g. Say in a silly voice: Welcome to the Candy Land! Watch me dance!"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-pink-200 focus:bg-white rounded-2xl p-4 text-gray-700 text-sm h-24 transition-all outline-none resize-none"
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Be descriptive! Mention colors, animals, and happy things to make the video even more magical.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                 <i className="fas fa-rocket text-blue-500"></i> Fun SEO Package
               </h2>
               <div className="space-y-4">
                 <div>
                   <span className="text-[10px] font-black text-gray-400 uppercase">Video Title</span>
                   <p className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-xl mt-1">{selectedProject.title}</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {selectedProject.tags.map(tag => (
                     <span key={tag} className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded-lg font-bold">#{tag.replace(/\s/g, '')}</span>
                   ))}
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Right: Generation View */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-white aspect-video relative group flex items-center justify-center">
            
            {status === 'idle' && (
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-blue-50 flex flex-col items-center justify-center p-12 text-center">
                <div className={`w-24 h-24 ${activeTab === 'presets' ? selectedProject.color : 'bg-pink-500'} rounded-full flex items-center justify-center text-white text-4xl mb-6 shadow-lg animate-bounce`}>
                  <i className={`fas ${activeTab === 'presets' ? selectedProject.icon : 'fa-wand-magic-sparkles'}`}></i>
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-4">
                  {activeTab === 'presets' ? "Ready for a Story?" : "Ready to Create Magic?"}
                </h2>
                <p className="text-gray-500 max-w-md mb-8">
                  {activeTab === 'presets' 
                    ? `Click the button below to bring "${selectedProject.title.split('🌟')[0].split('🐘')[0].split('🌙')[0]}" to life!` 
                    : "Describe your dream world and let our magic wand do the rest!"}
                </p>
                <button 
                  onClick={handleGenerate}
                  className={`${activeTab === 'presets' ? selectedProject.color : 'bg-pink-500'} hover:opacity-90 text-white font-black px-10 py-5 rounded-3xl text-xl shadow-xl transition-all active:scale-95 flex items-center gap-3`}
                >
                  <i className="fas fa-magic"></i> Make Magic
                </button>
              </div>
            )}

            {(status.includes('generating') || status === 'processing') && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-8 border-gray-100 border-t-pink-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <i className={`fas ${activeTab === 'presets' ? selectedProject.icon : 'fa-wand-sparkles'} text-2xl text-pink-500 animate-pulse`}></i>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Creating magic...</h3>
                <p className="text-pink-500 font-bold text-lg animate-pulse">{loadingMsg}</p>
                <p className="mt-8 text-[10px] text-gray-300 uppercase tracking-[0.2em] font-black">Just a tiny moment</p>
              </div>
            )}

            {status === 'completed' && content.videoUrl && (
              <div className="h-full w-full relative bg-gray-900">
                <video 
                  src={content.videoUrl} 
                  className="h-full w-full object-contain" 
                  controls 
                  autoPlay 
                  loop
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  {content.audioUrl && (
                    <button 
                      onClick={() => playAudio(content.audioUrl!)}
                      className="bg-white/95 hover:bg-white text-pink-600 h-12 w-12 rounded-full shadow-lg transition-all flex items-center justify-center"
                      title="Play Audio"
                    >
                      <i className="fas fa-volume-up"></i>
                    </button>
                  )}
                  <a 
                    href={content.videoUrl} 
                    download={`magic-video.mp4`}
                    className="bg-pink-500 hover:bg-pink-600 text-white h-12 w-12 rounded-full shadow-lg transition-all flex items-center justify-center"
                    title="Download Video"
                  >
                    <i className="fas fa-download"></i>
                  </a>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-3xl mb-4">
                  <i className="fas fa-cloud-rain"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Oh no! A Hiccup!</h3>
                <p className="text-red-500 mb-6 max-w-xs">{content.error}</p>
                <button 
                  onClick={handleGenerate}
                  className="bg-gray-800 text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-900 transition-all"
                >
                  Try Magic Again
                </button>
              </div>
            )}
          </div>

          {/* Tips Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
               <h3 className="font-black text-yellow-800 mb-3 flex items-center gap-2">
                 <i className="fas fa-lightbulb"></i> Fun Tip
               </h3>
               <p className="text-sm text-yellow-700 leading-relaxed font-medium">
                 {activeTab === 'presets' 
                   ? "Try making this video and then sharing it with your friends to see them dance along!" 
                   : "Try adding things like 'glitter', 'flying', or 'smiling' to your custom prompt for extra happiness!"}
               </p>
             </div>
             <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
               <h3 className="font-black text-purple-800 mb-3 flex items-center gap-2">
                 <i className="fas fa-heart"></i> Made for Kids
               </h3>
               <p className="text-sm text-purple-700 leading-relaxed font-medium">
                 Every video created here is designed to be bright, safe, and super fun for toddlers and little ones to enjoy.
               </p>
             </div>
          </div>
        </div>
      </main>

      {/* Mobile Action Button */}
      {(activeTab === 'custom' || status === 'completed') && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <button 
            onClick={status === 'completed' ? () => setStatus('idle') : handleGenerate}
            disabled={status !== 'idle' && status !== 'completed'}
            className={`bg-pink-500 w-16 h-16 rounded-full text-white shadow-2xl flex items-center justify-center text-2xl active:scale-90 transition-transform disabled:opacity-50`}
          >
            <i className={`fas ${status === 'completed' ? 'fa-plus' : 'fa-wand-magic-sparkles'}`}></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
