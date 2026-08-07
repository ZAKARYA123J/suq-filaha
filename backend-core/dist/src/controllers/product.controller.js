import { ProductService } from '../services/product.service';
const productService = new ProductService();
export class ProductController {
    async create(req, res) {
        try {
            const product = await productService.createProduct(req.user.userId, req.body);
            res.status(201).json(product);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getAll(req, res) {
        try {
            const { category, farmerId, isAvailable } = req.query;
            const products = await productService.getProducts({
                category: category,
                farmerId: farmerId,
                isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
            });
            res.json(products);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async getById(req, res) {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json(product);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async update(req, res) {
        try {
            const product = await productService.updateProduct(req.params.id, req.user.userId, req.body);
            res.json(product);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    async delete(req, res) {
        try {
            await productService.deleteProduct(req.params.id, req.user.userId);
            res.status(204).send();
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}
