'use client';
import {useEffect, useRef, useState} from 'react';
import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import {isPlanDate, endOfWeek} from '@/lib/weeklyPlans';

const months=['Қаңтар','Ақпан','Наурыз','Сәуір','Мамыр','Маусым','Шілде','Тамыз','Қыркүйек','Қазан','Қараша','Желтоқсан'];
const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const display=value=>isPlanDate(value)?value.split('-').reverse().join('.'):'Күнді таңдаңыз';

export default function PlanDatePicker({start,end,onChange}) {
  const [open,setOpen]=useState(false);
  const [target,setTarget]=useState('start');
  const [month,setMonth]=useState(new Date());
  const root=useRef(null), trigger=useRef(null), calendar=useRef(null);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  useEffect(()=>{
    if(!open)return;
    calendar.current?.focus();
    const outside=e=>{if(!root.current?.contains(e.target))setOpen(false);};
    const escape=e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[open]);
  const pick=value=>{
    if(target==='start'){onChange({start:value,end:endOfWeek(value)});close();}
    else {onChange({end:value});close();}
  };
  const year=month.getFullYear(), m=month.getMonth();
  const offset=(new Date(year,m,1).getDay()+6)%7;
  const count=new Date(year,m+1,0).getDate();
  return <div ref={root} className="plan-date-picker">
    <span className="plan-date-label">Апта аралығы</span>
    <button ref={trigger} type="button" className="plan-date-trigger" aria-expanded={open} aria-haspopup="dialog" onClick={()=>{setTarget('start');setMonth(isPlanDate(start)?new Date(start+'T12:00:00'):new Date());setOpen(!open);}}><CalendarDays size={19}/><span>{isPlanDate(start)&&isPlanDate(end)?`${display(start)} — ${display(end)}`:'Күндерді таңдау'}</span></button>
    <p>Басталу күнін таңдаңыз — аяқталуы 7 күнге есептеледі.</p>
    {open&&<div className="plan-calendar" role="dialog" aria-label="Апта күндерін таңдау" ref={calendar} tabIndex={-1}>
      <div className="plan-date-tabs">{[['start','Басталуы',start],['end','Аяқталуы',end]].map(([key,label,value])=><button type="button" key={key} aria-pressed={target===key} onClick={()=>{setTarget(key);if(isPlanDate(value))setMonth(new Date(value+'T12:00:00'));}}><small>{label}</small>{display(value)}</button>)}</div>
      <div className="plan-calendar-month"><button type="button" aria-label="Алдыңғы ай" disabled={year===2000&&m===0} onClick={()=>setMonth(new Date(year,m-1,1))}><ChevronLeft size={18}/></button><select aria-label="Ай" value={m} onChange={e=>setMonth(new Date(year,Number(e.target.value),1))}>{months.map((name,i)=><option key={name} value={i}>{name}</option>)}</select><select aria-label="Жыл" value={year} onChange={e=>setMonth(new Date(Number(e.target.value),m,1))}>{Array.from({length:101},(_,i)=>2000+i).map(y=><option key={y}>{y}</option>)}</select><button type="button" aria-label="Келесі ай" disabled={year===2100&&m===11} onClick={()=>setMonth(new Date(year,m+1,1))}><ChevronRight size={18}/></button></div>
      <div className="plan-calendar-grid">{['Дс','Сс','Ср','Бс','Жм','Сб','Жс'].map(d=><span key={d}>{d}</span>)}{Array.from({length:offset},(_,i)=><span key={`blank${i}`}/>)}{Array.from({length:count},(_,i)=>{
        const value=iso(new Date(year,m,i+1)), selected=value===start||value===end;
        return <button type="button" key={value} aria-label={display(value)} aria-pressed={selected} aria-current={value===iso(new Date())?'date':undefined} className={selected?'selected':isPlanDate(start)&&isPlanDate(end)&&value>start&&value<end?'in-range':''} disabled={target==='end'&&(!isPlanDate(start)||value<start)} onClick={()=>pick(value)}>{i+1}</button>;
      })}</div>
      <div className="plan-calendar-footer"><button type="button" onClick={()=>{const now=new Date();now.setDate(now.getDate()-((now.getDay()+6)%7));const value=iso(now);onChange({start:value,end:endOfWeek(value)});close();}}>Осы апта</button><button type="button" onClick={close}>Жабу</button></div>
    </div>}
  </div>;
}
