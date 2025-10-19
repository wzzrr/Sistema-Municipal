// src/presencial/ActaPresencial.tsx
import React, { useMemo, useState } from 'react';
import { FileText, Printer } from 'lucide-react';
import { useAuth } from '../auth';
import { Button, Card, CardBody, Input, Label, Textarea } from '../ui';

/**
 * Acta Presencial: registro manual en el momento.
 * Guarda en la tabla actas_presenciales vía /api/presencial.
 * Luego permite imprimir ticket PDF desde /api/presencial/:id/ticket.
 */

type FormData = {
  dominio: string;

  // Infractor
  infractor_nombre: string;
  infractor_dni: string;
  infractor_domicilio: string;
  infractor_licencia: string;
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

  // Cinemáticos
  cineMarca?: string;
  cineModelo?: string;
  cineSerie?: string;
  cineAprobacion?: string;

  // Fijos
  tipo_infraccion: string;
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
  const [created, setCreated] = useState<{ id: number; nro_acta?: string } | null>(null);
  const [error, setError] = useState<string>('');

  const [form, setForm] = useState<FormData>({
    dominio: '',
    infractor_nombre: '',
    infractor_dni: '',
    infractor_domicilio: '',
    infractor_licencia: '',
    infractor_cp: '',
    infractor_departamento: '',
    infractor_provincia: '',
    fecha_acta: nowLocalDateTime(),
    tipo_vehiculo: '',
    marca: '',
    modelo: '',
    observaciones: '',
    cineMarca: '',
    cineModelo: '',
    cineSerie: '',
    cineAprobacion: '',
    tipo_infraccion: 'presencial',
    estado: 'notificada',
    notificado: true,
  });

  const setVal = (k: keyof FormData, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v as any }));

  const canSubmit = useMemo(() => {
    return !!form.dominio && !!form.infractor_nombre && !!form.infractor_dni && !!form.infractor_domicilio;
  }, [form]);

  /** Guardar acta presencial en DB */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError('');

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

  /** Abrir ticket PDF desde acta creada */
  const onImprimir = async () => {
    if (!created?.id) return;
    try {
      setTicketLoading(true);
      // Se abre en nueva pestaña: útil en PDA o escritorio
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
            Registro manual para infracciones con detenimiento. Imprime ticket en formato “comandera”.
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <form className="p-4 md:p-5" onSubmit={onSubmit}>
            <Label>Dominio</Label>
            <Input value={form.dominio} onChange={(e) => setVal('dominio', e.target.value.toUpperCase())} />

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
                Ticket PDF
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
