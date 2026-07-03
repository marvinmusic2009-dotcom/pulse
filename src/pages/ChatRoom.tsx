import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import type { User, ChatMessage } from '../services/db';
import { Send, Users, MessageSquare, Clock, ShieldAlert, Sparkles } from 'lucide-react';

interface ChatRoomProps {
  user: User;
}

export default function ChatRoom({ user }: ChatRoomProps) {
  const schoolId = user.school_id;
  
  // States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeUser, setActiveUser] = useState<User>(user);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages and approved staff list
  const loadChatData = () => {
    const msgs = dbService.getChatMessages(schoolId);
    setMessages(msgs);
    
    const staff = dbService.getUsers(schoolId);
    setStaffList(staff);

    // Refresh active user to get latest profile picture
    const savedUserStr = localStorage.getItem('pulse_current_user');
    if (savedUserStr) {
      setActiveUser(JSON.parse(savedUserStr));
    }
  };

  useEffect(() => {
    loadChatData();
    
    // Auto scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Listen to sync events
    window.addEventListener('pulse-db-synced', loadChatData);
    window.addEventListener('pulse-user-updated', loadChatData);
    
    return () => {
      window.removeEventListener('pulse-db-synced', loadChatData);
      window.removeEventListener('pulse-user-updated', loadChatData);
    };
  }, [schoolId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    dbService.sendChatMessage(
      schoolId,
      activeUser.id,
      activeUser.full_name,
      activeUser.role,
      inputText.trim(),
      activeUser.avatar_url
    );

    setInputText('');
    loadChatData();
  };

  // Quick Chat Shortcuts
  const handleQuickSend = (text: string) => {
    dbService.sendChatMessage(
      schoolId,
      activeUser.id,
      activeUser.full_name,
      activeUser.role,
      text,
      activeUser.avatar_url
    );
    loadChatData();
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] animate-fade-slide-up">
      
      {/* Left Column: Active Workspace Staff */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-bold text-slate-800 text-sm">Clinic Workspace Staff</span>
          </div>
          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-bold">
            {staffList.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-50">
          {staffList.map((staff) => {
            const isSelf = staff.id === activeUser.id;
            return (
              <div key={staff.id} className="pt-2.5 flex items-center gap-3">
                {staff.avatar_url ? (
                  <img src={staff.avatar_url} alt={staff.full_name} className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-50" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                    {staff.full_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 truncate block">{staff.full_name}</span>
                    {isSelf && <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase font-bold">You</span>}
                  </div>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold border mt-0.5 ${
                    staff.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    staff.role === 'Doctor' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {staff.role}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Chat Room Area */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
        
        {/* Chat Header */}
        <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm block">Sickbay Staff Channel</span>
              <p className="text-[10px] text-slate-400 font-medium">Real-time team chat &bull; Workspace updates</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Cloud Active
          </span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-700 text-xs block">Start Clinic Team Conversation</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  All logged-in staff and admins can share notes, emergency clinic statuses, and inventory updates here.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.sender_id === activeUser.id;
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* Left Avatar (Others) */}
                  {!isSelf && (
                    msg.sender_avatar ? (
                      <img src={msg.sender_avatar} alt={msg.sender_name} className="w-8 h-8 rounded-full object-cover border bg-white mt-1" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs mt-1">
                        {msg.sender_name.charAt(0)}
                      </div>
                    )
                  )}

                  <div className={`max-w-[70%] space-y-1 flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                      <span className="font-bold text-slate-600">{msg.sender_name}</span>
                      <span className={`px-1.5 rounded-full font-bold uppercase scale-90 ${
                        msg.sender_role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        msg.sender_role === 'Doctor' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {msg.sender_role}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Chat Bubble */}
                    <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs border ${
                      isSelf 
                        ? 'bg-primary text-white border-primary rounded-tr-none' 
                        : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>

                  </div>

                  {/* Right Avatar (Self) */}
                  {isSelf && (
                    activeUser.avatar_url ? (
                      <img src={activeUser.avatar_url} alt={activeUser.full_name} className="w-8 h-8 rounded-full object-cover border bg-white mt-1" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs mt-1">
                        {activeUser.full_name.charAt(0)}
                      </div>
                    )
                  )}

                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="px-4 py-2 border-t flex flex-wrap gap-1.5 bg-slate-50/50">
          <button 
            type="button" 
            onClick={() => handleQuickSend('🚨 CLINIC EMERGENCY: Need medical assistance in sickbay immediately!')}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-lg text-[10px] transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency Alert</span>
          </button>
          <button 
            type="button" 
            onClick={() => handleQuickSend('📦 Inventory Alert: Pharmacy stock of essential drugs is running low.')}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 rounded-lg text-[10px] transition"
          >
            <span>Stock Request</span>
          </button>
          <button 
            type="button" 
            onClick={() => handleQuickSend('🔄 Shift handover checklist completed and reports uploaded to Admin inbox.')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 rounded-lg text-[10px] transition"
          >
            <span>Handover Complete</span>
          </button>
        </div>

        {/* Chat Input form */}
        <div className="p-3 border-t bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2.5">
            <input
              type="text"
              placeholder="Type message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-primary font-medium"
              required
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center justify-center shadow-md shadow-primary/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
