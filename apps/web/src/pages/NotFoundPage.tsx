import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 text-center">
      <div className="max-w-md bg-surface border border-border rounded-card p-8 shadow-calm space-y-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Compass size={24} />
        </div>
        <h1 className="text-xl font-bold text-text">Page Not Found</h1>
        <p className="text-xs text-text-muted leading-relaxed">
          The view or route you requested doesn't exist or has moved. Return to your Focus Stream to
          continue organizing your tasks.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm" icon={<ArrowLeft size={14} />}>
              Back to Focus Stream
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
