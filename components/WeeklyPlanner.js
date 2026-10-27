'use client';

import {useEffect, useMemo, useState} from 'react';
import {Download, Plus, Trash2, ChevronLeft, ChevronRight} from 'lucide-react';
import {PLAN_TEMPLATES, DAYS, defaultPlan, isPlanDate, buildPlanSvg} from '@/lib/weeklyPlans';
import {MATH_PLAN_TEMPLATES} from '@/lib/mathPlans';
import PlanDatePicker from './PlanDatePicker';
import OptionalTime from './OptionalTime';

export default function WeeklyPlanner({userId, syncState, groups, activeGid, selectGroup, onChange, notify, subject='informatics'}) {
  const templates=subject==='mathematics'?MATH_PLAN_TEMPLATES:PLAN_TEMPLATES;
  const firstWeek=templates[0].week;
  const lastWeek=templates[templates.length-1].week;
  const subjectName=subject==='mathematics'?'Математика':'Информатика';
  const [week,setWeek]=useState(subject==='mathematics'?0:1);
  const [source,setSource]=useState('');
  const [error,setError]=useState('');
  const [downloading,setDownloading]=useState(false);
  const [font,setFont]=useState(null);
  const group=groups.find(g=>g.id===activeGid);
  const plan=group?.weeklyPlans?.[subject]?.[week] || defaultPlan(week,templates);
  useEffect(()=>{try{const key=`plan-week:${subject}:${userId}:${activeGid}`;const stored=localStorage.getItem(key);const legacy=subject==='informatics'?localStorage.getItem(`plan-week:${userId}:${activeGid}`):null;const saved=Number(stored??legacy);setWeek((stored!==null||legacy!==null)&&Number.isInteger(saved)&&saved>=firstWeek&&saved<=lastWeek?saved:firstWeek);}catch{setWeek(firstWeek);}},[userId,activeGid,subject,firstWeek,lastWeek]);
  const chooseWeek=value=>{const next=typeof value==='function'?value(week):value;setWeek(next);try{localStorage.setItem(`plan-week:${subject}:${userId}:${activeGid}`,String(next));}catch{}};
  useEffect(()=>{
    let cancelled=false;
    const load=async path=>{const r=await fetch(path);if(!r.ok)throw new Error();const blob=await r.blob();return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});};
    Promise.all([load('/fonts/OpenSans.ttf'),load('/fonts/OpenSans-Italic.ttf')]).then(async ([data,italic])=>{
      const face=new FontFace('Plan Open Sans',`url(${data})`,{weight:'100 900'});
      const italicFace=new FontFace('Plan Open Sans',`url(${italic})`,{weight:'100 900',style:'italic'});
      await Promise.all([face.load(),italicFace.load()]);if(cancelled)return;document.fonts.add(face);document.fonts.add(italicFace);
      const ctx=document.createElement('canvas').getContext('2d');
      setFont({data,italic,measure:(text,bold=true,italic=false,size=7)=>{ctx.font=`${italic?'italic':'normal'} ${bold?700:400} ${size}px "Plan Open Sans"`;return ctx.measureText(text).width;}});
    }).catch(()=>{if(!cancelled)setError('Қаріп жүктелмеді. Бетті жаңартыңыз.');});
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    setSource('');setError('');
    const template=templates.find(item=>item.week===week);
    fetch(`/weekly-plans/${subject}/${template.file}.svg`,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error();return r.text();})
      .then(setSource).catch(e=>{if(e.name!=='AbortError')setError('Үлгі жүктелмеді. Бетті жаңартыңыз.');});
    return ()=>controller.abort();
  },[week,subject,templates]);
  const svg=useMemo(()=>font?buildPlanSvg(source,plan,font.data,font.measure,font.italic,week):'',[source,plan,font,week]);
  const overflow=svg.includes('data-text-overflow="true"');
  const update=patch=>onChange(group.id,week,{...plan,...patch},subject);
  const eventUpdate=(id,patch)=>update({events:plan.events.map(e=>e.id===id?{...e,...patch}:e)});
  async function download(){
    setDownloading(true);
    const url=URL.createObjectURL(new Blob([svg.replace('width="100%"','width="1506"').replace('height="auto"','height="1173"')],{type:'image/svg+xml;charset=utf-8'}));
    try {
      const img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
      const canvas=document.createElement('canvas');canvas.width=1506;canvas.height=1173;
      canvas.getContext('2d').drawImage(img,0,0,1506,1173);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw new Error();
      const png=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=png;a.download=`${subject}-week-${week}.png`;a.click();
      setTimeout(()=>URL.revokeObjectURL(png),1000);
    } catch {notify('Суретті жүктеу мүмкін болмады. Қайта көріңіз.');}
    finally{URL.revokeObjectURL(url);setDownloading(false);}
  }
  return <main className="weekly-planner">
    {!group ? <div className="planner-empty"><h1>Апталық жоспар</h1><p>Алдымен «Жұптық жұмыс» бөлімінде топ құрыңыз немесе топты таңдаңыз.</p></div> : <div className="planner-layout">
      <aside className="planner-controls">
        <label>Топ<select aria-label="Топ" value={activeGid} onChange={e=>selectGroup(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
        <section className="plan-week-picker" aria-label="Аптаны таңдау"><div className="plan-week-heading"><button aria-label="Алдыңғы апта" disabled={week===firstWeek} onClick={()=>chooseWeek(w=>w-1)}><ChevronLeft size={18}/></button><strong aria-live="polite">{week}-апта <span>/ {templates.length}</span></strong><button aria-label="Келесі апта" disabled={week===lastWeek} onClick={()=>chooseWeek(w=>w+1)}><ChevronRight size={18}/></button></div><div className="plan-week-grid">{templates.map(t=><button key={t.week} aria-label={`${t.week}-апта`} aria-pressed={week===t.week} onClick={()=>chooseWeek(t.week)}>{t.week}</button>)}</div></section>
        <PlanDatePicker key={`${activeGid}-${week}`} start={plan.start} end={plan.end} onChange={update}/>
        <section><h2>Қосымша сабақтар</h2><p>Сабақты кез келген күнге қойыңыз.</p>
          {plan.events.map(event=><div className="planner-event" key={event.id}>
            <label>Сабақ атауы<input value={event.title} maxLength={100} onChange={e=>eventUpdate(event.id,{title:e.target.value})}/></label>
            <div className="plan-format" role="group" aria-label="Мәтін пішімі"><button aria-pressed={event.bold===false&&!event.italic} onClick={()=>eventUpdate(event.id,{bold:false,italic:false})}>Қалыпты</button><button aria-label="Қалың мәтін" aria-pressed={event.bold!==false} onClick={()=>eventUpdate(event.id,{bold:event.bold===false})}><b>B</b></button><button aria-label="Курсив" aria-pressed={!!event.italic} onClick={()=>eventUpdate(event.id,{italic:!event.italic})}><i>I</i></button></div>
            <div className="planner-event-row"><label>Күн<select aria-label="Күн" value={event.day} onChange={e=>eventUpdate(event.id,{day:Number(e.target.value)})}>{DAYS.map((day,i)=><option value={i} key={day}>{day}</option>)}</select></label><OptionalTime key={`${activeGid}-${week}-${event.id}`} value={event.time} onChange={time=>eventUpdate(event.id,{time})}/><button className="planner-delete" aria-label={`${event.title} жою`} onClick={()=>update({events:plan.events.filter(e=>e.id!==event.id)})}><Trash2 size={17}/></button></div>
          </div>)}
          <div className="planner-add">{['Практикалық сабақ','Кураторлық сабақ','Ивент'].map(title=><button key={title} onClick={()=>update({events:[...plan.events,{id:crypto.randomUUID(),title,day:0,time:'',bold:true,italic:false}]})}><Plus size={15}/>{title}</button>)}</div>
        </section>
        <details><summary>Апта мәтінін өзгерту</summary><p>Дайын тақырыптарды қажет болса түзетіңіз.</p>{plan.days.map((text,index)=><label key={index}>{index===5?'Сенбі / Жексенбі':DAYS[index]}<textarea rows={3} maxLength={350} value={text} onChange={e=>update({days:plan.days.map((v,i)=>i===index?e.target.value:v)})}/></label>)}</details>
      </aside>
      <section className="planner-preview" aria-label="Жоспардың алдын ала көрінісі">
        <div className="workspace-heading"><span className="eyebrow">{subjectName}</span><h1>Апталық жоспар</h1></div>
        <div className="planner-actions"><button className="brand-button brand-button-dark" disabled={!svg || !isPlanDate(plan.start) || !isPlanDate(plan.end) || plan.end<plan.start || overflow || downloading} onClick={download}><Download size={18}/>{downloading?'Дайындалуда…':'Суретті жүктеу (PNG)'}</button></div>
        {overflow && <p role="alert">Мәтін ұяшыққа сыймайды. Мәтінді қысқартыңыз немесе қосымша сабақты басқа күнге ауыстырыңыз.</p>}
        {error?<p role="alert">{error}</p>:svg?<div className="planner-poster" dangerouslySetInnerHTML={{__html:svg}}/>:<p role="status">Үлгі жүктелуде…</p>}
      </section>
    </div>}
  </main>;
}
