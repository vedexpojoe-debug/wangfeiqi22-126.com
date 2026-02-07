
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserRole } from '../types';
import { chatWithCopilot } from '../services/geminiService';
import { Bot, Send, X, Sparkles, MessageSquare, Mic, Loader2 } from 'lucide-react';

interface AICopilotProps {
  userRole: UserRole;
  contextSummary: string; // Summary of current view data (e.g., "3 pending orders")
  onNavigate: (tab: string) => void;
  onAction?: (action: string) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({ userRole, contextSummary, onNavigate, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', text: `你好！我是 Eco-Brain 智能助手。\n我是您的全天候业务参谋。您可以问我：\n- "最近有什么新订单？"\n- "现在的再生石子行情如何？"\n- "帮我打开报备页面"`, sender: 'AI', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        text: input,
        sender: 'USER',
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await chatWithCopilot(input, userRole, contextSummary);
        
        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: response.reply,
            sender: 'AI',
            timestamp: Date.now(),
            actionLink: response.action
        };
        setMessages(prev => [...prev, aiMsg]);

        // Auto-execute action after a slight delay
        if (response.action) {
            if (response.action.startsWith('NAVIGATE:')) {
                const target = response.action.split(':')[1];
                setTimeout(() => {
                    onNavigate(target);
                    // setIsOpen(false); // Optional: close on navigate
                }, 1500);
            } else if (response.action === 'CREATE:ORDER' && onAction) {
                setTimeout(() => onAction('CREATE_ORDER'), 1000);
            }
        }

    } catch (error) {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "抱歉，我暂时无法连接到大脑中枢。", sender: 'AI', timestamp: Date.now() }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  return (
    <>
        {/* Floating Trigger Button */}
        {!isOpen && (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 animate-bounce-gentle ring-4 ring-white/30 backdrop-blur-sm"
            >
                <Sparkles className="w-8 h-8" />
            </button>
        )}

        {/* Chat Window */}
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-center pointer-events-none">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={() => setIsOpen(false)}></div>
                
                <div className="bg-white w-full sm:w-[380px] h-[80vh] sm:h-[600px] sm:rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden animate-slide-in-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Eco-Brain 助手</h3>
                                <div className="flex items-center text-xs opacity-80">
                                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span> 
                                    Online | Role: {userRole}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'AI' && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                    msg.sender === 'USER' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {msg.actionLink && (
                                        <div className="mt-2 text-xs opacity-75 italic flex items-center">
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 正在执行指令...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition-all">
                            <input 
                                className="flex-1 bg-transparent outline-none text-sm"
                                placeholder="输入您的问题..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                            />
                            <button className="text-gray-400 hover:text-indigo-600">
                                <Mic className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`p-2 rounded-full text-white transition-all ${!input.trim() ? 'bg-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
