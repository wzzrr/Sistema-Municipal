// src/usuarios/interfaces/usuario.interface.ts

export interface Usuario {
  id: number;
  email: string;
  nombre?: string;
  rol: 'dev' | 'admin' | 'agente';
  activo: boolean;
  creado_en: Date;
  actualizado_en?: Date;
}
