import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Clock, Bookmark, Download, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const AI_RAG_API_BASE_URL = '/api/ai';

const suggestedQuestions = [
  'Which universities are best for Computer Science in the US?',
  'What are the visa requirements for studying in Canada?',
  'How can I improve my TOEFL score?',
  'What scholarships are available for international students?',
  'Tell me about application deadlines for Fall 2026',
];

const conversationHistory = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your AI Study Abroad Advisor. I can help you with university selection, application guidance, visa requirements, exam preparation, and more. What would you like to know?',
    timestamp: new Date(Date.now() - 300000),
  },
];

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState(conversationHistory);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: currentInput }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`AI API error ${response.status}: ${text || response.statusText}`);
      }

      const data = await response.json();

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.ai_answer || 'Sorry, I encountered an error.',
        timestamp: new Date(),
        sources: data.reference_sources,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to fetch AI response:', error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error contacting AI: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center shrink-0"
        >
          <Badge className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 border border-violet-200 mb-4 font-medium">
            <Sparkles className="w-5 h-5" />
            AI-Powered Study Advisor
          </Badge>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Your Personal Education Co-Pilot
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Get instant, personalized answers to all your study abroad questions
          </p>
        </motion.div>

        <div className="bg-white flex-1 flex flex-col min-h-[500px] rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50/70 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-200">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>History</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-200">
                  <Bookmark className="w-4 h-4 text-gray-500" />
                  <span>Saved</span>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="hover:bg-gray-200" title="Download conversation">
                  <Download className="w-4 h-4 text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-200"
                  onClick={() => setMessages(conversationHistory)}
                  title="New conversation"
                >
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      message.role === 'assistant'
                        ? 'bg-gradient-to-br from-violet-500 to-violet-400'
                        : 'bg-gradient-to-br from-amber-500 to-orange-400'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <Sparkles className="w-5 h-5 text-white" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/30" />
                    )}
                  </div>

                  <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block px-5 py-3 rounded-2xl ${
                        message.role === 'assistant'
                          ? 'bg-gray-100 text-gray-800 text-left'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                     {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 text-left text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 inline-block text-gray-500">
                            <span className="font-bold flex items-center gap-1 mb-1"><Bookmark className="w-3 h-3" /> Nguồn tham khảo:</span>
                            <ul className="list-disc list-inside">
                                {message.sources.map((source, i) => <li key={i}>{source}</li>)}
                            </ul>
                        </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 px-5 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-2 h-2 bg-gray-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-gray-400 rounded-full" />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 shrink-0">
              <p className="text-sm font-medium text-gray-500 mb-3">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <motion.div key={index} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="rounded-full bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      {question}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 p-6 bg-white shrink-0">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about studying abroad..."
                className="flex-1"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:bg-gray-300"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

