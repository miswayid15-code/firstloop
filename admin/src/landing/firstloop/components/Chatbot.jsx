import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, X, Send, Bot, Sparkles, User } from 'lucide-react';

export const Chatbot = () => {
  const { isChatbotOpen, setIsChatbotOpen } = useApp();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! 👋 How can I help you with your digital loyalty cards today?'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions = [
    "How do I add my loyalty card?",
    "How does mobile stamping work?",
    "Do customers need an app?"
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Generate intelligent assistant response
    setTimeout(() => {
      let botResponse = "Choose your merchant, select your loyalty card, and tap Add to Apple Wallet or Add to Google Wallet!";
      const q = query.toLowerCase();

      if (q.includes('app')) {
        botResponse = "No app is required! Cards are saved directly to native Apple Wallet or Google Wallet apps built into smartphones.";
      } else if (q.includes('stamp') || q.includes('how does')) {
        botResponse = "Merchants stamp customer cards in 1 second using QR scanning or the online Stamper web app at checkout.";
      } else if (q.includes('pricing') || q.includes('free') || q.includes('cost')) {
        botResponse = "First Loop offers simple, predictable plans starting at ₹799/month with instant setup!";
      }

      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'assistant', text: botResponse }
      ]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      {/* Chatbot Window Popup */}
      {isChatbotOpen && (
        <div className="w-[340px] sm:w-[380px] h-[460px] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-4 text-white flex items-center justify-between border-b border-teal-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300 border border-teal-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                  <span>First Loop Support</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <div className="text-[10px] text-teal-300 font-semibold">Instant AI Assistant</div>
              </div>
            </div>
            
            <button
              onClick={() => setIsChatbotOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold hover:bg-purple-100 transition-colors whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-full border border-slate-200 text-xs focus:outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-pink-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white"
        aria-label="Open support chat"
      >
        {isChatbotOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>

    </div>
  );
};
