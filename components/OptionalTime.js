import {useEffect, useState} from 'react';
import {X} from 'lucide-react';

export default function OptionalTime({value,onChange}) {
  const [text,setText]=useState(value||'');
  const [error,setError]=useState(false);
  useEffect(()=>{setText(value||'');setError(false);},[value]);
  function change(next){
    setText(next);setError(false);
    if(!next.trim())onChange('');
    else if(/^([01]\d|2[0-3]):[0-5]\d$/.test(next))onChange(next);
  }
  function finish(){
    if(!text.trim()){onChange('');return;}
    const match=text.trim().match(/^(\d{1,2})(?::([0-5]\d))?$/);
    if(match&&Number(match[1])<24){const time=`${match[1].padStart(2,'0')}:${match[2]||'00'}`;setText(time);onChange(time);setError(false);}
    else setError(true);
  }
  return <div className="optional-time"><label>Уақыт (міндетті емес)<span className="optional-time-field"><input type="text" inputMode="text" placeholder="18:00" maxLength={5} value={text} aria-invalid={error} onChange={e=>change(e.target.value)} onBlur={finish}/>{text&&<button type="button" aria-label="Уақытты тазалау" onMouseDown={e=>e.preventDefault()} onClick={()=>{setText('');setError(false);onChange('');}}><X size={14}/></button>}</span></label>{error&&<small role="alert">Мысалы: 18:00</small>}</div>;
}
