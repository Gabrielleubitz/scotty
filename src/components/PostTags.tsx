import React from 'react';
import { Tag } from 'lucide-react';

interface PostTagsProps {
  tags?: string[];
}

const PostTags: React.FC<PostTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 mt-2">
      <Tag size={14} className="text-gray-500" />
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PostTags;