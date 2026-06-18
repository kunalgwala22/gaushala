import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { DashboardStats } from '../types';
import { 
  IndianRupee, 
  Users, 
  Heart, 
  Calendar, 
  Award,
  TrendingUp,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { motion } from 'framer-motion';

// Chart colors
const COLORS = ['#f7811e', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', bounce: 0.2, duration: 0.6 } }
};

export const Dashboard: React.FC = () => {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass-card p-6 border-red-500/20 text-center max-w-lg mx-auto mt-20">
        <h3 className="text-red-400 font-bold text-lg mb-2">Error Loading Dashboard</h3>
        <p className="text-slate-400 text-sm">Failed to retrieve real-time stats from the server. Please verify database connection.</p>
      </div>
    );
  }

  const { cards, trend, categories, topDonors, healthStats } = data;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-wide">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time overview of Shree Sawariya Seth Gaushala</p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Donations */}
        <motion.div variants={cardVariants} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IndianRupee size={80} className="text-saffron-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Donations</span>
          <h3 className="text-2xl font-bold text-white font-display">
            ₹{cards.totalDonations.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> Cumulative funds raised
          </span>
        </motion.div>

        {/* Monthly Donations */}
        <motion.div variants={cardVariants} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={80} className="text-saffron-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Monthly Donations</span>
          <h3 className="text-2xl font-bold text-saffron-400 font-display">
            ₹{cards.monthlyDonations.toLocaleString('en-IN')}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium mt-2 block">
            Raised this month
          </span>
        </motion.div>

        {/* Active Donors */}
        <motion.div variants={cardVariants} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} className="text-emerald-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Donors</span>
          <h3 className="text-2xl font-bold text-white font-display">
            {cards.activeDonors}
          </h3>
          <span className="text-[10px] text-emerald-400 font-medium mt-2 block">
            Donated in last 12 months
          </span>
        </motion.div>

        {/* Total Cows */}
        <motion.div variants={cardVariants} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Heart size={80} className="text-rose-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Cows</span>
          <h3 className="text-2xl font-bold text-white font-display">
            {cards.totalCows}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium mt-2 block">
            Sheltered in complex
          </span>
        </motion.div>

        {/* Active Sponsorships */}
        <motion.div variants={cardVariants} className="glass-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Award size={80} className="text-violet-500" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Adoptions</span>
          <h3 className="text-2xl font-bold text-emerald-400 font-display">
            {cards.activeSponsorships}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium mt-2 block">
            Cows sponsored by donors
          </span>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donation Trend Area Chart */}
        <motion.div variants={cardVariants} className="glass-card p-6 lg:col-span-2 flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-base text-slate-200">Donation Trend (Last 6 Months)</h3>
            <span className="text-xs bg-saffron-500/10 text-saffron-400 border border-saffron-500/20 px-2.5 py-1 rounded-full font-medium">Monthly Stats</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f7811e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f7811e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#94a3b8' }}
                  itemStyle={{ fontSize: '13px', color: '#f7811e' }}
                  formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Donations']}
                />
                <Area type="monotone" dataKey="amount" stroke="#f7811e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution Pie Chart */}
        <motion.div variants={cardVariants} className="glass-card p-6 flex flex-col h-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-slate-200">Category Distribution</h3>
            <PieIcon size={18} className="text-saffron-500" />
          </div>
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {categories.length === 0 ? (
              <p className="text-slate-500 text-sm">No donation data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categories.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', color: '#94a3b8', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Donors Bar Chart */}
        <motion.div variants={cardVariants} className="glass-card p-6 flex flex-col h-80">
          <h3 className="font-display font-semibold text-base text-slate-200 mb-6">Top Contributors</h3>
          <div className="flex-1 min-h-0">
            {topDonors.length === 0 ? (
              <p className="text-slate-500 text-sm text-center pt-16">No contributors found</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDonors} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ fontSize: '13px', color: '#10b981' }}
                    formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Total Donated']}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Cow Health Status Chart */}
        <motion.div variants={cardVariants} className="glass-card p-6 flex flex-col h-80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-base text-slate-200">Cow Health Distribution</h3>
            <Activity size={18} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-h-0">
            {healthStats.length === 0 ? (
              <p className="text-slate-500 text-sm text-center pt-16">No cow records available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthStats} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis dataKey="status" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val: string) => val.replace('_', ' ')} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ fontSize: '13px' }}
                    formatter={(value: any) => [value, 'Cows']}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={35}>
                    {healthStats.map((entry, index) => {
                      let color = '#3b82f6'; // recovering/default
                      if (entry.status === 'HEALTHY') color = '#10b981';
                      if (entry.status === 'UNDER_TREATMENT') color = '#f59e0b';
                      if (entry.status === 'CRITICAL') color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
export default Dashboard;
