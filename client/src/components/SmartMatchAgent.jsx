import { useState } from 'react'
import { FiX, FiSend, FiMessageSquare, FiZap } from 'react-icons/fi'
import api from '../services/api'

function SmartMatchAgent({ onApplyMatch, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm your housing assistant. Tell me what you're looking for in an apartment, and I'll help you find the perfect match! For example: 'I need a 2 bedroom under $1500 with parking near campus.'"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Call backend to analyze the request
      const response = await api.post('/smart-match', {
        userInput: userMessage,
        conversationHistory: newMessages
      })

      const data = response.data

      if (data.filters) {
        // Add assistant response
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.message || "Great! I've found some matches based on your preferences. Let me show you the results!"
          }
        ])

        // Apply filters after a short delay for better UX
        setTimeout(() => {
          onApplyMatch(data.filters, data.sortBy || 'rating-high')
          onClose()
        }, 1000)
      } else {
        // Continue conversation
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.message || "Could you tell me more about what you're looking for? Things like number of bedrooms, budget, or preferred amenities?"
          }
        ])
      }
    } catch (error) {
      console.error('Smart match error:', error)
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble understanding. Could you try rephrasing your request?"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-eggshell-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-eggshell-400 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-matcha-500 to-matcha-600">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <FiZap className="text-matcha-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Smart Match Assistant</h2>
              <p className="text-sm text-matcha-100">Powered by AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-matcha-100 hover:bg-matcha-600 p-2 rounded-lg transition-all duration-200"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-matcha-500 text-white'
                    : 'bg-eggshell-200 text-charcoal-800 border border-eggshell-400'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <FiMessageSquare size={14} className="text-matcha-500" />
                    <span className="text-xs font-bold text-matcha-600">Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-eggshell-200 text-charcoal-800 border border-eggshell-400 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-matcha-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-matcha-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-matcha-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-charcoal-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-eggshell-400 flex-shrink-0 bg-eggshell-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your ideal apartment..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-eggshell-50 rounded-xl border border-eggshell-400 focus:outline-none focus:ring-2 focus:ring-matcha-400 text-charcoal-900 font-medium disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-matcha-500 hover:bg-matcha-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FiSend size={18} />
              Send
            </button>
          </div>
          <p className="text-xs text-charcoal-500 mt-2 text-center">
            Try: "2 bed, under $1200, pet friendly" or "quiet studio near UO"
          </p>
        </div>
      </div>
    </div>
  )
}

export default SmartMatchAgent
