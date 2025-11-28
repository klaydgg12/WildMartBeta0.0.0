import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stock: '',
    images: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    
    setProductData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  };

  const removeImage = (index) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Fallback function to save to localStorage
  const saveToLocalStorage = (product) => {
    try {
      const existingProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');
      const newProduct = {
        id: Date.now().toString(),
        ...product,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      
      existingProducts.push(newProduct);
      localStorage.setItem('myProducts', JSON.stringify(existingProducts));
      return newProduct;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  };

const handlePublish = async () => {
  // Validate required fields
  if (!productData.name || !productData.category || !productData.price || !productData.stock) {
    alert('Please fill in all required fields: Name, Category, Price, and Stock');
    return;
  }

  if (parseFloat(productData.price) <= 0) {
    alert('Price must be greater than 0');
    return;
  }

  if (parseInt(productData.stock) < 0) {
    alert('Stock cannot be negative');
    return;
  }

  // Show confirmation dialog
  const isConfirmed = window.confirm('Are you sure you want to publish this product? This will make it visible to customers.');
  
  if (!isConfirmed) {
    return; // User clicked "Cancel"
  }

  setIsLoading(true);

  try {
    const productToSave = {
      name: productData.name,
      category: productData.category,
      description: productData.description,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      images: productData.images
    };

    let savedProduct;

    // Try backend API first
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('name', productToSave.name);
      formData.append('category', productToSave.category);
      formData.append('description', productToSave.description);
      formData.append('price', productToSave.price);
      formData.append('stock', productToSave.stock);
      formData.append('status', 'active');

      // Add images if any
      const imageInput = document.getElementById('image-upload');
      if (imageInput.files.length > 0) {
        Array.from(imageInput.files).forEach(file => {
          formData.append('images', file);
        });
      }

      const response = await axios.post('http://localhost:8080/api/products', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      savedProduct = response.data;
      console.log('Product saved to backend:', savedProduct);

    } catch (apiError) {
      console.warn('Backend API failed, using localStorage fallback:', apiError);
      // If backend fails, use localStorage as fallback
      savedProduct = saveToLocalStorage(productToSave);
    }

    // Show success message
    navigate('/my-products');

  } catch (error) {
    console.error('Error publishing product:', error);
    alert(`Error publishing product: ${error.message}. Please try again.`);
  } finally {
    setIsLoading(false);
  }
};


  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/my-products');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="add-product-main">
        <h2>Add New Product</h2>
        <div className="product-form-container">
          <div className="product-form">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label>Product Name</label>
              <input 
                type="text" 
                name="name"
                value={productData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <div className="category-dropdown">
                <select 
                  name="category"
                  value={productData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="books">Books</option>
                  <option value="home">Home</option>
                  <option value="accessories">Accessories</option>
                  <option value="sports">Sports</option>
                  <option value="other">Others</option>
                </select>
              </div>
            </div>
            
            {/* Price and Stock in one line */}
            <div className="form-row">
              <div className="form-group">
                <label>Price</label>
                <div className="price-input-container">
                  <span className="currency-symbol">₱</span>
                  <input 
                    type="number" 
                    name="price"
                    value={productData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Stock Quantity</label>
                <input 
                  type="number" 
                  name="stock"
                  value={productData.stock}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Product Description</label>
              <textarea 
                name="description"
                value={productData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Images</label>
              <div className="image-upload-area">
                <input 
                  type="file" 
                  id="image-upload"
                  multiple 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-upload-input"
                />
                <label htmlFor="image-upload" className="image-upload-box">
                  <div className="upload-icon">+</div>
                  <p>Click to upload images</p>
                  <span>or drag and drop</span>
                </label>
                
                {productData.images.length > 0 && (
                  <div className="uploaded-images">
                    <h4>Uploaded Images ({productData.images.length})</h4>
                    <div className="image-preview-grid">
                      {productData.images.map((image, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={image} alt={`Upload ${index + 1}`} />
                          <button 
                            type="button" 
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="publish-btn" 
                onClick={handlePublish}
                disabled={isLoading}
              >
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
          <div className="product-preview">
            <h3>Preview</h3>
            <div className="preview-content">
              <h3>Product Detail</h3>
              <div className="preview-image-section">
                {productData.images.length > 0 ? (
                  <div className="preview-main-image">
                    <img src={productData.images[0]} alt="Product preview" />
                  </div>
                ) : (
                  <div className="preview-image-placeholder">
                    No image uploaded
                  </div>
                )}
                
                {productData.images.length > 1 && (
                  <div className="preview-thumbnails">
                    {productData.images.slice(1).map((image, index) => (
                      <div key={index + 1} className="preview-thumbnail">
                        <img src={image} alt={`Thumbnail ${index + 2}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <h4>{productData.name || 'Product Name'}</h4>
              <p>{productData.description || 'Product details here!'}</p>
              <div className="preview-category">
                <strong>Category:</strong> {productData.category || 'Not selected'}
              </div>
              <div className="preview-details">
  <div className="preview-price-stock-row">
    <div className="preview-price">
      <strong>Price:</strong> ₱{productData.price ? parseFloat(productData.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
    </div>
    <div className="preview-stock">
      <strong>Stock:</strong> {productData.stock || '0'} 
    </div>
  </div>
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;