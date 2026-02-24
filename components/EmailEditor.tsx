import React, { useState, useRef, useEffect } from 'react'
import { tokenizeForm } from '../utils/tokenizeForm'

const LS_KEY = 'email_notifications_v1'

function loadTokens(){
  return [
    'borrowerName','entitasId','borrowerPhone','needType','company_csv','company_count','outDate','useDate','returnDate','productDetailsText','pickupMethod','note','approvalAgreementFlag','lainnya','loan_days','is_long_loan','useDate_ts',
    // new unified needDetails tokens
    'needDetails.namaCustomer','needDetails.namaPerusahaan','needDetails.alamat','needDetails.telepon','needDetails.alasan','needDetails.lainnya',
    // backward-compatible tokens
    'demo.namaCustomer','demo.namaPerusahaan','demo.alamat','demo.telepon','backup.namaCustomer','backup.namaPerusahaan','backup.alamat','backup.telepon','backup.alasan'
  ]
}

export default function EmailEditor({ initial, onSave }:{ initial?: any, onSave?: (data:any)=>void }){
  const [step, setStep] = useState<number>(1)
  const [name, setName] = useState<string>(initial?.name || '')
  const [senderName, setSenderName] = useState<string>(initial?.senderName || '')
  const [senderEmail, setSenderEmail] = useState<string>(initial?.senderEmail || '')
  const [replyTo, setReplyTo] = useState<string>(initial?.replyTo || '')
  const [subject, setSubject] = useState<string>(initial?.subject || '')
  const [to, setTo] = useState<string>(initial?.to || '')
  const [cc, setCc] = useState<string>(initial?.cc || '')
  const [bcc, setBcc] = useState<string>(initial?.bcc || '')
  const [pdfOptions, setPdfOptions] = useState<any>(initial?.pdfOptions || { includeForm:false })

  const editorRef = useRef<HTMLDivElement|null>(null)
  const [showTokens, setShowTokens] = useState<boolean>(false)
  const tokens = loadTokens()

  useEffect(()=>{
    if(initial && initial.body && editorRef.current){
      editorRef.current.innerHTML = initial.body
    }
  },[initial])

  function getBody(){ return editorRef.current?.innerHTML || '' }

  function insertToken(token: string){
    const el = editorRef.current
    if(!el) return
    el.focus()
    const sel = window.getSelection()
    if(!sel || sel.rangeCount===0) return
    const range = sel.getRangeAt(0)
    range.deleteContents()
    const node = document.createTextNode(`{{${token}}}`)
    range.insertNode(node)
    range.setStartAfter(node)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function next(){ if(step < 3) setStep(s=>s+1) }
  function prev(){ if(step > 1) setStep(s=>s-1) }

  function save(){
    const data = { name, senderName, senderEmail, replyTo, subject, body: getBody(), to, cc, bcc, pdfOptions }
    try{
      const raw = localStorage.getItem(LS_KEY)
      const all = raw ? JSON.parse(raw) : []
      all.unshift(data)
      localStorage.setItem(LS_KEY, JSON.stringify(all))
    }catch(e){ console.error(e) }
    onSave && onSave(data)
  }

  function renderPreview(){
    const tokensMap = tokenizeForm({ borrowerName:'Budi Santoso', entitasId:'SGP', company:['IVP Richard'], useDate:'2025-11-02', returnDate:'2025-11-05' } as any)
    let html = getBody()
    Object.keys(tokensMap).forEach(k=>{
      const re = new RegExp(`{{${k}}}`,'g')
      html = html.replace(re, tokensMap[k])
    })
    return html
  }

  return (
    <div>
      <div className="stepper">
        <div className={`step ${step===1? 'active':''}`}><div className="num">01</div><div className="label">Message</div></div>
        <div className={`step ${step===2? 'active':''}`}><div className="num">02</div><div className="label">Recipients</div></div>
        <div className={`step ${step===3? 'active':''}`}><div className="num">03</div><div className="label">PDF</div></div>
      </div>

      {step===1 && (
        <div className="card">
          <h3>Notification Name</h3>
          <input value={name} onChange={e=>setName(e.target.value)} />
          <p className="hint">A brief description of the notification, which appears in the list of notifications.</p>

          <div className="grid">
            <div className="form-group">
              <label>Sender&apos;s Name</label>
              <input value={senderName} onChange={e=>setSenderName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Sender&apos;s Email Address</label>
              <input value={senderEmail} onChange={e=>setSenderEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Reply-to Email Address</label>
              <input value={replyTo} onChange={e=>setReplyTo(e.target.value)} />
            </div>
          </div>

          <h4>The Message</h4>
          <div className="form-group">
            <label>Email Subject</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Email Body</label>
            <div className="editor-toolbar">
              <button onClick={()=>document.execCommand('bold')} type="button">B</button>
              <button onClick={()=>document.execCommand('italic')} type="button">I</button>
              <button onClick={()=>document.execCommand('insertUnorderedList')} type="button">•</button>
              <div style={{marginLeft:8}}>
                <button className="btn-plain" onClick={()=>setShowTokens(s=>!s)}>Show Tokens</button>
              </div>
            </div>

            <div ref={editorRef} contentEditable={true} className="wysiwyg" suppressContentEditableWarning>
              {initial?.body || `Enter email body here. You can also use HTML tags and {{borrowerName}}`}
            </div>

            {showTokens && (
              <div style={{marginTop:8,padding:8,border:'1px dashed var(--border-color)',borderRadius:8,background:'#fff'}}>
                <strong>Available Tokens</strong>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                  {tokens.map(t=> (
                    <button key={t} className="btn-plain" onClick={()=>insertToken(t)}>{t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <button onClick={()=>{ const html = renderPreview(); const w = window.open('about:blank'); if(w) w.document.write(html) }} className="btn-plain">Preview</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={next} className="btn-plain">Next</button>
              <button onClick={save} className="btn-accent">Save</button>
            </div>
          </div>
        </div>
      )}

      {step===2 && (
        <div className="card">
          <h3>Recipients</h3>
          <div className="grid">
            <div className="form-group">
              <label>To (comma separated)</label>
              <input value={to} onChange={e=>setTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Cc</label>
              <input value={cc} onChange={e=>setCc(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bcc</label>
              <input value={bcc} onChange={e=>setBcc(e.target.value)} />
            </div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
            <button onClick={prev} className="btn-plain">Back</button>
            <div>
              <button onClick={prev} className="btn-plain">Previous</button>
              <button onClick={next} className="btn-accent">Next</button>
            </div>
          </div>
        </div>
      )}

      {step===3 && (
        <div className="card">
          <h3>PDF Options</h3>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <label><input type="checkbox" checked={!!pdfOptions.includeForm} onChange={e=>setPdfOptions({...pdfOptions, includeForm: e.target.checked})} /> Include form responses in PDF</label>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'space-between',marginTop:12}}>
            <button onClick={prev} className="btn-plain">Back</button>
            <div>
              <button onClick={save} className="btn-accent">Save & Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
