import React, { useEffect, useRef, useState } from 'react'
import { NotificationRule } from '../types/rules'

const CHANNELS = [
  {key:'email', label:'Email Notification'},
  {key:'slack', label:'Slack Notification'},
  {key:'discord', label:'Discord Notification'},
  {key:'google_chat', label:'Google Chat Notification'},
  {key:'sms', label:'SMS Notification'},
  {key:'webhook', label:'Webhook Notification'},
  {key:'push', label:'Push Notification'},
]

export default function CreateMenu({ onCreate } : { onCreate: (rule: any, channelKey?: string)=>void }){
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement|null>(null)
  useEffect(()=>{
    function onDoc(e: MouseEvent){ if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', onDoc)
    return ()=> document.removeEventListener('click', onDoc)
  }, [])

  function makeRuleFor(channelKey: string, label: string): NotificationRule{
    const now = new Date().toISOString()
    const id = `rule_${Date.now()}`
    const template = `[[${label}]] Notification for {{borrowerName}} (Entitas: {{entitasId}})`
    return { id, name: `New ${label}`, enabled: true, conditions: [], template, createdAt: now }
  }

  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button className="btn-accent" onClick={()=>setOpen(s=>!s)}>Create ▾</button>
      {open && (
        <div style={{position:'absolute',right:0,top:'110%',background:'white',border:'1px solid rgba(16,24,40,0.06)',boxShadow:'0 8px 24px rgba(2,6,23,0.08)',borderRadius:8,width:240,zIndex:60}}>
          <div style={{padding:8,display:'flex',flexDirection:'column',gap:6}}>
            {CHANNELS.map(c=> (
              <button key={c.key} className="btn-plain" onClick={()=>{ onCreate(makeRuleFor(c.key,c.label), c.key); setOpen(false) }} style={{display:'flex',alignItems:'center',gap:10}}>
                {/* icon placeholder */}
                <span style={{width:28,height:20,display:'inline-flex',alignItems:'center',justifyContent:'center',color:'var(--accent)'}}>●</span>
                <span style={{flex:1,textAlign:'left'}}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
