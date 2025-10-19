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

function parseDMS(input: string): { dec: number, g:number, m:number, s:number, hemi?: 'N'|'S'|'E'|'W' } | null {
  if (!input) return null;
  let str = input.trim()
    .replace(/,/g, '.')
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

/** Formatea una fecha (ISO) al estilo "02 DE OCTUBRE DE 2025" (ES-AR) */
function toFechaTextoUpper(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const txt = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  return txt.replace(/ de /g, ' DE ').toUpperCase();
}

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

  // NUEVO: arteria
  const [arteria, setArteria] = useState<string>('');

  // NUEVO: emision_texto
  const [emision_texto, setEmisionTexto] = useState<string>('');

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

      setUbicacion(ocr.ubicacion_texto || '');
      if (ocr.fecha_labrado) setFecha(ocr.fecha_labrado);
      if (ocr.velocidad_medida !== undefined) setVM(Number(ocr.velocidad_medida));
      if (ocr.cam_serie) setCamSerie(ocr.cam_serie);
      if (!dominio && ocr.dominio) setDominio(ocr.dominio);

      if (ocr.arteria) setArteria(ocr.arteria);
      if (ocr.emision_texto) setEmisionTexto(ocr.emision_texto);

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

  // ---------- helpers emision_texto ----------
  const autocompletarEmisionConLabrado = () => {
    if (fecha_labrado) {
      setEmisionTexto(toFechaTextoUpper(fecha_labrado));
    } else {
      setEmisionTexto(toFechaTextoUpper()); // hoy
    }
  };

  const autocompletarEmisionHoy = () => {
    setEmisionTexto(toFechaTextoUpper());
  };

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

        // NUEVOS
        arteria: arteria || undefined,
        emision_texto: emision_texto || undefined,
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
      setMsg(`Guardado OK. Acta: ${j.nro_acta || j.id}.`);
    } catch (e:any) {
      setMsg(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  // ---------- PDF (preview/descarga directa desde API) ----------
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
    <div className="card card--elevated mb-6">
      <div className="card__header">
        <h3 className="card__title">Nueva Infracción</h3>
      </div>

      <div className="card__content">
        {/* Uploads */}
        <div className="grid-2">
          <div className="field">
            <label>Imagen</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {imageFileId && (
              <div className="help mt-2">
                Foto subida: <code>{imageFileId}</code>
              </div>
            )}
          </div>

          <div className="field">
            <label>TXT (opcional)</label>
            <input
              className="input"
              type="file"
              accept=".txt,.TXT"
              onChange={(e) => setTxtFile(e.target.files?.[0] || null)}
            />
            {txtFileId && (
              <div className="help mt-2">
                TXT subido: <code>{txtFileId}</code>
              </div>
            )}
          </div>
        </div>

        <div className="actions mt-4">
          <button className="btn btn--primary" onClick={handleUpload}>Subir y extraer (TXT)</button>
        </div>

        {/* Datos básicos */}
        <div className="grid-2 mt-6">
          <div className="field">
            <label>Dominio</label>
            <input
              className="input"
              value={dominio}
              onChange={(e) => setDominio(e.target.value)}
              onBlur={onDominioBlur}
              placeholder="AC091PZ"
            />
          </div>

          <div className="field">
            <label>Fecha labrado</label>
            <input
              className="input"
              type="datetime-local"
              value={fecha_labrado ? fecha_labrado.substring(0, 16) : ''}
              onChange={(e) => setFecha(new Date(e.target.value).toISOString())}
            />
          </div>

          <div className="field">
            <label>Ubicación</label>
            <input className="input" value={ubicacion_texto} onChange={(e) => setUbicacion(e.target.value)} />
          </div>

          <div className="field">
            <label>Arteria</label>
            <input
              className="input"
              list="arterias"
              value={arteria}
              onChange={(e)=>setArteria(e.target.value)}
              placeholder="AVENIDA / CALLE / RUTA / AUTOPISTA"
            />
            <datalist id="arterias">
              <option value="AVENIDA" />
              <option value="CALLE" />
              <option value="RUTA" />
              <option value="AUTOPISTA" />
              <option value="BOULEVARD" />
            </datalist>
          </div>
        </div>

        {/* Emisión */}
        <div className="field mt-6">
          <label>Emisión (texto)</label>
          <input
            className="input"
            value={emision_texto}
            onChange={(e) => setEmisionTexto(e.target.value)}
            placeholder="CATAMARCA, 02 DE OCTUBRE DE 2025"
          />
          <div className="actions mt-2">
            <button type="button" className="btn" onClick={autocompletarEmisionConLabrado} title="Usar fecha de labrado (o hoy)">
              Autocompletar
            </button>
            <button type="button" className="btn btn--ghost" onClick={autocompletarEmisionHoy} title="Usar hoy">
              Hoy
            </button>
          </div>
          <div className="help mt-2">
            * Campo libre (texto). Usá los botones para generar rápidamente desde fecha de labrado u hoy.
          </div>
        </div>

        {/* Velocidad / Cámara */}
        <div className="grid-2 mt-6">
          <div className="field">
            <label>Velocidad medida</label>
            <input
              className="input"
              type="number"
              value={velocidad_medida}
              onChange={(e) => setVM(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label>N° Serie cámara (TruCam II)</label>
            <input
              className="input"
              value={cam_serie}
              onChange={(e)=>setCamSerie(e.target.value)}
              placeholder="TC009925"
            />
          </div>
        </div>

        {/* Vehículo */}
        <div className="grid-3 mt-6">
          <div className="field">
            <label>Tipo de Vehículo</label>
            <input className="input" value={tipo_vehiculo} onChange={(e)=>setTipoVehiculo(e.target.value)} placeholder="AUTOMÓVIL" />
          </div>
          <div className="field">
            <label>Marca</label>
            <input className="input" value={vehiculo_marca} onChange={(e)=>setMarca(e.target.value)} placeholder="Volkswagen" />
          </div>
          <div className="field">
            <label>Modelo</label>
            <input className="input" value={vehiculo_modelo} onChange={(e)=>setModelo(e.target.value)} placeholder="Gol" />
          </div>
        </div>

        {/* Lat/Lng (DMS) */}
        <div className="grid-2 mt-6">
          <div className="field">
            <label>Latitud (DMS)</label>
            <input
              className="input"
              placeholder={`28°27'42.85"S`}
              value={latRaw}
              onChange={(e)=>setLatRaw(e.target.value)}
              onBlur={onLatBlur}
            />
            {latDecPreview !== null && (
              <div className="help mt-2">→ {latDecPreview.toFixed(6)}</div>
            )}
          </div>

          <div className="field">
            <label>Longitud (DMS)</label>
            <input
              className="input"
              placeholder={`65°47'02.91"O`}
              value={lngRaw}
              onChange={(e)=>setLngRaw(e.target.value)}
              onBlur={onLngBlur}
            />
            {lngDecPreview !== null && (
              <div className="help mt-2">→ {lngDecPreview.toFixed(6)}</div>
            )}
          </div>
        </div>

        {/* Titular */}
        {titular && (
          <div className="card mt-6">
            <div className="card__content">
              <b>Titular</b><br />
              {titular.nombre} — DNI {titular.dni}<br />
              {titular.domicilio}
            </div>
          </div>
        )}

        {/* Mensajes */}
        {msg && <div className="text-muted mt-4">{msg}</div>}
      </div>

      <div className="card__footer">
        <button className="btn btn--primary" onClick={save} disabled={loading}>Guardar</button>
        {lastId && (
          <button className="btn btn--success" onClick={genPdfStream} disabled={loading}>
            Generar PDF {lastActa ? `(${lastActa})` : ''}
          </button>
        )}
        <div className="spacer" />
        <button className="btn" onClick={onDone} disabled={loading}>Finalizar</button>
      </div>
    </div>
  );
}
