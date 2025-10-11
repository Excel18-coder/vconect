const { employerService, jobService, applicationService } = require('../services/employers');
const { uploadService } = require('../services');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

// ============= EMPLOYER PROFILE =============

const createEmployerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  const profile = await employerService.createOrUpdateProfile(userId, profileData);
  return sendSuccess(res, 'Employer profile saved', { profile });
});

const getEmployerProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const profile = await employerService.getProfile(userId);
  return sendSuccess(res, 'Employer profile retrieved', { profile });
});

const getPublicEmployerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const profile = await employerService.getPublicProfile(id);
  return sendSuccess(res, 'Employer profile retrieved', { profile });
});

const uploadCompanyLogo = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return sendError(res, 'No logo provided', 400);
  }

  const uploadedFile = await uploadService.uploadImage(req.file, 'company-logos');
  const profile = await employerService.updateLogo(userId, uploadedFile.url);

  return sendSuccess(res, 'Company logo uploaded', { profile });
});

// ============= JOB POSTINGS =============

const createJobPosting = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const jobData = req.body;

  const job = await jobService.createJob(userId, jobData);
  return sendCreated(res, 'Job posting created', { job });
});

const getJobPosting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await jobService.getJobById(id);
  return sendSuccess(res, 'Job posting retrieved', { job });
});

const getUserJobPostings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;

  const result = await jobService.getUserJobs(userId, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return sendSuccess(res, 'Job postings retrieved', result);
});

const browseJobPostings = asyncHandler(async (req, res) => {
  const filters = req.query;

  const result = await jobService.browseJobs(filters);
  return sendSuccess(res, 'Job postings retrieved', result);
});

const updateJobPosting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const job = await jobService.updateJob(id, userId, updateData);
  return sendSuccess(res, 'Job posting updated', { job });
});

const deleteJobPosting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await jobService.deleteJob(id, userId);
  return sendSuccess(res, 'Job posting deleted');
});

// ============= APPLICATIONS =============

const applyForJob = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { job_id, cover_letter, resume_url } = req.body;

  const application = await applicationService.createApplication(userId, {
    job_id,
    cover_letter,
    resume_url
  });

  return sendCreated(res, 'Application submitted', { application });
});

const uploadResume = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return sendError(res, 'No resume provided', 400);
  }

  const uploadedFile = await uploadService.uploadDocument(req.file, 'resumes');
  
  return sendSuccess(res, 'Resume uploaded', { resume_url: uploadedFile.url });
});

const getJobApplications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status } = req.query;

  const applications = await applicationService.getJobApplications(id, userId, status);
  return sendSuccess(res, 'Applications retrieved', { applications });
});

const getUserApplications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const applications = await applicationService.getUserApplications(userId, status);
  return sendSuccess(res, 'Applications retrieved', { applications });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { status, employer_notes } = req.body;

  const application = await applicationService.updateApplicationStatus(id, userId, {
    status,
    employer_notes
  });

  return sendSuccess(res, 'Application status updated', { application });
});

const withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await applicationService.withdrawApplication(id, userId);
  return sendSuccess(res, 'Application withdrawn');
});

const getApplicationDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const application = await applicationService.getApplicationDetails(id, userId);
  return sendSuccess(res, 'Application details retrieved', { application });
});

module.exports = {
  // Employer Profile
  createEmployerProfile,
  getEmployerProfile,
  getPublicEmployerProfile,
  uploadCompanyLogo,
  
  // Job Postings
  createJobPosting,
  getJobPosting,
  getUserJobPostings,
  browseJobPostings,
  updateJobPosting,
  deleteJobPosting,
  
  // Applications
  applyForJob,
  uploadResume,
  getJobApplications,
  getUserApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationDetails
};
