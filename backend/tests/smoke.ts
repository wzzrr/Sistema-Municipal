// Minimal smoke tests – do not replace your real tests
import assert from 'node:assert';

const base = process.env.BASE_URL || 'http://localhost:3000/api';
(async () => {
  let r = await fetch(`${base}/auth/me`, { credentials: 'include' as any });
  assert.equal(r.status, 401);

  r = await fetch(`${base}/infracciones/999999`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'anulada' }) });
  assert.equal(r.status, 401);

  r = await fetch(`${base}/infracciones`);
  assert.equal(r.status, 401);

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@seguridadvial', password: 'password' })
  });
  assert.ok(login.status === 200 || login.status === 201);
  const setCookie = login.headers.get('set-cookie');
  assert.ok(setCookie && setCookie.includes('sv_token='));

  r = await fetch(`${base}/auth/me`, { headers: { 'Cookie': setCookie! } });
  assert.equal(r.status, 200);

  const dto = { dominio: 'AB123CD', fecha_labrado: new Date().toISOString(), velocidad_medida: 80, velocidad_autorizada: 60, ubicacion_texto: 'AYACUCHO 1350', lat: -28.4696, lng: -65.7852 };
  const created = await fetch(`${base}/infracciones`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': setCookie! }, body: JSON.stringify(dto) });
  assert.equal(created.status, 201);
  const cjson: any = await created.json();
  assert.ok(cjson.id && cjson.nro_acta);

  const list = await fetch(`${base}/infracciones`, { headers: { 'Cookie': setCookie! } });
  assert.equal(list.status, 200);

  const pat = await fetch(`${base}/infracciones/${cjson.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Cookie': setCookie! }, body: JSON.stringify({ estado: 'anulada' }) });
  assert.equal(pat.status, 200);

  // Cookie-only policy: Bearer header should not authenticate
  const bad = await fetch(`${base}/infracciones`, { headers: { 'Authorization': 'Bearer dummy' } });
  assert.equal(bad.status, 401);
})().then(()=>console.log('SMOKE OK')).catch(e=>{ console.error(e); process.exit(1); });
