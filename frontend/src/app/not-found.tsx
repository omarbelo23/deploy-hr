import Link from 'next/link';
import { Button } from '@/components/ui/shadcn';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">404</h2>
        <p className="text-xl text-gray-600 mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <Link href="/">
          <Button variant="primary">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

