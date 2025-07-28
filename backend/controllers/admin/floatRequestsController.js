// backend/controllers/admin/floatRequestsController.js
import pool from '../../db.js';

// Get all float requests with agent details
export const getAllFloatRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        fr.request_id,
        fr.accountid,
        fr.amount,
        fr.request_status,
        fr.request_date,
        fr.processed_date,
        fr.processed_by,
        fr.sup_doc_filename,
        a.username as agent_name,
        a.availablebalance as agent_current_balance
      FROM float_requests fr
      JOIN accounts a ON fr.accountid = a.accountid
      ORDER BY fr.request_date DESC
    `);
    
    const requests = result.rows.map(request => ({
      ...request,
      amount: parseFloat(request.amount),
      agent_current_balance: parseFloat(request.agent_current_balance)
    }));
    
    res.json({ requests });
    
  } catch (err) {
    console.error('Get all float requests error:', err);
    res.status(500).json({ error: 'Failed to retrieve float requests' });
  }
};

// Update float request status (approve/reject)
export const updateFloatRequestStatus = async (req, res) => {
  const adminId = req.user?.accountid;
  const { requestId } = req.params;
  const { status } = req.body;
  
  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!requestId || !status) {
    return res.status(400).json({ error: 'Request ID and status are required' });
  }
  
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verify admin account
    const adminCheck = await client.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [adminId]
    );
    
    if (adminCheck.rowCount === 0 || adminCheck.rows[0].accounttype !== 'ADMIN') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied. Admin account required.' });
    }
    
    // Get the float request details
    const requestResult = await client.query(
      'SELECT * FROM float_requests WHERE request_id = $1 AND request_status = $2',
      [requestId, 'PENDING']
    );
    
    if (requestResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending float request not found' });
    }
    
    const request = requestResult.rows[0];
    
    // Update request status
    const updateResult = await client.query(`
      UPDATE float_requests 
      SET request_status = $1, 
          processed_by = $2, 
          processed_date = now()
      WHERE request_id = $3
      RETURNING *
    `, [status, adminId, requestId]);
    
    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to update request status' });
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: `Float request ${status.toLowerCase()} successfully`,
      request: {
        ...updateResult.rows[0],
        amount: parseFloat(updateResult.rows[0].amount)
      }
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update float request status error:', err);
    res.status(500).json({ error: 'Failed to update request status' });
  } finally {
    client.release();
  }
};

// Get supporting document for a float request (admin view)
export const getFloatRequestDocument = async (req, res) => {
  const adminId = req.user?.accountid;
  const { requestId } = req.params;
  
  if (!adminId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }
  
  try {
    // Verify admin account
    const adminCheck = await pool.query(
      'SELECT accounttype FROM accounts WHERE accountid = $1',
      [adminId]
    );
    
    if (adminCheck.rowCount === 0 || adminCheck.rows[0].accounttype !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin account required.' });
    }
    
    const result = await pool.query(`
      SELECT sup_doc, sup_doc_mime_type, sup_doc_filename 
      FROM float_requests 
      WHERE request_id = $1 AND sup_doc IS NOT NULL
    `, [requestId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const { sup_doc, sup_doc_mime_type, sup_doc_filename } = result.rows[0];
    
    // Set appropriate headers
    res.set({
      'Content-Type': sup_doc_mime_type,
      'Content-Length': sup_doc.length,
      'Content-Disposition': `inline; filename="${sup_doc_filename}"`
    });
    
    // Send the image buffer
    res.send(sup_doc);
    
  } catch (err) {
    console.error('Get float request document error:', err);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
};
