import http from 'node:http';
import { readFile } from 'node:fs/promises';
const root = new URL('../demo/', import.meta.url);
const files = {'/':'index.html','/index.html':'index.html','/engine.js':'engine.js','/app.js':'app.js','/style.css':'style.css'};
const types = {html:'text/html',js:'text/javascript',css:'text/css'};
http.createServer(async(req,res)=>{
  const file = files[new URL(req.url,'http://localhost').pathname];
  if (!file) {res.writeHead(404);res.end('Not found');return;}
  try { const body=await readFile(new URL(file,root));res.writeHead(200,{'Content-Type':types[file.split('.').pop()]+'; charset=utf-8'});res.end(body); }
  catch {res.writeHead(500);res.end('Unable to load demo');}
}).listen(4173,'127.0.0.1',()=>console.log('麦搭搭演示 http://127.0.0.1:4173'));
