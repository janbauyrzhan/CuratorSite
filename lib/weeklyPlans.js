// Transcribed from the supplied informatics posters. Day order: Mon–Sun (weekend combined).
const review = 'ҚАЙТАЛАУ ТЕСТ тапсыру\nСАБАҚ ТАПСЫРУ';
const pairs = 'ЖҰПТЫҚ ЖҰМЫС жасау';
const rows = [
  ['Алғашқы ПРОБНЫЙ ТЕСТ тапсыру\nТАНЫСУ КЕШІНЕ қатысу 18:00','САНАУ ЖҮЙЕЛЕРІ\nСАНАУ ЖҮЙЕЛЕРІ (2-бөлім)','2,8,16-ЛЫҚ САНДАРДЫ ЖЫЛДАМ АУЫСТЫРУ','БӨЛШЕК САНДАРДЫ АУДАРУ','Жұптық жұмыс жасау','КУРАТОРҒА АУЫЗША САБАҚ ТАПСЫРУ'],
  ['ЛОГИКАЛЫҚ ОПЕРАЦИЯЛАР','АҚИҚАТ КЕСТЕСІ','ЛОГИКАЛЫҚ СЫЗБА','IT Startup',pairs,review+'\nКУРАТОРЛЫҚ КЕШКЕ ҚАТЫСУ'],
  ['АҚПАРАТТЫ ӨЛШЕУ БІРЛІКТЕРІ','АЛФАВИТТІК ТӘСІЛ','АҚПАРАТТЫҢ ҚАСИЕТТЕРІ','UNICODE ЖӘНЕ ASCII','CROWDFUNDING\n'+pairs,review],
  ['EXCEL-ГЕ КІРІСПЕ','EXCEL-ДЕ ДИАГРАММАЛАР МЕН ШАРТТЫ ПІШІМДЕУДІ ҚОЛДАНУ','EXCEL-ДЕ ФОРМУЛА ҚОЛДАНУ','Excel-де кірістірілген функцияларды қолдану',pairs,review],
  ['КОМПЬЮТЕР ЖАДЫ','КОМПЬЮТЕР КОНФИГУРАЦИЯСЫ','ПРОГРАММАЛЫҚ ҚАМТАМАСЫЗ ЕТУ','АППАРАТТЫҚ ҚАМТАМАСЫЗ ЕТУ','Өнімді насихаттау\nЖҰПТЫҚ ЖҰМЫС',review],
  ['HTML-ГЕ КІРІСПЕ','HTML-ДЕ МӘТІНДІ ФОРМАТТАУ','HTML-ДЕ ТІЗІМ ҚҰРУ','HTML-ДЕ КЕСТЕ ҚҰРУ',pairs,review],
  ['HTML-ДЕГІ МУЛЬТИМЕДИЯ','CSS','JAVASCRIPT','Виртуалды шынайылық','Виртуалды шындықтағы адам\n'+pairs,review],
  ['КОМПЬЮТЕРЛІК ЖЕЛІЛЕРДІ ЖІКТЕУ','ЖЕЛІНІҢ ӨТКІЗУ ҚАБІЛЕТІ','ЖЕЛІЛІК КОМПОНЕНТТЕР','Ақпараттық қауіпсіздік',pairs,'САБАҚ ТАПСЫРУ'],
  ['IP АДРЕС','DNS ДОМЕН','PYTHON-ҒА КІРІСПЕ\nСЫЗЫҚТЫҚ АЛГОРИТМДЕР','СЫЗЫҚТЫҚ АЛГОРИТМДЕР (ПРАКТИКА)',pairs,review],
  ['ТАРМАҚТАЛҒАН АЛГОРИТМДЕР','ТАРМАҚТАЛҒАН АЛГОРИТМДЕР (ПРАКТИКА)','КІРІСТІРІЛГЕН ШАРТТАР','КҮРДЕЛІ ШАРТТАР',pairs+'\nСАБАҚ ТАПСЫРУ',review],
  ['FOR ЦИКЛІ','WHILE ЦИКЛІ','ЦИКЛ БАСҚАРУ НҰСҚАУЛЫҒЫ','ЦИКЛ (ПРАКТИКА)',pairs+'\nСАБАҚ ТАПСЫРУ','ҚАЙТАЛАУ ТЕСТ тапсыру'],
  ['КІРІСТІРІЛГЕН ЦИКЛДЕР','АЛГОРИТМНІҢ ТРАССИРОВКАСЫ','БІР ӨЛШЕМДІ МАССИВ','БІР ӨЛШЕМДІ МАССИВ (ПРАКТИКА)',pairs,review],
  ['ЕКІ ӨЛШЕМДІ МАССИВ','СҰРЫПТАУ АЛГОРИТМДЕРІ','ПРОЦЕДУРА','ФУНКЦИЯ',pairs,review],
  ['РЕКУРСИЯ','ЖОЛДАРМЕН ЖҰМЫС','ФАЙЛДАРМЕН ЖҰМЫС','ГРАФТАР',pairs,review],
  ['ДЕРЕКТЕР ҚОРЫ','КІЛТТІК ӨРІС','ДЕРЕКТЕР ҚОРЫН ҚҰРУ. SQL','МОБИЛЬДІ ҚҰРЫЛҒЫЛАР',pairs,review],
  ['SQL СҰРАНЫСТАР','СҰРАНЫС ІШІНДЕГІ СҰРАНЫСТАР','ДЕРЕКТЕРДІ ЕНГІЗУГЕ ФОРМА ЖАСАУ','ҚАЗАҚСТАНДАҒЫ ЦИФРЛАНДЫРУ','BLOCKCHAIN\n'+pairs,review],
  ['Ақпаратты құқықтық қорғау\nВиртуалды машиналар','Машиналық оқыту, нейронды желілер','Жасанды интеллект қолдану саласы','Жасанды интеллект мұғаліммен оқыту әдісі',pairs,review],
];
export const DAYS = ['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];
export const PLAN_TEMPLATES = rows.map((days, i) => ({
  week: i + 1, days,
  file: i < 14 ? i + 3 : i + 4,
  events: [
    ...([0,3,8,10,11,12].includes(i) ? [{id:'practice', title:'Практикалық сабақ', day:i === 0 || i === 10 ? 5 : 4, time:''}] : []),
    ...([2,8].includes(i) ? [{id:'curator', title:'Кураторлық сабақ', day:i === 2 ? 2 : 4, time:''}] : []),
  ],
}));
// The archive contains two versions of week 14; use the later one (17.svg).
PLAN_TEMPLATES[13].file = 17;

export function defaultPlan(week) {
  const template = PLAN_TEMPLATES[week - 1];
  return {start:'', end:'', days:[...template.days], events:template.events.map(e=>({...e}))};
}

export function endOfWeek(start) {
  if (!start) return '';
  const date = new Date(start+'T12:00:00');
  date.setDate(date.getDate()+6);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const xml = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function wrap(text, limit=34) {
  return text.split('\n').flatMap(paragraph=>{
    const lines=[]; let line='';
    for (const word of paragraph.split(/\s+/)) {
      if ((line+' '+word).trim().length>limit && line) {lines.push(line);line='';}
      // Split unbroken text too, so pasted URLs cannot overflow a card.
      let rest=word;
      while(rest.length>limit){if(line){lines.push(line);line='';}lines.push(rest.slice(0,limit));rest=rest.slice(limit);}
      line=(line+' '+rest).trim();
    }
    if(line) lines.push(line);
    return lines;
  });
}

export function buildPlanSvg(original, plan) {
  if (!original) return '';
  const date = value => value ? value.slice(8,10)+'.'+value.slice(5,7) : '—';
  let overlay = `<rect x="291" y="48" width="65" height="19" fill="white"/><text x="324" y="61.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="7" fill="#737373">${date(plan.start)}–${date(plan.end)}</text>`;
  plan.days.forEach((topic, index)=>{
    const x=index<3?33:224, y=[78,153,229][index%3];
    const events=plan.events.filter(e=>Math.min(Number(e.day),5)===index).map(e=>`${Number(e.day)>=5?DAYS[e.day]+': ':''}${e.title}${e.time?' '+e.time:''}`);
    const lines=wrap([topic,...events].filter(Boolean).join('\n'));
    const size=Math.min(6.1,45/Math.max(lines.length,1)/1.3);
    overlay+=`<rect x="${x}" y="${y}" width="145" height="55" rx="2" fill="white"/>`;
    lines.forEach((line,n)=>{overlay+=`<text x="${x+7}" y="${y+10+n*size*1.3}" font-family="Arial, sans-serif" font-size="${size}" font-weight="600" fill="#202020">${xml(line)}</text>`;});
  });
  return original.replace(/width="502"/, 'width="100%"').replace(/height="391"/,'height="auto"').replace('</svg>',overlay+'</svg>');
}
