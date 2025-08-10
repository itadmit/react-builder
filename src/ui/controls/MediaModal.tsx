import React, { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, Image as ImageIcon, Video, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { MediaUploader, UploadError, UploadedFile } from './MediaUploader'

// פונקציה למחיקת קובץ מדיה מהשרת
const deleteMediaFromServer = async (storeSlug: string, mediaId: number) => {
  const response = await fetch(`/api/stores/${storeSlug}/media`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ media_id: mediaId })
  })
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result.error || 'שגיאה במחיקת הקובץ')
  }
  
  return result
}

// טעינת ספריית מדיה מהשרת
const loadMediaLibrary = async (storeSlug: string, options: {
  page?: number
  limit?: number
  filterType?: 'image' | 'video' | 'all'
} = {}) => {
  const params = new URLSearchParams({
    page: String(options.page || 1),
    limit: String(options.limit || 20),
    filter_type: options.filterType || 'all'
  })
  
  try {
    const response = await fetch(`/api/stores/${storeSlug}/media?${params}`)
    const result = await response.json()
    
    if (result.success) {
      return {
        media: result.data.map((item: any) => ({
          id: item.id, // הוסף את ה-ID למחיקה
          filename: item.filename,
          url: item.url,
          original_name: item.original_filename || item.filename
        })),
        pagination: result.pagination
      }
    } else {
      throw new Error(result.error || 'שגיאה בטעינת ספריית המדיה')
    }
  } catch (error) {
    console.error('Media library error:', error)
    throw error
  }
}

export interface MediaModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (file: UploadedFile) => void
  storeSlug: string
  accept?: string
  title?: string
  type?: 'image' | 'video' | 'all'
  initialFiles?: UploadedFile[]
  onFilesChange?: (files: UploadedFile[]) => void
  currentImageUrl?: string // התמונה הנוכחית לסימון
}

export function MediaModal({
  isOpen,
  onClose,
  onSelect,
  storeSlug,
  accept = 'image/*,video/mp4',
  title = 'בחר מדיה',
  type = 'all',
  initialFiles = [],
  onFilesChange,
  currentImageUrl
}: MediaModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload')
  const [isUploading, setIsUploading] = useState(false)
  
  // ספריית מדיה מהשרת
  const [libraryFiles, setLibraryFiles] = useState<UploadedFile[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryPagination, setLibraryPagination] = useState<any>(null)
  const [libraryPage, setLibraryPage] = useState(1)
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set())
  
  // סנכרן עם קבצים חיצוניים
  useEffect(() => {
    setUploadedFiles(initialFiles)
  }, [initialFiles])
  
  // אפס state כשהמודל נסגר ונפתח מחדש
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setIsUploading(false)
      // אפס לטאב העלאה, אבל אם יש תמונה נוכחית עבור לספריה
      if (currentImageUrl) {
        setActiveTab('library')
      } else {
        setActiveTab('upload')
      }
    }
  }, [isOpen, currentImageUrl])

  const handleSelect = useCallback((file: UploadedFile) => {
    onSelect(file)
    onClose()
  }, [onSelect, onClose])

  const handleUpload = useCallback((files: UploadedFile[]) => {
    const newFiles = [...uploadedFiles, ...files]
    setUploadedFiles(newFiles)
    onFilesChange?.(newFiles)
    setError(null)
    setIsUploading(false)
    
    // בחירה אוטומטית של התמונה הראשונה שהועלתה
    if (files.length > 0) {
      handleSelect(files[0])
    }
  }, [uploadedFiles, onFilesChange, handleSelect])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsUploading(false)
  }, [])

  const handleUploadStart = useCallback(() => {
    setIsUploading(true)
    setError(null)
  }, [])

  const removeFile = useCallback((index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onFilesChange?.(newFiles)
  }, [uploadedFiles, onFilesChange])

  // מחיקת קובץ מהשרת
  const deleteLibraryFile = useCallback(async (file: UploadedFile & { id?: number }) => {
    console.log('🗑️ Delete clicked:', { file, storeSlug, hasId: !!file.id })
    
    if (!file.id || storeSlug === 'demo' || !storeSlug) {
      console.log('❌ Cannot delete - missing id or demo mode')
      return
    }

    // אישור מחיקה
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הקובץ "${file.original_name}"?\nפעולה זו לא ניתנת לביטול.`)) {
      console.log('❌ User cancelled deletion')
      return
    }
    
    console.log('✅ Proceeding with deletion...')

    setDeletingFiles(prev => new Set(prev).add(file.id!))

    try {
      await deleteMediaFromServer(storeSlug, file.id)
      
      // הסרה מהרשימה המקומית
      setLibraryFiles(prev => prev.filter(f => (f as any).id !== file.id))
      
      // עדכון pagination אם צריך
      if (libraryPagination) {
        setLibraryPagination({
          ...libraryPagination,
          total_count: Math.max(0, libraryPagination.total_count - 1)
        })
      }

    } catch (error) {
      console.error('Error deleting file:', error)
      setError(error instanceof Error ? error.message : 'שגיאה במחיקת הקובץ')
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(file.id!)
        return newSet
      })
    }
  }, [storeSlug, libraryPagination])

  // טעינת ספריית מדיה מהשרת
  const loadLibrary = useCallback(async (page = 1, append = false) => {
    // לא לטעון במצב demo או אם אין slug אמיתי
    if (!storeSlug || storeSlug === 'demo' || !storeSlug.trim()) {
      setLibraryFiles([])
      setLibraryPagination(null)
      return
    }
    
    setLibraryLoading(true)
    setLibraryError(null)
    
    try {
      const result = await loadMediaLibrary(storeSlug, {
        page,
        limit: 24,
        filterType: type === 'all' ? 'all' : type
      })
      
      let mediaFiles = result.media
      
      // אם יש תמונה נוכחית וזה עמוד ראשון, וודא שהיא מופיעה ברשימה
      if (currentImageUrl && page === 1 && !append) {
        const hasCurrentImage = mediaFiles.some((file: any) => file.url === currentImageUrl)
        if (!hasCurrentImage) {
          // הוסף את התמונה הנוכחית לתחילת הרשימה (ללא ID כי היא לא מהשרת)
          const filename = currentImageUrl.split('/').pop() || 'current-image'
          mediaFiles = [{
            filename,
            url: currentImageUrl,
            original_name: filename
            // אין ID כי זה תמונה נוכחית ולא מהרשימה של השרת
          }, ...mediaFiles]
        }
      }
      
      if (append) {
        setLibraryFiles(prev => [...prev, ...mediaFiles])
      } else {
        setLibraryFiles(mediaFiles)
      }
      
      setLibraryPagination(result.pagination)
      setLibraryPage(page)
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'שגיאה בטעינת ספריית המדיה')
    } finally {
      setLibraryLoading(false)
    }
  }, [storeSlug, type, currentImageUrl])

  // טעינה אוטומטית כשעוברים לטאב ספריית מדיה או כשיש תמונה נוכחית
  useEffect(() => {
    if (activeTab === 'library' && !libraryLoading) {
      // טען מחדש אם אין קבצים או אם יש תמונה נוכחית שצריכה להופיע
      if (libraryFiles.length === 0 || (currentImageUrl && !libraryFiles.some(file => file.url === currentImageUrl))) {
        loadLibrary(1)
      }
    }
  }, [activeTab, loadLibrary, libraryFiles.length, libraryLoading, currentImageUrl, libraryFiles])

  const getAcceptString = () => {
    if (type === 'image') return 'image/*'
    if (type === 'video') return 'video/mp4'
    return accept
  }

  const getUploadText = () => {
    if (type === 'image') return 'תמונות'
    if (type === 'video') return 'סרטונים'
    return 'קבצי מדיה'
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] max-h-[600px] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'upload' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} className="inline-block ml-2" />
            העלאה חדשה
          </button>
          <button
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === 'library' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
            onClick={() => setActiveTab('library')}
          >
            <ImageIcon size={16} className="inline-block ml-2" />
            ספריית מדיה
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'upload' && (
            <div className="h-full flex flex-col">
              {/* תמונות שהועלו - למעלה */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h3 className="font-medium text-green-600">✓ קבצים זמינים ({uploadedFiles.length})</h3>
                  <p className="text-xs text-zinc-600 bg-blue-50 p-2 rounded border-r-2 border-blue-400">
                    💡 העבר עכבר ולחץ ✓ לבחירה
                  </p>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[150px] overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <MediaItem
                        key={`${file.filename}-${index}`}
                        file={file}
                        onSelect={() => handleSelect(file)}
                        onRemove={() => removeFile(index)}
                        showRemove={true}
                        isSelected={currentImageUrl === file.url}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* חיווי העלאה */}
              {isUploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="font-medium">מעלה קבצים...</span>
                  </div>
                  <p className="text-sm text-blue-500 mt-1">אנא המתן, הקבצים בהעלאה</p>
                </div>
              )}

              {/* שגיאות */}
              {error && (
                <div className="mb-4">
                  <UploadError 
                    error={error} 
                    onDismiss={() => setError(null)} 
                  />
                </div>
              )}
              
              {/* אזור העלאה - ממורכז או קטן */}
              {uploadedFiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <MediaUploader
                      storeSlug={storeSlug}
                      variant="dropzone"
                      multiple={true}
                      maxFiles={10}
                      accept={getAcceptString()}
                      onUpload={handleUpload}
                      onError={handleError}
                      onUploadStart={handleUploadStart}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-auto">
                  <MediaUploader
                    storeSlug={storeSlug}
                    variant="button"
                    multiple={true}
                    maxFiles={10}
                    accept={getAcceptString()}
                    onUpload={handleUpload}
                    onError={handleError}
                    onUploadStart={handleUploadStart}
                    className="w-full"
                  >
                    <div className="border-2 border-dashed border-zinc-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <Upload size={20} className="mx-auto mb-2 text-zinc-400" />
                      <p className="text-sm text-zinc-600">העלה עוד קבצים</p>
                    </div>
                  </MediaUploader>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* כותרת וכפתור רענון */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">ספריית המדיה</h3>
                  {libraryFiles.length > 0 && (
                    <span className="text-sm text-zinc-600">
                      {libraryFiles.length} קבצים
                      {libraryPagination?.total_count && ` (מתוך ${libraryPagination.total_count})`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => loadLibrary(1)}
                  disabled={libraryLoading}
                  className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-zinc-50 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={libraryLoading ? 'animate-spin' : ''} />
                  רענן
                </button>
              </div>

              {/* שגיאות */}
              {libraryError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  ❌ {libraryError}
                </div>
              )}

              {/* טעינה ראשונית */}
              {libraryLoading && libraryFiles.length === 0 && (
                <div className="text-center py-8">
                  <RefreshCw size={32} className="mx-auto mb-3 animate-spin text-zinc-400" />
                  <p className="text-zinc-500">טוען ספריית מדיה...</p>
                </div>
              )}

              {/* תמונות מהשרת */}
              {!libraryLoading && libraryFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[300px] overflow-y-auto">
                    {libraryFiles.map((file, index) => (
                      <MediaItem
                        key={`library-${file.filename}-${index}`}
                        file={file}
                        onSelect={() => handleSelect(file)}
                        onDelete={() => deleteLibraryFile(file as any)}
                        showRemove={storeSlug !== 'demo' && !!storeSlug}
                        isSelected={currentImageUrl === file.url}
                        isDeleting={deletingFiles.has((file as any).id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* כפתור טען עוד - למטה */}
              {libraryFiles.length > 0 && libraryPagination?.has_more && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => loadLibrary(libraryPage + 1, true)}
                    disabled={libraryLoading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {libraryLoading ? 'טוען...' : 'טען עוד תמונות'}
                  </button>
                </div>
              )}

              {/* אין קבצים */}
              {!libraryLoading && libraryFiles.length === 0 && !libraryError && (
                <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-lg border border-dashed">
                  <ImageIcon size={48} className="mx-auto mb-3 text-zinc-400" />
                  {storeSlug === 'demo' || !storeSlug ? (
                    <>
                      <p className="font-medium">זוהי תצוגה מקדימה</p>
                      <p className="text-sm">בחנות אמיתית כאן תופיע ספריית המדיה שלך</p>
                      <p className="text-xs mt-2 text-blue-600">לעת עתה השתמש בלשונית "העלאה חדשה"</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">ספריית המדיה ריקה</p>
                      <p className="text-sm">העלה תמונות בלשונית "העלאה חדשה" כדי שיופיעו כאן</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-zinc-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface MediaItemProps {
  file: UploadedFile
  onSelect: () => void
  onRemove?: () => void
  onDelete?: () => void
  showRemove?: boolean
  isSelected?: boolean
  isDeleting?: boolean
}

function MediaItem({ file, onSelect, onRemove, onDelete, showRemove = false, isSelected = false, isDeleting = false }: MediaItemProps) {
  const isVideo = file.filename.toLowerCase().endsWith('.mp4')

  return (
    <div className={`relative group border-2 rounded-lg overflow-hidden bg-zinc-50 hover:border-blue-400 transition-all ${isSelected ? 'border-green-500 bg-green-50' : ''} ${isDeleting ? 'opacity-50' : ''}`}>
      <div className="aspect-square w-full h-20 flex items-center justify-center">
        {isVideo ? (
          <div className="flex flex-col items-center justify-center text-zinc-400 p-3">
            <Video size={32} />
            <span className="text-xs mt-2 text-center truncate max-w-full">{file.original_name}</span>
          </div>
        ) : (
          <img 
            src={file.url} 
            alt={file.original_name}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="flex flex-col items-center justify-center text-zinc-400 p-3 h-full">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span class="text-xs mt-2 text-center truncate">${file.original_name}</span>
                  </div>
                `
              }
            }}
          />
        )}
      </div>

      {/* spinner למחיקה */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
          <RefreshCw size={16} className="animate-spin text-red-500" />
        </div>
      )}

      {/* כפתורי פעולה */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          disabled={isDeleting}
          className="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-50 hover:text-blue-600 shadow-lg border transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
        >
          {isDeleting ? 'מוחק...' : '✓ בחר'}
        </button>
        
        {/* כפתור מחיקה מהשרת - אייקון פח זבל */}
        {showRemove && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={isDeleting}
            className="bg-white text-red-600 w-6 h-6 rounded-full hover:bg-red-50 hover:text-red-700 flex items-center justify-center shadow-lg border transition-all duration-200 transform hover:scale-105 text-xs disabled:opacity-50"
            title="מחק קובץ מהשרת לצמיתות"
          >
            <Trash2 size={12} />
          </button>
        )}
        
        {/* כפתור מחיקה רגילה (לקבצים מועלים) */}
        {showRemove && onRemove && !onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="bg-white text-red-600 w-6 h-6 rounded-full hover:bg-red-50 hover:text-red-700 flex items-center justify-center shadow-lg border transition-all duration-200 transform hover:scale-105 text-xs"
            title="הסר קובץ מהרשימה"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// Hook לשימוש קל במודל מדיה
export function useMediaModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [config, setConfig] = useState<{
    onSelect: (file: UploadedFile) => void
    storeSlug: string
    accept?: string
    title?: string
    type?: 'image' | 'video' | 'all'
    currentImageUrl?: string
  } | null>(null)

  const openModal = useCallback((options: {
    onSelect: (file: UploadedFile) => void
    storeSlug: string
    accept?: string
    title?: string
    type?: 'image' | 'video' | 'all'
    currentImageUrl?: string
  }) => {
    setConfig(options)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setConfig(null)
  }, [])

  const Modal = useCallback(() => {
    if (!config) return null
    
    return (
      <MediaModal
        isOpen={isOpen}
        onClose={closeModal}
        onSelect={config.onSelect}
        storeSlug={config.storeSlug}
        accept={config.accept}
        title={config.title}
        type={config.type}
        initialFiles={uploadedFiles}
        onFilesChange={setUploadedFiles}
        currentImageUrl={config.currentImageUrl}
      />
    )
  }, [isOpen, closeModal, config, uploadedFiles])

  return {
    openModal,
    closeModal,
    Modal
  }
}