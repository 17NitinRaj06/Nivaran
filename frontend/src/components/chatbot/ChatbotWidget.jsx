import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiChat, HiX, HiPaperAirplane, HiSparkles } from 'react-icons/hi';

const initialMessages = [
  {
    role: 'bot',
    text: "🌿 Welcome to Nivaran! I'm your civic assistant. Ask me about reporting issues, using the platform, or civic awareness topics.",
  },
];

const faqReplies = {
  report: 'To report an issue, click "Report Issue" in the sidebar, upload a photo, pin the location on the map, add details, and submit. AI will help suggest the category!',
  points: 'You earn 10 points for each report filed. Extra points are awarded when your reports get resolved or receive upvotes from the community.',
  badges: 'Badges are earned by reaching milestones:\n🌱 First Responder — 1 report\n👁️ Community Watcher — 5 reports\n🛡️ Neighborhood Hero — 15 reports\n🏆 Civic Champion — 30 reports',
  leaderboard: 'The leaderboard ranks community members by total points. Check it from the sidebar to see top contributors!',
  upvote: 'Upvote reports filed by other community members to show support. You cannot upvote your own reports.',
  map: 'The Map View shows all reported issues as pins. Green pins are resolved, dark green pins are pending/in progress. Click a pin to see details.',
  status: 'Reports have three statuses: Pending (awaiting review), In Progress (being addressed), and Resolved (completed).',
};

function getBotReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes('report') || lower.includes('how to') || lower.includes('submit')) return faqReplies.report;
  if (lower.includes('point') || lower.includes('score') || lower.includes('earn')) return faqReplies.points;
  if (lower.includes('badge') || lower.includes('achievement')) return faqReplies.badges;
  if (lower.includes('leaderboard') || lower.includes('rank')) return faqReplies.leaderboard;
  if (lower.includes('upvote') || lower.includes('like') || lower.includes('vote')) return faqReplies.upvote;
  if (lower.includes('map')) return faqReplies.map;
  if (lower.includes('status') || lower.includes('progress') || lower.includes('pending') || lower.includes('resolved')) return faqReplies.status;
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return 'Hello! 👋 How can I help you with Nivaran today?';
  if (lower.includes('thank')) return "You're welcome! 🌿 Keep making your community better!";
  return "I'm here to help with Nivaran! Try asking about reporting issues, earning points, badges, or the leaderboard. Or visit the dashboard to get started!";
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    setTimeout(() => {
      const reply = getBotReply(userMsg);
      setMessages((prev) => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-nature-gradient flex items-center justify-center shadow-card hover:shadow-card-hover hover:scale-105 transition-all"
      >
        {isOpen ? (
          <HiX className="text-white" size={24} />
        ) : (
          <HiChat className="text-white" size={24} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[500px] bg-white rounded-3xl shadow-card-hover border border-beige-100 flex flex-col overflow-hidden"
          >
            <div className="bg-nature-gradient p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <HiSparkles size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg">Nivaran Assistant</h3>
                  <p className="text-sage-200 text-xs">Ask me anything!</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-forest-600 text-white rounded-br-md'
                        : 'bg-beige-50 text-earth-800 rounded-bl-md'
                    }`}
                  >
                    {msg.text.split('\n').map((line, j) => (
                      <p key={j}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-beige-50 rounded-2xl rounded-bl-md p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-beige-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Nivaran..."
                  className="input-field py-2.5 text-sm flex-1"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-forest-700 transition-colors"
                >
                  <HiPaperAirplane size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
