/**
 * Product Service
 * Optimized business logic for product operations with caching
 *
 * Features:
 * - Result caching for better performance
 * - Batch operations support
 * - Comprehensive error handling
 * - Transaction support
 */

const productRepository = require('../../repositories/product-repository');
const imageService = require('./image-service');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');
const { NotFoundError, ValidationError, AuthorizationError } = require('../../errors');
const config = require('../../config');

class ProductService {
  /**
   * Create a new product listing
   */
  async createProduct(userId, productData, files) {
    try {
      logger.info('Creating product', { userId, title: productData.title });

      // Validate required fields
      if (!productData.title || !productData.description || !productData.price) {
        throw new ValidationError(
          'Missing required fields: title, description, and price are required'
        );
      }

      // Find category by slug
      let categoryId = null;
      if (productData.category) {
        const category = await productRepository.findCategoryBySlug(productData.category);
        if (!category) {
          throw new ValidationError(`Category '${productData.category}' not found`);
        }
        categoryId = category.id;
      }

      // Upload images to Cloudinary
      let imageUrls = [];
      if (files && files.length > 0) {
        imageUrls = await imageService.uploadProductImages(files, userId);
      }

      // Prepare product data
      const productRecord = {
        user_id: userId,
        category_id: categoryId,
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price),
        currency: productData.currency || 'KES',
        condition: productData.condition,
        location: productData.location,
        images: JSON.stringify(imageUrls),
        product_code: productData.product_code,
        brand: productData.brand,
        model: productData.model,
        color: productData.color,
        size: productData.size,
        weight: productData.weight,
        dimensions: productData.dimensions,
        material: productData.material,
        warranty_period: productData.warranty_period,
        warranty_type: productData.warranty_type,
        stock_quantity: parseInt(productData.stock_quantity) || 1,
        min_order_quantity: parseInt(productData.min_order_quantity) || 1,
        max_order_quantity: productData.max_order_quantity
          ? parseInt(productData.max_order_quantity)
          : null,
        discount_percentage: parseFloat(productData.discount_percentage) || 0,
        discount_end_date: productData.discount_end_date || null,
        tags: productData.tags || '',
        seo_title: productData.seo_title,
        seo_description: productData.seo_description,
        shipping_included:
          productData.shipping_included === 'true' || productData.shipping_included === true,
        shipping_cost: parseFloat(productData.shipping_cost) || 0,
        return_policy: productData.return_policy,
        is_digital: productData.is_digital === 'true' || productData.is_digital === true,
        download_url: productData.download_url,
        contact_phone: productData.contact_phone,
        contact_email: productData.contact_email,
        negotiable: productData.negotiable === 'true' || productData.negotiable === true,
      };

      // Create product in database
      const product = await productRepository.create(productRecord);

      logger.success('Product created successfully', {
        productId: product.id,
        userId,
        imagesCount: imageUrls.length,
      });

      return product;
    } catch (error) {
      logger.error('Failed to create product', error, { userId });
      throw error;
    }
  }

  /**
   * Get product by ID with caching and view count increment
   * @param {string} productId - Product ID
   * @param {boolean} incrementView - Whether to increment view count
   * @returns {Promise<Object>} Product data
   */
  async getProductById(productId, incrementView = false) {
    try {
      // Check cache for non-view increment requests
      const cacheKey = cache.generateKey('product', productId);

      if (!incrementView) {
        const cached = cache.get(cacheKey);
        if (cached) {
          logger.debug('Product cache hit', { productId });
          return cached;
        }
      }

      const product = await productRepository.findById(productId);

      if (!product) {
        throw new NotFoundError('Product not found', { productId });
      }

      // Parse images JSON safely
      product.images = this.parseImages(product.images);

      // Increment view count asynchronously (don't block response)
      if (incrementView) {
        productRepository
          .incrementViews(productId)
          .catch(err => logger.error('Failed to increment views', err, { productId }));
        product.views = (product.views || 0) + 1;
      }

      // Calculate final price
      product.final_price = this.calculateFinalPrice(product.price, product.discount_percentage);
      product.discount_amount = product.price - product.final_price;

      // Cache the result (5 minutes TTL)
      if (!incrementView) {
        cache.set(cacheKey, product, 300, ['products', `user:${product.user_id}`]);
      }

      return product;
    } catch (error) {
      logger.error('Failed to get product by ID', error, { productId });
      throw error;
    }
  }

  /**
   * Get seller's products
   */
  async getSellerProducts(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { products, total } = await productRepository.findByUserId(userId, { limit, offset });

      // Parse images and calculate final prices
      const enrichedProducts = products.map(product => ({
        ...product,
        images: this.parseImages(product.images),
        final_price: this.calculateFinalPrice(product.price, product.discount_percentage),
      }));

      return {
        products: enrichedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get seller products', error, { userId });
      throw error;
    }
  }

  /**
   * Browse all products (public)
   */
  async browseProducts(filters = {}) {
    try {
      const page = parseInt(filters.page) || 1;
      const limit = Math.min(
        parseInt(filters.limit) || config.pagination.defaultLimit,
        config.pagination.maxLimit
      );
      const offset = (page - 1) * limit;

      const { products, total } = await productRepository.browse({ limit, offset });

      // Parse images and calculate final prices
      const enrichedProducts = products.map(product => ({
        ...product,
        images: this.parseImages(product.images),
        final_price: this.calculateFinalPrice(product.price, product.discount_percentage),
        seller_name: product.seller_name || 'Seller',
      }));

      return {
        products: enrichedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to browse products', error);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId, userId, updateData, files) {
    try {
      // Check if product exists and belongs to user
      const existingProduct = await productRepository.findById(productId);

      if (!existingProduct) {
        throw new NotFoundError('Product', productId);
      }

      if (existingProduct.user_id !== userId) {
        throw new AuthorizationError('You do not have permission to update this product');
      }

      // Handle image uploads if provided
      if (files && files.length > 0) {
        const newImageUrls = await imageService.uploadProductImages(files, userId);
        updateData.images = JSON.stringify(newImageUrls);
      }

      // Update category if provided
      if (updateData.category) {
        const category = await productRepository.findCategoryBySlug(updateData.category);
        if (category) {
          updateData.category_id = category.id;
        }
        delete updateData.category;
      }

      // Update product in database
      const updatedProduct = await productRepository.update(productId, updateData);

      logger.success('Product updated successfully', { productId, userId });

      return updatedProduct;
    } catch (error) {
      logger.error('Failed to update product', error, { productId, userId });
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productId, userId) {
    try {
      // Check if product exists and belongs to user
      const existingProduct = await productRepository.findById(productId);

      if (!existingProduct) {
        throw new NotFoundError('Product', productId);
      }

      if (existingProduct.user_id !== userId) {
        throw new AuthorizationError('You do not have permission to delete this product');
      }

      // Delete images from Cloudinary
      if (existingProduct.images) {
        const imageUrls = this.parseImages(existingProduct.images);
        await imageService.deleteProductImages(imageUrls);
      }

      // Delete product from database
      await productRepository.delete(productId);

      logger.success('Product deleted successfully', { productId, userId });

      return true;
    } catch (error) {
      logger.error('Failed to delete product', error, { productId, userId });
      throw error;
    }
  }

  // Helper methods
  calculateFinalPrice(price, discountPercentage) {
    if (!discountPercentage || discountPercentage === 0) {
      return parseFloat(price);
    }
    return parseFloat(price) * (1 - parseFloat(discountPercentage) / 100);
  }

  parseImages(imagesJson) {
    if (!imagesJson) return [];
    try {
      return typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson;
    } catch (e) {
      return [];
    }
  }
}

module.exports = new ProductService();
