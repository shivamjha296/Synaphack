'use client'

import { useState, useEffect, useRef } from 'react'
import { Message, ChatChannel } from '../models/communication'
import { communicationService } from '../lib/communicationService'

interface EventCommunicationProps {
  eventId: string
  userId: string
  userName: string
  userRole: 'organizer' | 'participant' | 'judge'
  onClose: () => void
}

const EventCommunication = ({ 
  eventId, 
  userId, 
  userName, 
  userRole, 
  onClose 
}: EventCommunicationProps) => {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<string>('announcements')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [eventId])

  useEffect(() => {
    if (activeChannel) {
      // Subscribe to messages for active channel
      const unsubscribe = communicationService.subscribeToChannelMessages(
        eventId,
        activeChannel,
        (newMessages) => {
          setMessages(newMessages)
          // Only auto-scroll if user is near the bottom (so we don't yank them while reading)
          if (isAtBottom) {
            scrollToBottom()
            setShowJumpToLatest(false)
          } else {
            setShowJumpToLatest(true)
          }
        }
      )

      return () => unsubscribe()
    }
  }, [eventId, activeChannel])

  const scrollToBottom = () => {
    // Scroll the messages container to the bottom smoothly
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const loadChannels = async () => {
    try {
      const eventChannels = await communicationService.getEventChannels(eventId)

      // Deduplicate channels by `type` while preserving the first occurrence
      // and summing messageCount so duplicates (same type) don't appear in the UI.
      const map = new Map<string, ChatChannel>()
      for (const ch of eventChannels) {
        const key = ch.type
        const existing = map.get(key)
        if (existing) {
          // Merge message counts (handle undefined)
          existing.messageCount = (existing.messageCount || 0) + (ch.messageCount || 0)
          // Prefer existing.name/description (first occurrence). If missing, fill from current.
          if (!existing.name && ch.name) existing.name = ch.name
          if (!existing.description && ch.description) existing.description = ch.description
        } else {
          // clone to avoid mutating original
          map.set(key, { ...ch })
        }
      }

      const distinct = Array.from(map.values())
      setChannels(distinct)
      if (distinct.length > 0 && !activeChannel) {
        setActiveChannel('announcements')
      }
    } catch (error) {
      console.error('Error loading channels:', error)
    } finally {
      setLoading(false)
    }
  }

  // Track scroll position to determine whether to auto-scroll on new messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const onScroll = () => {
      const threshold = 120 // px from bottom
      const atBottom = container.scrollHeight - (container.scrollTop + container.clientHeight) < threshold
      setIsAtBottom(atBottom)
      if (atBottom) setShowJumpToLatest(false)
    }

    container.addEventListener('scroll', onScroll)
    // initialize
    onScroll()

    return () => container.removeEventListener('scroll', onScroll)
  }, [messagesContainerRef.current])

  // Keyboard navigation: arrow up/down to switch channels when messages area is focused
  const handleMessagesKeyDown = (e: React.KeyboardEvent) => {
    if (!channels || channels.length === 0) return
    const idx = channels.findIndex((c) => c.type === activeChannel)
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.max(0, idx - 1)
      setActiveChannel(channels[next].type)
      setTimeout(() => setIsAtBottom(true), 50)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(channels.length - 1, idx + 1)
      setActiveChannel(channels[next].type)
      setTimeout(() => setIsAtBottom(true), 50)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)
    setError(null)

    try {
      if (activeChannel === 'announcements' && userRole === 'organizer') {
        await communicationService.sendAnnouncement(
          eventId, 
          userId, 
          userName, 
          newMessage,
          false // isSticky - could be made configurable
        )
      } else if (activeChannel === 'qa') {
        await communicationService.askQuestion(
          eventId, 
          userId, 
          userName, 
          userRole as 'participant' | 'judge',
          newMessage
        )
      } else {
        await communicationService.sendMessage({
          eventId,
          senderId: userId,
          senderName: userName,
          senderRole: userRole,
          type: 'general',
          content: newMessage
        })
      }
      
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleReaction = async (messageId: string, reaction: 'like' | 'helpful' | 'question') => {
    try {
      await communicationService.addReaction(messageId, userId, reaction)
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const canSendMessage = () => {
    if (activeChannel === 'announcements') {
      return userRole === 'organizer'
    }
    return true // All roles can send messages to other channels
  }

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'announcements': return '📢'
      case 'qa': return '❓'
      case 'general': return '💬'
      case 'technical': return '🔧'
      default: return '💬'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'organizer': return 'text-red-600 bg-red-100'
      case 'judge': return 'text-purple-600 bg-purple-100'
      case 'participant': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢'
      case 'question': return '❓'
      case 'answer': return '💡'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="text-center">
              <p className="text-gray-800 font-medium">Loading Communication</p>
              <p className="text-gray-500 text-sm">Setting up channels...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-full md:h-5/6 flex flex-col md:flex-row overflow-hidden shadow-2xl">
        {/* Channels Sidebar */}
        <div className="w-full md:w-64 bg-gray-100 border-b md:border-b-0 md:border-r border-gray-200 flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-lg">Communication</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl p-1 hover:bg-gray-200 rounded"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-2 max-h-32 md:max-h-none overflow-y-auto">
            <div className="flex md:flex-col space-x-1 md:space-x-0 md:space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel.type)}
                  className={`flex-shrink-0 md:w-full text-left p-2 md:p-3 rounded-lg transition-colors ${
                    activeChannel === channel.type
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'hover:bg-gray-200 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-center md:justify-start">
                    <span className="text-lg md:mr-2">{getChannelIcon(channel.type)}</span>
                    <div className="hidden md:block">
                      <div className="font-medium text-sm">{channel.name}</div>
                      <div className="text-xs text-gray-500">{channel.messageCount} messages</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-slate-50 sticky top-0 z-20">
            <h4 className="font-semibold text-gray-900">
              {getChannelIcon(activeChannel)} {channels.find(c => c.type === activeChannel)?.name}
            </h4>
            <p className="text-sm text-gray-700">
              {channels.find(c => c.type === activeChannel)?.description}
            </p>
            {activeChannel === 'announcements' && userRole !== 'organizer' && (
              <p className="text-xs text-orange-600 mt-1">Only organizers can post announcements</p>
            )}
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            tabIndex={0}
            onKeyDown={handleMessagesKeyDown}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
          >
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.timestamp) !== formatDate(messages[index - 1]?.timestamp)

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-4">
                      {formatDate(message.timestamp)}
                    </div>
                  )}
                  
                  <div className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                      message.senderId === userId
                        ? 'bg-blue-600 text-white'
                        : message.type === 'announcement'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-slate-50 text-gray-900'
                    }`}>
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                          <span className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-full ${getRoleColor(message.senderRole)}`}>
                            {message.senderRole}
                          </span>
                          <span className="text-xs font-medium truncate max-w-20 sm:max-w-none">
                            {message.senderName}
                          </span>
                          {message.type !== 'general' && (
                            <span className="text-xs">
                              {getMessageTypeIcon(message.type)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs opacity-75 flex-shrink-0">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      
                      {/* Message Content */}
                      <div className="text-sm break-words">
                        {message.content}
                      </div>
                      
                      {/* Message Actions */}
                      {message.senderId !== userId && (
                        <div className="flex space-x-2 mt-2 flex-wrap">
                          <button
                            onClick={() => handleReaction(message.id!, 'like')}
                            className="text-xs opacity-75 hover:opacity-100 flex items-center"
                          >
                            👍 {Object.values(message.reactions || {}).filter(r => r === 'like').length || ''}
                          </button>
                          {message.type === 'question' && (
                            <button
                              onClick={() => handleReaction(message.id!, 'helpful')}
                              className="text-xs opacity-75 hover:opacity-100"
                            >
                              💡 {Object.values(message.reactions || {}).filter(r => r === 'helpful').length || ''}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
            {/* Jump to latest button */}
            {showJumpToLatest && (
              <div className="fixed right-6 bottom-28 z-50">
                <button
                  onClick={() => {
                    scrollToBottom()
                    setShowJumpToLatest(false)
                    setIsAtBottom(true)
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
                  aria-label="Jump to latest messages"
                >
                  ⤓ New
                </button>
              </div>
            )}
          </div>

          {/* Message Input */}
          {canSendMessage() && (
            <div className="p-4 border-t border-gray-200 bg-slate-50 sticky bottom-0 z-20">
              {error && (
                <div className="mb-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                  disabled={sendingMessage}
                  placeholder={
                    sendingMessage 
                      ? 'Sending...'
                      : activeChannel === 'announcements' 
                      ? 'Send announcement...' 
                      : activeChannel === 'qa'
                      ? 'Ask a question...'
                      : 'Type a message...'
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[50px] sm:min-w-[60px] flex items-center justify-center text-sm"
                >
                  {sendingMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Send</span>
                      <span className="sm:hidden">➤</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventCommunication
