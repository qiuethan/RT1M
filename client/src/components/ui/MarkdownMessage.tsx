import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        components={{
        // Paragraph styling
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        
        // Strong/Bold text
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        
        // Emphasis/Italic text
        em: ({ children }) => <em className="italic">{children}</em>,
        
        // Headings
        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
        
        // Lists
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        
        // Code
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="bg-surface-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
          }
          return <pre className="bg-surface-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2"><code>{children}</code></pre>;
        },
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-surface-300 pl-4 italic mb-2">{children}</blockquote>
        ),
        
        // Links
        a: ({ children, href }) => (
          <a href={href} className="text-primary-600 hover:text-primary-800 underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        
        // Line breaks
        br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}; 