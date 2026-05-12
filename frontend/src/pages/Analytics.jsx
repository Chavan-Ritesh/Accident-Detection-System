import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Car,
  User,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Calendar
} from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#9ca3af', font: { size: 12 } }
    },
  },
  scales: {
    x: {
      ticks: { color: '#6b7280' },
      grid: { color: '#1e2433' }
    },
    y: {
      ticks: { color: '#6b7280' },
      grid: { color: '#1e2433' }
    }
  }
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#9ca3af', font: { size: 12 }, padding: 16 }
    }
  }
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('TODAY')

  // ── Accidents Per Hour (today) ──
  const hourlyData = {
    labels: ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM',
             '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
    datasets: [
      {
        label: 'Collisions',
        data: [1, 2, 3, 1, 0, 2, 1, 3, 2, 1, 4, 2, 1],
        backgroundColor: '#ef444480',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Person Hit',
        data: [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        backgroundColor: '#f9731680',
        borderColor: '#f97316',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Rollovers',
        data: [0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0],
        backgroundColor: '#eab30880',
        borderColor: '#eab308',
        borderWidth: 2,
        borderRadius: 6,
      },
    ]
  }

  // ── Accidents Per Day (this week) ──
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Total Accidents',
        data: [4, 7, 3, 9, 5, 12, 6],
        fill: true,
        backgroundColor: '#0284c720',
        borderColor: '#0284c7',
        borderWidth: 2,
        pointBackgroundColor: '#0284c7',
        pointRadius: 5,
        tension: 0.4,
      }
    ]
  }

  // ── Accident Type Distribution ──
  const typeData = {
    labels: ['Collisions', 'Person Hit', 'Rollovers'],
    datasets: [{
      data: [45, 30, 25],
      backgroundColor: ['#ef4444', '#f97316', '#eab308'],
      borderColor: ['#ef444480', '#f9731680', '#eab30880'],
      borderWidth: 2,
    }]
  }

  // ── Severity Distribution ──
  const severityData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [20, 35, 30, 15],
      backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'],
      borderColor: ['#ef444480', '#f9731680', '#eab30880', '#22c55e80'],
      borderWidth: 2,
    }]
  }

  // ── Camera Performance ──
  const cameraData = {
    labels: ['Camera 1', 'Camera 2', 'Camera 3', 'Camera 4'],
    datasets: [
      {
        label: 'Accidents Detected',
        data: [12, 8, 15, 5],
        backgroundColor: '#0284c780',
        borderColor: '#0284c7',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  }

  const statCards = [
    {
      title: 'Total Accidents',
      value: '46',
      change: '+12%',
      trend: 'up',
      icon: <AlertTriangle className="w-6 h-6 text-danger" />,
      color: 'bg-danger/10',
      sub: 'vs last week'
    },
    {
      title: 'Collisions',
      value: '21',
      change: '+8%',
      trend: 'up',
      icon: <Car className="w-6 h-6 text-red-400" />,
      color: 'bg-red-400/10',
      sub: 'vs last week'
    },
    {
      title: 'Person Hit',
      value: '14',
      change: '-5%',
      trend: 'down',
      icon: <User className="w-6 h-6 text-orange-400" />,
      color: 'bg-orange-400/10',
      sub: 'vs last week'
    },
    {
      title: 'Rollovers',
      value: '11',
      change: '+3%',
      trend: 'up',
      icon: <RotateCcw className="w-6 h-6 text-yellow-400" />,
      color: 'bg-yellow-400/10',
      sub: 'vs last week'
    },
  ]

  return (
    <div className="min-h-screen bg-dark-400">
      <Sidebar />

      <div className="ml-64">
        <Navbar title="Analytics" />

        <div className="pt-16 p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-white font-semibold text-lg">
                Accident Analytics
              </h2>
              <p className="text-gray-500 text-sm">
                Highway — Aurangabad, Maharashtra
              </p>
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-2">
              {['TODAY', 'WEEK', 'MONTH'].map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    timeRange === r
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-200 text-gray-400 hover:text-white border border-dark-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i}
                className="bg-dark-200 rounded-2xl p-5 border border-dark-100">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${card.color}`}>
                    {card.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    card.trend === 'up' ? 'text-danger' : 'text-success'
                  }`}>
                    {card.trend === 'up'
                      ? <TrendingUp className="w-3 h-3" />
                      : <TrendingDown className="w-3 h-3" />
                    }
                    {card.change}
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className="text-gray-400 text-sm mt-1">{card.title}</p>
                <p className="text-gray-600 text-xs mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Hourly Bar Chart */}
            <div className="xl:col-span-2 bg-dark-200 rounded-2xl p-6 border border-dark-100">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">Accidents Per Hour</h3>
              </div>
              <div style={{ height: '240px' }}>
                <Bar data={hourlyData} options={chartOptions} />
              </div>
            </div>

            {/* Type Doughnut */}
            <div className="bg-dark-200 rounded-2xl p-6 border border-dark-100">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">Accident Types</h3>
              </div>
              <div style={{ height: '240px' }}>
                <Doughnut data={typeData} options={doughnutOptions} />
              </div>
            </div>

          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Weekly Line Chart */}
            <div className="xl:col-span-2 bg-dark-200 rounded-2xl p-6 border border-dark-100">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">Weekly Trend</h3>
              </div>
              <div style={{ height: '240px' }}>
                <Line data={weeklyData} options={chartOptions} />
              </div>
            </div>

            {/* Severity Doughnut */}
            <div className="bg-dark-200 rounded-2xl p-6 border border-dark-100">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">Severity Levels</h3>
              </div>
              <div style={{ height: '240px' }}>
                <Doughnut data={severityData} options={doughnutOptions} />
              </div>
            </div>

          </div>

          {/* Camera Performance */}
          <div className="bg-dark-200 rounded-2xl p-6 border border-dark-100">
            <div className="flex items-center gap-2 mb-5">
              <Car className="w-5 h-5 text-primary-400" />
              <h3 className="text-white font-semibold">
                Camera Performance
              </h3>
            </div>
            <div style={{ height: '200px' }}>
              <Bar data={cameraData} options={chartOptions} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Analytics