-- Create float_requests table for agent money requests
CREATE TABLE IF NOT EXISTS float_requests (
    request_id SERIAL PRIMARY KEY,
    accountid TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    sup_doc BYTEA NOT NULL,
    sup_doc_mime_type VARCHAR(100) NOT NULL,
    sup_doc_filename VARCHAR(255) NOT NULL,
    sup_doc_upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    request_status VARCHAR(20) DEFAULT 'PENDING' CHECK (request_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by TEXT,
    processed_date TIMESTAMP,
    comments TEXT,
    FOREIGN KEY (accountid) REFERENCES accounts(accountid),
    FOREIGN KEY (processed_by) REFERENCES accounts(accountid)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_float_requests_accountid ON float_requests(accountid);
CREATE INDEX IF NOT EXISTS idx_float_requests_status ON float_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_float_requests_date ON float_requests(request_date);
