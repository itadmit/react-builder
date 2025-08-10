import React, { useState } from 'react'
import { MediaUploader, UploadError, useMediaUpload, UploadedFile } from '../controls/Controls'
import { Image as ImageIcon, Video, Trash2 } from 'lucide-react'

// דוגמה לשימוש בקומפוננטת העלאת התמונות
export function MediaPickerExample() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const storeSlug = 'demo-store' // בפועל יגיע מה-store

  const handleUpload = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files])
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">דוגמה להעלאת תמונות</h2>
      
      {/* דוגמה 1: כפתור פשוט */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">כפתור העלאה פשוט</h3>
        <MediaUploader
          storeSlug={storeSlug}
          variant="button"
          onUpload={handleUpload}
          onError={handleError}
        >
          העלה תמונה
        </MediaUploader>
      </div>

      {/* דוגמה 2: Dropzone */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Dropzone - גרור ושחרר</h3>
        <MediaUploader
          storeSlug={storeSlug}
          variant="dropzone"
          multiple={true}
          maxFiles={5}
          onUpload={handleUpload}
          onError={handleError}
        />
      </div>

      {/* דוגמה 3: כפתור קומפקטי */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">כפתור קומפקטי</h3>
        <div className="flex items-center gap-3">
          <span>הוסף לגלריה:</span>
          <MediaUploader
            storeSlug={storeSlug}
            variant="compact"
            multiple={true}
            onUpload={handleUpload}
            onError={handleError}
          />
        </div>
      </div>

      {/* הצגת שגיאות */}
      {error && (
        <UploadError 
          error={error} 
          onDismiss={() => setError(null)} 
        />
      )}

      {/* הצגת תמונות שהועלו */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">תמונות שהועלו ({uploadedFiles.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={`${file.filename}-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100">
                  {file.filename.endsWith('.mp4') ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={32} className="text-zinc-400" />
                    </div>
                  ) : (
                    <img 
                      src={file.url} 
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          const icon = document.createElement('div')
                          icon.className = 'w-full h-full flex items-center justify-center'
                          icon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>'
                          parent.appendChild(icon)
                        }
                      }}
                    />
                  )}
                </div>
                
                {/* כפתור מחיקה */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="מחק תמונה"
                >
                  <Trash2 size={14} />
                </button>
                
                {/* מידע על הקובץ */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="truncate">{file.original_name}</div>
                  <div className="text-zinc-300">{file.filename}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// דוגמה לשימוש עם Hook
export function MediaPickerWithHook() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const { uploadSingleFile, uploadMultipleFiles, isUploading, error, clearError } = useMediaUpload('demo-store')

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList || fileList.length === 0) return

    try {
      if (fileList.length === 1) {
        const result = await uploadSingleFile(fileList[0])
        if (result) {
          setFiles(prev => [...prev, result])
        }
      } else {
        const results = await uploadMultipleFiles(Array.from(fileList))
        setFiles(prev => [...prev, ...results])
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold">שימוש עם Hook</h3>
      
      <div className="flex items-center gap-3">
        <input
          type="file"
          multiple
          accept="image/*,video/mp4"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="text-sm"
        />
        {isUploading && <span className="text-sm text-blue-600">מעלה...</span>}
      </div>

      {error && (
        <UploadError error={error} onDismiss={clearError} />
      )}

      {files.length > 0 && (
        <div className="text-sm text-zinc-600">
          הועלו {files.length} קבצים
        </div>
      )}
    </div>
  )
}