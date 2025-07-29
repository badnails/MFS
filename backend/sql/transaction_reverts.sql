-- Create transaction_reverts table to track transaction reversions
CREATE TABLE IF NOT EXISTS transaction_reverts (
    id SERIAL PRIMARY KEY,
    original_trx_id TEXT NOT NULL REFERENCES transactions(transactionid),
    revert_trx_id TEXT NOT NULL REFERENCES transactions(transactionid),
    reverter_account_id TEXT NOT NULL REFERENCES accounts(accountid),
    revert_type VARCHAR(20) NOT NULL CHECK (revert_type IN ('ADMIN_REVERT', 'REFUND')),
    revert_timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_reverts_original_trx_id ON transaction_reverts(original_trx_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reverts_revert_trx_id ON transaction_reverts(revert_trx_id);
CREATE INDEX IF NOT EXISTS idx_transaction_reverts_reverter_account_id ON transaction_reverts(reverter_account_id);
