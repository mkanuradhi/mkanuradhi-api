import express from 'express';
import * as blogPostController from '../controllers/blog-post-controller';
import validateObjectId from '../middleware/validate-objectid';
import upload from '../middleware/file-upload';
import requireAuthenticated from '../middleware/require-authenticated';
import Role from '../enums/role';

const blogPostRoute = express.Router();

// Search products by query
blogPostRoute.get('/search', blogPostController.searchBlogPosts);

// Add a new blog post (en text data)
blogPostRoute.post('/', requireAuthenticated([Role.ADMIN]), blogPostController.createBlogPostTextEn);

// Fetch all blog post
blogPostRoute.get('/', blogPostController.getBlogPosts);

// Fetch a specific blog post by ID
blogPostRoute.get('/id/:id', validateObjectId, blogPostController.getBlogPost);

// Fetch a specific blog post by path
blogPostRoute.get('/path/:path', blogPostController.getBlogPostByPath);

// Update blog post text data (partial update only for en text data)
blogPostRoute.patch('/:id/en', requireAuthenticated([Role.ADMIN]), validateObjectId, blogPostController.updateBlogPostTextEn);

// Update blog post si text data (partial update only for si text data)
blogPostRoute.patch('/:id/si', validateObjectId, requireAuthenticated([Role.ADMIN]), blogPostController.updateBlogPostTextSi);

// Update the primary image for a blog post
blogPostRoute.patch('/:id/primary-image', requireAuthenticated([Role.ADMIN]), upload.single('primaryImage'), blogPostController.uploadPrimaryImage);

// Update the images for a blog post
blogPostRoute.patch('/:id/images', requireAuthenticated([Role.ADMIN]), upload.array('images', 5), blogPostController.uploadImages);

// Publish or unpublish a blog post
blogPostRoute.patch('/:id/toggle', requireAuthenticated([Role.ADMIN]), validateObjectId, blogPostController.toggleBlogPostActivation);

// Delete a blog post
blogPostRoute.delete('/:id', requireAuthenticated([Role.ADMIN]), validateObjectId, blogPostController.deleteBlogPost);


export default blogPostRoute;