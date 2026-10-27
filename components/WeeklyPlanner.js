'use client';

import {useEffect, useMemo, useState} from 'react';
import {Download, Plus, Trash2} from 'lucide-react';
import {PLAN_TEMPLATES, DAYS, defaultPlan, isPlanDate, buildPlanSvg} from '@/lib/weeklyPlans';
import PlanDatePicker from './PlanDatePicker';

export default function WeeklyPlanner({groups, activeGid, selectGroup, onChange, notify}) {
  const [week,setWeek]=useState(1);
  const [source,setSource]=useState('');
  const [error,setError]=useState('');
  const [downloading,setDownloading]=useState(false);
  const [font,setFont]=useState(null);
  const group=groups.find(g=>g.id===activeGid);
  const plan=group?.weeklyPlans?.informatics?.[week] || defaultPlan(week);
  useEffect(()=>{
    let cancelled=false;
    fetch('/fonts/OpenSans.ttf').then(r=>{if(!r.ok)throw new Error();return r.blob();}).then(async blob=>{
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
      const face=new FontFace('Plan Open Sans',`url(${data})`,{weight:'100 900'});
      await face.load();if(cancelled)return;document.fonts.add(face);
      const ctx=document.createElement('canvas').getContext('2d');ctx.font='400 7px "Plan Open Sans"';
      setFont({data,measure:text=>ctx.measureText(text).width});
    }).catch(()=>{if(!cancelled)setError('Қаріп жүктелмеді. Бетті жаңартыңыз.');});
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    setSource('');setError('');
    fetch(`/weekly-plans/informatics/${PLAN_TEMPLATES[week-1].file}.svg`,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error();return r.text();})
      .then(setSource).catch(e=>{if(e.name!=='AbortError')setError('Үлгі жүктелмеді. Бетті жаңартыңыз.');});
    return ()=>controller.abort();
  },[week]);
  const svg=useMemo(()=>font?buildPlanSvg(source,plan,font.data,font.measure):'',[source,plan,font]);
  const overflow=svg.includes('data-text-overflow="true"');
  const update=patch=>onChange(group.id,week,{...plan,...patch});
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
      a.href=png;a.download=`informatics-week-${week}.png`;a.click();
      setTimeout(()=>URL.revokeObjectURL(png),1000);
    } catch {notify('Суретті жүктеу мүмкін болмады. Қайта көріңіз.');}
    finally{URL.revokeObjectURL(url);setDownloading(false);}
  }
  return <main className="weekly-planner">
    <div className="workspace-heading"><h1>Апталық жоспар</h1><p>Информатика · 17 дайын апта. Өзгерістер тобыңызға автоматты сақталады.</p></div>
    {!group ? <p>Алдымен «Жұптық жұмыс» бөлімінде топ құрыңыз немесе топты таңдаңыз.</p> : <div className="planner-layout">
      <aside className="planner-controls">
        <label>Топ<select aria-label="Топ" value={activeGid} onChange={e=>selectGroup(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
        <label>Апта<select aria-label="Апта" value={week} onChange={e=>setWeek(Number(e.target.value))}>{PLAN_TEMPLATES.map(t=><option key={t.week} value={t.week}>{t.week}-апта</option>)}</select></label>
        <PlanDatePicker key={`${activeGid}-${week}`} start={plan.start} end={plan.end} onChange={update}/>
        <section><h2>Қосымша сабақтар</h2><p>Сабақты кез келген күнге қойыңыз.</p>
          {plan.events.map(event=><div className="planner-event" key={event.id}>
            <label>Сабақ атауы<input value={event.title} maxLength={100} onChange={e=>eventUpdate(event.id,{title:e.target.value})}/></label>
            <div className="planner-event-row"><label>Күн<select aria-label="Күн" value={event.day} onChange={e=>eventUpdate(event.id,{day:Number(e.target.value)})}>{DAYS.map((day,i)=><option value={i} key={day}>{day}</option>)}</select></label><label>Уақыт<input type="time" value={event.time} onChange={e=>eventUpdate(event.id,{time:e.target.value})}/></label><button className="planner-delete" aria-label={`${event.title} жою`} onClick={()=>update({events:plan.events.filter(e=>e.id!==event.id)})}><Trash2 size={17}/></button></div>
          </div>)}
          <div className="planner-add">{['Практикалық сабақ','Кураторлық сабақ'].map(title=><button key={title} onClick={()=>update({events:[...plan.events,{id:crypto.randomUUID(),title,day:0,time:''}]})}><Plus size={15}/>{title}</button>)}</div>
        </section>
        <details><summary>Апта мәтінін өзгерту</summary><p>Дайын тақырыптарды қажет болса түзетіңіз.</p>{plan.days.map((text,index)=><label key={index}>{index===5?'Сенбі / Жексенбі':DAYS[index]}<textarea rows={3} maxLength={350} value={text} onChange={e=>update({days:plan.days.map((v,i)=>i===index?e.target.value:v)})}/></label>)}</details>
      </aside>
      <section className="planner-preview" aria-label="Жоспардың алдын ала көрінісі">
        <button className="brand-button" disabled={!svg || !isPlanDate(plan.start) || !isPlanDate(plan.end) || plan.end<plan.start || overflow || downloading} onClick={download}><Download size={18}/>{downloading?'Дайындалуда…':'Суретті жүктеу (PNG)'}</button>
        {(!isPlanDate(plan.start)||!isPlanDate(plan.end)) && <p>Жүктеу үшін апта күндерін белгілеңіз.</p>}
        {overflow && <p role="alert">Мәтін ұяшыққа сыймайды. Мәтінді қысқартыңыз немесе қосымша сабақты басқа күнге ауыстырыңыз.</p>}
        {error?<p role="alert">{error}</p>:svg?<div className="planner-poster" dangerouslySetInnerHTML={{__html:svg}}/>:<p role="status">Үлгі жүктелуде…</p>}
      </section>
    </div>}
  </main>;
}
