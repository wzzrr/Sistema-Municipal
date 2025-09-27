import React, { useEffect, useState } from 'react';
import { useAuth } from './auth';

type Titular = { dominio: string; nombre: string; dni: string; domicilio: string } | null;

// =============== helpers coordenadas (DMS) ===============
function normalizeHemi(h: string | undefined): 'N'|'S'|'E'|'W'|undefined {
  if (!h) return undefined;
  const up = h.toUpperCase();
  if (up === 'O') return 'W'; // Español "Oeste"
  if (['N','S','E','W'].includes(up)) return up as any;
  return undefined;
}

/**
 * parseDMS: acepta formatos con ° ' " o espacios, coma/punto decimal,
 * hemisferio N/S/E/W/O o signo en grados.
 * Ej: 28°27'42.85"S | 28 27 42,85 S | -28 27 42.85
 */
function parseDMS(input: string): { dec: number, g:number, m:number, s:number, hemi?: 'N'|'S'|'E'|'W' } | null {
  if (!input) return null;
  let str = input.trim()
    .replace(/,/g, '.')     // coma → punto
    .replace(/\s+/g, ' ')
    .toUpperCase();

  let hemi: 'N'|'S'|'E'|'W'|undefined;
  const hemiMatch = str.match(/([NSEWO])/);
  if (hemiMatch) hemi = normalizeHemi(hemiMatch[1]);

  const nums = Array.from(str.matchAll(/-?\d+(?:\.\d+)?/g)).map(m => m[0]);
  if (nums.length === 0) return null;

  let g = parseFloat(nums[0]);
  const signFromG = g < 0 ? -1 : 1;
  g = Math.abs(g);

  const m = nums[1] ? Math.abs(parseFloat(nums[1])) : 0;
  const s = nums[2] ? Math.abs(parseFloat(nums[2])) : 0;

  let sign = signFromG;
  if (hemi === 'S' || hemi === 'W') sign = -1;
  if (hemi === 'N' || hemi === 'E') sign = 1;

  const dec = sign * (g + m/60 + s/3600);
  return { dec, g, m, s, hemi };
}
// =========================================================

export default function NewInfraccion({ onDone }: { onDone: () => void }) {
  const { api } = useAuth();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [txtFile, setTxtFile]     = useState<File | null>(null);

  // IDs de /api/uploads
  const [imageFileId, setImageFileId] = useState<string>('');
  const [txtFileId, setTxtFileId]     = useState<string>('');

  const [dominio, setDominio] = useState('');
  const [titular, setTitular] = useState<Titular>(null);

  const [ubicacion_texto, setUbicacion] = useState('');
  const [fecha_labrado, setFecha]       = useState<string>('');

  // velocidad medida
  const [velocidad_medida, setVM] = useState<number>(0);

  // N° de serie de la cámara (TruCam)
  const [cam_serie, setCamSerie] = useState<string>('');

  // Campos de vehículo
  const [tipo_vehiculo, setTipoVehiculo] = useState('');
  const [vehiculo_marca, setMarca]       = useState('');
  const [vehiculo_modelo, setModelo]     = useState('');

  // Coordenadas (se ingresan por separado)
  const [latRaw, setLatRaw] = useState('');  // Latitud (DMS)
  const [lngRaw, setLngRaw] = useState('');  // Longitud (DMS)

  // Preview de decimales (display)
  const [latDecPreview, setLatDecPreview] = useState<number | null>(null);
  const [lngDecPreview, setLngDecPreview] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');

  const [lastId, setLastId]     = useState<number | null>(null);
  const [lastActa, setLastActa] = useState<string | undefined>(undefined);

  // ---------- upload/extract ----------
  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await api('/api/uploads', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('Falla subiendo archivo');
    return r.json() as Promise<{ fileId: string }>;
  };

  const handleUpload = async () => {
    try {
      setMsg('Subiendo...');
      let localImageId = imageFileId;
      let localTxtId   = txtFileId;

      if (imageFile) {
        const j = await upload(imageFile);
        localImageId = j.fileId;
        setImageFileId(j.fileId);
      }
      if (txtFile) {
        const j2 = await upload(txtFile);
        localTxtId = j2.fileId;
        setTxtFileId(j2.fileId);
      }

      setMsg('Extrayendo datos (TXT)...');
      const r = await api('/api/infracciones/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txtFileId: localTxtId || undefined,
          imageFileId: localImageId || undefined,
        }),
      });

      if (!r.ok) throw new Error('Falla extrayendo');
      const j = await r.json();
      const ocr = j.ocr || {};

      // valores que pueden venir en el extract
      setUbicacion(ocr.ubicacion_texto || '');
      if (ocr.fecha_labrado) setFecha(ocr.fecha_labrado);
      if (ocr.velocidad_medida !== undefined) setVM(Number(ocr.velocidad_medida));
      if (ocr.cam_serie) setCamSerie(ocr.cam_serie);
      if (!dominio && ocr.dominio) setDominio(ocr.dominio);

      setMsg('Datos pre-cargados (revisá y completá).');
    } catch (e:any) {
      setMsg(e.message || 'Error');
    }
  };

  // ---------- titular ----------
  const fetchTitular = async (dom: string) => {
    setTitular(null);
    if (!dom) return;
    try {
      const r = await api(`/api/titulares/${dom.toUpperCase()}`);
      if (r.ok) setTitular(await r.json());
    } catch { /* noop */ }
  };
  useEffect(() => {}, []);
  const onDominioBlur = () => fetchTitular(dominio);

  // ---------- parsing de coords ----------
  const parseLat = (s: string) => {
    const r = parseDMS(s);
    setLatDecPreview(r?.dec ?? null);
    return r?.dec;
  };
  const parseLng = (s: string) => {
    const r = parseDMS(s);
    setLngDecPreview(r?.dec ?? null);
    return r?.dec;
  };

  const onLatBlur = () => parseLat(latRaw);
  const onLngBlur = () => parseLng(lngRaw);

  // ---------- guardar ----------
  const save = async () => {
    try {
      setLoading(true);

      const lat = parseLat(latRaw) ?? undefined;
      const lng = parseLng(lngRaw) ?? undefined;

      const payload: any = {
        dominio: dominio.toUpperCase(),
        fecha_labrado,
        velocidad_medida: Number(velocidad_medida) || 0,
        ubicacion_texto,
        lat, lng,
        foto_file_id: imageFileId || undefined,

        // nuevos
        tipo_vehiculo,
        vehiculo_marca,
        vehiculo_modelo,

        // número de serie
        cam_serie: cam_serie || undefined,
      };

      const r = await api('/api/infracciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('No se pudo guardar');

      const j = await r.json();
      setLastId(j.id);
      setLastActa(j.nro_acta);
      setMsg(`Guardado OK. Acta: ${j.nro_acta || j.id}. Generá el PDF.`);
    } catch (e:any) {
      setMsg(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  // ---------- PDF ----------
  const genPdfStream = async () => {
    if (!lastId) return;
    try {
      setMsg('Generando PDF...');
      const r = await api(`/api/notificaciones/${lastId}/pdf/stream`, { method: 'POST' });
      if (!r.ok) throw new Error('No se pudo generar el PDF');

      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);

      const cd = r.headers.get('Content-Disposition') || '';
      const m  = cd.match(/filename="?([^"]+)"?/);
      const filename = m?.[1] ?? `acta-${lastId}.pdf`;

      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);

      setMsg('PDF generado');
    } catch (e:any) {
      setMsg(e.message || 'Error generando PDF');
    }
  };

  // ---------- UI ----------
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <h3 style={{ marginTop: 0 }}>Nueva Infracción</h3>

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label>Imagen</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          {imageFileId && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Foto subida: <code>{imageFileId}</code></div>}
        </div>
        <div>
          <label>TXT (opcional)</label>
          <input type="file" accept=".txt,.TXT" onChange={(e) => setTxtFile(e.target.files?.[0] || null)} />
          {txtFileId && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>TXT subido: <code>{txtFileId}</code></div>}
        </div>
      </div>

      <button onClick={handleUpload} style={{ marginTop: 8 }}>
        Subir y extraer (TXT)
      </button>

      <div style={{ display: 'grid', gap: 8, marginTop: 12, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <label>Dominio</label>
          <input
            value={dominio}
            onChange={(e) => setDominio(e.target.value)}
            onBlur={onDominioBlur}
            style={{ width: '100%' }}
            placeholder="AC091PZ"
          />
        </div>

        <div>
          <label>Fecha labrado</label>
          <input
            type="datetime-local"
            value={fecha_labrado ? fecha_labrado.substring(0, 16) : ''}
            onChange={(e) => setFecha(new Date(e.target.value).toISOString())}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Ubicación</label>
          <input value={ubicacion_texto} onChange={(e) => setUbicacion(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div>
          <label>Velocidad medida</label>
          <input
            type="number"
            value={velocidad_medida}
            onChange={(e) => setVM(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>N° Serie cámara (TruCam II)</label>
          <input
            value={cam_serie}
            onChange={(e)=>setCamSerie(e.target.value)}
            placeholder="TC009925"
            style={{ width:'100%' }}
          />
        </div>

        <div>
          <label>Tipo de Vehículo</label>
          <input value={tipo_vehiculo} onChange={(e)=>setTipoVehiculo(e.target.value)} style={{ width:'100%' }} placeholder="AUTOMÓVIL" />
        </div>
        <div>
          <label>Marca</label>
          <input value={vehiculo_marca} onChange={(e)=>setMarca(e.target.value)} style={{ width:'100%' }} placeholder="Volkswagen" />
        </div>
        <div>
          <label>Modelo</label>
          <input value={vehiculo_modelo} onChange={(e)=>setModelo(e.target.value)} style={{ width:'100%' }} placeholder="Gol" />
        </div>

        {/* Sólo Lat/Lng (DMS) — se eliminó el “Pegar línea completa” */}
        <div>
          <label>Latitud (DMS)</label>
          <input
            placeholder={`28°27'42.85"S`}
            value={latRaw}
            onChange={(e)=>setLatRaw(e.target.value)}
            onBlur={onLatBlur}
            style={{ width:'100%' }}
          />
          {latDecPreview !== null && (
            <div style={{ fontSize:12, color:'#6b7280' }}>→ {latDecPreview.toFixed(6)}</div>
          )}
        </div>

        <div>
          <label>Longitud (DMS)</label>
          <input
            placeholder={`65°47'02.91"O`}
            value={lngRaw}
            onChange={(e)=>setLngRaw(e.target.value)}
            onBlur={onLngBlur}
            style={{ width:'100%' }}
          />
          {lngDecPreview !== null && (
            <div style={{ fontSize:12, color:'#6b7280' }}>→ {lngDecPreview.toFixed(6)}</div>
          )}
        </div>
      </div>

      {titular && (
        <div style={{ marginTop: 8, padding: 8, background: '#f9fafb', borderRadius: 8 }}>
          <b>Titular</b><br />
          {titular.nombre} — DNI {titular.dni}<br />
          {titular.domicilio}
        </div>
      )}

      {msg && <div style={{ marginTop: 8, color: '#6b7280' }}>{msg}</div>}

      <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={save} disabled={loading}>Guardar</button>
        {lastId && (
          <button onClick={genPdfStream} disabled={loading}>
            Generar PDF {lastActa ? `(${lastActa})` : ''}
          </button>
        )}
        <button onClick={onDone} disabled={loading}>Finalizar</button>
      </div>
    </div>
  );
}
