import React, { useEffect, useRef, useState } from 'react'

export default function OptionsMenu({
  onAIStudio,
  onResend,
  onImport,
  onLimitResponses,
  onSettings,
  onTroubleshoot
}: {
  onAIStudio?: ()=>void,
  onResend?: ()=>void,
  onImport?: (file: File)=>void,
  onLimitResponses?: ()=>void,
  onSettings?: ()=>void,
  onTroubleshoot?: ()=>void,
}){
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement|null>(null)
  const inputRef = useRef<HTMLInputElement|null>(null)

  useEffect(()=>{
    function onDoc(e: MouseEvent){ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return ()=> document.removeEventListener('click', onDoc)
  }, [])

  function triggerImport(){ if(inputRef.current) inputRef.current.click() }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files && e.target.files[0]
    if(f && onImport) onImport(f)
    // reset
    if(inputRef.current) inputRef.current.value = ''
    setOpen(false)
  }

  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button className="btn-ghost" onClick={()=>setOpen(s=>!s)}>Options ▾</button>
      {open && (
        <div style={{position:'absolute',right:0,top:'110%',background:'white',border:'1px solid rgba(16,24,40,0.06)',boxShadow:'0 8px 24px rgba(2,6,23,0.08)',borderRadius:8,width:220,zIndex:60}}>
          <div style={{padding:8,borderBottom:'1px solid rgba(16,24,40,0.03)'}}>
            <button style={{display:'flex',alignItems:'center',gap:8,width:'100%'}} onClick={()=>{ onAIStudio && onAIStudio(); setOpen(false) }}>
              <strong>AI Studio</strong>
              <span style={{marginLeft:'auto',background:'#10b981',color:'white',fontSize:11,padding:'2px 6px',borderRadius:8}}>New</span>
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',padding:8,gap:6}}>
            <button className="btn-plain" onClick={()=>{ onResend && onResend(); setOpen(false) }}>Resend notifications</button>
            <button className="btn-plain" onClick={()=>{ triggerImport() }}>Import an existing rule</button>
            <button className="btn-plain" onClick={()=>{ onLimitResponses && onLimitResponses(); setOpen(false) }}>Limit Form Responses</button>
            <button className="btn-plain" onClick={()=>{ onSettings && onSettings(); setOpen(false) }}>Form Settings</button>
            <button className="btn-plain" onClick={()=>{ onTroubleshoot && onTroubleshoot(); setOpen(false) }}>Form Troubleshooting</button>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="application/json" style={{display:'none'}} onChange={handleFile} />
    </div>
  )
}
