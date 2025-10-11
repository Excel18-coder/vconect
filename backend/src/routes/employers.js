const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const employerController = require('../controllers/employerController');

// Employer profile routes
router.post('/profile', authenticateToken, employerController.createEmployerProfile);
router.get('/profile', authenticateToken, employerController.getEmployerProfile);
router.get('/profile/:id', employerController.getPublicEmployerProfile);
router.post('/profile/logo', authenticateToken, employerController.uploadCompanyLogo);

// Job postings management
router.post('/jobs', authenticateToken, employerController.createJobPosting);
router.get('/jobs/:id', employerController.getJobPosting);
router.get('/jobs', authenticateToken, employerController.getUserJobPostings);
router.get('/jobs/browse', employerController.browseJobPostings);
router.put('/jobs/:id', authenticateToken, employerController.updateJobPosting);
router.delete('/jobs/:id', authenticateToken, employerController.deleteJobPosting);

// Application management
router.post('/applications', authenticateToken, employerController.applyForJob);
router.post('/applications/resume', authenticateToken, employerController.uploadResume);
router.get('/applications/job/:id', authenticateToken, employerController.getJobApplications);
router.get('/applications', authenticateToken, employerController.getUserApplications);
router.patch('/applications/:id/status', authenticateToken, employerController.updateApplicationStatus);
router.delete('/applications/:id', authenticateToken, employerController.withdrawApplication);
router.get('/applications/:id', authenticateToken, employerController.getApplicationDetails);

module.exports = router;
