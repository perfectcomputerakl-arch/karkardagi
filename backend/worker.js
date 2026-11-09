const H={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Content-Type":"application/json"};
const j=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:H}), enc=x=>new TextEncoder().encode(x);
async function sha(x){let b=await crypto.subtle.digest("SHA-256",enc(x));return [...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,"0")).join("")}
async function sign(payload,key){let k=await crypto.subtle.importKey("raw",enc(key),{name:"HMAC",hash:"SHA-256"},false,["sign"]);let s=await crypto.subtle.sign("HMAC",k,enc(payload));return btoa(String.fromCharCode(...new Uint8Array(s)))}
async function valid(req,env){try{let t=(req.headers.get("Authorization")||"").replace("Bearer ","").split(".");if(t.length!==2||await sign(t[0],env.SETUP_KEY)!==t[1])return false;return JSON.parse(atob(t[0])).exp>Date.now()}catch{return false}}
export default {async fetch(req,env){if(req.method==="OPTIONS")return new Response(null,{headers:H});let p=new URL(req.url).pathname;
try{
if(p==="/api/health")return j({ok:true,service:"KARKARDAGI Backend"});
if(p==="/api/setup"&&req.method==="POST"){let b=await req.json();if(b.setupKey!==env.SETUP_KEY)return j({error:"Invalid setup key"},403);let c=await env.DB.prepare("SELECT COUNT(*) n FROM users").first();if(c.n)return j({error:"Admin already exists"},409);await env.DB.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')").bind(b.name,b.email.toLowerCase(),await sha(b.password)).run();return j({ok:true})}
if(p==="/api/login"&&req.method==="POST"){let b=await req.json(),u=await env.DB.prepare("SELECT * FROM users WHERE email=?").bind((b.email||"").toLowerCase()).first();if(!u||u.password_hash!==await sha(b.password||""))return j({error:"Incorrect email or password"},401);let payload=btoa(JSON.stringify({id:u.id,email:u.email,role:u.role,exp:Date.now()+604800000}));return j({token:payload+"."+await sign(payload,env.SETUP_KEY),user:{id:u.id,name:u.name,email:u.email,role:u.role}})}
if(!await valid(req,env))return j({error:"Unauthorized"},401);
let routes={halqas:["halqas",["name","area"]],masajid:["masajid",["halqa_id","name","area"]],entries:["karkardagi",["halqa_id","masjid_id","entry_date","prayer_meetings","attendees","lessons","visits","outreach","notes"]]};
for(let [r,[table,fields]] of Object.entries(routes)){if(p==="/api/"+r&&req.method==="GET")return j(await env.DB.prepare("SELECT * FROM "+table+" ORDER BY id DESC LIMIT 500").all());if(p==="/api/"+r&&req.method==="POST"){let b=await req.json();let vals=fields.map(f=>b[f]??"");let q=await env.DB.prepare("INSERT INTO "+table+"("+fields.join(",")+") VALUES("+fields.map(()=>"?").join(",")+")").bind(...vals).run();return j({ok:true,id:q.meta.last_row_id},201)}}
if(p==="/api/dashboard"){let out={};for(let t of ["halqas","masajid","karkardagi","users"]){let x=await env.DB.prepare("SELECT COUNT(*) n FROM "+t).first();out[t]=x.n}return j(out)}
if(p==="/api/users"&&req.method==="GET")return j(await env.DB.prepare("SELECT id,name,email,role,created_at FROM users").all());
return j({error:"Not found"},404)
}catch(e){return j({error:String(e)},500)}}};
