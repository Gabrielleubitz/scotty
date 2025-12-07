import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = "",
}) => {
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'blockquote', 'code-block'],
      [{ 'header': [2, 3, false] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['image', 'video'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'link', 'image', 'video',
    'blockquote', 'code-block', 'align'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <style jsx global>{`
        .ql-toolbar {
          border: 1px solid #d1d5db !important;
          border-bottom: none !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
          background: #f9fafb !important;
        }
        
        .ql-container {
          border: 1px solid #d1d5db !important;
          border-radius: 0 0 0.5rem 0.5rem !important;
          font-family: inherit !important;
        }
        
        .ql-editor {
          min-height: 200px !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af !important;
          font-style: normal !important;
        }
        
        .ql-toolbar .ql-formats {
          margin-right: 15px !important;
        }
        
        .ql-toolbar button {
          padding: 5px !important;
          margin: 2px !important;
        }
        
        .ql-toolbar button:hover {
          background: #e5e7eb !important;
          border-radius: 4px !important;
        }
        
        .ql-toolbar button.ql-active {
          background: #dbeafe !important;
          color: #2563eb !important;
          border-radius: 4px !important;
        }
      `}</style>
      
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};