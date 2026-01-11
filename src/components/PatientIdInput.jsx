import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePatientLookup } from '../hooks/usePatientLookup';
import { Loader2 } from 'lucide-react';

/**
 * Input amélioré pour id_patient avec auto-remplissage
 * Quand l'utilisateur entre un ID patient existant, les colonnes fixes sont auto-remplies
 */
export function PatientIdInput({
  value,
  rowId,
  onUpdateCell,
  onAutoFill,
  className
}) {
  const [isLooking, setIsLooking] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { lookupPatient, getPatientIds } = usePatientLookup();
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Charger les IDs patients pour l'autocomplétion
  useEffect(() => {
    getPatientIds().then(setSuggestions);
  }, [getPatientIds]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gérer le changement d'input
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    onUpdateCell(rowId, 'id_patient', newValue);

    // Afficher les suggestions filtrées
    if (newValue.length > 0) {
      const filtered = suggestions.filter(id =>
        id.toLowerCase().includes(newValue.toLowerCase())
      );
      setShowSuggestions(filtered.length > 0 && filtered[0] !== newValue);
    } else {
      setShowSuggestions(false);
    }
  }, [rowId, onUpdateCell, suggestions]);

  // Gérer le blur - déclencher la recherche patient
  const handleBlur = useCallback(async () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);

    if (!value || value.trim() === '') return;

    // Annuler tout debounce en cours
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce de la recherche
    debounceRef.current = setTimeout(async () => {
      setIsLooking(true);

      try {
        const patientData = await lookupPatient(value);

        if (patientData) {
          console.log('Auto-remplissage des données patient:', patientData);
          onAutoFill(rowId, patientData);
        }
      } finally {
        setIsLooking(false);
      }
    }, 300);
  }, [value, rowId, lookupPatient, onAutoFill]);

  // Gérer le clic sur une suggestion
  const handleSuggestionClick = useCallback(async (patientId) => {
    onUpdateCell(rowId, 'id_patient', patientId);
    setShowSuggestions(false);

    // Rechercher et auto-remplir immédiatement
    setIsLooking(true);
    try {
      const patientData = await lookupPatient(patientId);
      if (patientData) {
        onAutoFill(rowId, patientData);
      }
    } finally {
      setIsLooking(false);
    }
  }, [rowId, onUpdateCell, lookupPatient, onAutoFill]);

  // Filtrer les suggestions
  const filteredSuggestions = suggestions.filter(id =>
    value && id.toLowerCase().includes(value.toLowerCase()) && id !== value
  ).slice(0, 5);

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => filteredSuggestions.length > 0 && setShowSuggestions(true)}
        className={`${className} ${isLooking ? 'bg-yellow-50' : ''} pr-6`}
        placeholder="ID Patient"
      />

      {/* Indicateur de chargement */}
      {isLooking && (
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
          <Loader2 size={12} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Dropdown d'autocomplétion */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-auto">
          {filteredSuggestions.map(patientId => (
            <li
              key={patientId}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(patientId);
              }}
              className="px-2 py-1.5 text-xs cursor-pointer hover:bg-blue-100 border-b border-gray-100 last:border-0"
            >
              {patientId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
