import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { AREAS } from '../types';
import type { IssueFilters, StatusCounts } from '../types';

interface FilterBarProps {
  onSearch: (filters: IssueFilters) => void;
  statusCounts: StatusCounts;
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

export function FilterBar({ onSearch, statusCounts, currentStatus, onStatusChange }: FilterBarProps) {
  const [area, setArea] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');

  const handleSearch = () => {
    onSearch({
      area,
      issueNumber,
      dateRange: { start: startDate, end: endDate },
      title,
      phone,
      status: currentStatus,
    });
  };

  const handleReset = () => {
    setArea('');
    setIssueNumber('');
    setStartDate('');
    setEndDate('');
    setTitle('');
    setPhone('');
    onStatusChange('all');
    onSearch({
      area: '',
      issueNumber: '',
      dateRange: { start: '', end: '' },
      title: '',
      phone: '',
      status: 'all',
    });
  };

  const statusTabs = [
    { key: 'all', label: '全部', count: statusCounts.all },
    { key: 'pending', label: '未解决', count: statusCounts.pending },
    { key: 'resolved', label: '已解决', count: statusCounts.resolved },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Status tab buttons */}
      <div className="flex gap-2 mb-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              onStatusChange(tab.key);
              onSearch({
                area,
                issueNumber,
                dateRange: { start: startDate, end: endDate },
                title,
                phone,
                status: tab.key,
              });
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStatus === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}({tab.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">请选择区域</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="创建开始时间"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="创建结束时间"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value)}
          placeholder="请输入问题单号"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入标题"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="请输入手机号"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div />

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="size-4" />
            查询
          </button>
          <button
            onClick={handleReset}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="size-4" />
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
