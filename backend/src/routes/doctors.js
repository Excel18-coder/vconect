const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

// Doctor profile routes
router.post('/profile', authenticateToken, doctorController.createDoctorProfile);
router.get('/profile', authenticateToken, doctorController.getDoctorProfile);
router.get('/profile/:id', doctorController.getPublicDoctorProfile);
router.post('/profile/license', authenticateToken, doctorController.uploadLicense);
router.post('/profile/certificates', authenticateToken, doctorController.uploadCertificates);

// Medical services management
router.post('/services', authenticateToken, doctorController.createMedicalService);
router.get('/services/:id', doctorController.getMedicalService);
router.get('/services', authenticateToken, doctorController.getUserMedicalServices);
router.get('/services/browse', doctorController.browseMedicalServices);
router.put('/services/:id', authenticateToken, doctorController.updateMedicalService);
router.delete('/services/:id', authenticateToken, doctorController.deleteMedicalService);

// Appointment management
router.post('/appointments', authenticateToken, doctorController.bookAppointment);
router.get('/appointments/service/:id', authenticateToken, doctorController.getServiceAppointments);
router.get('/appointments', authenticateToken, doctorController.getUserAppointments);
router.patch('/appointments/:id/status', authenticateToken, doctorController.updateAppointmentStatus);
router.delete('/appointments/:id', authenticateToken, doctorController.cancelAppointment);
router.get('/appointments/:id', authenticateToken, doctorController.getAppointmentDetails);

module.exports = router;
