const { sql } = require("../config/database");
const { cloudinary } = require("../config/cloudinary");
const {
  sendSuccess,
  sendError,
  sendCreated,
  sendNotFound,
} = require("../utils/response");
const { asyncHandler } = require("../middleware/errorHandler");

const uploadImagesToCloudinary = async (files = []) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "vmarket/products",
          resource_type: "image",
          transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );

      uploadStream.end(file.buffer);
    });
  });

  return Promise.all(uploadPromises);
};

const slugifyCategory = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
};

/**
 * Create a new product listing (Sellers only)
 */
const createProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    title,
    description,
    price,
    currency = "KES",
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
    tags = "",
    seo_title,
    seo_description,
    shipping_included = false,
    shipping_cost = 0,
    return_policy,
    is_digital = false,
    download_url,
    contact_phone,
    contact_email,
    negotiable = true,
  } = req.body;

  // Validate required fields
  if (!title || !description || !price || !category) {
    return sendError(
      res,
      "Title, description, price, and category are required",
      null,
      400
    );
  }

  // Validate and normalize condition field - match database constraint exactly
  // Database allows: 'new', 'like_new', 'good', 'fair', 'poor'
  const validConditions = ["new", "like_new", "good", "fair", "poor"];
  let normalizedCondition = "good"; // Default value

  if (condition) {
    const lowerCondition = condition.toLowerCase().trim().replace(/\s+/g, "_");
    // Map common variations to database values
    if (validConditions.includes(lowerCondition)) {
      normalizedCondition = lowerCondition;
    } else if (
      lowerCondition === "brand_new" ||
      lowerCondition === "brandnew"
    ) {
      normalizedCondition = "new";
    } else if (lowerCondition === "excellent" || lowerCondition === "likenew") {
      normalizedCondition = "like_new";
    } else if (
      lowerCondition === "used" ||
      lowerCondition === "okay" ||
      lowerCondition === "average"
    ) {
      normalizedCondition = "good";
    } else if (lowerCondition === "worn" || lowerCondition === "damaged") {
      normalizedCondition = "fair";
    } else {
      normalizedCondition = "good"; // Default for unrecognized values
    }
  }

  // Handle uploaded files
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    try {
      // Upload each file to Cloudinary
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "vmarket/products",
              resource_type: "image",
              transformation: [
                { quality: "auto:good" },
                { fetch_format: "auto" },
              ],
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
      console.error("Error uploading images:", uploadError);
      return sendError(res, "Failed to upload images", null, 500);
    }
  }

  // Map category name to category ID
  const rawCategory = String(category || "").trim();
  if (!rawCategory) {
    return sendError(res, "Category is required", null, 400);
  }

  let category_id = null;

  // 1) Exact match on slug/name (case-insensitive)
  let categoryResult = await sql`
    SELECT id
    FROM categories
    WHERE LOWER(slug) = LOWER(${rawCategory})
       OR LOWER(name) = LOWER(${rawCategory})
    LIMIT 1
  `;

  // 2) Fuzzy match (helps with minor mismatches like 'house' vs 'housing')
  if (categoryResult.length === 0) {
    const likeValue = `%${rawCategory}%`;
    categoryResult = await sql`
      SELECT id
      FROM categories
      WHERE slug ILIKE ${likeValue}
         OR name ILIKE ${likeValue}
      ORDER BY created_at ASC
      LIMIT 1
    `;
  }

  // 3) Create category if still not found
  if (categoryResult.length === 0) {
    const baseSlug = slugifyCategory(rawCategory) || "category";
    let candidateSlug = baseSlug;
    let created = [];

    for (let i = 0; i < 10; i++) {
      created = await sql`
        INSERT INTO categories (name, slug, is_active)
        VALUES (${rawCategory}, ${candidateSlug}, true)
        ON CONFLICT (slug) DO NOTHING
        RETURNING id
      `;

      if (created.length > 0) break;
      candidateSlug = `${baseSlug}-${i + 2}`;
    }

    if (created.length > 0) {
      category_id = created[0].id;
    } else {
      // Fallback: another request may have created it concurrently
      const retry = await sql`
        SELECT id
        FROM categories
        WHERE slug = ${candidateSlug}
           OR slug = ${baseSlug}
        LIMIT 1
      `;
      if (retry.length === 0) {
        return sendError(res, "Failed to create category", null, 500);
      }
      category_id = retry[0].id;
    }
  } else {
    category_id = categoryResult[0].id;
  }

  // Check if user can create listings (sellers, landlords)
  const userProfile = await sql`
    SELECT user_type FROM profiles WHERE user_id = ${userId}
  `;

  const allowedUserTypes = ["seller", "admin", "landlord"];
  if (
    userProfile.length === 0 ||
    !allowedUserTypes.includes(userProfile[0].user_type)
  ) {
    return sendError(
      res,
      "Only sellers and landlords can create listings",
      null,
      403
    );
  }

  // Process tags - combine tags input with subcategory
  let tagsArray = [];
  if (tags && typeof tags === "string") {
    tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
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
      ${userId}, ${title}, ${description}, ${price}, ${currency}, ${normalizedCondition}, ${category_id}, ${location},
      ${product_code}, ${brand}, ${model}, ${color}, ${size}, ${weight}, ${dimensions}, ${material},
      ${warranty_period}, ${warranty_type}, ${stock_quantity}, ${min_order_quantity}, ${max_order_quantity},
      ${discount_percentage}, ${discount_end_date}, ${tagsArray}, ${seo_title}, ${seo_description},
      ${shipping_included}, ${shipping_cost}, ${return_policy}, ${is_digital}, ${download_url},
      ${imageUrls}, ${contact_phone}, ${contact_email}, ${negotiable}, 'active'
    )
    RETURNING *
  `;

  const product = products[0];

  return sendCreated(res, "Product created successfully", {
    product: {
      ...product,
      final_price:
        parseFloat(product.price) *
        (1 - parseFloat(product.discount_percentage || 0) / 100),
    },
  });
});

/**
 * Get seller's products
 */
const getSellerProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, status = "all" } = req.query;

  const offset = (page - 1) * limit;

  try {
    // Simplified query without complex joins for better performance
    let products;
    let totalQuery;

    if (status === "all") {
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
            l.category_id,
            l.contact_phone,
            COALESCE(c.name, 'Other') as category,
            COALESCE(c.slug, 'general') as subcategory
          FROM listings l
          LEFT JOIN categories c ON l.category_id = c.id
          WHERE l.user_id = ${userId}
          ORDER BY l.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int as total 
          FROM listings 
          WHERE user_id = ${userId}
        `,
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
            l.category_id,
            l.contact_phone,
            COALESCE(c.name, 'Other') as category,
            COALESCE(c.slug, 'general') as subcategory
          FROM listings l
          LEFT JOIN categories c ON l.category_id = c.id
          WHERE l.user_id = ${userId} AND l.status = ${status}
          ORDER BY l.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        sql`
          SELECT COUNT(*)::int as total 
          FROM listings 
          WHERE user_id = ${userId} AND status = ${status}
        `,
      ]);
    }

    const total = totalQuery[0]?.total || 0;

    return sendSuccess(res, "Products retrieved successfully", {
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: parseFloat(product.price || 0),
        condition: product.condition,
        location: product.location,
        images: Array.isArray(product.images)
          ? product.images
          : product.images
          ? [product.images]
          : [],
        tags: product.tags || [],
        status: product.status,
        views: product.views || 0,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        category: product.category,
        subcategory: product.subcategory,
        contactPhone: product.contact_phone || null,
        final_price:
          parseFloat(product.price || 0) *
          (1 - parseFloat(product.discount_percentage || 0) / 100),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return sendError(res, "Failed to fetch products", error.message, 500);
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
      l.user_id,
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
      l.contact_phone,
      c.name as category_name,
      c.slug as category_slug,
      p.display_name as seller_name,
      p.avatar_url as seller_avatar,
      p.location as seller_location,
      p.phone_number as seller_phone,
      u.email as seller_email
    FROM listings l
    LEFT JOIN categories c ON l.category_id = c.id
    LEFT JOIN profiles p ON l.user_id = p.user_id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.id = ${id} AND l.status = 'active'
  `;

  if (products.length === 0) {
    return sendNotFound(res, "Product not found");
  }

  const product = products[0];

  // Update view count
  await sql`
    UPDATE listings 
    SET views_count = views_count + 1 
    WHERE id = ${id}
  `;

  return sendSuccess(res, "Product retrieved successfully", {
    product: {
      ...product,
      images: Array.isArray(product.images)
        ? product.images
        : product.images
        ? [product.images]
        : [],
      contactPhone: product.contact_phone || null,
      seller: {
        id: product.user_id,
        name: product.seller_name,
        email: product.seller_email,
        phone: product.seller_phone || product.contact_phone,
        avatar: product.seller_avatar,
        location: product.seller_location,
      },
      final_price:
        parseFloat(product.price) *
        (1 - parseFloat(product.discount_percentage || 0) / 100),
    },
  });
});

/**
 * Update product
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if product exists and belongs to user
  const existingProducts = await sql`
    SELECT * FROM listings 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (existingProducts.length === 0) {
    return sendNotFound(res, "Product not found or unauthorized");
  }

  const existingProduct = existingProducts[0];

  // Extract and validate update fields
  const {
    title,
    description,
    price,
    condition,
    location,
    category_id,
    subcategory,
    tags,
    status,
    discount_percentage,
    stock_quantity,
  } = req.body;

  // Handle image uploads if files are provided
  let imageUrls = existingProduct.images || [];
  if (req.files && req.files.length > 0) {
    const newImageUrls = await uploadImagesToCloudinary(req.files);

    // Append new images to existing ones (max 8 total)
    imageUrls = [...imageUrls, ...newImageUrls].slice(0, 8);
  }

  // Normalize condition if provided
  let normalizedCondition = existingProduct.condition;
  if (condition) {
    const validConditions = ["new", "like_new", "good", "fair", "poor"];
    const lowerCondition = condition.toLowerCase().trim().replace(/\s+/g, "_");

    if (validConditions.includes(lowerCondition)) {
      normalizedCondition = lowerCondition;
    } else if (
      lowerCondition === "brand_new" ||
      lowerCondition === "brandnew"
    ) {
      normalizedCondition = "new";
    } else if (lowerCondition === "excellent" || lowerCondition === "likenew") {
      normalizedCondition = "like_new";
    } else if (
      lowerCondition === "used" ||
      lowerCondition === "okay" ||
      lowerCondition === "average"
    ) {
      normalizedCondition = "good";
    } else if (lowerCondition === "worn" || lowerCondition === "damaged") {
      normalizedCondition = "fair";
    }
  }

  // Parse tags if provided
  let parsedTags = existingProduct.tags;
  if (tags) {
    parsedTags =
      typeof tags === "string"
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : tags;
  }

  // Treat "subcategory" as a tag (listings table doesn't have a subcategory column)
  if (subcategory) {
    const subcategoryTag = String(subcategory).trim();
    if (subcategoryTag) {
      const nextTags = Array.isArray(parsedTags) ? [...parsedTags] : [];
      if (!nextTags.includes(subcategoryTag)) nextTags.push(subcategoryTag);
      parsedTags = nextTags;
    }
  }

  // Update the product
  const updatedProducts = await sql`
    UPDATE listings 
    SET 
      title = COALESCE(${title}, title),
      description = COALESCE(${description}, description),
      price = COALESCE(${price ? parseFloat(price) : null}, price),
      condition = ${normalizedCondition},
      location = COALESCE(${location}, location),
      category_id = COALESCE(${category_id}, category_id),
      tags = COALESCE(${parsedTags}, tags),
      status = COALESCE(${status}, status),
      images = ${imageUrls},
      discount_percentage = COALESCE(${
        discount_percentage ? parseFloat(discount_percentage) : null
      }, discount_percentage),
      stock_quantity = COALESCE(${
        stock_quantity ? parseInt(stock_quantity) : null
      }, stock_quantity),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `;

  console.log("✅ Product updated successfully:", id);

  return sendSuccess(res, "Product updated successfully", {
    product: {
      id: updatedProducts[0].id,
      title: updatedProducts[0].title,
      description: updatedProducts[0].description,
      price: parseFloat(updatedProducts[0].price),
      condition: updatedProducts[0].condition,
      location: updatedProducts[0].location,
      images: updatedProducts[0].images || [],
      tags: updatedProducts[0].tags || [],
      status: updatedProducts[0].status,
      createdAt: updatedProducts[0].created_at,
      updatedAt: updatedProducts[0].updated_at,
    },
  });
});

/**
 * Delete product
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { permanent = false } = req.query;

  // Check if product exists and belongs to user
  const products = await sql`
    SELECT * FROM listings 
    WHERE id = ${id} AND user_id = ${userId}
  `;

  if (products.length === 0) {
    return sendNotFound(res, "Product not found or unauthorized");
  }

  const product = products[0];

  // Delete images from Cloudinary if they exist
  if (
    product.images &&
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {
    console.log(
      `🗑️ Deleting ${product.images.length} images from Cloudinary for product ${id}`
    );

    for (const imageUrl of product.images) {
      try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
        const urlParts = imageUrl.split("/");
        const uploadIndex = urlParts.indexOf("upload");
        if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
          // Get everything after 'upload/' as the public_id (including folders)
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join("/"); // Skip version number
          const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ""); // Remove file extension

          // Delete from Cloudinary
          await cloudinary.uploader.destroy(publicId);
          console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
        }
      } catch (error) {
        console.error(
          `⚠️ Failed to delete image from Cloudinary: ${imageUrl}`,
          error
        );
        // Continue with deletion even if Cloudinary delete fails
      }
    }
  }

  if (permanent === "true") {
    // Permanent delete - actually remove from database
    await sql`
      DELETE FROM listings 
      WHERE id = ${id} AND user_id = ${userId}
    `;

    console.log("✅ Product permanently deleted from database:", id);
    return sendSuccess(res, "Product and all images permanently deleted");
  } else {
    // Soft delete - change status to inactive
    await sql`
      UPDATE listings 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;

    console.log("✅ Product soft deleted (status set to inactive):", id);
    return sendSuccess(
      res,
      "Product deleted successfully. Images removed from Cloudinary."
    );
  }
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
    sort = "created_at",
    order = "DESC",
    tags,
  } = req.query;

  const offset = (page - 1) * limit;

  // Normalize common legacy/alias category slugs so category tabs isolate correctly
  const normalizeCategorySlug = (value) => {
    const slug = String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");

    if (slug === "house") return "housing";
    if (slug === "real-estate") return "housing";
    if (slug === "marketplace") return "market";
    return slug;
  };

  const getCategoryAliases = (normalizedSlug) => {
    switch (normalizedSlug) {
      case "housing":
        return ["housing", "house", "real-estate"];
      case "transport":
        return ["transport"];
      case "entertainment":
        return ["entertainment"];
      case "market":
        return ["market", "marketplace"];
      default:
        return [normalizedSlug].filter(Boolean);
    }
  };

  try {
    // Build filters (so category tabs only show matching items)
    let where = sql`l.status = 'active'`;

    if (category) {
      const normalized = normalizeCategorySlug(category);

      // Marketplace is the catch-all bucket: everything that isn't one of the
      // primary tabs (housing/transport/entertainment) should appear in Market.
      if (normalized === "market") {
        const marketAliases = getCategoryAliases("market");
        const excludedPrimaryAliases = [
          ...getCategoryAliases("housing"),
          ...getCategoryAliases("transport"),
          ...getCategoryAliases("entertainment"),
        ].map((s) => s.toLowerCase());

        where = sql`${where} AND (
          LOWER(c.slug) = ANY(${sql.array(
            marketAliases.map((s) => s.toLowerCase()),
            "text"
          )})
          OR c.slug IS NULL
          OR LOWER(c.slug) <> ALL(${sql.array(excludedPrimaryAliases, "text")})
        )`;
      } else {
        const aliases = getCategoryAliases(normalized);

        // Match by slug aliases primarily; keep name fallback to be tolerant of older data.
        where = sql`${where} AND (
          LOWER(c.slug) = ANY(${sql.array(
            aliases.map((s) => s.toLowerCase()),
            "text"
          )})
          OR LOWER(c.name) = LOWER(${category})
        )`;
      }
    }

    if (search) {
      const q = `%${search}%`;
      where = sql`${where} AND (l.title ILIKE ${q} OR l.description ILIKE ${q})`;
    }

    if (condition) {
      where = sql`${where} AND LOWER(l.condition) = LOWER(${condition})`;
    }

    if (location) {
      const loc = `%${location}%`;
      where = sql`${where} AND l.location ILIKE ${loc}`;
    }

    if (min_price) {
      const min = Number(min_price);
      if (!Number.isNaN(min)) {
        where = sql`${where} AND l.price >= ${min}`;
      }
    }

    if (max_price) {
      const max = Number(max_price);
      if (!Number.isNaN(max)) {
        where = sql`${where} AND l.price <= ${max}`;
      }
    }

    // Optional tag filtering (comma-separated)
    if (tags) {
      const tagList = String(tags)
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      if (tagList.length > 0) {
        where = sql`${where} AND EXISTS (
          SELECT 1
          FROM unnest(l.tags) AS t(tag)
          WHERE LOWER(t.tag) = ANY(${sql.array(
            tagList.map((t) => t.toLowerCase()),
            "text"
          )})
        )`;
      }
    }

    const whereClause = sql`WHERE ${where}`;

    // NOTE: we keep ordering stable (created_at desc) to match existing behavior.
    // The `sort`/`order` query params are accepted but not trusted for dynamic SQL.
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
        l.contact_phone,
        c.name as category,
        c.slug as subcategory,
        p.display_name as seller_name,
        p.location as seller_location,
        p.phone_number as seller_phone,
        u.email as seller_email
      FROM listings l
      LEFT JOIN categories c ON l.category_id = c.id
      LEFT JOIN profiles p ON l.user_id = p.user_id
      LEFT JOIN users u ON l.user_id = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    // Calculate final prices
    const enrichedProducts = products.map((product) => ({
      ...product,
      images: Array.isArray(product.images)
        ? product.images
        : product.images
        ? [product.images]
        : [],
      seller_name: product.seller_name || "Seller",
      contactPhone: product.contact_phone || null,
      seller: {
        id: product.user_id,
        name: product.seller_name,
        phone: product.seller_phone || product.contact_phone,
        email: product.seller_email,
        location: product.seller_location,
      },
      final_price:
        parseFloat(product.price) *
        (1 - parseFloat(product.discount_percentage || 0) / 100),
    }));

    // Get total count (must match same filters)
    const totalResult = await sql`
      SELECT COUNT(*) as total 
      FROM listings l
      LEFT JOIN categories c ON l.category_id = c.id
      ${whereClause}
    `;

    const total = parseInt(totalResult[0]?.total || 0);

    return sendSuccess(res, "Products retrieved successfully", {
      products: enrichedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        category,
        search,
        min_price,
        max_price,
        condition,
        location,
        tags,
      },
    });
  } catch (error) {
    console.error("Browse products error:", error);
    return sendError(res, "Failed to retrieve products", error.message, 500);
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
    return sendNotFound(res, "Product not found");
  }

  // Add to favorites (ignore if already exists)
  await sql`
    INSERT INTO favorites (user_id, listing_id)
    VALUES (${userId}, ${id})
    ON CONFLICT (user_id, listing_id) DO NOTHING
  `;

  return sendSuccess(res, "Product added to favorites");
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

  return sendSuccess(res, "Product removed from favorites");
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

  return sendSuccess(res, "Favorites retrieved successfully", {
    favorites: favorites.map((product) => ({
      ...product,
      final_price:
        parseFloat(product.price) *
        (1 - parseFloat(product.discount_percentage || 0) / 100),
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
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
  getFavorites,
};
