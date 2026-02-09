import { useState, useEffect, useCallback } from 'react';
import { IssueList } from './components/IssueList';
import { FilterBar } from './components/FilterBar';
import { IssueDetail } from './components/IssueDetail';
import { IssueCreate } from './components/IssueCreate';
import { Login } from './components/Login';
import { Plus, LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { getIssues, type QueryParams } from './api/issues';
import type { Issue, IssueFilters, StatusCounts } from './types';

type PageView = 'list' | 'detail' | 'create' | 'login';

export default function App() {
  const { isLoggedIn, userRole, userName, logout } = useAuth();

  const [filters, setFilters] = useState<IssueFilters>({
    area: '',
    issueNumber: '',
    dateRange: { start: '', end: '' },
    title: '',
    phone: '',
    status: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<PageView>('list');

  // API data
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ all: 0, pending: 0, resolved: 0 });

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params: QueryParams = {
        page: currentPage,
        pageSize,
        status: filters.status,
        area: filters.area,
        issueNumber: filters.issueNumber,
        title: filters.title,
        phone: filters.phone,
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
      };
      const result = await getIssues(params);
      setIssues(result.data);
      setTotal(result.total);
      setStatusCounts(result.statusCounts);
    } catch (err) {
      console.error('获取列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    if (currentView === 'list') {
      fetchIssues();
    }
  }, [fetchIssues, currentView]);

  const handleSearch = (newFilters: IssueFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  };

  const handleViewDetail = (issue: Issue) => {
    setSelectedIssueId(issue.id);
    setCurrentView('detail');
  };

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedIssueId(null);
  };

  const handleShowLogin = () => {
    setCurrentView('login');
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      setCurrentView('list');
    }
  };

  const roleLabels: Record<string, string> = {
    user: '普通用户',
    resolver: '解决人',
    admin: '管理员',
  };

  if (currentView === 'login') {
    return <Login onBack={handleBackToList} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'list' ? (
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">问题整改</h1>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <UserCircle2 className="size-5 text-gray-500" />
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{userName}</span>
                      <span className="text-gray-500 ml-2">({roleLabels[userRole]})</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="size-4" />
                    退出登录
                  </button>
                </>
              ) : (
                <button
                  onClick={handleShowLogin}
                  className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <LogIn className="size-4" />
                  登录
                </button>
              )}
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="size-5" />
                上报新问题
              </button>
            </div>
          </div>

          <FilterBar
            onSearch={handleSearch}
            statusCounts={statusCounts}
            currentStatus={filters.status}
            onStatusChange={handleStatusChange}
          />

          <IssueList
            issues={issues}
            total={total}
            loading={loading}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onViewDetail={handleViewDetail}
            onDeleted={fetchIssues}
            userRole={userRole}
          />
        </div>
      ) : currentView === 'create' ? (
        <IssueCreate onBack={handleBackToList} />
      ) : (
        <IssueDetail
          issueId={selectedIssueId!}
          onBack={handleBackToList}
          userRole={userRole}
        />
      )}
    </div>
  );
}
