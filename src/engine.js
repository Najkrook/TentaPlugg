export const normalize = value => String(value??'').normalize('NFKC').trim().toLowerCase().replace(/[\s。、.,!?！？]/g,'');
export const correct = (q,value) => (q.answers||[]).some(a=>normalize(a)===normalize(value));
export function selectPractice(bank, stats, topic='Alla',count=10){
 const pool=bank.filter(q=>topic==='Alla'||q.topic===topic).map(q=>({q,priority:!stats[q.id]?3:stats[q.id].ok?1:5,tie:Math.random()}));
 return pool.sort((a,b)=>b.priority-a.priority||a.tie-b.tie).slice(0,count).map(x=>x.q.id);
}
export function mergeProgress(a,b){
 const result={...a,...b,stats:{...a.stats},drafts:{...a.drafts},history:[...(a.history||[]),...(b.history||[])].sort((x,y)=>y.at-x.at).filter((x,i,arr)=>arr.findIndex(y=>y.id===x.id)===i).slice(0,100)};
 for(const [id,d]of Object.entries(b.drafts||{}))if(!result.drafts[id]||d.at>result.drafts[id].at)result.drafts[id]=d;
 for(const [id,s]of Object.entries(b.stats||{}))if(!result.stats[id]||s.at>result.stats[id].at)result.stats[id]=s;
 result.examDate=(a.settingsAt||0)>(b.settingsAt||0)?a.examDate:b.examDate;
 result.settingsAt=Math.max(a.settingsAt||0,b.settingsAt||0);
 return result;
}
