import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Calendar, User, Phone, MapPin, FileText,
  AlertCircle, Loader2, Upload, X, Trash2,
  Eye, Download, Plus, CheckCircle, XCircle,
} from 'lucide-react';
import { getIssue } from '../api/issues';
import { resolveIssue, rejectIssue } from '../api/issues';
import { createFollowUp, updateFollowUp, deleteFollowUp } from '../api/followUps';
import { uploadImages } from '../api/upload';
import type { Issue, FollowUp, UserRole } from '../types';

interface IssueDetailProps {
  issueId: string;
  onBack: () => void;
  userRole: UserRole;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '未解决', color: 'bg-amber-500 text-white' },
  resolved: { label: '已解决', color: 'bg-green-600 text-white' },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function IssueDetail({ issueId, onBack, userRole }: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = userRole === 'admin';

  // Follow-up form state
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpName, setFollowUpName] = useState('');
  const [followUpDesc, setFollowUpDesc] = useState('');
  const [followUpImages, setFollowUpImages] = useState<string[]>([]);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpUploading, setFollowUpUploading] = useState(false);
  const followUpFileRef = useRef<HTMLInputElement>(null);
  const followUpFormRef = useRef<HTMLDivElement>(null);

  // Reject dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchIssue = async () => {
    setLoading(true);
    try {
      const data = await getIssue(issueId);
      setIssue(data);
    } catch {
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
    if (followUpImages.length === 0) { alert('请至少上传一张处理图片'); return; }
    setFollowUpSubmitting(true);
    try {
      await createFollowUp(issueId, {
        handlerName: followUpName,
        handleImages: followUpImages,
        handleDescription: followUpDesc || undefined,
      });
      setFollowUpName('');
      setFollowUpDesc('');
      setFollowUpImages([]);
      setShowFollowUpForm(false);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '添加处理记录失败');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    if (!confirm('确定要删除此处理记录吗？')) return;
    try {
      await deleteFollowUp(id);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除处理记录失败');
    }
  };

  const handleResolve = async () => {
    if (!confirm('确定要将此问题标记为已解决吗？')) return;
    setResolving(true);
    try {
      await resolveIssue(issueId);
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    } finally {
      setResolving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectIssue(issueId, rejectReason || undefined);
      setShowRejectDialog(false);
      setRejectReason('');
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '驳回失败');
    } finally {
      setRejecting(false);
    }
  };

  const handleDownloadImage = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || 'image';
    a.target = '_blank';
    a.click();
  };

  const handleDeleteFollowUpImage = async (followUpId: string, imageIndex: number, currentImages: string[]) => {
    if (!confirm('确定要删除此图片吗？')) return;
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    try {
      await updateFollowUp(followUpId, { handleImages: newImages });
      await fetchIssue();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除图片失败');
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
            <h1 className="text-2xl font-semibold text-gray-900">问题详情</h1>
            <span className={`inline-flex px-3 py-1 rounded-md text-xs font-medium ${statusMap[issue.status]?.color || ''}`}>
              {statusMap[issue.status]?.label || issue.status}
            </span>
          </div>
          {isAdmin && issue.status === 'pending' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
              >
                {resolving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                已解决
              </button>
              <button
                onClick={() => setShowRejectDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="size-4" />
                驳回
              </button>
            </div>
          )}
        </div>

        {/* 驳回对话框 */}
        {showRejectDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-[480px] max-w-[90vw]">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">驳回处理记录</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因（可选）"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center gap-2"
                >
                  {rejecting && <Loader2 className="size-4 animate-spin" />}
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 图片预览弹窗 */}
        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="预览" className="max-w-[90vw] max-h-[90vh] object-contain" />
            <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 text-white rounded-full hover:bg-white/30">
              <X className="size-6" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h3>

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
                  <div className="text-base text-gray-900">{issue.creator || '-'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="size-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500 mb-1">联系电话</div>
                  <div className="text-base text-gray-900">{issue.phone || '-'}</div>
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
                  <div className="text-base text-gray-900">{issue.location || '-'}</div>
                </div>
              </div>
            </div>

            {(issue.title || issue.description) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {issue.title && (
                  <>
                    <div className="text-sm text-gray-500 mb-2">问题标题</div>
                    <div className="text-base font-medium text-gray-900 mb-4">{issue.title}</div>
                  </>
                )}
                {issue.description && (
                  <>
                    <div className="text-sm text-gray-500 mb-2">问题描述</div>
                    <div className="text-base text-gray-700 leading-relaxed">{issue.description}</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 上报图片 */}
          {issue.images && issue.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">上报图片</h3>
              <div className="grid grid-cols-4 gap-4">
                {issue.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer">
                    <img src={img} alt={`上报图片${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                      <button onClick={() => setPreviewImage(img)} className="p-2 bg-white/90 rounded-full hover:bg-white text-gray-700" title="查看">
                        <Eye className="size-5" />
                      </button>
                      <button onClick={() => handleDownloadImage(img)} className="p-2 bg-white/90 rounded-full hover:bg-white text-gray-700" title="下载">
                        <Download className="size-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 处理记录 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">处理记录</h3>
              <button
                onClick={() => {
                  setShowFollowUpForm(true);
                  setTimeout(() => {
                    followUpFormRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
                  }, 100);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="size-4" />
                添加处理记录
              </button>
            </div>

            {followUps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无处理记录</div>
            ) : (
              <div className="space-y-6">
                {followUps.map((record: FollowUp, index: number) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900">处理记录 #{index + 1}</h4>
                        {record.status === 'rejected' && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">已驳回</span>
                        )}
                        {record.status === 'resolved' && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">已解决</span>
                        )}
                      </div>
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

                    {/* 驳回原因 */}
                    {record.status === 'rejected' && record.rejectionReason && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-sm font-medium text-amber-800 mb-1">驳回原因</div>
                        <div className="text-sm text-amber-700">{record.rejectionReason}</div>
                        {record.rejectedBy && (
                          <div className="text-xs text-amber-500 mt-1">驳回人：{record.rejectedBy}</div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-500">处理人：</span>
                        <span className="text-sm text-gray-900 font-medium">{record.handlerName}</span>
                      </div>
                    </div>

                    {record.handleDescription && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-2">处理描述</div>
                        <div className="text-sm text-gray-700 leading-relaxed bg-white rounded p-3">
                          {record.handleDescription}
                        </div>
                      </div>
                    )}

                    {record.handleImages && record.handleImages.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-2">处理图片</div>
                        <div className="grid grid-cols-6 gap-2">
                          {record.handleImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded overflow-hidden bg-gray-100 group cursor-pointer">
                              <img src={img} alt={`处理图片${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                <button onClick={() => setPreviewImage(img)} className="p-1 bg-white/90 rounded-full hover:bg-white text-gray-700" title="查看">
                                  <Eye className="size-3.5" />
                                </button>
                                <button onClick={() => handleDownloadImage(img)} className="p-1 bg-white/90 rounded-full hover:bg-white text-gray-700" title="下载">
                                  <Download className="size-3.5" />
                                </button>
                                <button onClick={() => handleDeleteFollowUpImage(record.id, idx, record.handleImages)} className="p-1 bg-white/90 rounded-full hover:bg-white text-red-600" title="删除">
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 添加处理记录表单 */}
        {showFollowUpForm && (
          <div ref={followUpFormRef} className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加处理记录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  处理人
                </label>
                <input
                  type="text"
                  value={followUpName}
                  onChange={(e) => setFollowUpName(e.target.value)}
                  placeholder="请输入处理人姓名"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  处理图片 <span className="text-red-500">*</span>
                </label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  处理描述
                </label>
                <textarea
                  value={followUpDesc}
                  onChange={(e) => setFollowUpDesc(e.target.value)}
                  placeholder="请输入处理描述（可选）"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitFollowUp}
                  disabled={followUpSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2"
                >
                  {followUpSubmitting && <Loader2 className="size-4 animate-spin" />}
                  提交
                </button>
                <button
                  onClick={() => { setShowFollowUpForm(false); setFollowUpName(''); setFollowUpDesc(''); setFollowUpImages([]); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
