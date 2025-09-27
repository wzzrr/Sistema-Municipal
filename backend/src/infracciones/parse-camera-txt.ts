/// <reference types="jest" />

export type ParsedTxt = {
  ubicacion_texto?: string;
  velocidad_medida?: number;
  velocidad_autorizada?: number;
  fecha_labrado?: string; // ISO
  lat?: number;
  lng?: number;
  cam_serie?: string;
};

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Normaliza: quita acentos, pasa a minúsculas, recorta y COLAPSA espacios internos
function normKey(s: string) {
  const noAcc = stripAccents(s).toLowerCase();
  return noAcc.replace(/\s+/g, ' ').trim();
}

function toNumber(s?: string) {
  if (!s) return undefined;
  const cleaned = s
    .replace(/km\/?h/i, '')
    .replace(/[^\d.,-]+/g, '')
    .replace(',', '.')
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function parseCameraTxt(content: string): ParsedTxt {
  const out: ParsedTxt = {};
  const lines = content.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);

  // Mapeo clave=valor tolerante a ":" o "="
  const kv: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(/^([^:=]+)\s*[:=]\s*(.*)$/);
    if (!m) continue;
    const k = normKey(m[1]);
    const v = m[2].trim();
    if (!(k in kv)) kv[k] = v;
  }

  // Helper para leer con tolerancia
  const getKV = (...candidates: string[]) => {
    const keys = Object.keys(kv);
    for (const c of candidates.map(normKey)) {
      // 1) exacta
      const exact = keys.find(k => k === c);
      if (exact) return kv[exact];
      // 2) contiene (por si hay espacios dobles u otros agregados)
      const soft = keys.find(k => k.includes(c));
      if (soft) return kv[soft];
    }
    return undefined;
  };

  // Serie de cámara
  out.cam_serie = getKV('nr serial', 'numero de serie', 'nro serial');

  // Fecha y hora -> ISO UTC
  const fecha = getKV('fecha');
  const hora  = getKV('hora');
  if (fecha && hora) {
    const fm = fecha.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    const hm = hora.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    if (fm && hm) {
      const dd = +fm[1], mm = +fm[2], yyyy = +fm[3];
      const hh = +hm[1], mi = +hm[2], ss = +hm[3];
      out.fecha_labrado = new Date(Date.UTC(yyyy, mm - 1, dd, hh, mi, ss)).toISOString();
    }
  }

  // Ubicación
  out.ubicacion_texto = getKV('ubicacion');

  // Velocidades
  const vm = getKV('velocidad medida', 'velocidad media', 'velocidad registrada');
  if (vm) out.velocidad_medida = toNumber(vm);

  const va = getKV('velocidad maxima autorizada', 'velocidad autorizada', 'velocidad maxima');
  if (va) out.velocidad_autorizada = toNumber(va);

  // Tu TXT no trae lat/lng
  return out;
}
