// frontend/src/usuarios/usuariosService.ts

import type {
  Usuario,
  CreateUsuarioDto,
  UpdateUsuarioDto,
  ChangePasswordDto,
  UsuariosResponse,
  UsuarioResponse,
} from './types';

export class UsuariosService {
  constructor(private api: (input: RequestInfo | string, init?: RequestInit) => Promise<Response>) {}

  /**
   * Obtener todos los usuarios con filtros opcionales
   */
  async getAll(filters?: { rol?: string; activo?: boolean }): Promise<Usuario[]> {
    const params = new URLSearchParams();
    if (filters?.rol) params.append('rol', filters.rol);
    if (filters?.activo !== undefined) params.append('activo', filters.activo.toString());

    const query = params.toString();
    const url = query ? `/api/usuarios?${query}` : '/api/usuarios';

    const r = await this.api(url);
    if (!r.ok) throw new Error(`Error al obtener usuarios: ${r.statusText}`);

    const data: UsuariosResponse = await r.json();
    return data.usuarios;
  }

  /**
   * Obtener un usuario por ID
   */
  async getById(id: number): Promise<Usuario> {
    const r = await this.api(`/api/usuarios/${id}`);
    if (!r.ok) {
      if (r.status === 404) throw new Error('Usuario no encontrado');
      throw new Error(`Error al obtener usuario: ${r.statusText}`);
    }

    const data: UsuarioResponse = await r.json();
    return data.usuario;
  }

  /**
   * Crear nuevo usuario
   */
  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    const r = await this.api('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!r.ok) {
      const errorText = await r.text();
      let errorMessage = 'Error al crear usuario';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Si no es JSON, usar el texto directamente
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: UsuarioResponse = await r.json();
    return data.usuario;
  }

  /**
   * Actualizar usuario
   */
  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const r = await this.api(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!r.ok) {
      const errorText = await r.text();
      let errorMessage = 'Error al actualizar usuario';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: UsuarioResponse = await r.json();
    return data.usuario;
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const r = await this.api(`/api/usuarios/${id}/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!r.ok) {
      const errorText = await r.text();
      let errorMessage = 'Error al cambiar contraseña';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }

  /**
   * Eliminar usuario (soft delete)
   */
  async delete(id: number): Promise<void> {
    const r = await this.api(`/api/usuarios/${id}`, {
      method: 'DELETE',
    });

    if (!r.ok) {
      const errorText = await r.text();
      let errorMessage = 'Error al eliminar usuario';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
  }
}
