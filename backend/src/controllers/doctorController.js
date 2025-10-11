const { doctorService, medicalServiceService, appointmentService } = require('../services/doctors');
const { uploadService } = require('../services');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============= DOCTOR PROFILE =============

const createDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  const profile = await doctorService.createOrUpdateProfile(userId, profileData);
  return sendSuccess(res, 'Doctor profile saved', { profile });
});

const getDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await doctorService.getProfile(userId);
  return sendSuccess(res, 'Doctor profile retrieved', { profile });
});

const getPublicDoctorProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await doctorService.getPublicProfile(id);
  return sendSuccess(res, 'Doctor profile retrieved', { profile });
});

const uploadLicense = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return sendError(res, 'No license document provided', 400);
  }

  const uploadedFile = await uploadService.uploadDocument(req.file, 'licenses');
  const profile = await doctorService.updateLicense(userId, uploadedFile.url);

  return sendSuccess(res, 'License uploaded', { profile });
});

const uploadCertificates = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.files || req.files.length === 0) {
    return sendError(res, 'No certificates provided', 400);
  }

  const uploadedFiles = await uploadService.uploadMultipleDocuments(req.files, 'certificates');
  const profile = await doctorService.addCertificates(userId, uploadedFiles);

  return sendSuccess(res, 'Certificates uploaded', { profile });
});

// ============= MEDICAL SERVICES =============

const createMedicalService = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const serviceData = req.body;

  const service = await medicalServiceService.createService(userId, serviceData);
  return sendCreated(res, 'Medical service created', { service });
});

const getMedicalService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await medicalServiceService.getServiceById(id);
  return sendSuccess(res, 'Medical service retrieved', { service });
});

const getUserMedicalServices = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await medicalServiceService.getUserServices(userId, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Medical services retrieved', result);
});

const browseMedicalServices = asyncHandler(async (req, res) => {
  const filters = req.query;

  const result = await medicalServiceService.browseServices(filters);
  return sendSuccess(res, 'Medical services retrieved', result);
});

const updateMedicalService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const service = await medicalServiceService.updateService(id, userId, updateData);
  return sendSuccess(res, 'Medical service updated', { service });
});

const deleteMedicalService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await medicalServiceService.deleteService(id, userId);
  return sendSuccess(res, 'Medical service deleted');
});

// ============= APPOINTMENTS =============

const bookAppointment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { service_id, preferred_date, symptoms, notes } = req.body;

  const appointment = await appointmentService.createAppointment(userId, {
    service_id,
    preferred_date,
    symptoms,
    notes
  });

  return sendCreated(res, 'Appointment booked', { appointment });
});

const getServiceAppointments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status } = req.query;

  const appointments = await appointmentService.getServiceAppointments(id, userId, status);
  return sendSuccess(res, 'Appointments retrieved', { appointments });
});

const getUserAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const appointments = await appointmentService.getUserAppointments(userId, status);
  return sendSuccess(res, 'Appointments retrieved', { appointments });
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status, doctor_notes, prescription } = req.body;

  const appointment = await appointmentService.updateAppointmentStatus(id, userId, {
    status,
    doctor_notes,
    prescription
  });

  return sendSuccess(res, 'Appointment status updated', { appointment });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await appointmentService.cancelAppointment(id, userId);
  return sendSuccess(res, 'Appointment cancelled');
});

const getAppointmentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const appointment = await appointmentService.getAppointmentDetails(id, userId);
  return sendSuccess(res, 'Appointment details retrieved', { appointment });
});

module.exports = {
  // Doctor Profile
  createDoctorProfile,
  getDoctorProfile,
  getPublicDoctorProfile,
  uploadLicense,
  uploadCertificates,
  
  // Medical Services
  createMedicalService,
  getMedicalService,
  getUserMedicalServices,
  browseMedicalServices,
  updateMedicalService,
  deleteMedicalService,
  
  // Appointments
  bookAppointment,
  getServiceAppointments,
  getUserAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentDetails
};
