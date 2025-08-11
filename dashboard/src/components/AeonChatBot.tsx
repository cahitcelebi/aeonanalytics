'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Send, X, Bot, User, Loader2, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  suggestions?: string[];
  functionCalled?: string;
}

interface ChatResponse {
  type: 'conversation' | 'api_response' | 'error';
  message: string;
  data?: any;
  suggestions?: string[];
  functionCalled?: string;
}

export default function AeonChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm AeonAnalytic's smart assistant. 🎮 I can help you analyze your game metrics, get performance reports, or explore user behavior. What would you like to do?",
      timestamp: new Date(),
      suggestions: [
        'Show the overall performance of this game',
        'Get metrics for the last 30 days',
        'Analyze user retention',
        'Show revenue trend'
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const params = useParams();

  // Game ID'yi al
  const gameId = params?.gameId as string;

  // Session ID'yi oluştur
  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);

  // Mesajlar güncellendiğinde otomatik kaydırma
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chat açıldığında input'a focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Boyutlandırma state'i
  const [popupSize, setPopupSize] = useState<{ width: number|string, height: number|string }>({ width: 384, height: 600 });

  // Hızlı boyutlandırma fonksiyonu
  const handleResize = (size: 'small' | 'medium' | 'large' | 'fullscreen') => {
    if (size === 'small') setPopupSize({ width: 360, height: 500 });
    else if (size === 'medium') setPopupSize({ width: 480, height: 650 });
    else if (size === 'large') setPopupSize({ width: 700, height: 900 });
    else if (size === 'fullscreen') setPopupSize({ width: '98vw', height: '90vh' });
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    // Kullanıcı mesajını ekle
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Backend'e mesaj gönder
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          sessionId: sessionId,
          gameId: gameId,
          pageContext: window.location.pathname
        })
      });

      if (!response.ok) {
        throw new Error('Sunucu hatası');
      }

      const result: ChatResponse = await response.json();
      
      // Typing animasyonunu durdur
      setIsTyping(false);
      
      // Asistan mesajını ekle
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        data: result.data,
        suggestions: result.suggestions,
        functionCalled: result.functionCalled
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      setIsTyping(false);
      console.error('Chat hatası:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again or ask in a different way.',
        timestamp: new Date(),
        suggestions: ['Try again', 'Ask a simple question']
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });
      
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Sohbet geçmişi temizlendi. Size nasıl yardımcı olabilirim?',
        timestamp: new Date(),
        suggestions: [
          'Bu oyunun genel performansını göster',
          'Son 30 günün metriklerini getir',
          'Kullanıcı retention analizi yap'
        ]
      }]);
    } catch (error) {
      console.error('History temizleme hatası:', error);
    }
  };

  const getFunctionIcon = (functionName?: string) => {
    switch (functionName) {
      case 'getGameMetrics':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'getRetentionData':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'getRevenueAnalytics':
        return <DollarSign className="w-4 h-4 text-yellow-500" />;
      case 'getUserSegments':
        return <Users className="w-4 h-4 text-purple-500" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatApiData = (data: any): string => {
    if (!data) return '';
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Chat asistanını aç/kapat"
      >
        {isOpen ? (
          <X className="w-8 h-8" />
        ) : (
          <span className="relative block w-10 h-10">
            <MessageCircle className="w-10 h-10" />
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span style={{fontWeight: 'bold', fontSize: '1.1rem', color: 'white', letterSpacing: '1px'}}>AI</span>
            </span>
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col resize both overflow-auto min-w-[320px] min-h-[400px] max-w-[98vw] max-h-[90vh]"
          style={{ width: popupSize.width, height: popupSize.height }}
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg cursor-move select-none sticky top-0 z-20" style={{ minHeight: 56 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-semibold">AeonAnalytic Assistant</h3>
              </div>
              <div className="flex items-center space-x-2">
                {/* Hızlı boyutlandırma butonları */}
                <div className="flex gap-1 mr-2">
                  <button onClick={() => handleResize('small')} className="px-2 py-1 text-xs rounded bg-white/20 hover:bg-white/40 border border-white/30">S</button>
                  <button onClick={() => handleResize('medium')} className="px-2 py-1 text-xs rounded bg-white/20 hover:bg-white/40 border border-white/30">M</button>
                  <button onClick={() => handleResize('large')} className="px-2 py-1 text-xs rounded bg-white/20 hover:bg-white/40 border border-white/30">L</button>
                  <button onClick={() => handleResize('fullscreen')} className="px-2 py-1 text-xs rounded bg-white/20 hover:bg-white/40 border border-white/30">⛶</button>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-white/80 hover:text-white text-sm"
                  title="Clear chat history"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-1">
              Ask questions to analyze your game metrics
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mt-1">
                        {getFunctionIcon(message.functionCalled)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* API Data Display */}
                      {message.data && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-600 hover:text-blue-800">
                            Ham veriyi göster
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {formatApiData(message.data)}
                          </pre>
                        </details>
                      )}
                      
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-gray-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {messages.length > 0 && messages[messages.length - 1].suggestions && (
              <div className="flex flex-wrap gap-2">
                {messages[messages.length - 1].suggestions?.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your game metrics..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Sağ alt köşe tutamacı (klasik grip) */}
          <div className="absolute right-1 bottom-1 w-4 h-4 cursor-nwse-resize opacity-40">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M0 16 L16 0 M4 16 L16 4 M8 16 L16 8 M12 16 L16 12" stroke="#888" strokeWidth="2"/></svg>
          </div>
        </div>
      )}
    </>
  );
} 