// frontend/src/usuarios/UsuarioModal.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Card, CardBody, FormRow, Input, Select } from '../ui';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto, Role } from './types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUsuarioDto | UpdateUsuarioDto) => Promise<void>;
  usuario?: Usuario | null; // Si existe, es modo edición
  loading?: boolean;
}

export default function UsuarioModal({
  isOpen,
  onClose,
  onSave,
  usuario,
  loading = false,
}: UsuarioModalProps) {
  const isEdit = !!usuario;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'agente' as Role,
    activo: true,
  });

  const [error, setError] = useState<string>('');

  // Cargar datos del usuario en modo edición
  useEffect(() => {
    if (isOpen && usuario) {
      setFormData({
        email: usuario.email,
        password: '', // No se carga la contraseña
        nombre: usuario.nombre || '',
        rol: usuario.rol,
        activo: usuario.activo,
      });
      setError('');
    } else if (isOpen && !usuario) {
      // Resetear en modo crear
      setFormData({
        email: '',
        password: '',
        nombre: '',
        rol: 'agente',
        activo: true,
      });
      setError('');
    }
  }, [isOpen, usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!isEdit && !formData.password) {
      setError('La contraseña es requerida');
      return;
    }

    if (!isEdit && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      if (isEdit) {
        // Modo edición: solo enviar campos que cambiaron
        const updateData: UpdateUsuarioDto = {};

        // Solo enviar email si cambió
        if (usuario && formData.email !== usuario.email) {
          updateData.email = formData.email;
        }

        // Solo enviar nombre si cambió
        if (usuario && formData.nombre !== (usuario.nombre || '')) {
          updateData.nombre = formData.nombre || undefined;
        }

        // Solo enviar rol si cambió
        if (usuario && formData.rol !== usuario.rol) {
          updateData.rol = formData.rol;
        }

        // Solo enviar activo si cambió
        if (usuario && formData.activo !== usuario.activo) {
          updateData.activo = formData.activo;
        }

        await onSave(updateData);
      } else {
        // Modo creación
        const createData: CreateUsuarioDto = {
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre || undefined,
          rol: formData.rol,
          activo: formData.activo,
        };
        await onSave(createData);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardBody className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormRow label="Email *" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                disabled={loading}
                required
              />
            </FormRow>

            {!isEdit && (
              <FormRow label="Contraseña *" htmlFor="password" help="Mínimo 6 caracteres">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </FormRow>
            )}

            <FormRow label="Nombre" htmlFor="nombre">
              <Input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                disabled={loading}
              />
            </FormRow>

            <FormRow label="Rol *" htmlFor="rol">
              <Select
                id="rol"
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value as Role })}
                disabled={loading}
                required
              >
                <option value="agente">Agente</option>
                <option value="admin">Admin</option>
                <option value="dev">Dev</option>
              </Select>
            </FormRow>

            <FormRow label="Estado" htmlFor="activo">
              <Select
                id="activo"
                value={formData.activo ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                disabled={loading}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </FormRow>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
