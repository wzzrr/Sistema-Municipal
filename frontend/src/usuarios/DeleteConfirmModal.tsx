// frontend/src/usuarios/DeleteConfirmModal.tsx

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button, Card, CardBody } from '../ui';
import type { Usuario } from './types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  usuario: Usuario | null;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  usuario,
  loading = false,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // El error se maneja en el componente padre
    }
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardBody className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Eliminar Usuario
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ¿Estás seguro de que deseas desactivar a este usuario?
            </p>
          </div>

          {/* Usuario Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
            <div className="text-sm">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {usuario.email}
              </div>
              {usuario.nombre && (
                <div className="text-slate-600 dark:text-slate-400 mt-1">
                  {usuario.nombre}
                </div>
              )}
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-2 capitalize">
                Rol: {usuario.rol}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Nota:</strong> El usuario será desactivado pero no eliminado permanentemente.
              Podrás reactivarlo más tarde si es necesario.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700"
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
