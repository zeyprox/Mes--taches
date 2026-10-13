
require('dotenv').config();
const express=require('express'), Database=require('better-sqlite3'), crypto=require('crypto'), fs=require('fs'), path=require('path');
const app=express();
const port=process.env.PORT||3000;
if(!process.env.APP_PASSWORD||!process.env.API_TOKEN||process.env.APP_PASSWORD===process.env.API_TOKEN){
 console.error('Configurez APP_PASSWORD et API_TOKEN, avec deux secrets différents.');process.exit(1);
}
const dir=path.resolve(process.env.DATA_DIR||'./data');fs.mkdirSync(dir,{recursive:true});
const db=new Database(path.join(dir,'tasks.db'));db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,title TEXT NOT NULL,notes TEXT DEFAULT '',category TEXT DEFAULT 'Personnel',priority TEXT DEFAULT 'Normale',due TEXT DEFAULT '',done INTEGER DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)`);
app.disable('x-powered-by');app.use(express.json({limit:'100kb'}));
app.use((req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');next()});
const eq=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&crypto.timingSafeEqual(x,y)};
const authorized=req=>{
 const bearer=(req.get('authorization')||'').replace(/^Bearer\s+/i,'');
 const basic=(req.get('authorization')||'').match(/^Basic\s+(.+)$/i);
 let password='';
 if(basic){try{password=Buffer.from(basic[1],'base64').toString().split(':').slice(1).join(':')}catch{}}
 return eq(bearer,process.env.API_TOKEN)||eq(password,process.env.APP_PASSWORD);
};
app.use('/api',(req,res,next)=>authorized(req)?next():res.status(401).json({error:'Authentification requise'}));
const all=()=>db.prepare('SELECT * FROM tasks ORDER BY done ASC, CASE priority WHEN \'Urgente\' THEN 0 WHEN \'Haute\' THEN 1 ELSE 2 END, due = \'\', due ASC, created_at DESC').all().map(x=>({...x,done:!!x.done}));
app.get('/api/tasks',(req,res)=>res.json(all()));
const clean=(x,old={})=>({
 title:String(x.title??old.title??'').trim().slice(0,180),
 notes:String(x.notes??old.notes??'').slice(0,3000),
 category:['Travail','Maison','Personnel','Autre'].includes(x.category??old.category)?(x.category??old.category):'Personnel',
 priority:['Normale','Haute','Urgente'].includes(x.priority??old.priority)?(x.priority??old.priority):'Normale',
 due:/^\d{4}-\d{2}-\d{2}$/.test(x.due??old.due??'')?(x.due??old.due):'',
 done:(x.done??old.done)?1:0
});
app.post('/api/tasks',(req,res)=>{
 const t=clean(req.body||{});if(!t.title)return res.status(400).json({error:'Titre obligatoire'});
 const id=crypto.randomUUID(),now=new Date().toISOString();
 db.prepare('INSERT INTO tasks(id,title,notes,category,priority,due,done,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,t.title,t.notes,t.category,t.priority,t.due,t.done,now,now);
 res.status(201).json({id,...t,done:!!t.done});
});
app.patch('/api/tasks/:id',(req,res)=>{
 const old=db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id);if(!old)return res.sendStatus(404);
 const t=clean(req.body||{},old);if(!t.title)return res.status(400).json({error:'Titre obligatoire'});
 db.prepare('UPDATE tasks SET title=?,notes=?,category=?,priority=?,due=?,done=?,updated_at=? WHERE id=?').run(t.title,t.notes,t.category,t.priority,t.due,t.done,new Date().toISOString(),req.params.id);
 res.json({...t,id:req.params.id,done:!!t.done});
});
app.delete('/api/tasks/:id',(req,res)=>{const n=db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id).changes;res.sendStatus(n?204:404)});
app.get('/api/export',(req,res)=>res.json({exported_at:new Date().toISOString(),tasks:all()}));
app.get('/openapi.yaml',(req,res)=>res.type('text/yaml').send(fs.readFileSync(path.join(__dirname,'openapi.yaml'),'utf8').replaceAll('https://VOTRE-DOMAINE.example','https://'+req.get('host'))));
app.use(express.static(path.join(__dirname,'public')));
app.listen(port,()=>console.log(`Mes tâches : http://localhost:${port}`));
