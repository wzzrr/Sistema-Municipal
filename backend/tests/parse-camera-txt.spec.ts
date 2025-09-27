// backend/tests/parse-camera-txt.spec.ts
import { parseCameraTxt } from '../src/infracciones/parse-camera-txt';

const sample = `Nr Serial=TC009925
Firmware=4.7.36  100.200.1.19
Fecha=12/06/2025
Hora=10:55:16
ID Operador=
Nombre del Operador=sicam
Ubicación=AYACUCHO
Nro de Calle=
Ultima alineación=21/10/2024 11:45:24
Modo=SPEED
Velocidad medida=35 km/h
Distancia medida=48.8 m
Velocidad máxima autorizada=30 km/h
`;

describe('parseCameraTxt', () => {
  it('extrae campos clave de formato clave=valor', () => {
    const r = parseCameraTxt(sample);
    expect(r.cam_serie).toBe('TC009925');
    expect(r.ubicacion_texto).toBe('AYACUCHO');
    expect(r.velocidad_medida).toBe(35);
    expect(r.velocidad_autorizada).toBe(30);
    expect(r.fecha_labrado).toBe('2025-06-12T10:55:16.000Z'); // según implementación (UTC)
  });
});
