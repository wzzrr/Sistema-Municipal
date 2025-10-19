function stripAccents(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function normKey(s) {
    const noAcc = stripAccents(s).toLowerCase();
    return noAcc.replace(/\s+/g, ' ').trim();
}
function toNumber(s) {
    if (!s)
        return undefined;
    const cleaned = s
        .replace(/km\/?h/i, '')
        .replace(/[^\d.,-]+/g, '')
        .replace(',', '.')
        .trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
}
export function parseCameraTxt(content) {
    const out = {};
    const lines = content.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
    const kv = {};
    for (const line of lines) {
        const m = line.match(/^([^:=]+)\s*[:=]\s*(.*)$/);
        if (!m)
            continue;
        const k = normKey(m[1]);
        const v = m[2].trim();
        if (!(k in kv))
            kv[k] = v;
    }
    const getKV = (...candidates) => {
        const keys = Object.keys(kv);
        for (const c of candidates.map(normKey)) {
            const exact = keys.find(k => k === c);
            if (exact)
                return kv[exact];
            const soft = keys.find(k => k.includes(c));
            if (soft)
                return kv[soft];
        }
        return undefined;
    };
    out.cam_serie = getKV('nr serial', 'numero de serie', 'nro serial');
    const fecha = getKV('fecha');
    const hora = getKV('hora');
    if (fecha && hora) {
        const fm = fecha.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        const hm = hora.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
        if (fm && hm) {
            const dd = +fm[1], mm = +fm[2], yyyy = +fm[3];
            const hh = +hm[1], mi = +hm[2], ss = +hm[3];
            out.fecha_labrado = new Date(Date.UTC(yyyy, mm - 1, dd, hh, mi, ss)).toISOString();
        }
    }
    out.ubicacion_texto = getKV('ubicacion');
    const vm = getKV('velocidad medida', 'velocidad media', 'velocidad registrada');
    if (vm)
        out.velocidad_medida = toNumber(vm);
    const va = getKV('velocidad maxima autorizada', 'velocidad autorizada', 'velocidad maxima');
    if (va)
        out.velocidad_autorizada = toNumber(va);
    return out;
}
