import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { Send } from 'lucide-react';

// ─── Hollow Knight "Bug Language" Voice Synthesizer ───
// Mimics the NPC gibberish sounds from the game using Web Audio API
const playVoidVoice = (text: string, onEnd: () => void) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Break text into syllable-like chunks (2-3 chars each)
  const syllables: string[] = [];
  for (let i = 0; i < text.length; i += Math.floor(Math.random() * 2) + 1) {
    syllables.push(text.substring(i, i + 2));
  }
  
  // Limit syllables for performance
  const maxSyllables = Math.min(syllables.length, 40);
  const syllableDuration = 0.08 + Math.random() * 0.04; // 80-120ms per syllable
  const pauseDuration = 0.03; // 30ms gap between syllables
  const totalDuration = maxSyllables * (syllableDuration + pauseDuration);

  // Master gain (volume control)
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.15;
  
  // Reverb-like effect using delay
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.05;
  const delayGain = ctx.createGain();
  delayGain.gain.value = 0.3;
  
  // Low-pass filter for muffled bug-voice quality
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;
  filter.Q.value = 2;
  
  // Chain: oscillators -> filter -> masterGain -> output
  //                                    \-> delay -> delayGain -> output
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);
  masterGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(ctx.destination);

  // Base frequencies that sound "bug-like" (low, hollow range)
  const baseFreqs = [120, 140, 160, 180, 200, 220, 150, 170];
  
  for (let i = 0; i < maxSyllables; i++) {
    const startTime = ctx.currentTime + i * (syllableDuration + pauseDuration);
    
    // Main tone oscillator
    const osc = ctx.createOscillator();
    osc.type = i % 3 === 0 ? 'sawtooth' : 'square'; // Mix waveforms
    const baseFreq = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
    osc.frequency.value = baseFreq + (Math.random() - 0.5) * 60;
    
    // Per-syllable envelope (attack-decay)
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(0.8 + Math.random() * 0.2, startTime + 0.01); // Fast attack
    env.gain.linearRampToValueAtTime(0.3, startTime + syllableDuration * 0.5);
    env.gain.linearRampToValueAtTime(0, startTime + syllableDuration); // Decay
    
    osc.connect(env);
    env.connect(filter);
    
    osc.start(startTime);
    osc.stop(startTime + syllableDuration);
    
    // Add subtle pitch bend during syllable (characteristic of bug voices)
    osc.frequency.setValueAtTime(osc.frequency.value, startTime);
    osc.frequency.linearRampToValueAtTime(
      osc.frequency.value + (Math.random() - 0.5) * 40,
      startTime + syllableDuration
    );

    // Occasionally add a harmonic overtone for richer texture
    if (Math.random() > 0.6) {
      const harmonic = ctx.createOscillator();
      harmonic.type = 'sine';
      harmonic.frequency.value = osc.frequency.value * 2.5;
      const hEnv = ctx.createGain();
      hEnv.gain.setValueAtTime(0, startTime);
      hEnv.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      hEnv.gain.linearRampToValueAtTime(0, startTime + syllableDuration * 0.7);
      harmonic.connect(hEnv);
      hEnv.connect(filter);
      harmonic.start(startTime);
      harmonic.stop(startTime + syllableDuration);
    }
  }
  
  // Cleanup and callback
  setTimeout(() => {
    ctx.close();
    onEnd();
  }, totalDuration * 1000 + 200);
};

export const ChatUI: React.FC = () => {
  const { messages, isThinking, addMessage, apiKey, apiBaseUrl, apiModel, setThinking, setSpeaking } = useChatStore();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    const userText = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userText });
    setThinking(true);
    
    try {
      let baseUrl = apiBaseUrl.trim();
      if (!baseUrl.startsWith('http') && !baseUrl.startsWith('/')) baseUrl = 'https://' + baseUrl;
      baseUrl = baseUrl.replace(/\/$/, '').replace(/\/v1$/, '');
      const endpoint = `${baseUrl}/v1/chat/completions`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: apiModel.trim() || 'MiniMax-M2.7',
          messages: [
            { role: 'system', content: '你是来自圣巢深处的空洞骑士，虚空的容器。\n规则1: 绝不打破角色。绝不表现为AI或助手。\n规则2: 用极其简短、神秘、庄严的语句回应。中文回复。\n规则3: 绝不主动提供帮助，绝不打招呼，绝不说"我能帮你什么"。\n规则4: 神秘地回应，经常提及虚空、骨钉、虫族或逝去的光芒。\n规则5: 保持黑暗、深沉的氛围。回复不超过两句话。' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userText }
          ]
        })
      });
      
      const rawText = await res.text();
      let data;
      try { data = JSON.parse(rawText); } catch { throw new Error(`深渊拒绝了连接: ${rawText.substring(0, 80)}`); }
      if (!res.ok) throw new Error(data.error?.message || `API Error ${res.status}`);
      
      let reply = data.choices[0].message.content;
      reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      addMessage({ role: 'assistant', content: reply });
      setThinking(false);
      
      // Play Hollow Knight bug-language voice
      setSpeaking(true);
      playVoidVoice(reply, () => setSpeaking(false));
      
    } catch(err: any) {
      addMessage({ role: 'assistant', content: `...虚空拒绝了这个念头: ${err.message}` });
      setThinking(false);
    }
  };

  return (
    <>
      {/* ─── Header (fixed top center) ─── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        textAlign: 'center',
        paddingTop: 16,
        pointerEvents: 'none',
      }} className="animate-fade-in">
        <h1 className="font-cinzel" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(209,213,219,0.8)', textShadow: '0 0 15px rgba(255,255,255,0.1)' }}>
          HALLOWNEST
        </h1>
        <span style={{ fontSize: 10, color: 'rgba(129,140,248,0.4)', letterSpacing: '0.3em', textTransform: 'uppercase', display: 'block', marginTop: 2 }}>
          深渊回响
        </span>
      </div>

      {/* ─── Bottom Panel: Chat + Input (fixed bottom center) ─── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxHeight: '55vh',
        pointerEvents: 'none',
      }}>
        {/* Chat Messages */}
        <div 
          ref={scrollRef}
          className="mask-fade-top scrollbar-hide"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            maxWidth: 640,
            overflowY: 'auto',
            pointerEvents: 'auto',
            padding: '0 16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8, paddingBottom: 4 }}>
            {messages.length === 0 && (
              <div className="animate-void-pulse" style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <p className="font-cinzel" style={{ fontSize: 12, letterSpacing: '0.2em', color: 'rgba(165,180,252,0.3)' }}>
                  虚空等待你的声音...
                </p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="animate-float-in"
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 10,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'rgba(148,163,184,0.8)',
                  }}>⚔</div>
                )}

                <div style={{
                  padding: '10px 16px',
                  maxWidth: '75%',
                  borderRadius: msg.role === 'user' ? '16px 16px 6px 16px' : '16px 16px 16px 6px',
                  background: msg.role === 'user' ? 'rgba(79,70,229,0.12)' : 'rgba(255,255,255,0.025)',
                  border: msg.role === 'user' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                  <p style={{
                    fontSize: 13, lineHeight: 1.7, fontWeight: 300, letterSpacing: '0.03em', margin: 0,
                    color: msg.role === 'user' ? 'rgba(224,231,255,0.9)' : 'rgba(203,213,225,0.9)',
                  }}>{msg.content}</p>
                </div>

                {msg.role === 'user' && (
                  <div className="font-cinzel" style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(129,140,248,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'rgba(165,180,252,0.9)',
                  }}>你</div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="animate-float-in" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, justifyContent: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: 'rgba(148,163,184,0.8)',
                }}>⚔</div>
                <div style={{
                  padding: '12px 18px',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px 16px 16px 6px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(129,140,248,0.6)', display: 'inline-block' }}></span>
                  <span className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(129,140,248,0.6)', display: 'inline-block' }}></span>
                  <span className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(129,140,248,0.6)', display: 'inline-block' }}></span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div style={{
          flexShrink: 0,
          width: '100%',
          maxWidth: 640,
          pointerEvents: 'auto',
          padding: '12px 12px calc(60px + env(safe-area-inset-bottom, 0px)) 12px',
          background: 'linear-gradient(to top, #030308 40%, rgba(3,3,8,0.8), transparent)',
        }}>
          <div className="animate-pulse-glow" style={{
            background: 'rgba(10,12,24,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 9999,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#e2e8f0', WebkitTextFillColor: '#e2e8f0',
                padding: '8px 14px', fontSize: 14, fontWeight: 300, letterSpacing: '0.03em',
                minWidth: 0, caretColor: '#818cf8',
              }}
              placeholder="向深渊诉说..."
              disabled={isThinking}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              style={{
                padding: 10, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.7)',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (!input.trim() || isThinking) ? 0.2 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
