import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import '../styles/MyProducts.css';

const MyProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    let backendProducts = [];
    let localProducts = [];

    // Try to fetch from backend
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/user/products', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      backendProducts = response.data;
    } catch (error) {
      console.warn('Could not fetch from backend, using localStorage:', error);
    }

    // Always fetch from localStorage as fallback
    try {
      localProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }

    // Combine both sources, remove duplicates by ID
    const allProducts = [...backendProducts, ...localProducts];
    const uniqueProducts = allProducts.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    setProducts(uniqueProducts);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Try to delete from backend first
        const token = localStorage.getItem('token');
        try {
          await axios.delete(`http://localhost:8080/api/products/${productId}`, {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          });
        } catch (apiError) {
          console.warn('Backend delete failed, deleting from localStorage:', apiError);
        }

        // Always delete from localStorage
        const existingProducts = JSON.parse(localStorage.getItem('myProducts') || '[]');
        const updatedProducts = existingProducts.filter(product => product.id !== productId);
        localStorage.setItem('myProducts', JSON.stringify(updatedProducts));

        fetchMyProducts(); // Refresh the list
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'available';
      case 'sold':
        return 'out-of-stock';
      case 'draft':
        return 'draft';
      default:
        return '';
    }
  };

  return (
    <div className="my-products-page">
      <Navbar />
      
      <div className="my-products-container">
        <div className="page-header">
          <h2>My Products</h2>
          <button className="btn-add" onClick={() => navigate('/add-product')}>
            + Add Product
          </button>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'sold' ? 'active' : ''}`}
            onClick={() => setFilter('sold')}
          >
            Sold
          </button>
          <button 
            className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
            onClick={() => setFilter('draft')}
          >
            Draft
          </button>
        </div>

        <div className="products-list">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>No products found.</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="product-item">
                <div className="product-image">
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : '/placeholder.png'} 
                    alt={product.name} 
                    onError={(e) => {
                      e.target.src = '/placeholder.png';
                    }}
                  />
                </div>
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p className="product-price">₱{product.price ? parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</p>
                  <p className="product-stock">Stock: {product.stock || 0}</p>
                  <span className={`product-status ${getStatusClass(product.status)}`}>
                    {product.status ? product.status.charAt(0).toUpperCase() + product.status.slice(1) : 'Draft'}
                  </span>
                </div>
                <div className="product-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => navigate(`/edit-product/${product.id}`)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProducts;