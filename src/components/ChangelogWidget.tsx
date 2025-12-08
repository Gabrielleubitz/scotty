import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'

import {
  useChangelog,
  useSearch,
  useFilteredPosts,
  useFeedbackForm,
  useLocalStorage,
  useIntersect
} from '@/hooks'
import { cn, renderChatMarkdown, isYouTubeUrl, getYouTubeEmbedUrl, isVideoUrl } from '@/lib/utils'
import { ChatAgent } from './ChatAgent'
import FeedbackForm from './FeedbackForm'
import PostTags from './PostTags'
import PostMeta from './PostMeta'
import ScrollToTop from './ScrollToTop'
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react'

export default function ChangelogWidget() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { posts } = useChangelog()
  const { search, setSearch } = useSearch()
  const { filteredPosts } = useFilteredPosts(posts, search)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [agentResponse, setAgentResponse] = useState('')
  const [input, setInput] = useState('')
  const { formState, submitFeedback } = useFeedbackForm()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [readPosts, setReadPosts] = useLocalStorage<string[]>('readPosts', [])

  // Configure DOMPurify to allow styles for YouTube iframe interaction
  useEffect(() => {
    DOMPurify.setConfig({ 
      ALLOW_UNKNOWN_PROTOCOLS: true,
      KEEP_CONTENT: true,
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'style'],
      ADD_TAGS: ['iframe'],
      ADD_URI_SAFE_ATTR: ['src']
    });
  }, []);

  const onIntersect = () => {
    const postId = selectedPost?.id
    if (postId && !readPosts.includes(postId)) {
      setReadPosts([...readPosts, postId])
    }
  }

  useIntersect(containerRef, onIntersect)

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return
      setShowScrollTop(containerRef.current.scrollTop > 300)
    }
    const currentRef = containerRef.current
    currentRef?.addEventListener('scroll', onScroll)
    return () => currentRef?.removeEventListener('scroll', onScroll)
  }, [])

  const handleSelectPost = (post) => {
    setSelectedPost(post)
  }

  const handleBack = () => {
    setSelectedPost(null)
    setAgentResponse('')
    setInput('')
  }

  const handleAskAgent = async () => {
    if (!input) return
    const res = await fetch('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question: input }),
    })
    const data = await res.json()
    setAgentResponse(data?.answer || 'No answer found')
  }

  return (
    <div id="productflow-changelog-widget" className="relative h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        {selectedPost ? (
          <button onClick={handleBack} className="flex items-center text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
        ) : (
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search updates..."
          />
        )}
        <button
          onClick={() => setShowChat(!showChat)}
          className="ml-4 flex items-center text-sm"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          AI
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2" ref={containerRef}>
        {!selectedPost ? (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleSelectPost(post)}
              className={cn(
                'mb-4 p-4 rounded border cursor-pointer',
                readPosts.includes(post.id) ? 'opacity-70' : 'opacity-100'
              )}
            >
              <h2 className="font-semibold text-lg">{post.title}</h2>
              <PostMeta post={post} />
              <PostTags tags={post.tags} />
            </div>
          ))
        ) : (
          <div>
            <h2 className="font-bold text-xl mb-2">{selectedPost.title}</h2>
            <PostMeta post={selectedPost} />
            <PostTags tags={selectedPost.tags} />
            {selectedPost.content && selectedPost.content.trim() && (
              <div
                className="prose max-w-none dark:prose-invert text-sm mt-4"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(renderChatMarkdown(selectedPost.content)),
                }}
              />
            )}
            
            {selectedPost.imageUrl && (
              <div className="mt-6">
                <img
                  src={selectedPost.imageUrl}
                  alt="Update image"
                  className="w-full rounded-card shadow-sm border border-border"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
              </div>
            )}

            {selectedPost.videoUrl && (
              <div className="mt-6">
                {isYouTubeUrl(selectedPost.videoUrl) ? (
                  <div className="youtube-container" style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
                    <iframe
                      width="100%"
                      height="250"
                      src={getYouTubeEmbedUrl(selectedPost.videoUrl)}
                      frameBorder="0"
                      style={{ 
                        border: 'none',
                        outline: 'none',
                        borderRadius: '8px'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title="YouTube video player"
                      className="rounded-card shadow-sm border border-border"
                    />
                  </div>
                ) : isVideoUrl(selectedPost.videoUrl) ? (
                  <video
                    controls
                    width="100%"
                    className="rounded-lg shadow-sm border border-gray-200"
                  >
                    <source src={selectedPost.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-blue-700 mb-2">Video Link</p>
                    <a 
                      href={selectedPost.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                    >
                      {selectedPost.videoUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
            
            <FeedbackForm
              formState={formState}
              submitFeedback={(rating, text) =>
                submitFeedback(selectedPost.id, rating, text)
              }
            />
          </div>
        )}
      </div>

      {showChat && (
        <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
          <div className="mb-2">
            <ChatAgent />
            <div className="mt-2 text-sm text-gray-500">
              Ask Ento anything about this changelog.
            </div>
          </div>
          <div className="flex">
            <input
              className="flex-1 border rounded-l px-3 py-2 text-sm"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a feature..."
            />
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-r text-sm"
              onClick={handleAskAgent}
            >
              Ask
            </button>
          </div>
          {agentResponse && (
            <div
              className="prose max-w-none dark:prose-invert text-sm mt-4"
              dangerouslySetInnerHTML={{
                __html: renderChatMarkdown(agentResponse),
              }}
            />
          )}
        </div>
      )}

      {showScrollTop && <ScrollToTop containerRef={containerRef} />}
    </div>
  )
}