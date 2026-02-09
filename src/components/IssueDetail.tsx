import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Calendar, User, Phone, MapPin, FileText, Image as ImageIcon, Clock, AlertCircle, Edit2, Loader2, Upload, X, Trash2 } from 'lucide-react';
import { getIssue, updateIssue } from '../api/issues';
import { createFollowUp, updateFollowUp, deleteFollowUp } from '../api/followUps';
import { uploadImages } from '../api/upload';
import type { Issue, FollowUp, UserRole } from '../types';

interface IssueDetailProps {
  issueId: string;
  onBack: () => void;
  userRole: UserRole;
  isEditMode?: boolean;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-amber-500 text-white' },
  processing: { label: '处理中', color: 'bg-blue-600 text-white' },
  resolved: { label: '已解决', color: 'bg-green-600 text-white' },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function IssueDetail({ issueId, onBack, userRole, isEditMode = false }: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const canEdit = userRole === 'resolver' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  // Follow-up form state
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [followUpImages, setFollowUpImages] = useState<string[]>([]);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpUploading, setFollowUpUploading] = useState(false);
  const followUpFileRef = useRef<HTMLInputElement>(null);

  // Resolve form state
  const [resolvingFollowUpId, setResolvingFollowUpId] = useState<string | null>(null);
  const [resolveDesc, setResolveDesc] = useState('');
  const [resolveImages, setResolveImages] = useState<string[]>([]);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveUploading, setResolveUploading] = useState(false);
  const resolveFileRef = useRef<HTMLInputElement>(null);

  // Deadline state
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState('');

  const fetchIssue = async () => {
    setLoading(true);
    try {
      const data = await getIssue(issueId);
      setIssue(data);
    } catch (err) {
      alert('加载问题详情失败');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const handleFollowUpImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setFollowUpUploading(true);
    try {
      const result = await uploadImages(Array.from(files).slice(0, 9 - followUpImages.length));
      setFollowUpImages(prev => [...prev, ...result.urls]);
    } catch { alert('图片上传失败'); }
    finally {
      setFollowUpUploading(false);
      if (followUpFileRef.current) followUpFileRef.current.value = '';
    }
  };

  const handleSubmitFollowUp = async () => {
    if (!followUpDesc.trim()) { alert('请输入处理描述'); return; }
    setFollowUpSubmitting(true);
    try {
      await createFollowUp(issueId, {
        handleDescription: followUpDesc,
        handleImages: followUpImages,
      });
      setFollowUpDesc('');
      setFollowUpImages([]);
      setShowFollowUpForm(false);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '添加跟进失败');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const handleResolveImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setResolveUploading(true);
    try {
      const result = await uploadImages(Array.from(files).slice(0, 9 - resolveImages.length));
      setResolveImages(prev => [...prev, ...result.urls]);
    } catch { alert('图片上传失败'); }
    finally {
      setResolveUploading(false);
      if (resolveFileRef.current) resolveFileRef.current.value = '';
    }
  };

  const handleSubmitResolve = async (followUpId: string) => {
    if (!resolveDesc.trim()) { alert('请输入解决描述'); return; }
    setResolveSubmitting(true);
    try {
      await updateFollowUp(followUpId, {
        resolver: '审核人',
        resolveDescription: resolveDesc,
        resolveImages: resolveImages,
      });
      setResolvingFollowUpId(null);
      setResolveDesc('');
      setResolveImages([]);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '提交解决信息失败');
    } finally {
      setResolveSubmitting(false);
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    if (!confirm('确定要删除此跟进记录吗？')) return;
    try {
      await deleteFollowUp(id);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除跟进记录失败');
    }
  };

  const handleSetDeadline = async () => {
    if (!deadlineValue) { alert('请选择截止时间'); return; }
    try {
      await updateIssue(issueId, { deadline: new Date(deadlineValue).toISOString() });
      setShowDeadlineForm(false);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '设置截止时间失败');
    }
  };

  if (loading || !issue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  const followUps = issue.followUps || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditMode ? '编辑问题' : '问题详情'}
            </h1>
            <span className={`inline-flex px-3 py-1 rounded-md text-xs font-medium ${statusMap[issue.status]?.color || ''}`}>
              {statusMap[issue.status]?.label || issue.status}
            </span>
            {userRole === 'user' && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">仅查看</span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
              {isAdmin && (
                <button
                  onClick={() => setShowDeadlineForm(!showDeadlineForm)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="size-4" />
                  设置截止时间
                </button>
              )}
            </div>

            {/* 截止时间设置表单 */}
            {showDeadlineForm && isAdmin && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={deadlineValue}
                  onChange={(e) => setDeadlineValue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={handleSetDeadline} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  确认
                </button>
                <button onClick={() => setShowDeadlineForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                  取消
                </button>
              </div>
            )}

            {/* 处理截止时间 */}
            {issue.deadline && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-900 mb-1">处理截止时间</div>
                  <div className="text-base font-semibold text-red-600">{formatTime(issue.deadline)}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <FileText className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">问题单号</div>
                  <div className="text-base font-medium text-blue-600">{issue.issueNumber}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">创建时间</div>
                  <div className="text-base text-gray-900">{formatTime(issue.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">创建人</div>
                  <div className="text-base text-gray-900">{issue.creator}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">联系电话</div>
                  <div className="text-base text-gray-900">{issue.phone}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">问题区域</div>
                  <div className="text-base text-gray-900">{issue.area}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">问题位置</div>
                  <div className="text-base text-gray-900">{issue.location}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 mb-2">问题标题</div>
              <div className="text-base font-medium text-gray-900 mb-4">{issue.title}</div>
              <div className="text-sm text-gray-500 mb-2">问题描述</div>
              <div className="text-base text-gray-700 leading-relaxed">{issue.description}</div>
            </div>
          </div>

          {/* 上报图片 */}
          {issue.images && issue.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">上报图片</h3>
              <div className="grid grid-cols-4 gap-4">
                {issue.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
                    <img src={img} alt={`上报图片${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 跟进记录 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">跟进记录</h3>

            {followUps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无跟进记录</div>
            ) : (
              <div className="space-y-6">
                {followUps.map((record: FollowUp, index: number) => (
                  <div key={record.id} className="relative">
                    {index !== followUps.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    <div className="bg-gray-50 rounded-lg p-6 relative">
                      <div className="absolute -left-2 top-6 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Clock className="size-4 text-white" />
                      </div>

                      {/* 处理信息 */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-semibold text-gray-900">处理记录</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{formatTime(record.handleTime)}</span>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteFollowUp(record.id)}
                                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                              >
                                <Trash2 className="size-3" />
                                删除
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-gray-500">处理人：</span>
                            <span className="text-sm text-gray-900 font-medium">{record.handler?.name || '未知'}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-gray-500 mb-2">处理描述</div>
                          <div className="text-sm text-gray-700 leading-relaxed bg-white rounded p-3">
                            {record.handleDescription}
                          </div>
                        </div>

                        {record.handleImages && record.handleImages.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-2">处理图片</div>
                            <div className="grid grid-cols-6 gap-2">
                              {record.handleImages.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded overflow-hidden bg-gray-100 group cursor-pointer">
                                  <img src={img} alt={`处理图片${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 解决信息 */}
                      {record.resolveTime ? (
                        <div className="pt-6 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-semibold text-green-700">解决记录</h4>
                            <span className="text-sm text-gray-500">{formatTime(record.resolveTime)}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="text-sm text-gray-500">审核人：</span>
                              <span className="text-sm text-gray-900 font-medium">{record.resolver}</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-sm text-gray-500 mb-2">解决描述</div>
                            <div className="text-sm text-gray-700 leading-relaxed bg-white rounded p-3">
                              {record.resolveDescription}
                            </div>
                          </div>

                          {record.resolveImages && record.resolveImages.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-500 mb-2">解决图片</div>
                              <div className="grid grid-cols-6 gap-2">
                                {record.resolveImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-square rounded overflow-hidden bg-gray-100 group cursor-pointer">
                                    <img src={img} alt={`解决图片${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : canEdit && (
                        <div className="pt-4 border-t border-gray-200">
                          {resolvingFollowUpId === record.id ? (
                            <div className="space-y-4">
                              <h4 className="text-base font-semibold text-green-700">添加解决信息</h4>
                              <textarea
                                value={resolveDesc}
                                onChange={(e) => setResolveDesc(e.target.value)}
                                placeholder="请输入解决描述"
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                              />
                              <input ref={resolveFileRef} type="file" accept="image/*" multiple onChange={handleResolveImageUpload} className="hidden" />
                              <div className="flex flex-wrap gap-2">
                                {resolveImages.map((img, idx) => (
                                  <div key={idx} className="relative w-16 h-16 rounded overflow-hidden">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button onClick={() => setResolveImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full">
                                      <X className="size-3" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => resolveFileRef.current?.click()}
                                  disabled={resolveUploading}
                                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-green-500"
                                >
                                  {resolveUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4 text-gray-400" />}
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSubmitResolve(record.id)}
                                  disabled={resolveSubmitting}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:bg-green-400 flex items-center gap-2"
                                >
                                  {resolveSubmitting && <Loader2 className="size-4 animate-spin" />}
                                  提交解决
                                </button>
                                <button onClick={() => { setResolvingFollowUpId(null); setResolveDesc(''); setResolveImages([]); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setResolvingFollowUpId(record.id)}
                              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                            >
                              <Edit2 className="size-3" />
                              添加解决信息
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 添加跟进表单 */}
        {canEdit && showFollowUpForm && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加跟进记录</h3>
            <div className="space-y-4">
              <textarea
                value={followUpDesc}
                onChange={(e) => setFollowUpDesc(e.target.value)}
                placeholder="请输入处理描述"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <input ref={followUpFileRef} type="file" accept="image/*" multiple onChange={handleFollowUpImageUpload} className="hidden" />
              <div className="flex flex-wrap gap-2">
                {followUpImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" />
                    <button onClick={() => setFollowUpImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => followUpFileRef.current?.click()}
                  disabled={followUpUploading}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center gap-1 hover:border-blue-500"
                >
                  {followUpUploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5 text-gray-400" />}
                  <span className="text-xs text-gray-500">{followUpUploading ? '上传中' : '上传'}</span>
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmitFollowUp}
                  disabled={followUpSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
                >
                  {followUpSubmitting && <Loader2 className="size-4 animate-spin" />}
                  提交跟进
                </button>
                <button
                  onClick={() => { setShowFollowUpForm(false); setFollowUpDesc(''); setFollowUpImages([]); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        {canEdit && !showFollowUpForm && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={() => setShowFollowUpForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加跟进
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
