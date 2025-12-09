import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { ChangelogPost } from '../types';
import { formatRelativeTime, renderChatMarkdown, isYouTubeUrl, getYouTubeEmbedUrl, isVideoUrl } from '../lib/utils';

interface PreviewChangelogWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  posts: ChangelogPost[];
  focusPostId: string | null;
}

export const PreviewChangelogWidget: React.FC<PreviewChangelogWidgetProps> = ({ 
  isOpen, 
  onClose, 
  posts,
  focusPostId 
}) => {
  const [focusedPostIndex, setFocusedPostIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && focusPostId) {
      const index = posts.findIndex(post => post.id === focusPostId);
      if (index !== -1) {
        setFocusedPostIndex(index);
      }
    }
  }, [isOpen, focusPostId, posts]);

  useEffect(() => {
    if (isOpen && focusPostId) {
      // Scroll to focused post after a brief delay to ensure rendering
      setTimeout(() => {
        const focusedElement = document.getElementById(`preview-post-${focusPostId}`);
        if (focusedElement) {
          focusedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isOpen, focusPostId]);

  // Inject styles once on mount
  useEffect(() => {
    const styleId = 'preview-widget-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slide-in-right {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Determine slide direction based on position (if passed as prop, otherwise default to right)
  const slideFrom = 'right'; // Default, can be made configurable
  
  return (
    <div id="productflow-preview-widget-overlay" className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] h-[700px] flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Widget Preview</h2>
            <div className="flex items-center space-x-3">
              <Search size={20} className="cursor-pointer hover:opacity-80 transition-opacity" />
              <button
                onClick={onClose}
                className="hover:opacity-80 transition-opacity"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex bg-gray-50 border-b">
          <div className="flex-1 px-6 py-4 text-sm font-medium text-blue-600 bg-white border-b-2 border-blue-600">
            <BookOpen size={16} className="inline mr-2" />
            Updates ({posts.length})
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                id={`preview-post-${post.id}`}
                className={`bg-white transition-all duration-300 ${
                  post.id === focusPostId 
                    ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg' 
                    : ''
                }`}
              >
                {/* Post Card */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                        NOTIFICATION
                      </span>
                      <span className="text-sm text-gray-600">{formatRelativeTime(post.createdAt)}</span>
                    </div>
                    {post.id === focusPostId && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        FOCUSED
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-blue-600 mb-4 leading-tight">
                    {post.title}
                  </h3>
                  
                  <div className="prose prose-gray max-w-none">
                    <div 
                      className="text-gray-700 leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: renderChatMarkdown(post.content) }}
                    />
                  </div>

                  {post.imageUrl && (
                    <div className="mt-6">
                      <img
                        src={post.imageUrl}
                        alt="Update image"
                        className="w-full rounded-lg shadow-sm border border-gray-200"
                        style={{ maxHeight: '300px', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {post.videoUrl && (
                    <div className="mt-6">
                      {isYouTubeUrl(post.videoUrl) ? (
                        <div className="youtube-container" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
                          <iframe
                            width="100%"
                            height="250"
                            src={getYouTubeEmbedUrl(post.videoUrl)}
                            frameBorder="0"
                            style={{ 
                              border: 'none',
                              outline: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title="YouTube video player"
                            className="rounded-lg shadow-sm border border-gray-200"
                          />
                        </div>
                      ) : isVideoUrl(post.videoUrl) ? (
                        <video
                          controls
                          width="100%"
                          className="rounded-lg shadow-sm border border-gray-200"
                        >
                          <source src={post.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-700 mb-2">Video Link</p>
                          <a 
                            href={post.videoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                          >
                            {post.videoUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      {post.views} views
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                <p className="text-gray-500">Create your first post to see how it looks in the widget!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};