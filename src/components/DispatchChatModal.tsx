import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Phone,
  User,
  Shield,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  Radio,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { createWhatsAppUrl, WhatsAppTemplates } from '../utils/whatsapp';

export const DispatchChatModal: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    messages,
    loadingMessages,
    sendMessage,
    deleteMessage,
    clearChatHistory,
    deleteConversation,
    isChatOpen,
    setIsChatOpen,
    markConversationAsRead,
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleClearHistory = async () => {
    if (!activeConversationId) return;
    setIsClearing(true);
    try {
      await clearChatHistory(activeConversationId);
      setShowClearConfirm(false);
      setActionNotice('Chat history cleared successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      console.error('Failed to clear chat history:', err);
      setActionNotice(`Error: ${err.message || 'Failed to clear history'}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeConversationId) return;
    setDeletingMsgId(msgId);
    try {
      await deleteMessage(activeConversationId, msgId);
      setActionNotice('Message removed.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err: any) {
      console.error('Failed to remove message:', err);
      setActionNotice(`Error: ${err.message || 'Failed to delete message'}`);
    } finally {
      setDeletingMsgId(null);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // Mark as read when conversation is viewed
  useEffect(() => {
    if (isChatOpen && activeConversationId) {
      markConversationAsRead(activeConversationId);
    }
  }, [isChatOpen, activeConversationId, markConversationAsRead]);

  if (!isChatOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      await sendMessage(text);
      setIsSending(false);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setIsSending(false);
    }
  };

  // WhatsApp click-to-chat URL
  const targetPhone = isAdmin
    ? (activeConversation?.citizenPhone || '')
    : (profile?.phone || '');

  const whatsAppUrl = createWhatsAppUrl(
    profile?.phoneCountryCode || '+501',
    targetPhone,
    isAdmin
      ? WhatsAppTemplates.citizenVerification(activeConversation?.citizenName || 'Citizen')
      : WhatsAppTemplates.emergencyAssistance(profile?.displayName || 'Citizen')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[720px] bg-[#160206] rounded-2xl border-2 border-[#d4af37] text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#4d0718] via-[#660922] to-[#360512] border-b border-[#d4af37]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#28050e] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white tracking-tight">
                  {isAdmin ? 'Belize Central Dispatch • Emergency Live Chat' : 'Belize Alerts • Live Dispatch Chat'}
                </h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  24/7 Live
                </span>
              </div>
              <p className="text-[11px] text-[#f3c853]">
                {isAdmin
                  ? 'Real-time two-way communication with citizens across all Belize districts'
                  : 'Direct line to Administrator Zain Dueheney and Central Dispatch'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick WhatsApp Action Button */}
            {targetPhone && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open conversation in WhatsApp"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition hover:scale-105"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp ({targetPhone})</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            )}

            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar (Admin only) + Main Chat Thread */}
        <div className="flex-1 flex overflow-hidden">
          {/* Admin Conversations Sidebar */}
          {isAdmin && (
            <div className="w-72 sm:w-80 border-r border-[#841c34]/80 bg-[#1c040a] flex flex-col shrink-0">
              <div className="p-3 border-b border-[#841c34]/60 bg-[#140206] flex items-center justify-between text-xs">
                <span className="font-black text-amber-200 uppercase tracking-wider text-[11px]">
                  Citizen Threads ({conversations.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Live Dispatch
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#841c34]/40">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                    <p>No active chat threads yet.</p>
                    <p className="text-[10px] text-amber-300/80">Messages from citizens will appear here.</p>
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isSelected = c.citizenId === activeConversationId;
                    const cleanPhone = c.citizenPhone || '';
                    const waLink = createWhatsAppUrl('+501', cleanPhone, WhatsAppTemplates.citizenVerification(c.citizenName));

                    return (
                      <div
                        key={c.citizenId}
                        onClick={() => {
                          setActiveConversationId(c.citizenId);
                          markConversationAsRead(c.citizenId);
                        }}
                        className={`p-3 cursor-pointer transition text-left group ${
                          isSelected
                            ? 'bg-[#3b0816] border-l-4 border-[#d4af37]'
                            : 'hover:bg-[#28050e]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-white group-hover:text-[#f3c853] truncate">
                            {c.citizenName}
                          </span>
                          {c.unreadByAdmin && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-0.5 text-[11px] text-slate-400">
                          <span className="truncate">{c.citizenEmail}</span>
                          {c.lastMessageAt && (
                            <span className="text-[10px] text-amber-200/60 font-mono shrink-0">
                              {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {c.lastMessage && (
                          <p className="text-[11px] text-slate-300 line-clamp-1 mt-1">
                            {c.lastMessage}
                          </p>
                        )}

                        {cleanPhone && (
                          <div className="mt-2 flex items-center justify-between pt-1 border-t border-[#841c34]/30">
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {cleanPhone}
                            </span>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-emerald-300 hover:text-emerald-200 font-bold underline flex items-center gap-0.5"
                            >
                              WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Main Chat Conversation Area */}
          <div className="flex-1 flex flex-col bg-[#140206]">
            {/* Conversation Subheader */}
            <div className="px-4 py-2.5 bg-[#20030a] border-b border-[#841c34]/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-slate-950 font-black text-xs flex items-center justify-center">
                  {isAdmin ? 'C' : 'D'}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    {isAdmin
                      ? (activeConversation?.citizenName || 'Select a Citizen Conversation')
                      : 'Belize Central Dispatch (Administrator)'}
                  </h4>
                  <p className="text-[10px] text-amber-200/70">
                    {isAdmin
                      ? (activeConversation?.citizenEmail || 'Click any thread in sidebar to view messages')
                      : 'Live channel for status updates, verification, and on-scene guidance'}
                  </p>
                </div>
              </div>

              {/* Right Side Header Actions: WhatsApp & Admin Clear History */}
              <div className="flex items-center gap-2">
                {/* Admin Clear Chat History Button */}
                {isAdmin && activeConversationId && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={isClearing || messages.length === 0}
                    title="Clear all messages in this conversation thread (Admin Only)"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-red-100 text-[11px] font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Clear History</span>
                  </button>
                )}

                {/* Citizen WhatsApp button on mobile */}
                {targetPhone && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                  >
                    <Phone className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Admin Confirmation Banner for Clearing Chat History */}
            {showClearConfirm && (
              <div className="bg-red-950 border-b border-red-500/70 p-2.5 px-4 text-xs flex items-center justify-between gap-3 text-red-100 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Confirm History Clearance:</strong> Permanently delete all <strong>{messages.length}</strong> messages in this conversation?
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    disabled={isClearing}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-black transition shadow"
                  >
                    {isClearing ? 'Clearing...' : 'Yes, Clear All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    disabled={isClearing}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Notice feedback banner */}
            {actionNotice && (
              <div className="bg-amber-950/90 border-b border-amber-500/50 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
                <span>{actionNotice}</span>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="text-amber-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Messages Thread Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-[#140206] to-[#0e0104]">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs gap-2">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting to dispatch stream...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#28050e] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="max-w-sm space-y-1">
                    <h5 className="font-bold text-white text-sm">
                      {isAdmin ? 'No Messages in Thread' : 'Start Conversation with Central Dispatch'}
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isAdmin
                        ? 'Citizen has opened the chat. Send a dispatch greeting or request status verification.'
                        : 'Need immediate advice, reporting questions, or status updates on your incident? Send a message directly to central dispatch.'}
                    </p>
                  </div>

                  {/* WhatsApp Prompt */}
                  {targetPhone && (
                    <div className="p-3 bg-[#24050e] rounded-xl border border-emerald-500/40 max-w-sm w-full text-left space-y-1.5 mt-2">
                      <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Instant WhatsApp Dispatch Line</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        You can also send a direct WhatsApp message to registered number <strong>{targetPhone}</strong>:
                      </p>
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition mt-1"
                      >
                        Launch WhatsApp Conversation
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMine = m.senderId === user?.uid;
                  const isDispatch = m.senderRole === 'admin' || m.senderRole === 'dispatcher';
                  const isBeingDeleted = deletingMsgId === m.id;

                  return (
                    <div
                      key={m.id || idx}
                      className={`group flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isBeingDeleted ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                        <span className="font-bold text-amber-200">
                          {isMine ? 'You' : m.senderName}
                        </span>
                        {isDispatch && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase text-[9px]">
                            Central Dispatch
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Administrator: Delete Specific Message button */}
                        {isAdmin && m.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id!)}
                            disabled={isBeingDeleted}
                            title="Remove this message (Administrator Zain Dueheney)"
                            className="ml-2 opacity-60 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition text-slate-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div
                        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md whitespace-pre-wrap leading-relaxed ${
                          isMine
                            ? 'bg-gradient-to-r from-[#841c34] to-[#660922] text-white border border-[#d4af37]/40 rounded-br-none'
                            : isDispatch
                            ? 'bg-[#2b0510] text-amber-100 border border-[#d4af37]/60 rounded-bl-none font-medium'
                            : 'bg-slate-800 text-white border border-slate-700 rounded-bl-none'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Dispatch Preset Action Chips */}
            <div className="px-3 py-1.5 bg-[#1b0308] border-t border-[#841c34]/50 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-[10px] font-bold text-amber-300 shrink-0">Quick Text:</span>
              {(isAdmin
                ? [
                    'Please confirm your exact current location.',
                    'First response crew is en route.',
                    'Report format verified and broadcasted.',
                    'Are Police, Fire, or BERT EMS needed on scene?',
                  ]
                : [
                    'Requesting ETA on response crew.',
                    'Situation has escalated on scene.',
                    'Incident has been resolved / safe.',
                    'I have additional photo evidence.',
                  ]
              ).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputMessage(chip)}
                  className="px-2.5 py-1 rounded-full bg-[#2a050e] hover:bg-[#3d0815] text-amber-200 border border-[#841c34] shrink-0 transition text-[10px]"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Message Form */}
            <form onSubmit={handleSend} className="p-3 bg-[#180308] border-t border-[#841c34] flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isAdmin
                    ? 'Reply as Belize Central Dispatch (Zain Dueheney)...'
                    : 'Type message to Central Dispatch...'
                }
                className="flex-1 bg-[#28050e] border border-[#841c34] rounded-xl px-4 py-2.5 text-xs text-white placeholder-amber-200/40 focus:outline-none focus:border-[#d4af37]"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f59e0b] hover:from-[#e5c048] hover:to-[#fbbf24] text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
