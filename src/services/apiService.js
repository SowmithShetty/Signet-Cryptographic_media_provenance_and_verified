/**
 * API Service — Backend communication layer
 */

const API_BASE = '/api';

/**
 * Upload a file to the backend for C2PA signature verification.
 *
 * @param {File} file - The file to validate
 * @param {boolean} simulate - Whether to simulate C2PA metadata (Developer Mode)
 * @returns {Promise<object>} Validation result from the server
 */
export async function validateFile(file, simulate = false) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/validate?simulate=${simulate}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Validation failed with status ${res.status}`);
  }

  return res.json();
}

/**
 * Trigger mock sample C2PA file ingestion from backend for testing.
 *
 * @returns {Promise<object>} The mock C2PA validation record
 */
export async function validateSampleFile() {
  const res = await fetch(`${API_BASE}/validate-sample`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to load C2PA forensic sample');
  }

  return res.json();
}


/**
 * Fetch past validation records from the server.
 *
 * @param {number} limit - Max number of records to fetch
 * @returns {Promise<object[]>} Array of validation records
 */
export async function getValidations(limit = 50) {
  const res = await fetch(`${API_BASE}/validations?limit=${limit}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch validations: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a single validation record by ID.
 *
 * @param {string} id - The validation record ID
 * @returns {Promise<object>} Single validation record
 */
export async function getValidation(id) {
  const res = await fetch(`${API_BASE}/validations/${id}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch validation: ${res.status}`);
  }

  return res.json();
}
