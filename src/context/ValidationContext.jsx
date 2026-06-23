import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getValidations } from '../services/apiService';

const ValidationContext = createContext(null);

export function ValidationProvider({ children }) {
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing validations on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchExisting() {
      try {
        const records = await getValidations(50);
        if (!cancelled) {
          setValidations(records);
        }
      } catch (err) {
        console.warn('[SIGNET] Could not fetch past validations:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchExisting();
    return () => { cancelled = true; };
  }, []);

  // Add a new validation result (called after file upload completes)
  const addValidation = useCallback((result) => {
    setValidations((prev) => [result, ...prev]);
  }, []);

  // Compute stats
  const stats = {
    total: validations.length,
    withManifest: validations.filter((v) => v.hasManifest).length,
    valid: validations.filter((v) => v.signatureValid).length,
    invalid: validations.filter((v) => v.hasManifest && !v.signatureValid).length,
    noMetadata: validations.filter((v) => !v.hasManifest).length,
  };

  // Get the provenance chain from the most recent validation that has one
  const latestProvenanceChain = validations.find((v) => v.provenanceChain?.length > 0)?.provenanceChain || [];

  // Get all provenance chains for display
  const allProvenanceChains = validations
    .filter((v) => v.provenanceChain?.length > 0)
    .map((v) => ({
      id: v._id,
      fileName: v.fileName,
      chain: v.provenanceChain,
      signatureValid: v.signatureValid,
      analyzedAt: v.analyzedAt,
    }));

  return (
    <ValidationContext.Provider
      value={{
        validations,
        addValidation,
        loading,
        stats,
        latestProvenanceChain,
        allProvenanceChains,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const ctx = useContext(ValidationContext);
  if (!ctx) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return ctx;
}
