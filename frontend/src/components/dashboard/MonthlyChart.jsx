import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MonthlyChart({ data }) {
  if (!data || data.length === 0) return null;

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Amount Collected (₹)',
      data: data.map(d => d.collected),
      backgroundColor: 'rgba(37, 99, 235, 0.8)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 1,
      borderRadius: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}`
        }
      }
    },
    scales: {
      y: {
        ticks: { callback: v => `₹${v.toLocaleString('en-IN')}` },
        grid: { color: 'rgba(156,163,175,0.1)' }
      },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Collection</h3>
      <div className="h-48">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
