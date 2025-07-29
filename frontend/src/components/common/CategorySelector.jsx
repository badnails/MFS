import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronRight, 
  ChevronDown, 
  Building, 
  Check, 
  ArrowLeft,
  Search,
  MapPin
} from 'lucide-react';
import './CategorySelector.css';

const CategorySelector = ({ onCategorySelect, initialCategoryId = null, showBreadcrumb = true }) => {
  const [categories, setCategories] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryPath, setCategoryPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (initialCategoryId) {
      fetchCategoryPath(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    filterCategories();
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories);
      setFilteredCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryPath = async (categoryId) => {
    try {
      const response = await axios.get(`/api/categories/${categoryId}/path`);
      setCategoryPath(response.data.path);
      
      // Expand all nodes in the path
      const pathIds = response.data.path.map(cat => cat.id);
      setExpandedNodes(new Set(pathIds));
      
      // Set selected category
      const leafCategory = response.data.path[0];
      setSelectedCategory(leafCategory);
    } catch (error) {
      console.error('Error fetching category path:', error);
    }
  };

  const filterCategories = () => {
    if (!searchTerm) {
      setFilteredCategories(categories);
      return;
    }

    const filterTree = (nodes) => {
      return nodes.reduce((filtered, node) => {
        const matchesSearch = node.category_name.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = node.children ? filterTree(node.children) : [];
        
        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren
          });
          
          // Auto-expand nodes that contain matches
          if (filteredChildren.length > 0) {
            setExpandedNodes(prev => new Set([...prev, node.id]));
          }
        }
        
        return filtered;
      }, []);
    };

    setFilteredCategories(filterTree(categories));
  };

  const toggleExpanded = (nodeId) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  };

  const handleCategorySelect = (category) => {
    if (category.is_leaf) {
      setSelectedCategory(category);
      onCategorySelect(category);
    } else {
      toggleExpanded(category.id);
    }
  };

  const renderCategoryNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedCategory?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className={`category-node level-${level}`}>
        <div 
          className={`category-item ${isSelected ? 'selected' : ''} ${node.is_leaf ? 'leaf' : 'branch'}`}
          onClick={() => handleCategorySelect(node)}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          <div className="category-content">
            {hasChildren && (
              <button 
                className="expand-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.id);
                }}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            
            {!hasChildren && <div className="expand-spacer" />}
            
            <div className="category-icon">
              {node.is_leaf ? <MapPin size={16} /> : <Building size={16} />}
            </div>
            
            <span className="category-name">{node.category_name}</span>
            
            {isSelected && node.is_leaf && (
              <div className="selected-indicator">
                <Check size={16} />
              </div>
            )}
          </div>
          
          {!node.is_leaf && (
            <div className="category-badge">
              {node.children?.length || 0}
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="category-children">
            {node.children.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderBreadcrumb = () => {
    if (!showBreadcrumb || categoryPath.length === 0) return null;

    return (
      <div className="category-breadcrumb">
        <div className="breadcrumb-items">
          {categoryPath.map((item, index) => (
            <React.Fragment key={item.id}>
              {index > 0 && <ChevronRight size={14} className="breadcrumb-separator" />}
              <span 
                className={`breadcrumb-item ${index === 0 ? 'current' : ''}`}
                onClick={() => index > 0 && fetchCategoryPath(item.id)}
              >
                {item.category_name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="category-selector loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-selector">
      <div className="category-header">
        <h3>Select Institution Category</h3>
        <p>Choose a specific category for your institution</p>
      </div>

      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {renderBreadcrumb()}

      <div className="category-tree">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => renderCategoryNode(category))
        ) : (
          <div className="no-results">
            <MapPin size={24} />
            <p>No categories found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {selectedCategory && (
        <div className="selected-summary">
          <div className="summary-content">
            <div className="summary-icon">
              <Check size={16} />
            </div>
            <div className="summary-text">
              <strong>Selected:</strong> {selectedCategory.category_name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
