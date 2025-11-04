-- Create messages table for in-app messaging system
-- This table stores messages between buyers and sellers

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  listing_id UUID,
  property_id UUID,
  job_id UUID,
  attachments JSONB,
  read BOOLEAN DEFAULT FALSE,
  deleted_by_sender UUID,
  deleted_by_receiver UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Stores messages between users (buyers and sellers)';
COMMENT ON COLUMN messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN messages.receiver_id IS 'User who received the message';
COMMENT ON COLUMN messages.subject IS 'Message subject/title';
COMMENT ON COLUMN messages.message IS 'Message body content';
COMMENT ON COLUMN messages.parent_message_id IS 'ID of parent message if this is a reply';
COMMENT ON COLUMN messages.listing_id IS 'Optional reference to product listing';
COMMENT ON COLUMN messages.property_id IS 'Optional reference to property listing';
COMMENT ON COLUMN messages.job_id IS 'Optional reference to job listing';
COMMENT ON COLUMN messages.attachments IS 'JSON array of attachment URLs';
COMMENT ON COLUMN messages.read IS 'Whether the message has been read by receiver';
COMMENT ON COLUMN messages.deleted_by_sender IS 'User ID if sender deleted the message';
COMMENT ON COLUMN messages.deleted_by_receiver IS 'User ID if receiver deleted the message';
