import React, { useEffect } from 'react'

type ToastShape = {
  type: 'success' | 'error'
  title: string
  message?: string
} | null

export default function Notification({ toast, setToast }: { toast: ToastShape, setToast: (t: ToastShape) => void }){
  useEffect(()=>{
    if(!toast) return
    const id = setTimeout(()=> setToast(null), 4000)
    return ()=> clearTimeout(id)
  },[toast, setToast])

  if(!toast) return null

  return (
    <div style={{position:'fixed',right:20,top:20,zIndex:1000}}>
      <div style={{background: toast.type==='success' ? 'linear-gradient(90deg,#16a34a,#059669)' : 'linear-gradient(90deg,#ef4444,#dc2626)', color:'white', padding:'12px 16px', borderRadius:10, boxShadow:'0 8px 30px rgba(2,6,23,0.12)'}}>
        <strong style={{display:'block',fontWeight:700}}>{toast.title}</strong>
        <div style={{fontSize:13,opacity:0.95}}>{toast.message}</div>
      </div>
    </div>
  )
}
