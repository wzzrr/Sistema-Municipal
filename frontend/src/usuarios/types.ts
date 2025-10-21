// frontend/src/usuarios/types.ts

export type Role = 'dev' | 'admin' | 'agente';

export interface Usuario {
  id: number;
  email: string;
  nombre?: string;
  rol: Role;
  activo: boolean;
  creado_en: string;
  actualizado_en?: string;
}

export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombre?: string;
  rol: Role;
  activo?: boolean;
}

export interface UpdateUsuarioDto {
  email?: string;
  nombre?: string;
  rol?: Role;
  activo?: boolean;
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface UsuariosResponse {
  usuarios: Usuario[];
}

export interface UsuarioResponse {
  usuario: Usuario;
  message?: string;
}
