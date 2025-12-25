const { body, validationResult } = require("express-validator");

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("displayName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be between 2 and 50 characters"),

  body("userType")
    .optional()
    .isIn(["buyer", "seller", "landlord"])
    .withMessage("Invalid user type"),
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
  body("display_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Display name must be between 2 and 50 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),

  body("phone_number")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must not exceed 100 characters"),

  body("user_type")
    .optional()
    .isIn(["buyer", "seller", "landlord", "admin"])
    .withMessage("Invalid user type"),
];

/**
 * Validation rules for listing creation
 */
const validateListing = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("price")
    .optional()
    .isDecimal({ decimal_digits: "0,2" })
    .withMessage("Price must be a valid decimal number"),

  body("category_id").isUUID().withMessage("Invalid category ID"),

  body("condition")
    .optional()
    .isIn(["new", "like_new", "good", "fair", "poor"])
    .withMessage("Condition must be one of: new, like_new, good, fair, poor"),

  body("location")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Location must not exceed 255 characters"),

  body("contact_phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid contact phone number"),

  body("contact_email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid contact email"),
];

/**
 * Validation rules for password reset request
 */
const validatePasswordResetRequest = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

/**
 * Validation rules for password reset
 */
const validatePasswordReset = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

/**
 * Validation rules for product creation
 */
const validateProductCreation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Product title must be between 3 and 255 characters"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Product description must be between 10 and 5000 characters"),

  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Category must be between 2 and 100 characters"),

  body("condition")
    .optional()
    .customSanitizer((value) => {
      if (!value) return "good";
      const normalized = String(value)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

      if (normalized === "new" || normalized === "brand_new") return "new";
      if (
        normalized === "like_new" ||
        normalized === "likenew" ||
        normalized === "excellent"
      ) {
        return "like_new";
      }
      if (
        normalized === "used" ||
        normalized === "okay" ||
        normalized === "average" ||
        normalized === "good"
      ) {
        return "good";
      }
      if (
        normalized === "worn" ||
        normalized === "damaged" ||
        normalized === "fair"
      ) {
        return "fair";
      }
      if (normalized === "poor") return "poor";

      return "good";
    })
    .isIn(["new", "like_new", "good", "fair", "poor"])
    .withMessage("Condition must be one of: new, like_new, good, fair, poor"),

  body("stock_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer"),

  body("discount_percentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percentage must be between 0 and 100"),

  body("tags")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Tags must not exceed 500 characters"),

  body("images").optional(),

  body("weight")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),

  body("shipping_cost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Shipping cost must be a non-negative number"),
];

/**
 * Validation rules for product update
 */
const validateProductUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Product title must be between 3 and 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Product description must be between 10 and 5000 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),

  body("condition")
    .optional()
    .customSanitizer((value) => {
      if (!value) return value;
      const normalized = String(value)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

      if (normalized === "new" || normalized === "brand_new") return "new";
      if (
        normalized === "like_new" ||
        normalized === "likenew" ||
        normalized === "excellent"
      ) {
        return "like_new";
      }
      if (
        normalized === "used" ||
        normalized === "okay" ||
        normalized === "average" ||
        normalized === "good"
      ) {
        return "good";
      }
      if (
        normalized === "worn" ||
        normalized === "damaged" ||
        normalized === "fair"
      ) {
        return "fair";
      }
      if (normalized === "poor") return "poor";

      return "good";
    })
    .isIn(["new", "like_new", "good", "fair", "poor"])
    .withMessage("Condition must be one of: new, like_new, good, fair, poor"),

  body("stock_quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer"),

  body("discount_percentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Discount percentage must be between 0 and 100"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "sold", "pending"])
    .withMessage("Status must be one of: active, inactive, sold, pending"),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateListing,
  validateProductCreation,
  validateProductUpdate,
  validatePasswordResetRequest,
  validatePasswordReset,
  handleValidationErrors,
};
