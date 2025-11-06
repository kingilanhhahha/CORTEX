import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">✅ React is Working!</h1>
        <p className="text-muted-foreground mb-4">
          If you can see this page, React is loading properly.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current URL: {window.location.href}</p>
          <p className="text-sm text-muted-foreground">User Agent: {navigator.userAgent}</p>
        </div>
        <button 
          onClick={() => window.location.href = '/'} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Go to Login Page
        </button>
      </div>
    </div>
  );
};

export default TestPage; 