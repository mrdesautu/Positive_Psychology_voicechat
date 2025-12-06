import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';
  
  return (
    <div className={`flex w-full mb-4 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed
        ${isModel 
          ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' 
          : 'bg-teal-600 text-white rounded-tr-none'}`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        <span className={`text-[10px] mt-2 block opacity-70 ${isModel ? 'text-slate-400' : 'text-teal-100'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
