'use client';

import {useEffect, useMemo, useState} from 'react';
import {Download, Plus, Trash2} from 'lucide-react';
import {PLAN_TEMPLATES, DAYS, defaultPlan, endOfWeek, buildPlanSvg} from '@/lib/weeklyPlans';

export default function WeeklyPlanner({groups, activeGid, selectGroup, onChange, notify}) {
  const [week,setWeek]=useState(1);
  const [source,setSource]=useState('');
  const [error,setError]=useState('');
  const [downloading,setDownloading]=useState(false);
  const group=groups.find(g=>g.id===activeGid);
  const plan=group?.weeklyPlans?.informatics?.[week] || defaultPlan(week);
  useEffect(()=>{
    const controller=new AbortController();
    setSource('');setError('');
    fetch(`/weekly-plans/informatics/${PLAN_TEMPLATES[week-1].file}.svg`,{signal:controller.signal})
      .then(r=>{if(!r.ok)throw new Error();return r.text();})
      .then(setSource).catch(e=>{if(e.name!=='AbortError')setError('Үлгі жүктелмеді. Бетті жаңартыңыз.');});
    return ()=>controller.abort();
  },[week]);
  const svg=useMemo(()=>buildPlanSvg(source,plan),[source,plan]);
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
        <div className="planner-dates"><label>Басталуы<input type="date" value={plan.start} onChange={e=>update({start:e.target.value,end:endOfWeek(e.target.value)})}/></label><label>Аяқталуы<input type="date" min={plan.start} value={plan.end} onChange={e=>update({end:e.target.value})}/></label></div>
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
        <button className="brand-button" disabled={!svg || !plan.start || !plan.end || plan.end<plan.start || downloading} onClick={download}><Download size={18}/>{downloading?'Дайындалуда…':'Суретті жүктеу (PNG)'}</button>
        {!plan.start && <p>Жүктеу үшін апта күндерін белгілеңіз.</p>}
        {error?<p role="alert">{error}</p>:svg?<div className="planner-poster" dangerouslySetInnerHTML={{__html:svg}}/>:<p role="status">Үлгі жүктелуде…</p>}
      </section>
    </div>}
  </main>;
}
