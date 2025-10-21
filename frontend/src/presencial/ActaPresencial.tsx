// src/presencial/ActaPresencial.tsx
import React, { useMemo, useState } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import { useAuth } from '../auth';
import { Button, Card, CardBody, Input, Label, Textarea } from '../ui';

/**
 * Acta Presencial: registro manual en el momento.
 * Guarda en la tabla actas_presenciales vía /api/presencial.
 * Luego permite imprimir ticket PNG (Zebra ZQ520) desde /api/presencial/:id/ticket.
 */

type FormData = {
  dominio: string;

  // Infractor
  infractor_nombre: string;
  infractor_dni: string;
  infractor_domicilio: string;
  infractor_licencia: string;
  infractor_licencia_clase: string;
  infractor_cp: string;
  infractor_departamento: string;
  infractor_provincia: string;

  // Fecha Acta
  fecha_acta: string;

  // Vehículo
  tipo_vehiculo: string;
  marca: string;
  modelo: string;

  // Titular (invisible)
  titular?: string;
  titular_dni?: string;
  titular_domicilio?: string;

  // Otros
  observaciones?: string;
  lugar_infraccion?: string;
  remitido_a?: string;

  // Cinemáticos
  cineMarca?: string;
  cineModelo?: string;
  cineSerie?: string;
  cineAprobacion?: string;

  // Tipo de infracción y velocidades
  tipo_infraccion: string;
  velocidad_medida?: number;
  velocidad_limite?: number;

  // Fijos
  estado: string;
  notificado: boolean;
};

function nowLocalDateTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ActaPresencial() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [created, setCreated] = useState<{ id: number; nro_acta?: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [consultaSuccess, setConsultaSuccess] = useState<string>('');

  const [form, setForm] = useState<FormData>({
    dominio: '',
    infractor_nombre: '',
    infractor_dni: '',
    infractor_domicilio: '',
    infractor_licencia: '',
    infractor_licencia_clase: '',
    infractor_cp: '',
    infractor_departamento: '',
    infractor_provincia: '',
    fecha_acta: nowLocalDateTime(),
    tipo_vehiculo: '',
    marca: '',
    modelo: '',
    observaciones: '',
    lugar_infraccion: '',
    remitido_a: '',
    // Valores por defecto para datos cinemáticos
    cineMarca: 'TRUCAM II',
    cineModelo: 'TC 009925',
    cineSerie: '',
    cineAprobacion: '19/10/26',
    tipo_infraccion: 'Exceso de velocidad',
    velocidad_medida: undefined,
    velocidad_limite: undefined,
    estado: 'notificada',
    notificado: true,
  });

  const setVal = (k: keyof FormData, v: string | boolean | number | undefined) =>
    setForm((f) => ({ ...f, [k]: v as any }));

  const canSubmit = useMemo(() => {
    return !!form.dominio && !!form.infractor_nombre && !!form.infractor_dni && !!form.infractor_domicilio;
  }, [form]);

  /** Consultar datos del titular por dominio */
  const onConsultarDominio = async () => {
    if (!form.dominio) {
      setError('Debe ingresar un dominio');
      return;
    }

    try {
      setConsultaLoading(true);
      setError('');
      setConsultaSuccess('');

      const r = await api(`/api/titulares/${form.dominio.toUpperCase()}`, {
        method: 'GET',
      });

      if (!r.ok) {
        if (r.status === 404) {
          setError(`No se encontraron datos para el dominio ${form.dominio}`);
        } else {
          const txt = await r.text();
          throw new Error(txt || `HTTP ${r.status}`);
        }
        return;
      }

      const data = await r.json();

      // Rellenar campos del formulario con datos del titular y vehículo
      setForm((f) => ({
        ...f,
        // Datos del titular
        titular: data.nombre,
        titular_dni: data.dni,
        titular_domicilio: data.domicilio,
        // Si el infractor es el titular, pre-completar también los datos del infractor
        infractor_nombre: f.infractor_nombre || data.nombre,
        infractor_dni: f.infractor_dni || data.dni,
        infractor_domicilio: f.infractor_domicilio || data.domicilio,
        infractor_cp: f.infractor_cp || data.cp,
        infractor_departamento: f.infractor_departamento || data.departamento,
        infractor_provincia: f.infractor_provincia || data.provincia,
        // Datos del vehículo
        tipo_vehiculo: data.tipo_vehiculo || f.tipo_vehiculo,
        marca: data.marca || f.marca,
        modelo: data.modelo || f.modelo,
      }));

      setConsultaSuccess(`Datos cargados: ${data.nombre} - ${data.marca} ${data.modelo}`);
    } catch (e: any) {
      setError(e.message || 'Error al consultar el dominio');
    } finally {
      setConsultaLoading(false);
    }
  };

  /** Guardar acta presencial en DB */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError('');
      setConsultaSuccess('');

      const payload = { ...form, fecha_notificacion: form.fecha_acta };
      const r = await api('/api/presencial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
      const data = JSON.parse(txt);
      setCreated(data);
    } catch (e: any) {
      setError(e.message || 'No se pudo guardar el acta');
    } finally {
      setLoading(false);
    }
  };

  /** Abrir/descargar ticket PNG desde acta creada */
  const onImprimir = async () => {
    if (!created?.id) return;
    try {
      setTicketLoading(true);
      // Se abre en nueva pestaña para visualizar o descargar PNG
      window.open(`/api/presencial/${created.id}/ticket`, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      setError(e.message || 'No se pudo generar el ticket');
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="p-5">
          <div className="text-lg font-semibold">Acta presencial (en el acto)</div>
          <div className="text-sm text-slate-500">
            Registro manual para infracciones con detenimiento. Genera ticket PNG optimizado para impresora Zebra ZQ520.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <form className="p-4 md:p-5" onSubmit={onSubmit}>
            <Label>Dominio</Label>
            <div className="flex gap-2">
              <Input
                value={form.dominio}
                onChange={(e) => setVal('dominio', e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onConsultarDominio}
                disabled={!form.dominio || consultaLoading}
              >
                <Search className="w-4 h-4" />
                {consultaLoading ? 'Consultando...' : 'Consultar'}
              </Button>
            </div>
            {consultaSuccess && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                ✓ {consultaSuccess}
              </div>
            )}

            <Label>Fecha y hora del acta</Label>
            <Input type="datetime-local" value={form.fecha_acta} onChange={(e) => setVal('fecha_acta', e.target.value)} />

            <Label>Infractor — Nombre y Apellido</Label>
            <Input value={form.infractor_nombre} onChange={(e) => setVal('infractor_nombre', e.target.value)} />

            <Label>Infractor — DNI</Label>
            <Input value={form.infractor_dni} onChange={(e) => setVal('infractor_dni', e.target.value)} />

            <Label>Domicilio</Label>
            <Input value={form.infractor_domicilio} onChange={(e) => setVal('infractor_domicilio', e.target.value)} />

            <Label>N° de Licencia</Label>
            <Input value={form.infractor_licencia} onChange={(e) => setVal('infractor_licencia', e.target.value)} />

            <Label>Clase de licencia</Label>
            <Input value={form.infractor_licencia_clase} onChange={(e) => setVal('infractor_licencia_clase', e.target.value)} placeholder="Ej: B1, B2, C, D" />

            <Label>Cod. Postal</Label>
            <Input value={form.infractor_cp} onChange={(e) => setVal('infractor_cp', e.target.value)} />

            <Label>Departamento</Label>
            <Input value={form.infractor_departamento} onChange={(e) => setVal('infractor_departamento', e.target.value)} />

            <Label>Provincia</Label>
            <Input value={form.infractor_provincia} onChange={(e) => setVal('infractor_provincia', e.target.value)} />

            <Label>Tipo de vehículo</Label>
            <Input value={form.tipo_vehiculo} onChange={(e) => setVal('tipo_vehiculo', e.target.value)} />

            <Label>Marca</Label>
            <Input value={form.marca} onChange={(e) => setVal('marca', e.target.value)} />

            <Label>Modelo</Label>
            <Input value={form.modelo} onChange={(e) => setVal('modelo', e.target.value)} />

            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(e) => setVal('observaciones', e.target.value)} rows={2} />

            <Label>Lugar de infracción</Label>
            <Input value={form.lugar_infraccion} onChange={(e) => setVal('lugar_infraccion', e.target.value)} placeholder="Ubicación específica donde ocurrió la infracción" />

            <Label>Remitido a</Label>
            <Input value={form.remitido_a} onChange={(e) => setVal('remitido_a', e.target.value)} placeholder="Autoridad o dependencia a la que se remite" />

            <div className="mt-3 border-t pt-3 text-sm text-slate-500">Tipo de infracción</div>

            <Label>Tipo de infracción</Label>
            <Input value={form.tipo_infraccion} onChange={(e) => setVal('tipo_infraccion', e.target.value)} placeholder="Ej: Exceso de velocidad" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Velocidad medida (km/h)</Label>
                <Input
                  type="number"
                  value={form.velocidad_medida || ''}
                  onChange={(e) => setVal('velocidad_medida', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ej: 80"
                />
              </div>
              <div>
                <Label>Velocidad límite (km/h)</Label>
                <Input
                  type="number"
                  value={form.velocidad_limite || ''}
                  onChange={(e) => setVal('velocidad_limite', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ej: 60"
                />
              </div>
            </div>

            <div className="mt-3 border-t pt-3 text-sm text-slate-500">Datos del cinemático</div>

            <Label>Marca del equipo</Label>
            <Input value={form.cineMarca} onChange={(e) => setVal('cineMarca', e.target.value)} />

            <Label>Modelo</Label>
            <Input value={form.cineModelo} onChange={(e) => setVal('cineModelo', e.target.value)} />

            <Label>N° de Serie</Label>
            <Input value={form.cineSerie} onChange={(e) => setVal('cineSerie', e.target.value)} />

            <Label>Fecha de aprobación (DD-MM-AAAA)</Label>
            <Input value={form.cineAprobacion} onChange={(e) => setVal('cineAprobacion', e.target.value)} />

            {error && <div className="text-sm text-rose-500 mt-2">{error}</div>}

            <div className="flex items-center gap-3 mt-4">
              <Button type="submit" disabled={!canSubmit || loading}>
                <FileText className="w-4 h-4" />
                {loading ? 'Guardando…' : 'Guardar acta'}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={!created?.id || ticketLoading}
                onClick={onImprimir}
              >
                <Printer className="w-4 h-4" />
                Ticket PNG
              </Button>

              {created?.nro_acta && (
                <span className="text-sm text-slate-500">
                  Nro acta: <b className="font-mono">{created.nro_acta}</b>
                </span>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
