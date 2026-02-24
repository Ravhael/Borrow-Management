import React, { useState } from 'react'
import { NotificationRule, Condition, Comparator } from '../types/rules'

const comparators: Comparator[] = ['equals','contains','gt','lt','gte','lte']

export default function RuleEditor({
  initial,
  onSave,
  onCancel
}: {
  initial?: NotificationRule
  onSave: (r: NotificationRule) => void
  onCancel?: ()=>void
}){
  const [name, setName] = useState(initial?.name||'')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [template, setTemplate] = useState(initial?.template||'')
  const [conditions, setConditions] = useState<Condition[]>(initial?.conditions || [{field:'', operator:'equals', value:''}])

  function updateCondition(i: number, patch: Partial<Condition>){
    const copy = [...conditions]
    copy[i] = {...copy[i], ...patch}
    setConditions(copy)
  }

  function addCondition(){ setConditions([...conditions, {field:'', operator:'equals', value:''}]) }
  function removeCondition(i:number){ setConditions(conditions.filter((_,idx)=>idx!==i)) }

  function save(){
    const id = initial?.id || `rule_${Date.now()}`
    const now = new Date().toISOString()
    const rule: NotificationRule = { id, name, enabled, template, conditions, createdAt: initial?.createdAt||now, updatedAt: now }
    onSave(rule)
  }

  return (
    <div className="rule-editor-panel">
      <div className="form-group">
        <label>Nama Rule</label>
        <input value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} /> Enabled</label>
      </div>

      <div className="form-group">
        <label>Conditions (AND)</label>
        {conditions.map((c, i)=> (
          <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
            <input placeholder="field (token)" value={c.field} onChange={e=>updateCondition(i,{field:e.target.value})} style={{flex:2}} />
            <select value={c.operator} onChange={e=>updateCondition(i,{operator: e.target.value as Comparator})}>
              {comparators.map(x=> <option key={x} value={x}>{x}</option>)}
            </select>
            <input placeholder="value" value={c.value} onChange={e=>updateCondition(i,{value:e.target.value})} style={{flex:2}} />
            <button type="button" onClick={()=>removeCondition(i)} className="btn-plain">Remove</button>
          </div>
        ))}
        <button type="button" onClick={addCondition} className="btn-plain">Add Condition</button>
      </div>

      <div className="form-group">
        <label>Template (notification text)</label>
        <textarea value={template} onChange={e=>setTemplate(e.target.value)} placeholder="Gunakan token seperti {{borrowerName}}" />
      </div>

      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button onClick={onCancel} type="button" className="btn-plain">Cancel</button>
        <button onClick={save} type="button" className="btn-accent">Save Rule</button>
      </div>
    </div>
  )
}
