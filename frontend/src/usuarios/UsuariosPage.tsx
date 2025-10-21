// frontend/src/usuarios/UsuariosPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Edit, Trash2, Key, RefreshCw, Filter } from 'lucide-react';
import { useAuth } from '../auth';
import { Card, CardBody, Button, Select, Input } from '../ui';
import { UsuariosService } from './usuariosService';
import UsuarioModal from './UsuarioModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, Role } from './types';

export default function UsuariosPage() {
  const { api, user: currentUser } = useAuth();
  const usuariosService = useMemo(() => new UsuariosService(api), [api]);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filtros
  const [filtroRol, setFiltroRol] = useState<string>('');
  const [filtroActivo, setFiltroActivo] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Permisos
  const canManage = currentUser?.rol === 'dev' || currentUser?.rol === 'admin';

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');

      const filters: any = {};
      if (filtroRol) filters.rol = filtroRol;
      if (filtroActivo) filters.activo = filtroActivo === 'true';

      const data = await usuariosService.getAll(filters);
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, [filtroRol, filtroActivo]);

  // Filtro de búsqueda local
  const usuariosFiltrados = useMemo(() => {
    if (!search.trim()) return usuarios;

    const searchLower = search.toLowerCase();
    return usuarios.filter(
      (u) =>
        u.email.toLowerCase().includes(searchLower) ||
        u.nombre?.toLowerCase().includes(searchLower) ||
        u.rol.toLowerCase().includes(searchLower)
    );
  }, [usuarios, search]);

  const handleCreate = () => {
    setSelectedUsuario(null);
    setModalOpen(true);
  };

  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setModalOpen(true);
  };

  const handleDelete = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setDeleteModalOpen(true);
  };

  const handleSave = async (data: CreateUsuarioDto | UpdateUsuarioDto) => {
    try {
      setModalLoading(true);

      if (selectedUsuario) {
        // Actualizar
        await usuariosService.update(selectedUsuario.id, data as UpdateUsuarioDto);
      } else {
        // Crear
        await usuariosService.create(data as CreateUsuarioDto);
      }

      await loadUsuarios();
      setModalOpen(false);
    } catch (err: any) {
      throw new Error(err.message || 'Error al guardar usuario');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUsuario) return;

    try {
      setModalLoading(true);
      await usuariosService.delete(selectedUsuario.id);
      await loadUsuarios();
      setDeleteModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setModalLoading(false);
    }
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardBody className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Gestión de Usuarios
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Administra los usuarios del sistema
                </p>
              </div>
            </div>

            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                Nuevo Usuario
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Filtros */}
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Buscar por email o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                <option value="">Todos los roles</option>
                <option value="dev">Dev</option>
                <option value="admin">Admin</option>
                <option value="agente">Agente</option>
              </Select>

              <Select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </Select>
            </div>

            <Button variant="outline" onClick={loadUsuarios} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-rose-200 dark:border-rose-800">
          <CardBody className="p-4">
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Tabla */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Cargando usuarios...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    {canManage && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {usuario.email}
                          </div>
                          {usuario.nombre && (
                            <div className="text-sm text-slate-500">
                              {usuario.nombre}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            usuario.activo
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {formatFecha(usuario.creado_en)}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(usuario)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                              onClick={() => handleDelete(usuario)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                              title="Eliminar"
                              disabled={usuario.id === currentUser?.id}
                            >
                              <Trash2
                                className={`w-4 h-4 ${
                                  usuario.id === currentUser?.id
                                    ? 'text-slate-300 dark:text-slate-700'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="text-sm text-slate-500 mb-1">Total Usuarios</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {usuarios.length}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="text-sm text-slate-500 mb-1">Activos</div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {usuarios.filter((u) => u.activo).length}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="text-sm text-slate-500 mb-1">Inactivos</div>
            <div className="text-2xl font-semibold text-slate-600 dark:text-slate-400">
              {usuarios.filter((u) => !u.activo).length}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modales */}
      <UsuarioModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        usuario={selectedUsuario}
        loading={modalLoading}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        usuario={selectedUsuario}
        loading={modalLoading}
      />
    </div>
  );
}
