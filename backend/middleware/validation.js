const { body, validationResult } = require('express-validator');
const { APIError } = require('../utils/errorHandler');

/**
 * Validation middleware factory
 * @param {Array} validations - Array of validation chains
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      }));
      throw new APIError('Validation error', 400, errorMessages);
    }

    next();
  };
};

/**
 * User validation rules
 */
const userValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('fullName')
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters'),
  ];
};

/**
 * Product validation rules
 */
const productValidationRules = () => {
  return [
    body('name').isLength({ min: 2 }).withMessage('Product name is required'),
    body('sku').notEmpty().withMessage('SKU is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('categoryId').notEmpty().withMessage('Category is required'),
  ];
};

/**
 * Supplier validation rules
 */
const supplierValidationRules = () => {
  return [
    body('name').isLength({ min: 2 }).withMessage('Supplier name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phone')
      .matches(/^[0-9]{10,}$/)
      .withMessage('Invalid phone number'),
    body('gstNumber').notEmpty().withMessage('GST number is required'),
  ];
};

/**
 * Customer validation rules
 */
const customerValidationRules = () => {
  return [
    body('name').isLength({ min: 2 }).withMessage('Customer name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phone')
      .matches(/^[0-9]{10,}$/)
      .withMessage('Invalid phone number'),
  ];
};

/**
 * Sale validation rules
 */
const saleValidationRules = () => {
  return [
    body('customerId').notEmpty().withMessage('Customer is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one product is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ];
};

module.exports = {
  validate,
  userValidationRules,
  productValidationRules,
  supplierValidationRules,
  customerValidationRules,
  saleValidationRules,
};
