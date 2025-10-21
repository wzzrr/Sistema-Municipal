// src/TestExtraccion.tsx
import React, { useState } from 'react';
import { useAuth } from './auth.js';

/**
 * TestExtraccion: Componente para probar la extracción de datos desde archivos TXT de cámaras
 * Útil para verificar parsing sin crear infracciones reales
 */
export default function TestExtraccion() {
  const { api } = useAuth();

  const [txtFile, setTxtFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // ---------- upload/extract ----------
  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const r = await api('/api/uploads', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('Error subiendo archivo');
    return r.json() as Promise<{ fileId: string }>;
  };

  const handleTest = async () => {
    if (!txtFile && !imageFile) {
      setError('Debe seleccionar al menos un archivo');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      let txtFileId: string | undefined;
      let imageFileId: string | undefined;

      // Subir archivos
      if (txtFile) {
        const j = await upload(txtFile);
        txtFileId = j.fileId;
      }

      if (imageFile) {
        const j = await upload(imageFile);
        imageFileId = j.fileId;
      }

      // Llamar al endpoint de extracción
      const r = await api('/api/infracciones/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txtFileId,
          imageFileId,
        }),
      });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || `HTTP ${r.status}`);
      }

      const data = await r.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Error en la extracción');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    alert('JSON copiado al portapapeles');
  };

  const reset = () => {
    setTxtFile(null);
    setImageFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="card card--elevated">
        <div className="card__header">
          <h3 className="card__title">Test de Extracción de Datos</h3>
        </div>

        <div className="card__content">
          <p className="text-muted mb-4">
            Sube archivos TXT de cámaras para probar la extracción de datos sin crear una infracción real.
          </p>

          <div className="grid-2">
            <div className="field">
              <label>Archivo TXT (cámara)</label>
              <input
                className="input"
                type="file"
                accept=".txt,.TXT"
                onChange={(e) => setTxtFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
              {txtFile && (
                <div className="help mt-2">
                  Archivo: <code>{txtFile.name}</code>
                </div>
              )}
            </div>

            <div className="field">
              <label>Imagen (opcional)</label>
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
              {imageFile && (
                <div className="help mt-2">
                  Imagen: <code>{imageFile.name}</code>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="alert alert--error mt-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="actions mt-4">
            <button
              className="btn btn--primary"
              onClick={handleTest}
              disabled={loading || (!txtFile && !imageFile)}
            >
              {loading ? 'Extrayendo...' : 'Probar Extracción'}
            </button>
            <button
              className="btn btn--ghost"
              onClick={reset}
              disabled={loading}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {result && (
        <div className="card card--elevated">
          <div className="card__header">
            <h4 className="card__title">Resultados de Extracción</h4>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => copyToClipboard(result)}
            >
              Copiar JSON
            </button>
          </div>

          <div className="card__content">
            {/* OCR/Parsed Data */}
            {result.ocr && Object.keys(result.ocr).length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold mb-2">Datos extraídos del TXT (OCR)</h5>
                <div className="grid-2 gap-3">
                  {Object.entries(result.ocr).map(([key, value]) => (
                    <div key={key} className="field">
                      <label className="text-xs text-muted">{key}</label>
                      <div className="input bg-slate-50 dark:bg-slate-800">
                        {value !== null && value !== undefined ? String(value) : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANPR Data */}
            {result.anpr && Object.keys(result.anpr).length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold mb-2">Datos ANPR</h5>
                <div className="grid-2 gap-3">
                  {Object.entries(result.anpr).map(([key, value]) => (
                    <div key={key} className="field">
                      <label className="text-xs text-muted">{key}</label>
                      <div className="input bg-slate-50 dark:bg-slate-800">
                        {value !== null && value !== undefined ? String(value) : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Archivos */}
            {result.archivos && result.archivos.length > 0 && (
              <div className="mb-4">
                <h5 className="font-semibold mb-2">Archivos</h5>
                <ul className="list-disc list-inside">
                  {result.archivos.map((arch: any, idx: number) => (
                    <li key={idx} className="text-sm">
                      <strong>{arch.tipo}:</strong> <code>{arch.fileId}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* JSON Raw */}
            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Ver JSON completo</summary>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded mt-2 overflow-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
