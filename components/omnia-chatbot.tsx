'use client'

import React from "react"

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, MapPin, HelpCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const quickActions = [
  { id: 'destinations', label: 'Top Destinations', icon: MapPin },
  { id: 'booking', label: 'Booking Help', icon: HelpCircle },
  { id: 'agent', label: 'Talk to Agent', icon: User },
]

const knowledgeBase = {
  destinations: {
    keywords: ['destination', 'place', 'where', 'popular', 'summer', 'travel to', 'visit'],
    response: "Our most popular destinations include:\n\n🏖️ Santorini, Greece - Perfect for romantic getaways\n🌴 Bali, Indonesia - Tropical paradise with stunning temples\n🏛️ Rome, Italy - Rich history and amazing cuisine\n🗼 Dubai, UAE - Modern luxury and desert adventures\n\nWould you like more details about any of these destinations?"
  },
  documents: {
    keywords: ['document', 'visa', 'passport', 'requirement', 'need', 'japan', 'permit'],
    response: "For international travel, you'll typically need:\n\n📋 Valid passport (6+ months validity)\n✈️ Visa (depending on destination)\n💉 Vaccination certificates (if required)\n🏥 Travel insurance\n\nFor Japan specifically, you'll need a valid passport and tourist visa. Would you like help with visa applications?"
  },
  booking: {
    keywords: ['book', 'reserve', 'private', 'tour', 'package', 'price', 'cost'],
    response: "I'd be happy to help you book your dream vacation! We offer:\n\n✨ Customized private tours\n📦 All-inclusive packages\n🎟️ Group and solo travel options\n\nPlease share your email or phone number, and one of our travel consultants will contact you within 24 hours. Or you can reach us at +251 94 125 2045."
  },
  general: {
    keywords: ['help', 'hello', 'hi', 'thank', 'thanks'],
    response: "I'm here to help you plan your perfect journey! You can ask me about destinations, bookings, travel requirements, or speak with one of our agents. What would you like to know?"
  }
}

function getBotResponse(userMessage: string): string {
  const message = userMessage.toLowerCase()
  
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (value.keywords.some(keyword => message.includes(keyword))) {
      return value.response
    }
  }
  
  return "That's a great question! While I'm still learning, I'd love to connect you with one of our travel experts who can give you detailed information. Would you like me to arrange a callback, or you can WhatsApp us at +251 94 125 2045?"
}

export function OmniaChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: "Hello! Ready to explore the world? Where can I help you go today?",
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages([welcomeMessage])
      }, 500)
    }
  }, [isOpen, messages.length])

  const handleQuickAction = (actionId: string) => {
    let message = ''
    switch (actionId) {
      case 'destinations':
        message = 'Show me top destinations'
        break
      case 'booking':
        message = 'I need help with booking'
        break
      case 'agent':
        message = 'I want to talk to an agent'
        break
    }
    handleSendMessage(message)
  }

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputValue.trim()
    if (!messageText) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot typing and response
    setTimeout(() => {
      setIsTyping(false)
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(messageText),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const chatRef = useRef<HTMLDivElement>(null)

  // Outside click detection
  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (e: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    // Small delay so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0056b3] text-white shadow-2xl transition-all hover:scale-110 hover:bg-[#004494] focus:outline-none focus:ring-4 focus:ring-blue-300 group"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
          </span>
          
          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
            Chat with OMNIA Concierge
          </span>
        </button>
      )}

      {/* Backdrop Overlay - Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" />
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed z-50 flex flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300
            inset-x-0 bottom-0 h-[90vh] rounded-t-2xl
            md:inset-auto md:bottom-6 md:right-24 md:h-[500px] md:w-[360px] md:max-h-[calc(100vh-8rem)] md:rounded-2xl md:border md:border-gray-200 md:dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#0056b3] to-[#003d82] px-5 py-3 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="absolute bottom-0 right-0 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">OMNIA Concierge</h3>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                    message.sender === 'user'
                      ? 'bg-[#0056b3] text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                  )}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  <p className={cn(
                    'mt-1 text-xs',
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shrink-0">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="flex items-center gap-2 rounded-full border border-[#0056b3]/30 bg-[#0056b3]/10 px-4 py-2 text-sm font-medium text-[#0056b3] transition-colors hover:bg-[#0056b3]/20 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 pt-3 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 resize-none rounded-xl border-gray-300 bg-gray-50 focus:border-[#0056b3] focus:ring-[#0056b3] dark:bg-gray-800 dark:border-gray-600"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="rounded-xl bg-[#0056b3] px-4 h-10 hover:bg-[#004494] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsOpen(false)}
              className="mt-2 w-full rounded-xl py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 md:hidden"
            >
              Close Chat
            </button>
          </div>
        </div>
      )}
    </>
  )
}
