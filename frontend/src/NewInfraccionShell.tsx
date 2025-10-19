import React from 'react';
import { Camera, Info, FileText, HelpCircle } from 'lucide-react';
import NewInfraccion from './NewInfraccion';
import { Card, CardBody } from './ui'; // ⬅️ reutilizamos el micro-kit

/** Shell visual (Tailwind) que envuelve a NewInfraccion sin tocar su lógica ni props */
export type NewInfraccionShellProps = React.ComponentProps<typeof NewInfraccion>;

export default function NewInfraccionShell(props: NewInfraccionShellProps) {
  return (
    <div className="space-y-4">
      {/* Encabezado descriptivo */}
      <Card>
        <CardBody className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center dark:bg-emerald-900/30 dark:text-emerald-300">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold leading-6">Ingresar infracción</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Cargá la imagen (y opcionalmente el TXT) y completá los datos requeridos. La extracción automática y el guardado funcionan igual.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Layout de dos columnas: izquierda el formulario real, derecha ayudas/estado */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,320px] gap-4">
        <Card>
          <CardBody className="p-0">
            {/* Tu componente original SIN cambios */}
            <div className="p-4 md:p-5">
              <NewInfraccion {...props} />
            </div>
          </CardBody>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-slate-500" />
                <div className="font-medium">Consejos rápidos</div>
              </div>
              <ul className="text-sm text-slate-500 list-disc list-inside space-y-1">
                <li>Usá imágenes claras y sin recortes.</li>
                <li>Verificá el <b>dominio</b> antes de guardar.</li>
                <li>Revisá la <b>fecha de labrado</b> y la <b>velocidad</b>.</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <div className="font-medium">Recordatorio</div>
              </div>
              <p className="text-sm text-slate-500">
                Al guardar, se genera el acta y quedará disponible en <b>Panel</b> y en <b>Consultar</b>.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <div className="font-medium">Soporte</div>
              </div>
              <p className="text-sm text-slate-500">
                Si algo no se completa automáticamente, podés editar los campos manualmente antes de guardar.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
