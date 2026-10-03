/**
 * Epic 3 identity helper.
 * Reads the logged-in user from the shared session (localStorage 'vhms_user'),
 * falling back to demo values only if nobody is logged in.
 */
const DEMO = {
  ownerId: 'OWNER-DEMO-001', petId: 'PET-DEMO-001', doctorId: 'DOC-DEMO-001',
  ownerName: 'Sunil Perera', petName: 'Buddy', petSpecies: 'Dog (Golden Retriever)',
  doctorName: 'Dr. Nimal Fernando'
}

export function getEpic3Session() {
  let u = null
  try { u = JSON.parse(localStorage.getItem('vhms_user') || 'null') } catch { u = null }
  const role = u && u.role ? String(u.role).toUpperCase() : ''
  const isOwner = role === 'OWNER' || role === 'PET_OWNER' || role === 'PETOWNER'
  const isDoctor = role === 'DOCTOR'
  return {
    ...DEMO,
    ownerId: (isOwner && u.id) || DEMO.ownerId,
    ownerName: (isOwner && u.name) || DEMO.ownerName,
    doctorId: (isDoctor && (u.id || u.email)) || DEMO.doctorId,
    doctorName: (isDoctor && u.name) || DEMO.doctorName
  }
}

export const DEMO_DEFAULTS = DEMO
