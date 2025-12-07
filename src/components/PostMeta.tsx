import React from 'react';
import { Clock, Eye } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

interface PostMetaProps {
  post: {
    createdAt: Date;
    views?: number;
  };
}

const PostMeta: React.FC<PostMetaProps> = ({ post }) => {
  return (
    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
      <div className="flex items-center space-x-1">
        <Clock size={14} />
        <span>{formatRelativeTime(post.createdAt)}</span>
      </div>
      {post.views !== undefined && (
        <div className="flex items-center space-x-1">
          <Eye size={14} />
          <span>{post.views} views</span>
        </div>
      )}
    </div>
  );
};

export default PostMeta;