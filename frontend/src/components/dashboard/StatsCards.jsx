import React from 'react';

export default function StatsCards({ stats }) {
  const cards = [
    { label: 'Total Collected', value: `₹${(stats.totalCollected || 0).toLocaleString('en-IN')}`, icon: '💰', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Pending Amount', value: `₹${(stats.totalPending || 0).toLocaleString('en-IN')}`, icon: '⏳', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Paid', value: stats.paidCount || 0, icon: '✅', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Unpaid', value: stats.unpaidCount || 0, icon: '❌', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Overdue', value: stats.overdueCount || 0, icon: '⚠️', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Total Flats', value: stats.totalFlats || 0, icon: '🏢', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <div key={i} className="card p-4">
          <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
            {card.icon}
          </div>
          <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
