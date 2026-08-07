import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ProductService } from '../services/product.service';
const productService = new ProductService();

export class ProductController {
  async create(req: AuthRequest, res: Response) {
    try {
  const farmerId = req.user?.userId as string;
  const files = req.files as Express.Multer.File[];

  const imageUrls = files?.map(file => file.path) || [];

  const product = await productService.createProduct(farmerId, {
    ...req.body,
    images: imageUrls,
    quantity: Number(req.body.quantity),
price: Number(req.body.price),
harvestDate: req.body.harvestDate
  ? new Date(req.body.harvestDate)
  : null,
  });
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      const { category, isAvailable, farmerId } = req.query;
      const products = await productService.getProducts({
        category: category as string,
        farmerId: farmerId as string,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      });
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  
  async getAvailble(req: AuthRequest, res: Response) {
    try {
      const {isAvailable } = req.query;
      const products = await productService.getProductsAvailable({
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      });
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id as string);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const product = await productService.updateProduct(
        req.params.id as string,
        req.user!.userId,
        req.body
      );
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await productService.deleteProduct(req.params.id as string, req.user!.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async search(req: AuthRequest, res: Response) {
    try {
      const { q, category, minPrice, maxPrice, isAvailable } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Search term (q) is required' });
      }

      const products = await productService.searchProducts(q as string, {
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      });
      
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFarmerProducts(req: AuthRequest, res: Response) {
    try {
      const { farmerId } = req.params;
      const { isAvailable } = req.query;
      
      const products = await productService.getFarmerProducts(
        farmerId as string,
        isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined
      );
      
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMyProducts(req: AuthRequest, res: Response) {
    try {
      const { isAvailable } = req.query;
      
      const products = await productService.getFarmerProducts(
        req.user!.userId,
        isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined
      );
      
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async toggleAvailability(req: AuthRequest, res: Response) {
    try {
      const product = await productService.toggleProductAvailability(
        req.params.id as string,
        req.user!.userId
      );
      
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getByCategory(req: AuthRequest, res: Response) {
    try {
      const { category } = req.params;
      
      if (!category) {
        return res.status(400).json({ error: 'Category is required' });
      }

      const products = await productService.getProductsByCategory(category as string);
      
      res.json(products);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}