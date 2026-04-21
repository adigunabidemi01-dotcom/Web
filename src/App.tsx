import React, { useState, useEffect } from 'react';
import { Sparkles, Video, CreditCard, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// AD PLACEHOLDER COMPONENT
function AdPlaceholder({ width, height, className, slotName }: { width: string, height: string, className?: string, slotName: string }) {
  return (
    <div className={cn("bg-gray-100 flex flex-col items-center justify-center border border-dashed border-gray-300 text-gray-400 text-sm overflow-hidden", className)} style={{ width, height, minHeight: height }}>
      <span>Advertisement</span>
      <span className="text-xs">{slotName}</span>
      {/* 
        To use real AdSense, replace this div content with:
        <ins className="adsbygoogle"
             style={{ display: "block" }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="YYYYYYYYYY"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      */}
    </div>
  );
}

export default function App() {
  const [promptReq, setPromptReq] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Monetization State
  const [adCredits, setAdCredits] = useState(() => parseInt(localStorage.getItem('ad_credits') || '0', 10));
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
  const [isPaidUser, setIsPaidUser] = useState(() => localStorage.getItem('is_paid_user') === 'true');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if returning from a successful Stripe checkout
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      setStripeSessionId(sessionId);
      setIsPaidUser(true); // Optimistically set, will be verified on backend during generation
      localStorage.setItem('is_paid_user', 'true');
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleGenerate = async (authMethod: 'stripe' | 'ad_credit', sessionId?: string) => {
    setIsGenerating(true);
    setShowPaywall(false);
    setErrorStatus(null);
    setResult('');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptReq,
          method: authMethod,
          sessionId: sessionId || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      setResult(data.result);
      
      if (authMethod === 'ad_credit') {
        const newCredits = adCredits - 10;
        setAdCredits(newCredits);
        localStorage.setItem('ad_credits', newCredits.toString());
      }

    } catch (error: any) {
      setErrorStatus(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const attemptGeneration = () => {
    if (!promptReq.trim()) {
       setErrorStatus("Please enter a topic first.");
       return;
    }
    
    setErrorStatus(null);

    // If paid via Stripe
    if (isPaidUser && stripeSessionId) {
      handleGenerate('stripe', stripeSessionId);
    } else if (adCredits >= 10) {
      handleGenerate('ad_credit');
    } else {
      // Need to pay or watch ads
      setShowPaywall(true);
    }
  };

  const handleBuyStripe = async () => {
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
       setErrorStatus(e.message || "Stripe config is missing.");
       setShowPaywall(false);
    }
  };

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    // Simulate a 3-second ad
    setTimeout(() => {
      const newCredits = adCredits + 1;
      setAdCredits(newCredits);
      localStorage.setItem('ad_credits', newCredits.toString());
      setIsWatchingAd(false);
    }, 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <Sparkles className="w-6 h-6" />
          PromptMaster Pro
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {isPaidUser ? (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Lifetime Access Active
            </span>
          ) : (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              Ad Credits: {adCredits}/10
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar (Ads) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
          <AdPlaceholder slotName="Sidebar Banner 1" width="100%" height="600px" className="rounded-lg shadow-sm" />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full gap-8 py-6">
          
          <div className="text-center space-y-4 pt-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
              Generate the Perfect AI Prompt.
            </h1>
            <p className="text-lg text-gray-600">
              Describe what you want to achieve, and our optimized Gemini engine will craft a master-level prompt for you.
            </p>
          </div>

          <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100 relative">
             <div className="space-y-4">
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700">What is your topic?</label>
                <textarea
                  id="prompt"
                  rows={4}
                  className="w-full resize-none p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. Write a LinkedIn post about SEO..."
                  value={promptReq}
                  onChange={(e) => setPromptReq(e.target.value)}
                />
                <button
                  onClick={attemptGeneration}
                  disabled={isGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Generating...
                    </>
                  ) : (
                    <>
                       <Sparkles className="w-5 h-5" /> Generate Magic Prompt
                    </>
                  )}
                </button>
             </div>

             {errorStatus && (
               <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{errorStatus}</p>
               </div>
             )}
          </div>

          <AdPlaceholder slotName="In-Content Banner" width="100%" height="120px" className="rounded-xl shadow-sm my-4" />

          {result && (
            <div className="bg-gray-900 text-gray-100 p-6 shadow-xl rounded-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
                <h3 className="font-semibold text-lg text-white">Your Expert Prompt</h3>
                <button
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy text'}
                </button>
              </div>
              <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </div>
          )}

        </main>

        {/* Right Sidebar (Ads) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
          <AdPlaceholder slotName="Sidebar Banner 2" width="100%" height="300px" className="rounded-lg shadow-sm" />
          <AdPlaceholder slotName="Sidebar Banner 3" width="100%" height="300px" className="rounded-lg shadow-sm" />
        </aside>
      </div>

      {/* Footer Banner */}
      <footer className="w-full bg-white border-t border-gray-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
          <AdPlaceholder slotName="Footer Leaderboard" width="100%" height="90px" className="max-w-4xl rounded-lg shadow-sm" />
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} PromptMaster Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* Monetization Gate Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-2">Unlock Your Generation</h2>
            <p className="text-gray-600 text-center mb-8">
              Support this tool by purchasing lifetime access, or watch a few ads to generate for free!
            </p>

            <div className="space-y-4">
              {/* Option A: Payment */}
              <button 
                onClick={handleBuyStripe}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold flex items-center justify-between transition-all group shadow-sm active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block text-lg">Lifetime Pro Access</span>
                    <span className="block text-indigo-200 font-normal text-sm">One-time payment of $300</span>
                  </div>
                </div>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <div className="relative py-4 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-gray-200"></div>
                <span className="relative bg-white px-4 text-sm text-gray-400 font-medium">OR</span>
              </div>

              {/* Option B: Ads */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center text-center gap-4">
                <div>
                   <p className="font-bold text-gray-900">Watch Rewarded Ads</p>
                   <p className="text-sm text-gray-500">Collect 10 Ad Credits to generate one prompt.</p>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                  <div 
                    className="bg-blue-500 h-3 transition-all duration-500 ease-out flex items-center justify-end pr-1 text-[10px] text-white font-bold leading-none" 
                    style={{ width: `${(adCredits / 10) * 100}%` }}
                  >
                    {(adCredits / 10) * 100}%
                  </div>
                </div>

                <div className="flex w-full items-center gap-3">
                  <button 
                    onClick={handleWatchAd}
                    disabled={isWatchingAd || adCredits >= 10}
                    className="flex-1 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isWatchingAd ? (
                       <>
                         <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                         Watching...
                       </>
                    ) : adCredits >= 10 ? (
                       <>Credit Earned!</>
                    ) : (
                       <>
                         <Video className="w-4 h-4 text-blue-600" /> Watch Ad ({adCredits}/10)
                       </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                        if (adCredits >= 10) {
                           handleGenerate('ad_credit');
                        }
                    }}
                    disabled={adCredits < 10}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 text-white p-3 rounded-lg font-bold transition-all shadow-md active:scale-[0.98]"
                  >
                    Use Credit
                  </button>
                </div>
              </div>

            </div>

            <button 
              onClick={() => setShowPaywall(false)}
              className="mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
