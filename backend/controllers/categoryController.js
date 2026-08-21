const Category = require('../models/Category');
const Product = require('../models/Product');

const buildCategoryQuery = (search) => {
  const query = { isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  return query;
};

// ─── GET ALL CATEGORIES ───────────────────────────────────────────────────────
// Supports pagination + search; also returns productCount for each category
exports.getCategories = async (req, res) => {
  try {
    const { search = '', page, limit } = req.query;
    const query = buildCategoryQuery(search);

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const skip = (pageNum - 1) * limitNum;

      const total = await Category.countDocuments(query);
      const categories = await Category.find(query)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limitNum);

      // Attach product count to each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const productCount = await Product.countDocuments({ category: cat._id, isActive: true });
          return { ...cat.toObject(), productCount };
        })
      );

      return res.json({
        success: true,
        data: categoriesWithCount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // No pagination: flat list (for dropdowns)
    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── GET CATEGORY BY ID ───────────────────────────────────────────────────────
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category || !category.isActive) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const productCount = await Product.countDocuments({ category: category._id, isActive: true });

    res.json({ success: true, data: { ...category.toObject(), productCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── CREATE CATEGORY ──────────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, color, icon, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exist = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (exist) {
      return res.status(400).json({ success: false, message: 'A category with this name already exists' });
    }

    const category = new Category({
      name: name.trim(),
      description: description || '',
      image: image || '',
      color: color || '#1976d2',
      icon: icon || 'category',
      sortOrder: parseInt(sortOrder, 10) || 0,
    });
    await category.save();

    res.status(201).json({ success: true, data: { ...category.toObject(), productCount: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── UPDATE CATEGORY ──────────────────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category || !category.isActive) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, image, color, icon, sortOrder } = req.body;

    if (name && name.trim() !== category.name) {
      const duplicate = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: category._id },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'A category with this name already exists' });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (color !== undefined) category.color = color;
    if (icon !== undefined) category.icon = icon;
    if (sortOrder !== undefined) category.sortOrder = parseInt(sortOrder, 10) || 0;

    await category.save();

    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    res.json({ success: true, data: { ...category.toObject(), productCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// ─── DELETE CATEGORY ──────────────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category || !category.isActive) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Prevent deletion if products reference this category
    const productCount = await Product.countDocuments({ category: category._id, isActive: true });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${productCount} product(s) are assigned to this category. Reassign them first.`,
      });
    }

    category.isActive = false;
    await category.save();

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
