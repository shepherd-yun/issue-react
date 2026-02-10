import { Eye, Trash2, Loader2 } from 'lucide-react';
import { deleteIssue } from '../api/issues';
import type { Issue, UserRole } from '../types';

interface IssueListProps {
  issues: Issue[];
  total: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onViewDetail: (issue: Issue) => void;
  onDeleted: () => void;
  userRole: UserRole;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '未解决', color: 'bg-amber-500 text-white' },
  rejected: { label: '已驳回', color: 'bg-red-500 text-white' },
  resolved: { label: '已解决', color: 'bg-green-600 text-white' },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function IssueList({
  issues,
  total,
  loading,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onDeleted,
  userRole,
}: IssueListProps) {
  const totalPages = Math.ceil(total / pageSize);
  const isAdmin = userRole === 'admin';

  const handleDelete = async (issue: Issue) => {
    if (!confirm(`确定要删除问题「${issue.title || issue.issueNumber}」吗？`)) return;
    try {
      await deleteIssue(issue.id);
      onDeleted();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-6 py-4 text-left text-sm font-medium text-gray-700 border-r border-gray-200">问题单号</th>
              <th className="sticky left-[140px] z-10 bg-gray-50 px-6 py-4 text-left text-sm font-medium text-gray-700 border-r border-gray-200">问题区域</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">问题标题</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">问题描述</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">问题位置</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">状态</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">创建时间</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">创建人</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 whitespace-nowrap">联系电话</th>
              <th className="sticky right-0 z-10 bg-gray-50 px-6 py-4 text-left text-sm font-medium text-gray-700 border-l border-gray-200">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              issues.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 z-10 bg-white px-6 py-4 border-r border-gray-200">
                    <button
                      onClick={() => onViewDetail(item)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
                    >
                      {item.issueNumber}
                    </button>
                  </td>
                  <td className="sticky left-[140px] z-10 bg-white px-6 py-4 border-r border-gray-200">
                    <div className="text-sm text-gray-900 whitespace-nowrap">{item.area}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 whitespace-nowrap">{item.title || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 w-[200px] truncate" title={item.description || ''}>
                      {item.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{item.location || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${statusMap[item.status]?.color || ''}`}>
                      {statusMap[item.status]?.label || item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{formatTime(item.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{item.creator || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{item.phone || '-'}</td>
                  <td className="sticky right-0 z-10 bg-white px-6 py-4 border-l border-gray-200">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="查看"
                      >
                        <Eye className="size-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          共 <span className="font-medium text-gray-900">{total}</span> 条记录
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">每页显示</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10 条</option>
              <option value="20">20 条</option>
              <option value="50">50 条</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>

          <div className="text-sm text-gray-700">
            第 <span className="font-medium text-gray-900">{currentPage}</span> / {totalPages || 1} 页
          </div>
        </div>
      </div>
    </div>
  );
}
