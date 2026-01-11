import React from 'react';
import { AlertCircle, Loader2, CheckCircle, RefreshCw, X } from 'lucide-react';

/**
 * Indicateur de statut pour l'état de synchronisation
 */
export function StatusIndicator({ loading, error, isSyncing, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle size={16} />
        <span className="text-sm truncate max-w-48">Erreur</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-1 p-1 rounded hover:bg-red-100"
            title="Réessayer"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-yellow-600">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Synchronisation...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600">
      <CheckCircle size={16} />
      <span className="text-sm">Synchronisé</span>
    </div>
  );
}

/**
 * Message d'erreur toast
 */
export function ErrorMessage({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-100 border border-red-300 rounded-lg shadow-lg z-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
        <div className="flex-1">
          <h4 className="font-medium text-red-800">Erreur de synchronisation</h4>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton de chargement pour le tableau
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse p-4">
      <div className="h-10 bg-gray-200 rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2 py-2 border-b border-gray-100">
          {Array.from({ length: 8 }).map((_, j) => (
            <div key={j} className="h-8 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
