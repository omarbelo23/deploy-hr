'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/shadcn';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md border border-red-200 p-8 text-center max-w-md">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Something went wrong!
            </h2>
            <p className="text-muted-foreground mb-6">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={reset} variant="default">
                Try again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="secondary"
              >
                Go home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

