import { X } from 'lucide-react'
import { SetoranForm } from './SetoranForm'

export function EditSetoranModal({ 
  isOpen, 
  onClose, 
  initialData,
  onSave, 
  isUstadz 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  initialData: any, 
  onSave: (payload: any) => Promise<any>,
  isUstadz: boolean 
}) {

  const handleSave = async (payload: any) => {
    const res = await onSave(payload)
    if (res.success) {
      onClose()
    }
    return res
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800">Edit Setoran</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
           {initialData && (
             <SetoranForm 
               mode="edit" 
               initialData={initialData} 
               isUstadz={isUstadz}
               onSubmit={handleSave}
               onCancel={onClose}
             />
           )}
        </div>
      </div>
    </div>
  )
}
