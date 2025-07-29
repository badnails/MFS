import pool from '../db.js';

// Get all categories with their hierarchical structure
export const getCategories = async (req, res) => {
  try {
    const query = `
      WITH RECURSIVE category_tree AS (
        -- Base case: top-level categories
        SELECT 
          id,
          category_name,
          parent_id,
          is_leaf,
          0 as level,
          ARRAY[id] as path
        FROM institution_category 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: child categories
        SELECT 
          c.id,
          c.category_name,
          c.parent_id,
          c.is_leaf,
          ct.level + 1,
          ct.path || c.id
        FROM institution_category c
        JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree
      ORDER BY level, category_name;
    `;

    const result = await pool.query(query);
    
    // Build hierarchical structure
    const categories = buildCategoryTree(result.rows);
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get subcategories for a specific parent
export const getSubcategories = async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const query = `
      SELECT id, category_name, parent_id, is_leaf
      FROM institution_category 
      WHERE parent_id = $1
      ORDER BY category_name;
    `;

    const result = await pool.query(query, [parentId]);
    
    res.json({ subcategories: result.rows });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
};

// Get category path (breadcrumb)
export const getCategoryPath = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const query = `
      WITH RECURSIVE category_path AS (
        SELECT 
          id,
          category_name,
          parent_id,
          0 as level
        FROM institution_category 
        WHERE id = $1
        
        UNION ALL
        
        SELECT 
          c.id,
          c.category_name,
          c.parent_id,
          cp.level + 1
        FROM institution_category c
        JOIN category_path cp ON c.id = cp.parent_id
      )
      SELECT id, category_name, level
      FROM category_path
      ORDER BY level DESC;
    `;

    const result = await pool.query(query, [categoryId]);
    
    res.json({ path: result.rows });
  } catch (error) {
    console.error('Error fetching category path:', error);
    res.status(500).json({ error: 'Failed to fetch category path' });
  }
};

// Helper function to build tree structure
function buildCategoryTree(flatCategories) {
  const categoryMap = new Map();
  const rootCategories = [];

  // First pass: create all category objects
  flatCategories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      children: []
    });
  });

  // Second pass: build the tree structure
  flatCategories.forEach(cat => {
    if (cat.parent_id === null) {
      rootCategories.push(categoryMap.get(cat.id));
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(categoryMap.get(cat.id));
      }
    }
  });

  return rootCategories;
}
