const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const landlordController = require('../controllers/landlordController');

// Landlord profile routes
router.post('/profile', authenticateToken, landlordController.createLandlordProfile);
router.get('/profile', authenticateToken, landlordController.getLandlordProfile);
router.get('/profile/:id', landlordController.getPublicLandlordProfile);

// Property management
router.post('/properties', authenticateToken, landlordController.createProperty);
router.post('/properties/:id/images', authenticateToken, landlordController.uploadPropertyImages);
router.get('/properties/browse', landlordController.browseProperties);
router.get('/properties/:id', landlordController.getProperty);
router.get('/properties', authenticateToken, landlordController.getUserProperties);
router.put('/properties/:id', authenticateToken, landlordController.updateProperty);
router.delete('/properties/:id', authenticateToken, landlordController.deleteProperty);
router.delete('/properties/:propertyId/images/:imageUrl', authenticateToken, landlordController.deletePropertyImage);

// Viewing management
router.post('/viewings', authenticateToken, landlordController.scheduleViewing);
router.get('/viewings/property/:id', authenticateToken, landlordController.getPropertyViewings);
router.get('/viewings', authenticateToken, landlordController.getUserViewings);
router.patch('/viewings/:id/status', authenticateToken, landlordController.updateViewingStatus);
router.delete('/viewings/:id', authenticateToken, landlordController.cancelViewing);
router.get('/viewings/:id', authenticateToken, landlordController.getViewingDetails);

module.exports = router;
