import React, { useState, useEffect } from 'react';
import { MessageCircle, Bot, User, Loader, ChevronRight } from 'lucide-react';
import { apiService } from '../lib/api';
import { ChatMessage } from '../types';
import { renderChatMarkdown } from '../lib/utils';

interface QuestionAnswerPair {
  question: string;
  answer: string;
  sessionId: string;
  timestamp: Date;
}

interface TopQuestion {
  question: string;
  count: number;
  examples: QuestionAnswerPair[];
}

export const AIChatAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<TopQuestion | null>(null);

  useEffect(() => {
    loadAIChatData();
  }, []);

  const loadAIChatData = async () => {
    setLoading(true);
    try {
      const messages = await apiService.getAIChatMessages();
      const processedData = processChatData(messages);
      setTopQuestions(processedData);
    } catch (error) {
      console.error('Failed to load AI chat data:', error);
      setTopQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const processChatData = (messages: ChatMessage[]): TopQuestion[] => {
    const sessions: { [key: string]: ChatMessage[] } = {};
    messages.forEach(msg => {
      if (msg.sessionId) {
        if (!sessions[msg.sessionId]) {
          sessions[msg.sessionId] = [];
        }
        sessions[msg.sessionId].push(msg);
      }
    });

    const questionMap = new Map<string, { count: number; examples: QuestionAnswerPair[] }>();

    Object.values(sessions).forEach(sessionMessages => {
      // Sort messages by timestamp to ensure correct order
      sessionMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      for (let i = 0; i < sessionMessages.length; i++) {
        const currentMessage = sessionMessages[i];
        if (currentMessage.isUser) {
          // Look for the immediate next AI response
          const nextMessage = sessionMessages[i + 1];
          if (nextMessage && !nextMessage.isUser) {
            const question = currentMessage.content.trim().toLowerCase(); // Normalize question
            const answer = nextMessage.content.trim();

            if (question) {
              if (!questionMap.has(question)) {
                questionMap.set(question, { count: 0, examples: [] });
              }
              const entry = questionMap.get(question)!;
              entry.count++;
              entry.examples.push({
                question: currentMessage.content.trim(), // Store original casing for example
                answer: answer,
                sessionId: currentMessage.sessionId!,
                timestamp: currentMessage.timestamp,
              });
            }
            i++; // Skip the AI response as it's already paired
          }
        }
      }
    });

    const sortedQuestions: TopQuestion[] = Array.from(questionMap.entries())
      .map(([question, data]) => ({
        question: data.examples[0]?.question || question, // Use original casing from first example
        count: data.count,
        examples: data.examples,
      }))
      .sort((a, b) => b.count - a.count);

    return sortedQuestions;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Bot size={20} className="mr-2 text-blue-600" />
          AI Chat Analytics
        </h2>
        <button
          onClick={loadAIChatData}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Loader size={16} className="mr-1" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Questions List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Questions Asked</h3>
            {topQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4" />
                <p>No AI chat data available yet.</p>
                <p className="text-sm text-gray-400 mt-1">Users need to interact with the AI assistant.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topQuestions.slice(0, 10).map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedQuestion(q)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors flex items-center justify-between ${
                      selectedQuestion?.question === q.question
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{q.question}</p>
                      <p className="text-sm text-gray-600">{q.count} times asked</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-500" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Question Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedQuestion ? `Details for: "${selectedQuestion.question}"` : 'Select a question to see details'}
            </h3>
            {selectedQuestion ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {selectedQuestion.examples.map((example, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start mb-2">
                      <User size={16} className="text-blue-600 mr-2 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">User Question:</p>
                        <p className="text-sm text-gray-700">{example.question}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Bot size={16} className="text-purple-600 mr-2 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">AI Answer:</p>
                        <div
                          className="text-sm text-gray-700 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderChatMarkdown(example.answer) }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                      Session: {example.sessionId.substring(0, 8)}... | {new Date(example.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Select a question from the list to view its details and example answers.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};