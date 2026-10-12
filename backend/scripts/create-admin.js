const pool=require('../config/database');
const {hashPassword,verifyPassword}=require('../lib/security');
async function main(){
  const pairs=[['PROVISION_ADMIN_EMAIL','PROVISION_ADMIN_PASSWORD'],['BOOTSTRAP_ADMIN_EMAIL','BOOTSTRAP_ADMIN_PASSWORD'],['SEED_ADMIN_EMAIL','SEED_ADMIN_PASSWORD'],['DEMO_EMAIL','DEMO_PASSWORD'],['ADMIN_EMAIL','ADMIN_PASSWORD']];
  const selected=pairs.find(([email,password])=>process.env[email]&&process.env[password]);
  if(!selected)throw new Error('A complete configured administrator email/password pair is required.');
  const email=process.env[selected[0]],password=process.env[selected[1]],tenant=process.env.SEED_TENANT_ID||process.env.DEMO_TENANT||'default';
  const prior=await pool.query('SELECT password FROM users WHERE email=$1',[email]);
  if(prior.rowCount){
    if(!verifyPassword(password,prior.rows[0].password))throw new Error('Configured account credentials do not match the existing account. Existing password, role and tenant were preserved.');
    console.log('Configured account ready. Existing account preserved.');return;
  }
  const inserted=await pool.query("INSERT INTO users(email,password,name,role,tenant_id) VALUES($1,$2,$3,'commander',$4) ON CONFLICT(email) DO NOTHING RETURNING id",[email,hashPassword(password),process.env.SEED_ADMIN_NAME||'Administrator',tenant]);
  if(!inserted.rowCount){const current=await pool.query('SELECT password FROM users WHERE email=$1',[email]);if(!verifyPassword(password,current.rows[0]?.password))throw new Error('An existing account now has different credentials. It was preserved.');}
  console.log(inserted.rowCount?'Configured administrator provisioned.':'Configured account ready. Existing account preserved.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>pool.end());
