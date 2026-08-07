// import { jest } from '@jest/globals';

// // Create mock functions
// const mockCreateProduct = jest.fn();
// const mockGetProducts = jest.fn();
// const mockGetProductById = jest.fn();
// const mockUpdateProduct = jest.fn();
// const mockDeleteProduct = jest.fn();
// const mockSearchProducts = jest.fn();
// const mockGetFarmerProducts = jest.fn();
// const mockToggleProductAvailability = jest.fn();
// const mockGetProductsByCategory = jest.fn();

// jest.mock('../src/services/product.service', () => {
//   return {
//     ProductService: jest.fn().mockImplementation(() => ({
//       createProduct: mockCreateProduct,
//       getProducts: mockGetProducts,
//       getProductById: mockGetProductById,
//       updateProduct: mockUpdateProduct,
//       deleteProduct: mockDeleteProduct,
//       searchProducts: mockSearchProducts,
//       getFarmerProducts: mockGetFarmerProducts,
//       toggleProductAvailability: mockToggleProductAvailability,
//       getProductsByCategory: mockGetProductsByCategory,
//     })),
//   };
// });
// jest.mock('.././src/config/database', () => ({
//   __esModule: true,
//   default: {
//     product: {
//       create: jest.fn(),
//       findMany: jest.fn(),
//       findUnique: jest.fn(),
//       update: jest.fn(),
//       delete: jest.fn(),
//     },
//   },
// }));
// import { Response } from 'express';
// import { ProductController } from '../src/controllers/product.controller';
// import { AuthRequest } from '../src/middlewares/auth.middleware';
// import { describe, it, expect, beforeEach } from '@jest/globals';

// // Mock Prisma to prevent database calls


// describe('ProductController', () => {
//   let productController: ProductController;
//   let mockRequest: Partial<AuthRequest>;
//   let mockResponse: Partial<Response>;
//   let statusMock: jest.Mock;
//   let jsonMock: jest.Mock;
//   let sendMock: jest.Mock;

//   beforeEach(() => {
//     // Clear all mocks before each test
//     jest.clearAllMocks();

//     productController = new ProductController();

//     statusMock = jest.fn().mockReturnThis();
//     jsonMock = jest.fn().mockReturnThis();
//     sendMock = jest.fn().mockReturnThis();

//     mockRequest = {
//       user: { userId: 'farmer-123', role: 'FARMER' },
//       params: {},
//       query: {},
//       body: {},
//     };

//     mockResponse = {
//       status: statusMock,
//       json: jsonMock,
//       send: sendMock,
//     };
//   });

//   describe('create', () => {
//     it('should create a product successfully', async () => {
//       const productData = {
//         name: 'Tomatoes',
//         category: 'Vegetables',
//         price: 25.5,
//         unit: 'kg',
//         quantity: 100,
//       };

//       const createdProduct = {
//         id: 'product-123',
//         ...productData,
//         farmerId: 'farmer-123',
//         images: [],
//         isAvailable: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         farmer: {
//           id: 'farmer-123',
//           name: 'John Farmer',
//           location: 'Farm Valley',
//           rating: 4.5,
//         },
//       };

//       mockRequest.body = productData;
//       mockCreateProduct.mockResolvedValue(createdProduct);

//       await productController.create(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockCreateProduct).toHaveBeenCalledWith('farmer-123', productData);
//       expect(statusMock).toHaveBeenCalledWith(201);
//       expect(jsonMock).toHaveBeenCalledWith(createdProduct);
//     });

//     it('should handle errors when creating product', async () => {
//       mockRequest.body = { name: 'Test' };
//       mockCreateProduct.mockRejectedValue(new Error('Validation failed'));

//       await productController.create(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({ error: 'Validation failed' });
//     });
//   });

//   describe('getAll', () => {
//     it('should get all products without filters', async () => {
//       const products = [
//         { id: 'product-1', name: 'Tomatoes', category: 'Vegetables' },
//         { id: 'product-2', name: 'Apples', category: 'Fruits' },
//       ];

//       mockGetProducts.mockResolvedValue(products);

//       await productController.getAll(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockGetProducts).toHaveBeenCalledWith({
//         category: undefined,
//         farmerId: undefined,
//         isAvailable: undefined,
//       });
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });

//     it('should get products with filters', async () => {
//       mockRequest.query = {
//         category: 'Vegetables',
//         isAvailable: 'true',
//         farmerId: 'farmer-456',
//       };

//       const products = [{ id: 'product-1', name: 'Tomatoes', category: 'Vegetables' }];
//       mockGetProducts.mockResolvedValue(products);

//       await productController.getAll(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockGetProducts).toHaveBeenCalledWith({
//         category: 'Vegetables',
//         farmerId: 'farmer-456',
//         isAvailable: true,
//       });
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });
//   });

//   describe('getById', () => {
//     it('should get product by id successfully', async () => {
//       const product = {
//         id: 'product-123',
//         name: 'Tomatoes',
//         category: 'Vegetables',
//         farmer: { id: 'farmer-123', name: 'John' },
//       };

//       mockRequest.params = { id: 'product-123' };
//       mockGetProductById.mockResolvedValue(product);

//       await productController.getById(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockGetProductById).toHaveBeenCalledWith('product-123');
//       expect(jsonMock).toHaveBeenCalledWith(product);
//     });

//     it('should return 404 if product not found', async () => {
//       mockRequest.params = { id: 'non-existent' };
//       mockGetProductById.mockResolvedValue(null);

//       await productController.getById(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(404);
//       expect(jsonMock).toHaveBeenCalledWith({ error: 'Product not found' });
//     });
//   });

//   describe('update', () => {
//     it('should update product successfully', async () => {
//       const updateData = { name: 'Updated Tomatoes', price: 30 };
//       const updatedProduct = {
//         id: 'product-123',
//         ...updateData,
//         farmerId: 'farmer-123',
//       };

//       mockRequest.params = { id: 'product-123' };
//       mockRequest.body = updateData;
//       mockUpdateProduct.mockResolvedValue(updatedProduct);

//       await productController.update(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockUpdateProduct).toHaveBeenCalledWith('product-123', 'farmer-123', updateData);
//       expect(jsonMock).toHaveBeenCalledWith(updatedProduct);
//     });

//     it('should handle unauthorized update', async () => {
//       mockRequest.params = { id: 'product-123' };
//       mockRequest.body = { name: 'Updated' };
//       mockUpdateProduct.mockRejectedValue(new Error('Product not found or unauthorized'));

//       await productController.update(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({
//         error: 'Product not found or unauthorized',
//       });
//     });
//   });

//   describe('delete', () => {
//     it('should delete product successfully', async () => {
//       mockRequest.params = { id: 'product-123' };
//       mockDeleteProduct.mockResolvedValue({});

//       await productController.delete(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockDeleteProduct).toHaveBeenCalledWith('product-123', 'farmer-123');
//       expect(statusMock).toHaveBeenCalledWith(204);
//       expect(sendMock).toHaveBeenCalled();
//     });

//     it('should handle errors when deleting', async () => {
//       mockRequest.params = { id: 'product-123' };
//       mockDeleteProduct.mockRejectedValue(new Error('Product not found or unauthorized'));

//       await productController.delete(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({
//         error: 'Product not found or unauthorized',
//       });
//     });
//   });

//   describe('search', () => {
//     it('should search products with query term', async () => {
//       mockRequest.query = { q: 'tomato' };
//       const products = [
//         { id: 'product-1', name: 'Tomatoes', category: 'Vegetables' },
//         { id: 'product-2', name: 'Cherry Tomatoes', category: 'Vegetables' },
//       ];

//       mockSearchProducts.mockResolvedValue(products);

//       await productController.search(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockSearchProducts).toHaveBeenCalledWith('tomato', {
//         category: undefined,
//         minPrice: undefined,
//         maxPrice: undefined,
//         isAvailable: undefined,
//       });
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });

//     it('should search products with all filters', async () => {
//       mockRequest.query = {
//         q: 'organic',
//         category: 'Vegetables',
//         minPrice: '10',
//         maxPrice: '50',
//         isAvailable: 'true',
//       };

//       const products = [{ id: 'product-1', name: 'Organic Tomatoes' }];
//       mockSearchProducts.mockResolvedValue(products);

//       await productController.search(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockSearchProducts).toHaveBeenCalledWith('organic', {
//         category: 'Vegetables',
//         minPrice: 10,
//         maxPrice: 50,
//         isAvailable: true,
//       });
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });

//     it('should return 400 if search term is missing', async () => {
//       mockRequest.query = {};

//       await productController.search(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({
//         error: 'Search term (q) is required',
//       });
//       expect(mockSearchProducts).not.toHaveBeenCalled();
//     });
//   });

//   describe('getFarmerProducts', () => {
//     it('should get products for specific farmer', async () => {
//       mockRequest.params = { farmerId: 'farmer-456' };
//       const products = [
//         { id: 'product-1', name: 'Tomatoes', farmerId: 'farmer-456' },
//         { id: 'product-2', name: 'Carrots', farmerId: 'farmer-456' },
//       ];

//       mockGetFarmerProducts.mockResolvedValue(products);

//       await productController.getFarmerProducts(
//         mockRequest as AuthRequest,
//         mockResponse as Response
//       );

//       expect(mockGetFarmerProducts).toHaveBeenCalledWith('farmer-456', undefined);
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });

//     it('should get farmer products with availability filter', async () => {
//       mockRequest.params = { farmerId: 'farmer-456' };
//       mockRequest.query = { isAvailable: 'true' };
//       const products = [{ id: 'product-1', name: 'Tomatoes', isAvailable: true }];

//       mockGetFarmerProducts.mockResolvedValue(products);

//       await productController.getFarmerProducts(
//         mockRequest as AuthRequest,
//         mockResponse as Response
//       );

//       expect(mockGetFarmerProducts).toHaveBeenCalledWith('farmer-456', true);
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });
//   });

//   describe('getMyProducts', () => {
//     it('should get authenticated farmer own products', async () => {
//       const products = [
//         { id: 'product-1', name: 'Tomatoes', farmerId: 'farmer-123' },
//         { id: 'product-2', name: 'Carrots', farmerId: 'farmer-123' },
//       ];

//       mockGetFarmerProducts.mockResolvedValue(products);

//       await productController.getMyProducts(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockGetFarmerProducts).toHaveBeenCalledWith('farmer-123', undefined);
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });

//     it('should get own products with availability filter', async () => {
//       mockRequest.query = { isAvailable: 'false' };
//       const products = [{ id: 'product-1', name: 'Out of Stock Item', isAvailable: false }];

//       mockGetFarmerProducts.mockResolvedValue(products);

//       await productController.getMyProducts(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockGetFarmerProducts).toHaveBeenCalledWith('farmer-123', false);
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });
//   });

//   describe('toggleAvailability', () => {
//     it('should toggle product availability successfully', async () => {
//       mockRequest.params = { id: 'product-123' };
//       const updatedProduct = {
//         id: 'product-123',
//         name: 'Tomatoes',
//         isAvailable: false,
//       };

//       mockToggleProductAvailability.mockResolvedValue(updatedProduct);

//       await productController.toggleAvailability(
//         mockRequest as AuthRequest,
//         mockResponse as Response
//       );

//       expect(mockToggleProductAvailability).toHaveBeenCalledWith('product-123', 'farmer-123');
//       expect(jsonMock).toHaveBeenCalledWith(updatedProduct);
//     });

//     it('should handle unauthorized toggle attempt', async () => {
//       mockRequest.params = { id: 'product-123' };
//       mockToggleProductAvailability.mockRejectedValue(
//         new Error('Product not found or unauthorized')
//       );

//       await productController.toggleAvailability(
//         mockRequest as AuthRequest,
//         mockResponse as Response
//       );

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({
//         error: 'Product not found or unauthorized',
//       });
//     });
//   });

//   describe('getByCategory', () => {
//     it('should get products by category', async () => {
//       mockRequest.params = { category: 'Vegetables' };
//       const products = [
//         { id: 'product-1', name: 'Tomatoes', category: 'Vegetables', isAvailable: true },
//         { id: 'product-2', name: 'Carrots', category: 'Vegetables', isAvailable: true },
//       ];

//       mockGetProductsByCategory.mockResolvedValue(products);

//       await productController.getByCategory(mockRequest as AuthRequest, mockResponse as Response);

//       expect(mockGetProductsByCategory).toHaveBeenCalledWith('Vegetables');
//       expect(jsonMock).toHaveBeenCalledWith(products);
//     });

//     it('should return 400 if category is missing', async () => {
//       mockRequest.params = {};

//       await productController.getByCategory(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({ error: 'Category is required' });
//       expect(mockGetProductsByCategory).not.toHaveBeenCalled();
//     });

//     it('should handle errors when getting products by category', async () => {
//       mockRequest.params = { category: 'InvalidCategory' };
//       mockGetProductsByCategory.mockRejectedValue(new Error('Database error'));

//       await productController.getByCategory(mockRequest as AuthRequest, mockResponse as Response);

//       expect(statusMock).toHaveBeenCalledWith(400);
//       expect(jsonMock).toHaveBeenCalledWith({ error: 'Database error' });
//     });
//   });
// });