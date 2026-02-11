
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PROJECTS } from './constants';
import { VideoProject, GenerationStatus, GeneratedContent } from './types';
import { generateKidsVideo, generateKidsAudio, decodeAudioData } from './services/geminiService';
import ApiKeyPrompt from './components/ApiKeyPrompt';

const App: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<VideoProject>(PROJECTS[0]);
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

    setStatus('generating-video');
    setLoadingMsg('Designing magical worlds with Veo AI...');
    setContent({});

    try {
      // 1. Generate Video
      const videoUrl = await generateKidsVideo(selectedProject.visualPrompt);
      
      // 2. Generate Audio
      setStatus('generating-audio');
      setLoadingMsg('Composing cheerful nursery rhyme sounds...');
      const audioBase64 = await generateKidsAudio(selectedProject.audioPrompt, 
        selectedProject.id === 'sleepy-star' ? 'Puck' : 'Kore');
      
      setContent({ videoUrl, audioUrl: audioBase64 });
      setStatus('completed');
      
      // Auto play audio once
      playAudio(audioBase64);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setShowKeyPrompt(true);
      }
      setStatus('error');
      setContent({ error: err.message || 'Something went wrong during generation.' });
    }
  };

  const loadingMessages = [
    "Waking up the little stars...",
    "Mixing vibrant colors for the kids...",
    "Tuning the animal voices in Wiggle Woods...",
    "Preparing the sleepy moonbeams...",
    "Finalizing the magic touches..."
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
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
            <i className="fas fa-play-circle text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            KiddoStudio <span className="text-blue-500">AI</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={() => window.location.reload()}
             className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <i className="fas fa-rotate-right"></i> Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Project Selector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i className="fas fa-film text-blue-500"></i> Select Project
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
                    <h3 className="font-bold text-gray-800 line-clamp-1">{proj.title.split('|')[0]}</h3>
                    <p className="text-xs text-gray-500">{proj.focus}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <i className="fas fa-bullhorn text-pink-500"></i> YouTube SEO Package
            </h2>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Primary Title</span>
                <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl mt-1">{selectedProject.title}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Description Snippet</span>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mt-1 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProject.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold">#{tag.replace(/\s/g, '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Generation View */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-white aspect-video relative group">
            
            {status === 'idle' && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex flex-col items-center justify-center p-12 text-center">
                <div className={`w-24 h-24 ${selectedProject.color} rounded-full flex items-center justify-center text-white text-4xl mb-6 shadow-lg animate-bounce`}>
                  <i className={`fas ${selectedProject.icon}`}></i>
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-4">Ready to Produce?</h2>
                <p className="text-gray-500 max-w-md mb-8">
                  We'll use Veo AI to create a 720p preview of <span className="font-bold text-gray-700">"{selectedProject.title.split('|')[0]}"</span> and Gemini TTS for the character voice.
                </p>
                <button 
                  onClick={handleGenerate}
                  className={`${selectedProject.color} hover:opacity-90 text-white font-black px-10 py-5 rounded-3xl text-xl shadow-xl transition-all active:scale-95 flex items-center gap-3`}
                >
                  <i className="fas fa-magic"></i> Generate Magic
                </button>
              </div>
            )}

            {(status.includes('generating') || status === 'processing') && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-8 border-gray-100 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <i className={`fas ${selectedProject.icon} text-2xl text-blue-500 animate-pulse`}></i>
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Creating your video...</h3>
                <p className="text-blue-500 font-bold text-lg animate-pulse">{loadingMsg}</p>
                <p className="mt-8 text-xs text-gray-400 max-w-xs uppercase tracking-widest font-bold">Estimated time: 30-60 seconds</p>
              </div>
            )}

            {status === 'completed' && content.videoUrl && (
              <div className="h-full w-full relative bg-black">
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
                      className="bg-white/90 hover:bg-white text-blue-600 px-4 py-2 rounded-full font-bold shadow-lg transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-volume-up"></i> Play Audio
                    </button>
                  )}
                  <a 
                    href={content.videoUrl} 
                    download={`video-${selectedProject.id}.mp4`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-bold shadow-lg transition-all flex items-center gap-2"
                  >
                    <i className="fas fa-download"></i> Save
                  </a>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-3xl mb-4">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Production Paused</h3>
                <p className="text-red-500 mb-6">{content.error}</p>
                <button 
                  onClick={handleGenerate}
                  className="bg-gray-800 text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-900 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Social Proof & Tips Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-yellow-50 rounded-3xl p-6 border border-yellow-100">
               <h3 className="font-black text-yellow-800 mb-3 flex items-center gap-2">
                 <i className="fas fa-lightbulb"></i> Pro Creator Tip
               </h3>
               <p className="text-sm text-yellow-700 leading-relaxed">
                 When uploading to YouTube Kids, remember to check <strong>"Yes, it's Made for Kids"</strong>. This ensures you appear in the filtered app where parents find content!
               </p>
             </div>
             <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100">
               <h3 className="font-black text-purple-800 mb-3 flex items-center gap-2">
                 <i className="fas fa-link"></i> Retention Loop
               </h3>
               <p className="text-sm text-purple-700 leading-relaxed">
                 Add an end screen to "Clap Clap Little Star" that points to "The Wiggle Woods". Keep toddlers watching by creating a playlist sequence!
               </p>
             </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button 
          onClick={handleGenerate}
          disabled={status !== 'idle' && status !== 'completed'}
          className={`${selectedProject.color} w-16 h-16 rounded-full text-white shadow-2xl flex items-center justify-center text-2xl active:scale-90 transition-transform disabled:opacity-50`}
        >
          <i className="fas fa-magic"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
