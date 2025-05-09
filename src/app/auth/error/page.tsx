import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Authentication Error</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            There was a problem with your authentication request.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <p className="text-red-600 dark:text-red-400 mb-4">
            An error occurred during the authentication process. This could be due to invalid credentials or a system issue.
          </p>
          
          <div className="flex flex-col space-y-4">
            <Link 
              href="/auth/signin"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Try signing in again
            </Link>
            
            <Link 
              href="/"
              className="text-blue-500 hover:text-blue-700"
            >
              Return to home page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
