import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth, isAuthorizedAdminEmail } from './AuthContext';
import { DispatchChatMessage, DispatchConversation, UserRole } from '../types';

interface ChatContextType {
  conversations: DispatchConversation[];
  activeConversation: DispatchConversation | null;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: DispatchChatMessage[];
  loadingMessages: boolean;
  sendMessage: (text: string, conversationId?: string, incidentId?: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  clearChatHistory: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  openChatWithCitizen: (citizen: { id: string; displayName?: string; email: string; phone?: string }) => void;
  unreadCount: number;
  markConversationAsRead: (conversationId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<DispatchConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DispatchChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // If citizen logs in, their default active conversation is their own UID
  useEffect(() => {
    if (user && !isAdmin && !activeConversationId) {
      setActiveConversationId(user.uid);
    }
  }, [user, isAdmin, activeConversationId]);

  // Subscribe to conversations list
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }

    const path = 'conversations';
    try {
      if (isAdmin) {
        // Admin listens to all citizen conversations
        const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const list: DispatchConversation[] = [];
            snapshot.forEach((d) => {
              list.push({ ...d.data(), id: d.id } as DispatchConversation);
            });
            setConversations(list);
          },
          (err) => {
            console.warn('Conversations listener error:', err);
          }
        );
        return () => unsubscribe();
      } else {
        // Citizen listens to their own conversation document
        const convRef = doc(db, 'conversations', user.uid);
        const unsubscribe = onSnapshot(
          convRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setConversations([{ ...docSnap.data(), id: docSnap.id } as DispatchConversation]);
            } else {
              setConversations([]);
            }
          },
          (err) => {
            console.warn('Citizen conversation listener error:', err);
          }
        );
        return () => unsubscribe();
      }
    } catch (err) {
      console.error('Failed to attach conversation listener:', err);
    }
  }, [user, isAdmin]);

  // Subscribe to messages in the active conversation
  useEffect(() => {
    if (!user || !activeConversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesPath = `conversations/${activeConversationId}/messages`;
    try {
      const q = query(collection(db, messagesPath), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: DispatchChatMessage[] = [];
          snapshot.forEach((d) => {
            list.push({ ...d.data(), id: d.id } as DispatchChatMessage);
          });
          setMessages(list);
          setLoadingMessages(false);
        },
        (err) => {
          console.warn('Messages listener error:', err);
          setLoadingMessages(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to attach messages listener:', err);
      setLoadingMessages(false);
    }
  }, [user, activeConversationId]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(
    async (convId: string) => {
      if (!user) return;
      try {
        const convRef = doc(db, 'conversations', convId);
        if (isAdmin) {
          await updateDoc(convRef, { unreadByAdmin: false });
        } else {
          await updateDoc(convRef, { unreadByCitizen: false });
        }
      } catch (err) {
        // Silently ignore if document doesn't exist yet
      }
    },
    [user, isAdmin]
  );

  // Send message
  const sendMessage = async (text: string, convId?: string, incidentId?: string) => {
    if (!user) throw new Error('You must be signed in to send a dispatch message.');
    const trimmed = text.trim();
    if (!trimmed) return;

    const targetConvId = convId || activeConversationId || user.uid;
    const now = new Date().toISOString();

    const senderRole: UserRole = isAdmin ? 'admin' : (profile?.role || 'citizen');
    const senderName = profile?.displayName || user.displayName || (isAdmin ? 'Belize Central Dispatch' : 'Citizen');

    // 1. Ensure / update the parent conversation doc
    const convRef = doc(db, 'conversations', targetConvId);
    const convPayload: Partial<DispatchConversation> = {
      citizenId: targetConvId,
      citizenName: isAdmin
        ? (conversations.find((c) => c.citizenId === targetConvId)?.citizenName || 'Citizen')
        : (profile?.displayName || user.displayName || 'Citizen'),
      citizenEmail: isAdmin
        ? (conversations.find((c) => c.citizenId === targetConvId)?.citizenEmail || '')
        : (user.email || ''),
      citizenPhone: isAdmin
        ? (conversations.find((c) => c.citizenId === targetConvId)?.citizenPhone || '')
        : (profile?.phone || ''),
      lastMessage: trimmed,
      lastMessageAt: now,
      updatedAt: now,
      unreadByAdmin: !isAdmin,
      unreadByCitizen: isAdmin,
    };

    try {
      await setDoc(convRef, convPayload, { merge: true });
    } catch (err) {
      console.warn('Conversation header update error:', err);
    }

    // 2. Add message to subcollection
    const messagesPath = `conversations/${targetConvId}/messages`;
    const messagePayload: DispatchChatMessage = {
      conversationId: targetConvId,
      senderId: user.uid,
      senderName,
      senderRole,
      message: trimmed,
      createdAt: now,
    };

    if (incidentId) {
      messagePayload.incidentId = incidentId;
    }

    try {
      await addDoc(collection(db, messagesPath), messagePayload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, messagesPath);
    }
  };

  // Administrator Action: Remove a specific message
  const deleteMessage = async (convId: string, messageId: string) => {
    if (!user) throw new Error('Authentication required');
    if (!isAdmin) {
      throw new Error('Access Denied: Only Administrator Zain Dueheney is authorized to delete chat messages.');
    }

    const messagePath = `conversations/${convId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'conversations', convId, 'messages', messageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, messagePath);
    }
  };

  // Administrator Action: Clear full chat history in a conversation
  const clearChatHistory = async (convId: string) => {
    if (!user) throw new Error('Authentication required');
    if (!isAdmin) {
      throw new Error('Access Denied: Only Administrator Zain Dueheney is authorized to clear chat history.');
    }

    const messagesPath = `conversations/${convId}/messages`;
    try {
      const q = query(collection(db, messagesPath));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // Update parent conversation summary to reflect history wipe
      const convRef = doc(db, 'conversations', convId);
      const now = new Date().toISOString();
      await updateDoc(convRef, {
        lastMessage: 'Chat history cleared by Central Dispatch Administrator.',
        lastMessageAt: now,
        updatedAt: now,
        unreadByAdmin: false,
        unreadByCitizen: false,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, messagesPath);
    }
  };

  // Administrator Action: Delete entire conversation thread
  const deleteConversation = async (convId: string) => {
    if (!user) throw new Error('Authentication required');
    if (!isAdmin) {
      throw new Error('Access Denied: Only Administrator Zain Dueheney is authorized to delete conversation threads.');
    }

    try {
      const messagesPath = `conversations/${convId}/messages`;
      const q = query(collection(db, messagesPath));
      const snapshot = await getDocs(q);
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));

      await deleteDoc(doc(db, 'conversations', convId));

      if (activeConversationId === convId) {
        setActiveConversationId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `conversations/${convId}`);
    }
  };

  // Open chat specifically with a citizen (for admin)
  const openChatWithCitizen = (citizen: { id: string; displayName?: string; email: string; phone?: string }) => {
    setActiveConversationId(citizen.id);
    setIsChatOpen(true);
    markConversationAsRead(citizen.id);
  };

  // Calculate unread count
  const unreadCount = conversations.reduce((acc, c) => {
    if (isAdmin && c.unreadByAdmin) return acc + 1;
    if (!isAdmin && c.unreadByCitizen) return acc + 1;
    return acc;
  }, 0);

  const activeConversation = conversations.find((c) => c.citizenId === activeConversationId) || null;

  return (
    <ChatContext.Provider
      value={{
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
        openChatWithCitizen,
        unreadCount,
        markConversationAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
