import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);
}

export function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    const videoId = match[1];
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  }
  return url;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(url);
}

export function renderChatMarkdown(content: string): string {
  if (!content) return '';
  
  // First, handle existing HTML lists (from rich text editor)
  // Ensure HTML lists are preserved and properly styled
  let html = content
    // Preserve existing HTML lists
    .replace(/<ul>/g, '<ul style="list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0;">')
    .replace(/<ol>/g, '<ol style="list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0;">')
    .replace(/<li>/g, '<li style="margin: 0.25rem 0;">');
  
  // Convert markdown to HTML
  html = html
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]*)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
  // Then process markdown lists (for any remaining markdown syntax)
  if (!html.includes('<ul>') && !html.includes('<ol>')) {
    const lines = html.split('\n');
    const processedLines = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isListItem = /^[-*+]\s+(.+)/.test(line);
      
      if (isListItem) {
        const content = line.replace(/^[-*+]\s+/, '');
        if (!inList) {
          processedLines.push('<ul style="list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0;">');
          inList = true;
        }
        processedLines.push(`<li style="margin: 0.25rem 0;">${content}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        if (line) {
          processedLines.push(line);
        }
      }
    }
    
    // Close any open list
    if (inList) {
      processedLines.push('</ul>');
    }
    
    html = processedLines.join('\n');
  }
  
  // Convert line breaks (but not within list structures)
  html = html.replace(/\n(?!<\/?(?:ul|ol|li))/gim, '<br>');
  
  return html;
}

export function translatePost(post: any, translation: any) {
  if (translation) {
    return {
      ...post,
      title: translation.title || post.title,
      content: translation.content || post.content,
    };
  }

  return post;
}