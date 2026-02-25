import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, 
  Brain, 
  Briefcase, 
  Lightbulb, 
  Shield, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Maximize,
  Minimize,
  Video,
  Square
} from 'lucide-react';
import Hls from 'hls.js';

// --- STYLES INJECTION ---
const injectStyles = () => {
  if (typeof document === 'undefined') return;
  const styleId = 'presentation-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
    
    body, html, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #000;
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow: hidden;
      color: white;
    }

    /* Liquid Glass Aesthetic */
    .liquid-glass {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border: 1px solid rgba(255, 255, 255, 0.12);
      position: relative;
      overflow: hidden;
    }
    
    .liquid-glass::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
};

// --- COMPONENTS ---

const VideoBackground = ({ src }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn("Autoplay prevented:", e));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari Native HLS Fallback
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.warn("Autoplay prevented:", e));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
    />
  );
};

const Logo = () => (
  <svg width="129" height="40" viewBox="0 0 129 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 10 L30 30 L10 30 Z" fill="white" />
    <circle cx="45" cy="20" r="10" fill="white" fillOpacity="0.5" />
    <text x="65" y="26" fill="white" fontSize="20" fontWeight="bold" letterSpacing="-0.02em">OPTIMAL</text>
  </svg>
);

const Header = ({ pageText }) => (
  <div className="absolute top-[4%] left-[5.2%] right-[5.2%] flex justify-between items-center z-20">
    <div className="flex-1 flex justify-start"><Logo /></div>
    <div className="flex-1 flex justify-center text-[clamp(12px,1.05vw,20px)] opacity-80 tracking-wide uppercase text-center">Pitch Deck</div>
    <div className="flex-1 flex justify-end text-[clamp(12px,1.05vw,20px)] opacity-80">{pageText}</div>
  </div>
);

const Presentation = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const hideTimeoutRef = useRef(null);
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen();
          break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = useCallback(() => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  }, []);

  useEffect(() => {
    handleMouseMove(); // Initial trigger
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [handleMouseMove]);

  const startRecording = async () => {
    try {
      // Prompts the user to select the current tab to record
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true // Captures system audio/microphone for narration
      });
      
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'video/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `presentation-recording.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        recordedChunksRef.current = [];
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Listen for the user stopping the share via the browser's native UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      };
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      // Stop all tracks to remove the red browser recording indicator
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-black overflow-hidden select-none"
      onClick={handleMouseMove}
    >
      {/* Slides */}
      {slides.map((slide, index) => {
        let stateClass = '';
        if (index === currentSlide) {
          stateClass = 'opacity-100 scale-100 z-10 pointer-events-auto';
        } else if (index < currentSlide) {
          stateClass = 'opacity-0 scale-95 z-0 pointer-events-none';
        } else {
          stateClass = 'opacity-0 scale-105 z-0 pointer-events-none';
        }

        return (
          <div 
            key={index} 
            className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out origin-center ${stateClass}`}
          >
            {slide}
          </div>
        );
      })}

      {/* Top Right Hint */}
      <div 
        className={`absolute top-[5%] right-[5.2%] text-[11px] text-white/40 z-30 tracking-widest uppercase transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        ← → Navigate &middot; F Fullscreen
      </div>

      {/* Bottom Navigation Bar */}
      <div 
        className={`absolute bottom-[4%] left-[5.2%] right-[5.2%] z-30 flex items-center justify-between transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="text-[13px] text-white/50 tabular-nums font-medium tracking-widest w-24">
          {currentSlide + 1} / {slides.length}
        </div>

        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-[6px] rounded-full transition-all duration-300 ease-in-out ${idx === currentSlide ? 'w-[24px] bg-white/90' : 'w-[6px] bg-white/30'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 w-auto min-w-[6rem] justify-end">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-1.5 rounded-md transition-colors ${isRecording ? 'text-red-500 hover:bg-red-500/20 bg-red-500/10' : 'text-white/50 hover:text-white/90 hover:bg-white/10'}`}
            title={isRecording ? "Stop Recording" : "Record Presentation to Video"}
          >
            {isRecording ? <Square size={16} fill="currentColor" /> : <Video size={16} />}
          </button>
          <button 
            onClick={prevSlide}
            className="p-1.5 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-md transition-colors"
            disabled={currentSlide === 0}
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={nextSlide}
            className="p-1.5 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-md transition-colors"
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight size={18} />
          </button>
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-white/50 hover:text-white/90 hover:bg-white/10 rounded-md transition-colors"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SLIDE COMPONENTS ---

const CoverSlide = ({ videoSrc }) => (
  <div className="relative w-full h-full">
    <VideoBackground src={videoSrc} />
    <Header pageText="" />
    
    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-[5.2%] -mt-[3%]">
      <h1 className="text-[clamp(32px,5vw,96px)] font-bold tracking-[-0.02em] leading-[1.05]">
        AI-Powered Data Analytics
      </h1>
      <h2 className="text-[clamp(20px,2.5vw,48px)] font-light opacity-90 mt-[1.5%]">
        Unlocking Business Potential
      </h2>
      <p className="text-[clamp(14px,1.2vw,24px)] font-medium opacity-75 mt-[2%] text-[#D2FF55]">
        By John Doe
      </p>
    </div>

    <div className="absolute bottom-[4%] left-0 w-full text-center z-10">
      <p className="text-[clamp(12px,1vw,20px)] opacity-60 tracking-widest">2024</p>
    </div>
  </div>
);

const IntroSlide = ({ videoSrc }) => (
  <div className="relative w-full h-full">
    <VideoBackground src={videoSrc} />
    <Header pageText="Page 001" />

    <div className="relative z-10 w-full h-full px-[5.2%] pt-[12%] flex flex-col">
      <h2 className="text-[clamp(28px,3.5vw,64px)] font-bold tracking-[-0.02em] leading-[1.05] max-w-[60%]">
        The Rise of AI <br />
        <span className="font-light text-white/80">in Data Analytics</span>
      </h2>

      <div className="flex flex-row mt-[3.5%] gap-[4%] w-full items-start">
        {/* Column 1 */}
        <div className="flex-[0_0_22%] flex flex-col gap-4">
          <p className="text-[clamp(13px,1vw,20px)] opacity-90 leading-relaxed">
            The global AI in analytics market is experiencing exponential growth, scaling rapidly from $150B towards an anticipated milestone.
          </p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-[clamp(28px,3.5vw,64px)] font-bold leading-none">$300<span className="text-[0.6em] opacity-50">B</span></span>
            <span className="text-[clamp(13px,1vw,20px)] text-white/80 font-medium">2027</span>
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex-[0_0_38%]">
          <p className="text-[clamp(13px,1.1vw,20px)] opacity-90 leading-[1.6]">
            Businesses across all sectors are rapidly adopting AI-driven analysis tools to parse vast datasets, uncover hidden patterns, and predict future market trends. This transformation shifts organizations from reactive reporting to proactive, intelligent strategy execution, fundamentally redefining competitive advantage in the modern digital economy.
          </p>
        </div>

        {/* Column 3 */}
        <div className="flex-[0_0_20%] flex flex-col">
          <h3 className="text-[clamp(28px,3.5vw,64px)] font-bold leading-none">25–40%</h3>
          <p className="text-[clamp(13px,1vw,16px)] opacity-80 mt-2">
            Increase in operational efficiency reported by early enterprise adopters.
          </p>
          
          <svg width="100%" height="auto" viewBox="0 0 150 60" className="mt-[10%] overflow-visible">
            <defs>
              <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D2FF55" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#D2FF55" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 50 Q 30 45, 60 35 T 110 20 T 150 10 L 150 60 L 0 60 Z" fill="url(#graphGradient)" />
            <path d="M 0 50 Q 30 45, 60 35 T 110 20 T 150 10" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="0" cy="50" r="4" fill="#B750B2" stroke="white" strokeWidth="1.5" />
            <circle cx="150" cy="10" r="4" fill="#B750B2" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>

    <div className="absolute bottom-[4%] right-[5.2%] z-10">
      <p className="text-[clamp(12px,1vw,20px)] opacity-60 tracking-widest uppercase">The Rise of AI</p>
    </div>
  </div>
);

const AnalyticsSlide = ({ videoSrc }) => (
  <div className="relative w-full h-full">
    <VideoBackground src={videoSrc} />
    <Header pageText="Page 002" />

    <div className="relative z-10 w-full h-full flex flex-col items-center pt-[10%] pb-[8%]">
      <div className="text-center mb-[4%]">
        <p className="text-[clamp(14px,1.2vw,24px)] opacity-90 font-medium uppercase tracking-widest mb-2">
          Transforming Data into Intelligence with
        </p>
        <h2 className="text-[clamp(28px,3.5vw,64px)] font-bold tracking-[-0.02em] leading-none">
          AI-Powered Analytics
        </h2>
      </div>

      <div className="flex flex-col gap-[clamp(10px,1.5vw,27px)] px-[5.2%] w-full h-full flex-1">
        {/* Top Row */}
        <div className="flex w-full gap-[clamp(10px,1.5vw,27px)] flex-1">
          <AnalyticsCard 
            icon={Monitor} 
            title="Advanced Capabilities" 
            desc="Real-time processing, predictive analytics, and machine learning." 
          />
          <AnalyticsCard 
            icon={Brain} 
            title="Smarter Decision-Making" 
            desc="Helping businesses unlock insights and optimize efficiency." 
          />
          <AnalyticsCard 
            icon={Briefcase} 
            title="Industry Leader" 
            desc="Driving AI-driven data analytics innovation." 
          />
        </div>
        
        {/* Bottom Row */}
        <div className="flex w-full gap-[clamp(10px,1.5vw,25px)] flex-1">
          <AnalyticsCard 
            icon={Lightbulb} 
            title="Future-Ready Solutions" 
            desc="Empowering organizations to stay competitive in a data-driven world." 
          />
          <AnalyticsCard 
            icon={Shield} 
            title="Scalable & Secure" 
            desc="Ensuring seamless AI integration with robust data protection." 
          />
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsCard = ({ icon: Icon, title, desc }) => (
  <div className="liquid-glass rounded-2xl flex-1 flex flex-col justify-end p-[clamp(20px,2.5vw,48px)] transition-transform duration-300 hover:scale-[1.02]">
    <div className="mb-auto">
      <Icon className="text-white w-[clamp(32px,2.5vw,48px)] h-[clamp(32px,2.5vw,48px)] stroke-[1.5]" />
    </div>
    <div>
      <h3 className="text-[clamp(18px,1.8vw,36px)] font-semibold leading-tight mb-2 mt-4">{title}</h3>
      <p className="text-[clamp(12px,1vw,20px)] text-white/80 leading-snug">{desc}</p>
    </div>
  </div>
);

const QuoteSlide = ({ videoSrc }) => (
  <div className="relative w-full h-full">
    <VideoBackground src={videoSrc} />
    
    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-[5.2%]">
      <div className="max-w-[70%] flex flex-col gap-[12px]">
        <p className="text-[clamp(14px,1.2vw,20px)] opacity-90 font-medium tracking-widest uppercase text-[#D2FF55]">
          Andrew Ng
        </p>
        <h2 className="text-[clamp(28px,4vw,64px)] font-medium tracking-[-0.02em] leading-[1.15]">
          &ldquo;Artificial Intelligence is the new electricity.&rdquo;
        </h2>
      </div>
    </div>
  </div>
);

const OutroSlide = ({ videoSrc }) => (
  <div className="relative w-full h-full">
    <VideoBackground src={videoSrc} />
    <Header pageText="Page 020" />

    <div className="relative z-10 w-full h-full flex flex-col justify-center px-[5.2%]">
      <h2 className="text-[clamp(28px,3.5vw,64px)] font-bold tracking-[-0.02em] leading-[1.05]">
        Contact Information & <br />
        <span className="font-light text-white/80">Final Call to Action</span>
      </h2>
      
      <p className="text-[clamp(13px,1.1vw,20px)] opacity-90 max-w-[38%] mt-[3%] leading-relaxed">
        Ready to transform your data landscape? Partner with us to integrate advanced AI analytics into your ecosystem and turn raw metrics into actionable growth strategies.
      </p>

      <div className="flex flex-col gap-[clamp(12px,1.2vw,19px)] mt-[3%]">
        <ContactItem icon={InstagramIcon} text="Instagram.com/grapho" />
        <ContactItem icon={FacebookIcon} text="Facebook.com/grapho" />
        <ContactItem icon={Phone} text="+1 (415) 987-6543" />
        <ContactItem icon={Mail} text="contact@optimalai.com" />
        <ContactItem icon={MapPin} text="Headquarters: San Francisco, CA, USA" />
      </div>
    </div>
  </div>
);

const ContactItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-4 group cursor-pointer w-max">
    <div className="p-2 rounded-full liquid-glass group-hover:bg-white/10 transition-colors">
      <Icon className="w-[clamp(18px,1.5vw,24px)] h-[clamp(18px,1.5vw,24px)] text-white" />
    </div>
    <span className="text-[clamp(13px,1.1vw,20px)] font-medium opacity-90 group-hover:opacity-100 group-hover:text-[#D2FF55] transition-colors">
      {text}
    </span>
  </div>
);

// Custom SVGs for Socials to match styling
const InstagramIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  useEffect(() => {
    injectStyles();
  }, []);

  // Note: Standard high-quality HLS test streams are used here to ensure the prototype runs perfectly 
  // since the Mux URLs provided in the prompt were truncated.
  // Replace these with your actual complete `.m3u8` Mux streaming URLs.
  const videoSources = [
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // 1. Cover Slide Source
    "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8", // 2. Intro Slide Source
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // 3. Analytics Slide Source
    "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8", // 4. Quote Slide Source
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"  // 5. Outro Slide Source
  ];

  const slides = [
    <CoverSlide key="1" videoSrc={videoSources[0]} />,
    <IntroSlide key="2" videoSrc={videoSources[1]} />,
    <AnalyticsSlide key="3" videoSrc={videoSources[2]} />,
    <QuoteSlide key="4" videoSrc={videoSources[3]} />,
    <OutroSlide key="5" videoSrc={videoSources[4]} />
  ];

  return <Presentation slides={slides} />;
}
