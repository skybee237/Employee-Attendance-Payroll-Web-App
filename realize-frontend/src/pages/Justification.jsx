import { useState, useEffect, useCallback } from "react";
import API from "../api";
import { toast } from "react-toastify";

const Justification = ({ employeeId }) => {
  // State management
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ 
    date: "", 
    reason: "", 
    type: "absence",
    duration: "",
    attachments: []
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Justification types
  const justificationTypes = [
    { value: 'absence', label: 'Full Day Absence', icon: '🏠' },
    { value: 'late', label: 'Late Arrival', icon: '⏰' },
    { value: 'early_departure', label: 'Early Departure', icon: '🚪' },
    { value: 'partial_absence', label: 'Partial Absence', icon: '⏳' }
  ];

  // Status colors and icons
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pending Review' },
    approved: { color: 'bg-green-100 text-green-800', icon: '✅', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', icon: '❌', label: 'Rejected' }
  };

  // File validation
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload images (JPEG, PNG, GIF) or documents (PDF, DOC, DOCX) only");
      return false;
    }

    return true;
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    setUploadingFiles(true);
    const newAttachments = [...form.attachments];
    
    try {
      for (let file of files) {
        if (!validateFile(file)) continue;

        // Create a preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newAttachments.push({
              name: file.name,
              type: file.type,
              size: file.size,
              preview: e.target.result,
              file: file
            });
            setForm(prev => ({ ...prev, attachments: newAttachments }));
          };
          reader.readAsDataURL(file);
        } else {
          newAttachments.push({
            name: file.name,
            type: file.type,
            size: file.size,
            file: file
          });
          setForm(prev => ({ ...prev, attachments: newAttachments }));
        }
      }
    } catch (err) {
      toast.error("Error processing files");
    } finally {
      setUploadingFiles(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = (index) => {
    const newAttachments = form.attachments.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, attachments: newAttachments }));
  };

  // Upload files to server
  const uploadFilesToServer = async (attachments) => {
    const uploadedFiles = [];
    
    for (const attachment of attachments) {
      if (attachment.url) {
        // File already uploaded
        uploadedFiles.push({
          name: attachment.name,
          type: attachment.type,
          url: attachment.url
        });
        continue;
      }

      const formData = new FormData();
      formData.append('file', attachment.file);
      formData.append('employeeId', employeeId);
      formData.append('purpose', 'justification');

      try {
        const response = await API.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        uploadedFiles.push({
          name: attachment.name,
          type: attachment.type,
          url: response.data.fileUrl
        });
      } catch (err) {
        console.error('File upload failed:', err);
        toast.error(`Failed to upload ${attachment.name}`);
      }
    }
    
    return uploadedFiles;
  };

  // Enhanced error handling
  const handleError = (err, action) => {
    console.error(`Error ${action}:`, err);
    const message = err?.response?.data?.message || err?.message || `Error ${action}`;
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Show success notification
  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
    toast.success(message);
  };

  // Clear field error
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form fields
  const validateField = (field, value) => {
    switch (field) {
      case 'date':
        if (!value) {
          setFieldErrors(prev => ({ ...prev, date: 'Date is required' }));
          return false;
        }
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (selectedDate > today) {
          setFieldErrors(prev => ({ ...prev, date: 'Cannot justify future dates' }));
          return false;
        }
        clearFieldError('date');
        return true;

      case 'reason':
        if (!value.trim()) {
          setFieldErrors(prev => ({ ...prev, reason: 'Reason is required' }));
          return false;
        }
        if (value.trim().length < 10) {
          setFieldErrors(prev => ({ ...prev, reason: 'Please provide a more detailed reason (minimum 10 characters)' }));
          return false;
        }
        clearFieldError('reason');
        return true;

      case 'duration':
        if (form.type === 'partial_absence' && !value) {
          setFieldErrors(prev => ({ ...prev, duration: 'Duration is required for partial absence' }));
          return false;
        }
        clearFieldError('duration');
        return true;

      default:
        return true;
    }
  };

  // Validate entire form
  const validateForm = () => {
    const isDateValid = validateField('date', form.date);
    const isReasonValid = validateField('reason', form.reason);
    const isDurationValid = validateField('duration', form.duration);
    
    return isDateValid && isReasonValid && isDurationValid;
  };

  // Fetch justifications
  const fetchJustifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/api/justification/${employeeId}`);
      let fetchedRecords = res.data || [];
      
      const filteredRecords = filter === 'all' 
        ? fetchedRecords 
        : fetchedRecords.filter(record => record.status === filter);
      
      const sortedRecords = [...filteredRecords].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
      
      setRecords(sortedRecords);
      setError(null);
    } catch (err) {
      handleError(err, "fetching justifications");
    } finally {
      setLoading(false);
    }
  }, [employeeId, filter, sortOrder]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (success) setSuccess(null);
    setTimeout(() => validateField(field, value), 300);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fix the errors below before submitting");
      return;
    }

    setSubmitting(true);
    try {
      // Upload files first
      let uploadedAttachments = [];
      if (form.attachments.length > 0) {
        uploadedAttachments = await uploadFilesToServer(form.attachments);
      }

      const submissionData = {
        employeeId,
        date: form.date,
        reason: form.reason.trim(),
        type: form.type,
        duration: form.type === 'partial_absence' ? form.duration : undefined,
        attachments: uploadedAttachments,
        submittedAt: new Date().toISOString()
      };

      if (editingId) {
        await API.put(`/api/justification/${editingId}`, submissionData);
        showSuccess("Justification updated successfully!");
        setEditingId(null);
      } else {
        await API.post(`/api/justification/${employeeId}`, submissionData);
        showSuccess("Justification submitted successfully!");
      }
      
      // Reset form
      setForm({ 
        date: "", 
        reason: "", 
        type: "absence", 
        duration: "",
        attachments: []
      });
      setFieldErrors({});
      
      await fetchJustifications();
    } catch (err) {
      handleError(err, editingId ? "updating justification" : "submitting justification");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit justification
  const handleEdit = (record) => {
    if (record.status !== 'pending') {
      setError("Only pending justifications can be edited");
      return;
    }
    
    setForm({
      date: record.date.split('T')[0],
      reason: record.reason,
      type: record.type || 'absence',
      duration: record.duration || '',
      attachments: record.attachments || []
    });
    setEditingId(record._id);
    setFieldErrors({});
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setForm({ 
      date: "", 
      reason: "", 
      type: "absence", 
      duration: "",
      attachments: []
    });
    setEditingId(null);
    setFieldErrors({});
  };

  // Handle delete justification
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this justification?")) {
      return;
    }

    try {
      await API.delete(`/api/justification/${id}`);
      showSuccess("Justification deleted successfully!");
      await fetchJustifications();
    } catch (err) {
      handleError(err, "deleting justification");
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    return '📎';
  };

  useEffect(() => {
    if (employeeId) {
      fetchJustifications();
    }
  }, [employeeId, fetchJustifications]);

  if (loading && !records.length) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading justifications...</span>
        </div>
      </div>
    );
  }

  const stats = {
    total: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    approved: records.filter(r => r.status === 'approved').length,
    rejected: records.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Absence & Late Justifications</h2>
          <p className="text-gray-600">Submit and track your absence and tardiness justifications</p>
        </div>
        
        <button
          onClick={fetchJustifications}
          className="mt-4 sm:mt-0 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          disabled={loading}
        >
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold text-xl">×</button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Approved</p>
          <p className="text-2xl font-bold text-green-800">{stats.approved}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
        </div>
      </div>

      {/* Justification Form */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? 'Edit Justification' : 'Submit New Justification'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  fieldErrors.date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
              {fieldErrors.date && <p className="mt-1 text-sm text-red-600">{fieldErrors.date}</p>}
            </div>

            {/* Type Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {justificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration Field */}
          {form.type === 'partial_absence' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="e.g., 2 hours, 9:00 AM - 11:00 AM"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  fieldErrors.duration ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {fieldErrors.duration && <p className="mt-1 text-sm text-red-600">{fieldErrors.duration}</p>}
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supporting Documents
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                className="hidden"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-gray-400 text-4xl mb-2">📎</div>
                <p className="text-gray-600">Click to upload supporting documents</p>
                <p className="text-sm text-gray-400 mt-1">Max 5MB per file (images, PDF, Word)</p>
              </label>
            </div>

            {/* File Previews */}
            {form.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Attached files:</p>
                {form.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700 text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please provide a detailed explanation for your absence/tardiness..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical ${
                fieldErrors.reason ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {fieldErrors.reason ? (
                <p className="text-sm text-red-600">{fieldErrors.reason}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {form.reason.length}/500 characters (minimum 10 required)
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel Edit
              </button>
            )}
            
            <button
              type="submit"
              disabled={submitting || uploadingFiles || Object.keys(fieldErrors).length > 0}
              className={`px-8 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                submitting || uploadingFiles || Object.keys(fieldErrors).length > 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {submitting || uploadingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploadingFiles ? 'Uploading...' : editingId ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                editingId ? '💾 Update Justification' : '📝 Submit Justification'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            {['all', 'pending', 'approved', 'rejected'].map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
            >
              {sortOrder === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Justification Records */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            Justification History
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({records.length} {records.length === 1 ? 'record' : 'records'})
            </span>
          </h3>
        </div>
        
        {records.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {records.map((record) => {
              const statusInfo = statusConfig[record.status] || statusConfig.pending;
              const typeInfo = justificationTypes.find(t => t.value === record.type) || justificationTypes[0];
              
              return (
                <div key={record._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </h4>
                        <span className="text-lg">{typeInfo.icon}</span>
                        <span className="text-sm text-gray-600">{typeInfo.label}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{record.reason}</p>
                      
                      {record.duration && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Duration:</span> {record.duration}
                        </p>
                      )}
                      
                      {/* Attachments */}
                      {record.attachments && record.attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Attachments:</p>
                          <div className="space-y-1">
                            {record.attachments.map((file, index) => (
                              <a
                                key={index}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                <span>{getFileIcon(file.type)}</span>
                                <span>{file.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Submitted: {new Date(record.submittedAt || record.createdAt).toLocaleString()}</span>
                        {record.reviewedAt && (
                          <span>Reviewed: {new Date(record.reviewedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                      
                      {record.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {record.reviewComments && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-700">Review Comments:</p>
                      <p className="text-sm text-gray-600 mt-1">{record.reviewComments}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">No justifications found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filter === 'all' 
                ? "Submit your first justification using the form above" 
                : `No ${filter} justifications found. Try changing the filter.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Justification;