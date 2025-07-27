import express from 'express';
import { 
  getCategories, 
  getSubcategories, 
  getCategoryPath 
} from '../controllers/categoryController.js';
import { authenticateJWT } from '../controllers/authController.js';

const router = express.Router();

// Get all categories in hierarchical structure
router.get('/categories', authenticateJWT, getCategories);

// Get subcategories for a specific parent
router.get('/categories/:parentId/subcategories', authenticateJWT, getSubcategories);

// Get category path (breadcrumb)
router.get('/categories/:categoryId/path', authenticateJWT, getCategoryPath);

export default router;
