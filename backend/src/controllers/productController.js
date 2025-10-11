const { sql } = require('../config/database');
const { cloudinary } = require('../config/cloudinary');
const { 
  sendSuccess, 
  sendError, 
  sendCreated, 
  sendNotFound 
} = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Create a new product listing (Sellers only)
 */
const createProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    title,
    description,
    price,
    currency = 'KES',
    condition,
    category, // Frontend sends category slug
    subcategory, // We'll store this as a tag for now
    location,
    product_code,
    brand,
    model,
    color,
    size,
    weight,
    dimensions,
    material,
    warranty_period,
    warranty_type,
    stock_quantity = 1,
    min_order_quantity = 1,
    max_order_quantity,
    discount_percentage = 0,
    discount_end_date,
    tags = '',
    seo_title,
    seo_description,
    shipping_included = false,
    shipping_cost = 0,
    return_policy,
    is_digital = false,
    download_url,
    contact_phone,
    contact_email,
    negotiable = true
  } = req.body;

  // Validate required fields
  if (!title || !description || !price || !category) {
    return sendError(res, 'Title, description, price, and category are required', null, 400);
  }

  // Handle uploaded files
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    try {
      // Upload each file to Cloudinary
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'vmarket/products',
              resource_type: 'image',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      imageUrls = await Promise.all(uploadPromises);
    } catch (uploadError) {
      console.error('Error uploading images:', uploadError);
      return sendError(res, 'Failed to upload images', null, 500);
    }
  }

  // Map category name to category ID
  const categoryResult = await sql`
    SELECT id FROM categories WHERE slug = ${category} OR name ILIKE ${category}
  `;
  
  if (categoryResult.length === 0) {
    return sendError(res, 'Invalid category provided', null, 400);
  }
  
  const category_id = categoryResult[0].id;

  // Check if user is a seller
  const userProfile = await sql`
    SELECT user_type FROM profiles WHERE user_id = ${userId}
  `;
  
  if (userProfile.length === 0 || !['seller', 'admin', 'landlord', 'employer'].includes(userProfile[0].user_type)) {
    return sendError(res, 'Only sellers can create product listings', null, 403);
  }

  // Process tags - combine tags input with subcategory
  let tagsArray = [];
  if (tags && typeof tags === 'string') {
    tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }
  if (subcategory) {
    tagsArray.push(subcategory);
  }

  // Create the product listing
  const products = await sql`
    INSERT INTO listings (
      user_id, title, description, price, currency, condition, category_id, location,
      product_code, brand, model, color, size, weight, dimensions, material,
      warranty_period, warranty_type, stock_quantity, min_order_quantity, max_order_quantity,
      discount_percentage, discount_end_date, tags, seo_title, seo_description,
      shipping_included, shipping_cost, return_policy, is_digital, download_url,
      images, contact_phone, contact_email, negotiable, status
    ) VALUES (
      ${userId}, ${title}, ${description}, ${price}, ${currency}, ${condition}, ${category_id}, ${location},
      ${product_code}, ${brand}, ${model}, ${color}, ${size}, ${weight}, ${dimensions}, ${material},
      ${warranty_period}, ${warranty_type}, ${stock_quantity}, ${min_order_quantity}, ${max_order_quantity},
      ${discount_percentage}, ${discount_end_date}, ${tagsArray}, ${seo_title}, ${seo_description},
      ${shipping_included}, ${shipping_cost}, ${return_policy}, ${is_digital}, ${download_url},
      ${imageUrls}, ${contact_phone}, ${contact_email}, ${negotiable}, 'active'
    )
    RETURNING *
  `;

  const product = products[0];

  return sendCreated(res, 'Product created successfully', {
    product: {
      ...product,
      final_price: parseFloat(product.price) * (1 - parseFloat(product.discount_percentage || 0) / 100)
    }
  });
});

/**
 * Get seller's products
 */
const getSellerProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, status = 'all' } = req.query;
  
  const offset = (page - 1) * limit;
  
  try {
    // Simplified query without complex joins for better performance
    let products;
    let totalQuery;
    
    if (status === 'all') {
      // Run queries in parallel for better performance
      [products, totalQuery] = await Promise.all([
        sql`
          SELECT 
            l.id,
            l.title,
            l.description,
            l.price,
            l.condition,
            l.location,
            l.images,
            l.tags,
            l.status,
            l.views_count as views,
            l.created_at,
            l.updated_at,
            l.discount_percentage,
            l.category_id
          FROM listings l
          WHERE l.user_id = ${userId}
          ORDER BY l.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int as total 
          FROM listings 
          WHERE user_id = ${userId}
        `
      ]);
    } else {
      [products, totalQuery] = await Promise.all([
        sql`
          SELECT 
            l.id,
            l.title,
            l.description,
            l.price,
            l.condition,
            l.location,
            l.images,
            l.tags,
            l.status,
            l.views_count as views,
            l.created_at,
            l.updated_at,
            l.discount_percentage,
            l.category_id
          FROM listings l
          WHERE l.user_id = ${userId} AND l.status = ${status}
          ORDER BY l.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int as total 
          FROM listings 
          WHERE user_id = ${userId} AND status = ${status}
        `
      ]);
    }
    
    const total = totalQuery[0]?.total || 0;

    return sendSuccess(res, 'Products retrieved successfully', {
      products: products.map(product => ({
        ...product,
        final_price: parseFloat(product.price || 0) * (1 - parseFloat(product.discount_percentage || 0) / 100)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return sendError(res, 'Failed to fetch products', error.message, 500);
  }
});

/**
 * Get single product details
 */
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const products = await sql`
    SELECT 
      l.id,
      l.title,
      l.description,
      l.price,
      l.condition,
      l.location,
      l.images,
      l.tags,
      l.status,
      l.views_count as views,
      l.created_at,
      l.updated_at,
      l.discount_percentage,
      l.brand,
      l.model,
      l.color,
      l.size,
      l.warranty_period,
      l.warranty_type,
      l.return_policy,
      l.negotiable,
      c.name as category_name,
      c.slug as category_slug,
      p.display_name as seller_name,
      p.avatar_url as seller_avatar,
      p.location as seller_location,
      u.email as seller_email
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN profiles p ON l.user_id = p.user_id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.id = ${id} AND l.status = 'active'
  `;

  if (products.length === 0) {
    return sendNotFound(res, 'Product not found');
  }

  const product = products[0];

  // Update view count
  await sql`
    UPDATE listings 
    SET views_count = views_count + 1 
    WHERE id = ${id}
  `;

  return sendSuccess(res, 'Product retrieved successfully', {
    product: {
      ...product,
      final_price: parseFloat(product.price) * (1 - parseFloat(product.discount_percentage || 0) / 100)
    }
  });
});

/**
 * Update product
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  // Check if product exists and belongs to user
  const existingProducts = await sql`
    SELECT id FROM listings 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (existingProducts.length === 0) {
    return sendNotFound(res, 'Product not found or unauthorized');
  }

  // For now, we'll implement a simple update for the most common fields
  const { title, description, price, condition, location } = req.body;
  
  if (!title && !description && !price && !condition && !location) {
    return sendError(res, 'At least one field is required for update', null, 400);
  }

  // Build update query manually for safety
  let updateQuery = 'UPDATE listings SET updated_at = CURRENT_TIMESTAMP';
  const params = [];
  
  if (title) {
    updateQuery += `, title = $${params.length + 1}`;
    params.push(title);
  }
  if (description) {
    updateQuery += `, description = $${params.length + 1}`;
    params.push(description);
  }
  if (price) {
    updateQuery += `, price = $${params.length + 1}`;
    params.push(parseFloat(price));
  }
  if (condition) {
    updateQuery += `, condition = $${params.length + 1}`;
    params.push(condition);
  }
  if (location) {
    updateQuery += `, location = $${params.length + 1}`;
    params.push(location);
  }
  
  updateQuery += ` WHERE id = $${params.length + 1} AND user_id = $${params.length + 2} RETURNING *`;
  params.push(id, userId);

  // Execute update with template literal
  const updatedProducts = await sql`
    UPDATE listings 
    SET title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        price = COALESCE(${price ? parseFloat(price) : null}, price),
        condition = COALESCE(${condition}, condition),
        location = COALESCE(${location}, location),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  return sendSuccess(res, 'Product updated successfully', {
    product: updatedProducts[0]
  });
});

/**
 * Delete product
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if product exists and belongs to user
  const products = await sql`
    SELECT * FROM listings 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (products.length === 0) {
    return sendNotFound(res, 'Product not found or unauthorized');
  }

  // Soft delete by changing status
  await sql`
    UPDATE listings 
    SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND user_id = ${userId}
  `;

  return sendSuccess(res, 'Product deleted successfully');
});

/**
 * Browse products (public endpoint for buyers)
 */
const browseProducts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    category, 
    search, 
    min_price, 
    max_price, 
    condition, 
    location, 
    sort = 'created_at', 
    order = 'DESC',
    tags
  } = req.query;
  
  const offset = (page - 1) * limit;
  
  try {
    // Simplified query to get products with category and seller info
    const products = await sql`
      SELECT 
        l.id,
        l.user_id,
        l.category_id,
        l.title,
        l.description,
        l.price,
        l.condition,
        l.location,
        l.images,
        l.tags,
        l.status,
        l.views_count as views,
        l.created_at,
        l.updated_at,
        l.discount_percentage,
        c.name as category,
        c.slug as subcategory,
        p.display_name as seller_name,
        p.location as seller_location,
        u.email as seller_email
      FROM listings l
      LEFT JOIN categories c ON l.category_id = c.id
      LEFT JOIN profiles p ON l.user_id = p.user_id
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    // Calculate final prices
    const enrichedProducts = products.map(product => ({
      ...product,
      seller_name: product.seller_name || 'Seller',
      final_price: parseFloat(product.price) * (1 - parseFloat(product.discount_percentage || 0) / 100)
    }));

    // Get total count
    const totalResult = await sql`
      SELECT COUNT(*) as total 
      FROM listings
      WHERE status = 'active'
    `;
    
    const total = parseInt(totalResult[0]?.total || 0);

    return sendSuccess(res, 'Products retrieved successfully', {
      products: enrichedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        category,
        search,
        min_price,
        max_price,
        condition,
        location,
        tags
      }
    });
  } catch (error) {
    console.error('Browse products error:', error);
    return sendError(res, 'Failed to retrieve products', error.message, 500);
  }
});

/**
 * Add product to favorites
 */
const addToFavorites = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if product exists
  const products = await sql`
    SELECT id FROM listings 
    WHERE id = ${id} AND status = 'active'
  `;

  if (products.length === 0) {
    return sendNotFound(res, 'Product not found');
  }

  // Add to favorites (ignore if already exists)
  await sql`
    INSERT INTO favorites (user_id, listing_id)
    VALUES (${userId}, ${id})
    ON CONFLICT (user_id, listing_id) DO NOTHING
  `;

  // Log analytics
  await sql`
    INSERT INTO seller_analytics (user_id, listing_id, event_type, event_data)
    SELECT l.user_id, ${id}, 'favorite', ${{user_id: userId}}
    FROM listings l WHERE l.id = ${id}
  `;

  return sendSuccess(res, 'Product added to favorites');
});

/**
 * Remove product from favorites
 */
const removeFromFavorites = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await sql`
    DELETE FROM favorites 
    WHERE user_id = ${userId} AND listing_id = ${id}
  `;

  return sendSuccess(res, 'Product removed from favorites');
});

/**
 * Get user's favorite products
 */
const getFavorites = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const favorites = await sql`
    SELECT 
      l.*,
      c.name as category_name,
      p.display_name as seller_name,
      f.created_at as favorited_at
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN profiles p ON l.user_id = p.user_id
    WHERE f.user_id = ${userId} AND l.status = 'active'
    ORDER BY f.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const totalQuery = await sql`
    SELECT COUNT(*) as total 
    FROM favorites f
    JOIN listings l ON f.listing_id = l.id
    WHERE f.user_id = ${userId} AND l.status = 'active'
  `;
  
  const total = parseInt(totalQuery[0].total);

  return sendSuccess(res, 'Favorites retrieved successfully', {
    favorites: favorites.map(product => ({
      ...product,
      final_price: parseFloat(product.price) * (1 - parseFloat(product.discount_percentage || 0) / 100)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
  createProduct,
  getSellerProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  browseProducts,
  addToFavorites,
  removeFromFavorites,
  getFavorites
};
