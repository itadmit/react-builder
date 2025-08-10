import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react'

export interface UploadedFile {
  id?: number // ID מהשרת למחיקה
  filename: string
  url: string
  original_name: string
}

export interface MediaUploaderProps {
  storeSlug: string
  onUpload: (files: UploadedFile[]) => void
  onError?: (error: string) => void
  onUploadStart?: () => void
  multiple?: boolean
  accept?: string
  maxFiles?: number
  className?: string
  children?: React.ReactNode
  variant?: 'button' | 'dropzone' | 'compact'
}

export interface UploadResult {
  success: boolean
  data?: UploadedFile[]
  error?: string
  errors?: Array<{ file: string; error: string }>
  total_uploaded?: number
  total_errors?: number
}

export function MediaUploader({
  storeSlug,
  onUpload,
  onError,
  onUploadStart,
  multiple = false,
  accept = 'image/*,video/mp4',
  maxFiles = 10,
  className = '',
  children,
  variant = 'button'
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    if (!storeSlug) {
      const error = 'חסר slug של החנות'
      onError?.(error)
      return
    }

    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    if (fileArray.length > maxFiles) {
      const error = `ניתן להעלות עד ${maxFiles} קבצים בו זמנית`
      onError?.(error)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadingFiles(fileArray.map(f => f.name))
    onUploadStart?.()

    try {
      const formData = new FormData()
      
      if (fileArray.length === 1) {
        // קובץ יחיד
        formData.append('images', fileArray[0])
      } else {
        // מספר קבצים
        fileArray.forEach(file => {
          formData.append('images[]', file)
        })
      }

      // יצירת XMLHttpRequest עם progress tracking
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // מגביל ל-90% כי השרת עדיין מעבד
            const progress = Math.round((e.loaded / e.total) * 90)
            setUploadProgress(progress)
          }
        })
        
        xhr.onload = () => {
          // מגיע ל-95% כשההעלאה הסתיימה אבל השרת עדיין מעבד
          setUploadProgress(95)
          
          if (xhr.status >= 200 && xhr.status < 300) {
            // מגיע ל-100% כשהכל הסתיים
            setUploadProgress(100)
            
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
                const [key, value] = line.split(': ')
                if (key && value) headers[key] = value
                return headers
              }, {} as Record<string, string>))
            })
            resolve(response)
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
          }
        }
        
        xhr.onerror = () => reject(new Error('שגיאת רשת'))
        xhr.ontimeout = () => reject(new Error('זמן קצוב'))
        
        xhr.open('POST', `/api/stores/${storeSlug}/upload`)
        xhr.send(formData)
      })

      const result: UploadResult = await response.json()

      if (result.success && result.data) {
        onUpload(result.data)
        
        // הצגת שגיאות חלקיות אם יש
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(err => `${err.file}: ${err.error}`).join('\n')
          onError?.(`הועלו ${result.total_uploaded} קבצים, אך היו שגיאות:\n${errorMessages}`)
        }
      } else {
        throw new Error(result.error || 'שגיאה בהעלאת הקבצים')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה בהעלאה'
      onError?.(errorMessage)
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadingFiles([])
    }
  }, [storeSlug, onUpload, onError, maxFiles])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
    // איפוס הinput כדי לאפשר העלאה של אותו קובץ שוב
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [uploadFiles])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
  }, [uploadFiles])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={openFileDialog}
          disabled={isUploading}
          className="btn btn-ghost btn-sm flex items-center gap-1"
        >
          {isUploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {isUploading ? 'מעלה...' : 'העלה'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  if (variant === 'dropzone') {
    return (
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-zinc-300 hover:border-zinc-400'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          ${className}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              {/* אנימציית shimmer */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded-lg animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-shimmer"></div>
                </div>
                <Upload size={24} className="absolute inset-0 m-auto text-blue-500" />
              </div>
              
              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-sm text-blue-600 mb-1">
                  <span>
                    {uploadProgress < 90 ? 'מעלה קבצים...' : 
                     uploadProgress < 95 ? 'מעבד תמונות...' : 
                     uploadProgress < 100 ? 'כמעט סיים...' : 'הושלם!'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {/* אפקט shimmer על ה-progress bar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
                  </div>
                </div>
                {uploadingFiles.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {uploadingFiles.length === 1 
                      ? `מעלה: ${uploadingFiles[0]}`
                      : `מעלה ${uploadingFiles.length} קבצים`
                    }
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-zinc-400">
              <ImageIcon size={24} />
              <Video size={24} />
              <Upload size={24} />
            </div>
          )}
          
          {!isUploading && (
            <div className="text-sm">
              <div className="font-medium text-zinc-700">
                {multiple ? 'גרור קבצים לכאן או לחץ לבחירה' : 'גרור קובץ לכאן או לחץ לבחירה'}
              </div>
              <div className="text-zinc-500 mt-1">
                תמונות: JPG, PNG, WebP • וידאו: MP4
              </div>
              {multiple && (
                <div className="text-zinc-500">
                  עד {maxFiles} קבצים
                </div>
              )}
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  // variant === 'button' (default)
  return (
    <div className={`inline-flex ${className}`}>
      <button
        type="button"
        onClick={openFileDialog}
        disabled={isUploading}
        className="btn btn-primary flex items-center gap-2"
      >
        {isUploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Upload size={16} />
        )}
        {isUploading ? 'מעלה...' : (children || 'העלה תמונה')}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

// Hook נוח לשימוש בהעלאת תמונות
export function useMediaUpload(storeSlug: string) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadSingleFile = useCallback(async (file: File): Promise<UploadedFile | null> => {
    if (!storeSlug) {
      throw new Error('חסר slug של החנות')
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('images', file)

      const response = await fetch(`/api/stores/${storeSlug}/upload`, {
        method: 'POST',
        body: formData
      })

      const result: UploadResult = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        return result.data[0]
      } else {
        throw new Error(result.error || 'שגיאה בהעלאת הקובץ')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      setError(errorMessage)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [storeSlug])

  const uploadMultipleFiles = useCallback(async (files: File[]): Promise<UploadedFile[]> => {
    if (!storeSlug) {
      throw new Error('חסר slug של החנות')
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('images[]', file)
      })

      const response = await fetch(`/api/stores/${storeSlug}/upload`, {
        method: 'POST',
        body: formData
      })

      const result: UploadResult = await response.json()

      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'שגיאה בהעלאת הקבצים')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה'
      setError(errorMessage)
      throw err
    } finally {
      setIsUploading(false)
    }
  }, [storeSlug])

  return {
    uploadSingleFile,
    uploadMultipleFiles,
    isUploading,
    error,
    clearError: () => setError(null)
  }
}

// קומפוננטה פשוטה להצגת שגיאות
export function UploadError({ error, onDismiss }: { error: string; onDismiss?: () => void }) {
  if (!error) return null

  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        {error.split('\n').map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 hover:text-red-900">
          <X size={16} />
        </button>
      )}
    </div>
  )
}