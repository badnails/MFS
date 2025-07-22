// src/components/InstitutionalAccountInfo.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Globe, ChevronRight, ChevronDown, Plus, Edit3, Save, X } from 'lucide-react';
import axios from 'axios';

const InstitutionalAccountInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountType, accountid } = location.state || {};

  const [formData, setFormData] = useState({
    merchantname: '',
    websiteurl: '',
    category_id: null
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    category_name: '',
    parent_id: null,
    is_leaf: false
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get('/api/institution-categories');
      setCategories(buildCategoryTree(response.data));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const buildCategoryTree = (flatCategories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    flatCategories.forEach(cat => {
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children.push(categoryMap.get(cat.id));
        }
      } else {
        rootCategories.push(categoryMap.get(cat.id));
      }
    });

    return rootCategories;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleCategorySelect = (category) => {
    if (category.is_leaf) {
      setSelectedCategory(category);
      setFormData({
        ...formData,
        category_id: category.id
      });
      const path = buildCategoryPath(category.id);
      setCategoryPath(path);
    }
  };

  const buildCategoryPath = (categoryId) => {
    const findPath = (categories, targetId, currentPath = []) => {
      for (const category of categories) {
        const newPath = [...currentPath, category.category_name];
        if (category.id === targetId) {
          return newPath;
        }
        if (category.children.length > 0) {
          const result = findPath(category.children, targetId, newPath);
          if (result) return result;
        }
      }
      return null;
    };
    return findPath(categories, categoryId) || [];
  };

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = async (parentId = null) => {
    setNewCategoryForm({
      category_name: '',
      parent_id: parentId,
      is_leaf: false
    });
    setShowAddCategory(true);
  };

  const submitNewCategory = async () => {
    try {
      if (!newCategoryForm.category_name.trim()) {
        setError('Category name is required');
        return;
      }

      await axios.post('/api/institution-categories', newCategoryForm);
      await fetchCategories();
      setShowAddCategory(false);
      setNewCategoryForm({ category_name: '', parent_id: null, is_leaf: false });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory({
      ...category,
      original_name: category.category_name
    });
  };

  const submitCategoryEdit = async () => {
    try {
      if (!editingCategory.category_name.trim()) {
        setError('Category name is required');
        return;
      }

      await axios.put(`/api/institution-categories/${editingCategory.id}`, {
        category_name: editingCategory.category_name,
        is_leaf: editingCategory.is_leaf
      });
      
      await fetchCategories();
      setEditingCategory(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category.id} className={`ml-${level * 4}`}>
        <div className="flex items-center justify-between p-2 border-b hover:bg-gray-50">
          <div className="flex items-center flex-1">
            {category.children.length > 0 && (
              <button
                onClick={() => toggleCategoryExpansion(category.id)}
                className="mr-2 text-gray-600"
              >
                {expandedCategories.has(category.id) ? 
                  <ChevronDown size={16} /> : 
                  <ChevronRight size={16} />
                }
              </button>
            )}
            
            {editingCategory?.id === category.id ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  value={editingCategory.category_name}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    category_name: e.target.value
                  })}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <label className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={editingCategory.is_leaf}
                    onChange={(e) => setEditingCategory({
                      ...editingCategory,
                      is_leaf: e.target.checked
                    })}
                    className="mr-1"
                  />
                  Leaf
                </label>
                <button
                  onClick={submitCategoryEdit}
                  className="text-green-600 hover:text-green-800"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-1">
                <button
                  onClick={() => handleCategorySelect(category)}
                  disabled={!category.is_leaf}
                  className={`text-left flex-1 text-sm ${
                    category.is_leaf 
                      ? 'text-blue-600 hover:text-blue-800 cursor-pointer' 
                      : 'text-gray-700 cursor-default'
                  } ${
                    selectedCategory?.id === category.id ? 'font-semibold bg-blue-50' : ''
                  }`}
                >
                  {category.category_name}
                  {category.is_leaf && <span className="ml-2 text-xs text-green-600">[Selectable]</span>}
                </button>
                
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Edit category"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => handleAddCategory(category.id)}
                    className="text-green-600 hover:text-green-800"
                    title="Add subcategory"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {expandedCategories.has(category.id) && category.children.length > 0 && (
          <div className="ml-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.merchantname || !formData.category_id) {
        setError('Please enter merchant name and select a category.');
        setLoading(false);
        return;
      }

      const response = await axios.post('/auth/institutionalinfo', {
        formData,
        accountid
      });

      if (response.status === 200) {
        console.log('Institutional info submitted successfully:', response.data);
        navigate('/contact-info', { 
          state: { 
            accountid,
            accountType,
            previousStep: 'institutional-info'
          } 
        });
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow px-6 py-8">
          <div className="mb-8 text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
              {accountType === 'MERCHANT' ? 'Merchant' : 'Biller'} Information
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please provide your business details to complete your {accountType.toLowerCase()} account setup
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {accountType === 'MERCHANT' ? 'Merchant Name' : 'Biller Name'} *
              </label>
              <input
                type="text"
                name="merchantname"
                value={formData.merchantname}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                placeholder={`Enter your ${accountType === 'MERCHANT' ? 'merchant' : 'biller'} name`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website URL (optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  name="websiteurl"
                  value={formData.websiteurl}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-1"
                  placeholder="https://example.com"
                />
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 mt-0.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Business Category *
                </label>
                <button
                  type="button"
                  onClick={() => handleAddCategory(null)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus size={16} className="mr-1" />
                  Add Category
                </button>
              </div>

              {selectedCategory && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900">Selected Category:</p>
                  <p className="text-sm text-blue-800">
                    {categoryPath.join(' → ')}
                  </p>
                </div>
              )}

              <div className="border border-gray-300 rounded-md max-h-96 overflow-y-auto">
                {categories.length > 0 ? (
                  renderCategoryTree(categories)
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No categories available. Create your first category.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading || !formData.category_id}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Continue to Contact Info'
                )}
              </button>
            </div>
          </form>

          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Category
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategoryForm.category_name}
                      onChange={(e) => setNewCategoryForm({
                        ...newCategoryForm,
                        category_name: e.target.value
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newCategoryForm.is_leaf}
                        onChange={(e) => setNewCategoryForm({
                          ...newCategoryForm,
                          is_leaf: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        This is a selectable category (leaf node)
                      </span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitNewCategory}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionalAccountInfo;
