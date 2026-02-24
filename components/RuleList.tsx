import React from 'react'
import { NotificationRule } from '../types/rules'

export default function RuleList({ rules, onEdit, onDelete, onToggle, onTest } : {
  rules: NotificationRule[],
  onEdit: (r: NotificationRule)=>void,
  onDelete: (id:string)=>void,
  onToggle: (id:string)=>void,
  onTest: (r: NotificationRule)=>void
}){
  if(!rules || rules.length===0) return <div className="rule-card">No rules defined yet</div>
  return (
    <div style={{display:'grid',gap:12}}>
      {rules.map(r=> (
        <div key={r.id} className="rule-card" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div className="title">{r.name} {r.enabled? <span style={{color:'green'}}>●</span> : <span style={{color:'#999'}}>●</span>}</div>
            <div className="meta">{r.conditions.map(c=> `${c.field} ${c.operator} ${c.value}`).join(' AND ')}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn-plain" onClick={()=>onTest(r)}>Test</button>
            <button className="btn-plain" onClick={()=>onToggle(r.id)}>{r.enabled? 'Disable' : 'Enable'}</button>
            <button className="btn-plain" onClick={()=>onEdit(r)}>Edit</button>
            <button className="btn-plain" onClick={()=>onDelete(r.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
