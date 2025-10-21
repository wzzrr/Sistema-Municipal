import React, { useEffect, useState } from 'react';
import { useAuth } from './auth';

type Titular = {
  dominio: string;
  nombre: string;
  dni: string;
  domicilio: string;
  cp?: string;
  departamento?: string;
  provincia?: string;
  tipo_vehiculo?: string;
  marca?: string;
  modelo?: string;
} | null;

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

export default function NewInfraccion({ onDone }: { onDone: () => void }) {
  const { api } = useAuth();

  // Archivos seleccionados (imagen + txt opcional)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');

  // IDs de /api/uploads
  const [imageFileId, setImageFileId] = useState<string>('');
  const [txtFileId, setTxtFileId]     = useState<string>('');

  // Estado de validación
  const [filesError, setFilesError] = useState<string>('');

  const [dominio, setDominio] = useState('');
  const [titular, setTitular] = useState<Titular>(null);

  const [ubicacion_texto, setUbicacion] = useState('');
  const [fecha_labrado, setFecha]       = useState<string>('');

  // NUEVO: arteria
  const [arteria, setArteria] = useState<string>('');

  // Fecha de Notificación (antes era emision_texto)
  const [fecha_notificacion, setFechaNotificacion] = useState<string>('');

  // velocidad medida
  const [velocidad_medida, setVM] = useState<number>(0);

  // N° de serie de la cámara (TruCam)
  const [cam_serie, setCamSerie] = useState<string>('');

  // Campos de vehículo
  const [tipo_vehiculo, setTipoVehiculo] = useState('');
  const [vehiculo_marca, setMarca]       = useState('');
  const [vehiculo_modelo, setModelo]     = useState('');

  // Campos de titular
  const [titular_nombre, setTitularNombre] = useState('');
  const [titular_dni_cuit, setTitularDniCuit] = useState('');
  const [titular_domicilio, setTitularDomicilio] = useState('');
  const [titular_cp, setTitularCp] = useState('');
  const [titular_departamento, setTitularDepartamento] = useState('');
  const [titular_provincia, setTitularProvincia] = useState('');

  // Estado de consulta de dominio
  const [consultandoDominio, setConsultandoDominio] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState('');

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

  // ---------- validación de archivos ----------
  const validateFiles = (files: File[]): { valid: boolean; error: string } => {
    if (files.length === 0) {
      return { valid: false, error: 'Debe seleccionar al menos una imagen' };
    }

    if (files.length > 2) {
      return { valid: false, error: 'Máximo 2 archivos: 1 imagen + 1 TXT (opcional)' };
    }

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const txtFiles = files.filter(f => f.name.toLowerCase().endsWith('.txt'));
    const otherFiles = files.filter(f => !f.type.startsWith('image/') && !f.name.toLowerCase().endsWith('.txt'));

    if (imageFiles.length === 0) {
      return { valid: false, error: 'Debe incluir al menos una imagen' };
    }

    if (imageFiles.length > 1) {
      return { valid: false, error: 'Solo puede subir 1 imagen' };
    }

    if (txtFiles.length > 1) {
      return { valid: false, error: 'Solo puede subir 1 archivo TXT' };
    }

    if (otherFiles.length > 0) {
      return { valid: false, error: 'Solo se permiten archivos de imagen y TXT' };
    }

    return { valid: true, error: '' };
  };

  // ---------- manejo de selección de archivos ----------
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedFiles([]);
      setImagePreview('');
      setFilesError('');
      return;
    }

    const fileArray = Array.from(files);
    const validation = validateFiles(fileArray);

    if (!validation.valid) {
      setFilesError(validation.error);
      setSelectedFiles([]);
      setImagePreview('');
      return;
    }

    setSelectedFiles(fileArray);
    setFilesError('');

    // Generar preview de imagen
    const imageFile = fileArray.find(f => f.type.startsWith('image/'));
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  };

  // ---------- drag & drop ----------
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    handleFileSelect(files);
  };

  // ---------- upload/extract ----------
  const handleUpload = async () => {
    try {
      if (selectedFiles.length === 0) {
        setMsg('Debe seleccionar archivos primero');
        return;
      }

      setMsg('Subiendo archivos...');

      const fd = new FormData();
      selectedFiles.forEach(file => {
        fd.append('files', file);
      });

      const r = await api('/api/uploads/pair', { method: 'POST', body: fd });
      if (!r.ok) {
        const errorText = await r.text();
        throw new Error(errorText || 'Error subiendo archivos');
      }

      const uploadResult = await r.json();

      // Guardar los IDs
      const localImageId = uploadResult.image?.fileId || '';
      const localTxtId = uploadResult.txt?.fileId || '';

      setImageFileId(localImageId);
      setTxtFileId(localTxtId);

      // Si hay archivo TXT, extraer datos
      if (localTxtId) {
        setMsg('Extrayendo datos del TXT...');
        const r2 = await api('/api/infracciones/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txtFileId: localTxtId,
            imageFileId: localImageId,
          }),
        });

        if (!r2.ok) throw new Error('Error extrayendo datos');
        const extractData = await r2.json();
        const ocr = extractData.ocr || {};

        setUbicacion(ocr.ubicacion_texto || '');
        if (ocr.fecha_labrado) setFecha(ocr.fecha_labrado);
        if (ocr.velocidad_medida !== undefined) setVM(Number(ocr.velocidad_medida));
        if (ocr.cam_serie) setCamSerie(ocr.cam_serie);
        if (!dominio && ocr.dominio) setDominio(ocr.dominio);
        if (ocr.arteria) setArteria(ocr.arteria);

        setMsg('✓ Archivos subidos y datos extraídos correctamente');
      } else {
        setMsg('✓ Imagen subida correctamente (sin TXT)');
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message || 'Error desconocido'}`);
    }
  };

  // ---------- titular ----------
  const fetchTitular = async () => {
    if (!dominio) {
      setErrorConsulta('Debe ingresar un dominio');
      return;
    }

    setConsultandoDominio(true);
    setErrorConsulta('');
    setTitular(null);

    try {
      const r = await api(`/api/titulares/${dominio.toUpperCase()}`);

      if (!r.ok) {
        if (r.status === 404) {
          setErrorConsulta(`No se encontraron datos para el dominio ${dominio}`);
        } else {
          const txt = await r.text();
          setErrorConsulta(txt || `Error HTTP ${r.status}`);
        }
        return;
      }

      const data = await r.json();
      setTitular(data);

      // Autocompletar campos del titular
      setTitularNombre(data.nombre || '');
      setTitularDniCuit(data.dni || '');
      setTitularDomicilio(data.domicilio || '');
      setTitularCp(data.cp || '');
      setTitularDepartamento(data.departamento || '');
      setTitularProvincia(data.provincia || '');

      // Autocompletar datos del vehículo si vienen
      if (data.tipo_vehiculo) setTipoVehiculo(data.tipo_vehiculo);
      if (data.marca) setMarca(data.marca);
      if (data.modelo) setModelo(data.modelo);

      setMsg(`Datos cargados: ${data.nombre} - ${data.marca || ''} ${data.modelo || ''}`);
    } catch (e: any) {
      setErrorConsulta(e.message || 'Error al consultar el dominio');
    } finally {
      setConsultandoDominio(false);
    }
  };

  useEffect(() => {}, []);

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

  // ---------- autocompletar fecha de notificación con fecha/hora actual ----------
  const autocompletarFechaNotificacion = () => {
    const now = new Date();
    setFechaNotificacion(now.toISOString());
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
        fecha_notificacion: fecha_notificacion || undefined,
        velocidad_medida: Number(velocidad_medida) || 0,
        ubicacion_texto,
        lat, lng,
        foto_file_id: imageFileId || undefined,

        // vehículo
        tipo_vehiculo,
        vehiculo_marca,
        vehiculo_modelo,

        // número de serie
        cam_serie: cam_serie || undefined,

        // arteria
        arteria: arteria || undefined,

        // titular
        titular_nombre: titular_nombre || undefined,
        titular_dni_cuit: titular_dni_cuit || undefined,
        titular_domicilio: titular_domicilio || undefined,
        titular_cp: titular_cp || undefined,
        titular_departamento: titular_departamento || undefined,
        titular_provincia: titular_provincia || undefined,
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
        {/* Uploads - Input Unificado con Drag & Drop */}
        <div className="field">
          <label className="font-semibold text-base mb-2">
            Archivos de Infracción
            <span className="text-sm text-muted font-normal ml-2">
              (1 imagen + 1 TXT opcional)
            </span>
          </label>

          {/* Zona de Drag & Drop */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-all
              ${isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }
            `}
          >
            <input
              id="file-input"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              type="file"
              multiple
              accept="image/*,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            <div className="pointer-events-none">
              <div className="text-4xl mb-2">
                {isDragging ? '📥' : '📎'}
              </div>
              <p className="text-base font-medium mb-1">
                {isDragging
                  ? 'Suelta los archivos aquí'
                  : 'Arrastra archivos aquí o haz clic para seleccionar'
                }
              </p>
              <p className="text-sm text-muted">
                Formatos aceptados: JPG, PNG + TXT (opcional)
              </p>
            </div>
          </div>

          {filesError && (
            <div className="text-sm text-rose-600 mt-2 font-medium">
              ⚠ {filesError}
            </div>
          )}

          {/* Lista de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
              <div className="text-sm font-semibold mb-2">Archivos seleccionados:</div>
              <ul className="text-sm space-y-1">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-slate-600">
                      {file.type.startsWith('image/') ? '📷' : '📄'}
                    </span>
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview de imagen */}
          {imagePreview && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Vista previa:</div>
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full h-auto max-h-64 rounded border border-slate-300 shadow-sm"
              />
            </div>
          )}

          {/* Confirmación de archivos subidos */}
          {(imageFileId || txtFileId) && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded">
              <div className="text-sm font-semibold text-emerald-800 mb-1">
                ✓ Archivos subidos al servidor:
              </div>
              {imageFileId && (
                <div className="text-xs text-emerald-700">
                  Imagen: <code className="bg-white px-1 rounded">{imageFileId}</code>
                </div>
              )}
              {txtFileId && (
                <div className="text-xs text-emerald-700">
                  TXT: <code className="bg-white px-1 rounded">{txtFileId}</code>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="actions mt-4">
          <button
            className="btn btn--primary"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
          >
            {selectedFiles.length > 0 ? 'Subir y procesar archivos' : 'Seleccione archivos primero'}
          </button>
        </div>

        {/* Consulta de Dominio */}
        <div className="mt-6">
          <label className="font-semibold">Dominio</label>
          <div className="flex gap-2 mt-1">
            <input
              className="input flex-1"
              value={dominio}
              onChange={(e) => setDominio(e.target.value.toUpperCase())}
              placeholder="AC091PZ"
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={fetchTitular}
              disabled={!dominio || consultandoDominio}
            >
              {consultandoDominio ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
          {errorConsulta && (
            <div className="text-sm text-rose-500 mt-1">{errorConsulta}</div>
          )}
        </div>

        {/* Datos del Titular (autocompletados desde consulta) */}
        {titular && (
          <div className="card mt-6">
            <div className="card__content">
              <div className="text-sm text-muted mb-2">✓ Datos del titular cargados desde base de datos</div>
              <div className="grid-3">
                <div className="field">
                  <label>Titular — Nombre</label>
                  <input className="input" value={titular_nombre} onChange={(e) => setTitularNombre(e.target.value)} />
                </div>
                <div className="field">
                  <label>DNI/CUIT</label>
                  <input className="input" value={titular_dni_cuit} onChange={(e) => setTitularDniCuit(e.target.value)} />
                </div>
                <div className="field">
                  <label>Domicilio</label>
                  <input className="input" value={titular_domicilio} onChange={(e) => setTitularDomicilio(e.target.value)} />
                </div>
                <div className="field">
                  <label>CP</label>
                  <input className="input" value={titular_cp} onChange={(e) => setTitularCp(e.target.value)} />
                </div>
                <div className="field">
                  <label>Departamento</label>
                  <input className="input" value={titular_departamento} onChange={(e) => setTitularDepartamento(e.target.value)} />
                </div>
                <div className="field">
                  <label>Provincia</label>
                  <input className="input" value={titular_provincia} onChange={(e) => setTitularProvincia(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Datos básicos */}
        <div className="grid-2 mt-6">
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
            <label>Fecha de Notificación</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="datetime-local"
                value={fecha_notificacion ? fecha_notificacion.substring(0, 16) : ''}
                onChange={(e) => setFechaNotificacion(new Date(e.target.value).toISOString())}
              />
              <button
                type="button"
                className="btn"
                onClick={autocompletarFechaNotificacion}
                title="Usar fecha/hora actual"
              >
                Ahora
              </button>
            </div>
            <div className="help mt-1 text-xs">Fecha y hora en que se notifica al titular (opcional)</div>
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
