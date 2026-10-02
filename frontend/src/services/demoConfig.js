/**
 * Centralized Demo Configuration for Epic 3 Development
 *
 * TODO [EPIC 1 INTEGRATION]: Replace these constants with values from the
 * authenticated user session once Epic 1 authentication is complete.
 *
 * - DEMO_PET_OWNER_ID → logged-in PetOwner's actual MongoDB ID from JWT/session
 * - DEMO_PET_ID       → selected Pet's actual MongoDB ID from PetOwner's pet list
 * - DEMO_DOCTOR_ID    → logged-in Doctor's actual MongoDB ID from JWT/session
 *
 * These constants ensure that Doctor submissions and Pet Owner retrieval
 * use the SAME IDs during development, so the workflow is demonstrable.
 */

export const DEMO_PET_OWNER_ID = 'OWNER-DEMO-001'
export const DEMO_PET_ID       = 'PET-DEMO-001'
export const DEMO_DOCTOR_ID    = 'DOC-DEMO-001'

export const DEMO_OWNER_NAME   = 'Sunil Perera'
export const DEMO_PET_NAME     = 'Buddy'
export const DEMO_PET_SPECIES  = 'Dog (Golden Retriever)'
export const DEMO_DOCTOR_NAME  = 'Dr. Nimal Fernando'
