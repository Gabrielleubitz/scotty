import React from 'react';
import { Bot } from 'lucide-react';

interface ChatAgentProps {
  className?: string;
}

export const ChatAgent: React.FC<ChatAgentProps> = ({ className }) => {
  return (
    <div className={`flex items-center space-x-2 ${className || ''}`}>
      <Bot size={16} className="text-blue-600" />
      <span className="text-sm font-medium text-gray-700">AI Assistant</span>
    </div>
  );
};

export default ChatAgent;