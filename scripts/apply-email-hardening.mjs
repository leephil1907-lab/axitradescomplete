import fs from 'node:fs';
const p='server.ts'; let s=fs.readFileSync(p,'utf8');
if(!s.includes("./server/emailService")) s=s.replace("import nodemailer from 'nodemailer';","import nodemailer from 'nodemailer';\nimport { sendRegistrationEmails, sendPasswordResetEmail } from './server/emailService';");
s=s.replace("app.post('/api/users/register', (req, res) => {","app.post('/api/users/register', async (req, res) => {");
const response="  res.json({ success: true, user: userData, totalUsers: appUsersStore.length });";
if(!s.includes('sendRegistrationEmails(userData)')) s=s.replace(response,"  void sendRegistrationEmails(userData);\n"+response,1);
if(!s.includes('/api/auth/password-reset/request')){const marker="// Register or synchronize a client account\napp.post('/api/users/register'";const route="app.post('/api/auth/password-reset/request', async (req,res)=>{const email=String(req.body?.email||'').trim().toLowerCase();if(!email)return res.status(400).json({success:false,error:'Email address is required.'});try{await sendPasswordResetEmail(email)}catch(e){console.warn('[Axi password reset]',e)}return res.json({success:true});});\n\n";s=s.replace(marker,route+marker,1);}
fs.writeFileSync(p,s);
const ap='src/App.tsx'; let a=fs.readFileSync(ap,'utf8');
if(!a.includes('./components/EmailActionPage'))a=a.replace("import ForgotPasswordModal from './components/ForgotPasswordModal';","import ForgotPasswordModal from './components/ForgotPasswordModal';\nimport EmailActionPage from './components/EmailActionPage';");
if(!a.includes('AXI_EMAIL_ACTION_ROUTING_V1'))a=a.replace('export default function App() {',"export default function App() {\n  // AXI_EMAIL_ACTION_ROUTING_V1\n  const ep=new URLSearchParams(window.location.search); const em=ep.get('mode'); const ec=ep.get('oobCode');\n  if((window.location.pathname==='/reset-password'||window.location.pathname==='/verify-email')&&em&&ec)return <EmailActionPage />;");
fs.writeFileSync(ap,a);
