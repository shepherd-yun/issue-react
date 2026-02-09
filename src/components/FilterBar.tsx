import { useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { AREAS } from '../types';
import type { IssueFilters } from '../types';

interface FilterBarProps {
  onSearch: (filters: IssueFilters) => void;
}

export function FilterBar({ onSearch }: FilterBarProps) {
  const [area, setArea] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('all');

  const handleSearch = () => {
    onSearch({
      area,
      issueNumber,
      dateRange: { start: startDate, end: endDate },
      title,
      phone,
      status,
    });
  };

  const handleReset = () => {
    setArea('');
    setIssueNumber('');
    setStartDate('');
    setEndDate('');
    setTitle('');
    setPhone('');
    setStatus('all');
    onSearch({
      area: '',
      issueNumber: '',
      dateRange: { start: '', end: '' },
      title: '',
      phone: '',
      status: 'all',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value)}
          placeholder="请输入问题单号"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

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
