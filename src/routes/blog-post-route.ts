import express from 'express';
import * as blogPostController from '../controllers/blog-post-controller';
import validateObjectId from '../middleware/validate-objectid';
import upload from '../middleware/file-upload';

const blogPostRoute = express.Router();

// Add a new blog post (text data)
blogPostRoute.post('/', blogPostController.createBlogPostText);

// Fetch all blog post
blogPostRoute.get('/', blogPostController.getBlogPosts);

// Fetch a specific blog post by ID
blogPostRoute.get('/id/:id', validateObjectId, blogPostController.getBlogPost);

// Fetch a specific blog post by path
blogPostRoute.get('/path/:path', blogPostController.getBlogPostByPath);

// Update blog post text data (partial update for text data only)
blogPostRoute.patch('/:id/text-data', validateObjectId, blogPostController.updateBlogPostText);

// Update the primary image for a blog post
blogPostRoute.patch('/:id/primary-image', upload.single('primaryImage'), blogPostController.uploadPrimaryImage);

// Update the images for a blog post
blogPostRoute.patch('/:id/images', upload.array('images', 5), blogPostController.uploadImages);

// Delete a blog post
blogPostRoute.delete('/:id', validateObjectId, blogPostController.deleteBlogPost);


export default blogPostRoute;