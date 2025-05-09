'use client';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease';
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export default function StatCard({ title, value, icon, change, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-500',
      light: 'bg-blue-100',
    },
    green: {
      bg: 'bg-green-500',
      text: 'text-green-500',
      light: 'bg-green-100',
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      light: 'bg-red-100',
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-500',
      light: 'bg-yellow-100',
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-500',
      light: 'bg-purple-100',
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${colorClasses[color].light} rounded-md p-3`}>
            <svg
              className={`h-6 w-6 ${colorClasses[color].text}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          <div className="text-sm">
            <span
              className={`font-medium ${
                change.type === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              } hover:text-${change.type === 'increase' ? 'green' : 'red'}-700`}
            >
              {change.type === 'increase' ? '↑' : '↓'} {change.value}
            </span>{' '}
            <span className="text-gray-500 dark:text-gray-400">from previous period</span>
          </div>
        </div>
      )}
    </div>
  );
}
