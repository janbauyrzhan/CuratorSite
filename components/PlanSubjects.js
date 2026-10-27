import {ArrowUpRight, Monitor, Calculator, Atom, Globe, CalendarDays} from 'lucide-react';

export const PLAN_SUBJECTS = [
  {id:'informatics',name:'Информатика',icon:Monitor,color:'#eeecfb'},
  {id:'mathematics',name:'Математика',icon:Calculator,color:'#edf1e5'},
  {id:'physics',name:'Физика',icon:Atom,color:'#f7ece4'},
  {id:'geography',name:'География',icon:Globe,color:'#e6f0f5'},
];

export default function PlanSubjects({subject,onSelect}) {
  const selected=PLAN_SUBJECTS.find(s=>s.id===subject);
  if(selected)return <main className="plan-subject-page"><div className="plan-coming-soon"><CalendarDays size={36}/><h1>{selected.name}</h1><p>Бұл пәннің апталық жоспарлары жақында қосылады.</p><p>Дайын үлгілер қосылғанда, осында аптаны таңдап, күндер мен сабақтарды өзгерте аласыз.</p><button className="brand-button" onClick={()=>onSelect(null)}>Пәндерге оралу</button></div></main>;
  return <main className="plan-subject-page"><div className="workspace-heading"><h1>Апталық жоспар</h1><p>Жоспар дайындау үшін пәнді таңдаңыз.</p></div><div className="plan-subject-grid">{PLAN_SUBJECTS.map(({id,name,icon:Icon,color})=><button className="plan-subject-card" key={id} onClick={()=>onSelect(id)}><span className="plan-subject-icon" style={{background:color}}><Icon size={28}/></span><strong>{name}</strong><span>{id==='informatics'?'17 дайын апта':id==='mathematics'?'25 дайын апта':'Үлгілер жақында қосылады'}</span><ArrowUpRight size={20}/></button>)}</div></main>;
}
