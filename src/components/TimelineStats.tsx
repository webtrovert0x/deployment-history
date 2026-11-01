'use client';

import React from 'react';
import { Layers, Cpu, GitFork, CheckCircle2 } from 'lucide-react';
import { DeploymentRecord } from '@/utils/scanner';

interface TimelineStatsProps {
  deployments: DeploymentRecord[];
  isScanning: boolean;
}

export default function TimelineStats({ deployments, isScanning }: TimelineStatsProps) {
  const total = deployments.length;
  const direct = deployments.filter((d) => d.creationMethod.includes('Direct')).length;
  const factory = deployments.filter((d) => d.creationMethod.includes('Factory') || d.creationMethod.includes('Clone')).length;
  const activeBytecode = deployments.filter((d) => d.verificationStatus === 'Bytecode Active' || d.verificationStatus === 'Verified').length;

  const stats = [
    {
      label: 'Total Deployments',
      value: total,
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Direct EOA Deploys',
      value: direct,
      icon: Cpu,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-100',
    },
    {
      label: 'Factory / Clones',
      value: factory,
      icon: GitFork,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
    },
    {
      label: 'Active Bytecode',
      value: activeBytecode,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`bg-white rounded-xl p-4 border ${stat.borderColor} shadow-sm transition-all hover:shadow-md flex items-center space-x-3`}
          >
            <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {isScanning ? (
                  <span className="inline-block w-8 h-6 bg-slate-100 animate-pulse rounded"></span>
                ) : (
                  stat.value
                )}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}

