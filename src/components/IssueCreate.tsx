import { ArrowLeft, Upload, X, Image as ImageIcon, MapPin, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { AREAS } from '../types';
import { createIssue } from '../api/issues';
import { uploadImages } from '../api/upload';

interface IssueCreateProps {
  onBack: () => void;
}

export function IssueCreate({ onBack }: IssueCreateProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area: '',
    phone: '',
    location: '',
    creator: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGetLocation = () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      alert('您的浏览器不支持定位功能');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 使用高德地图逆地理编码 API
          const response = await fetch(
            `https://restapi.amap.com/v3/geocode/regeo?key=d1e3358b9104a1c7aefa26f3f16f421b&location=${longitude},${latitude}`
          );
          const data = await response.json();
          const address = data.regeocode?.formatted_address || '';
          handleInputChange('location', address || `经度: ${longitude.toFixed(6)}, 纬度: ${latitude.toFixed(6)}`);
        } catch {
          handleInputChange('location', `经度: ${longitude.toFixed(6)}, 纬度: ${latitude.toFixed(6)}`);
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = '定位失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = '您拒绝了定位权限，请在浏览器设置中允许定位';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMsg = '定位请求超时';
            break;
        }
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 9 - images.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      const result = await uploadImages(filesToUpload);
      setImages(prev => [...prev, ...result.urls]);
    } catch (err: any) {
      alert(err.response?.data?.message || '图片上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) { alert('请至少上传一张图片'); return; }
    if (!formData.area) { alert('请选择问题区域'); return; }

    setSubmitting(true);
    try {
      await createIssue({
        images,
        area: formData.area,
        title: formData.title || undefined,
        description: formData.description || undefined,
        location: formData.location || undefined,
        creator: formData.creator || undefined,
        phone: formData.phone || undefined,
      });
      alert('问题上报成功！');
      onBack();
    } catch (err: any) {
      alert(err.response?.data?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1000px] mx-auto p-6">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">上报新问题</h1>
          </div>
        </div>

        {/* 表单区域 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            {/* 上报图片 - 必填 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                上报图片 <span className="text-red-500">*</span>
              </label>
              <div className="text-sm text-gray-500 mb-3">
                最少上传1张图片，最多9张，支持JPG、PNG格式，单张图片不超过5MB
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                    <img
                      src={img}
                      alt={`上报图片${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}

                {images.length < 9 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-colors group disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="size-8 text-blue-500 animate-spin" />
                    ) : (
                      <Upload className="size-8 text-gray-400 group-hover:text-blue-500" />
                    )}
                    <span className="text-sm text-gray-500 group-hover:text-blue-600">
                      {uploading ? '上传中...' : '上传图片'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* 问题区域 - 必填 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  问题区域 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择区域</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  创建人姓名
                </label>
                <input
                  type="text"
                  value={formData.creator}
                  onChange={(e) => handleInputChange('creator', e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 问题标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                问题标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入问题标题"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 联系电话 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                联系电话
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="请输入联系电话"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 问题位置 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                问题位置
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="请输入具体位置或点击定位按钮获取"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      定位中...
                    </>
                  ) : (
                    <>
                      <MapPin className="size-5" />
                      获取定位
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                点击"获取定位"按钮可自动获取当前位置，或手动输入具体位置
              </div>
            </div>

            {/* 问题描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                问题描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请详细描述遇到的问题，包括问题发生的时间、地点、具体现象等"
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-2 text-sm text-gray-500">
                {formData.description.length} / 500 字
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <ImageIcon className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">温馨提示：</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>上报图片和问题区域为必填项</li>
                    <li>建议上传现场照片，便于问题定位</li>
                    <li>使用定位功能可精确记录问题位置</li>
                    <li>提交后您可以在列表中查看处理进度</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onBack}
            className="px-8 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? '提交中...' : '提交问题'}
          </button>
        </div>
      </div>
    </div>
  );
}
