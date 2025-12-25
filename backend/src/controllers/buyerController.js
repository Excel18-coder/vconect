const { messageService } = require("../services/buyers");
const { sendSuccess, sendCreated } = require("../utils/response");
const { asyncHandler } = require("../middleware/errorHandler");

// ============= MESSAGES =============

const formatMessage = (row) => {
  if (!row) return row;
  return {
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    listing_id: row.listing_id || null,
    subject: row.subject || "",
    message: row.message,
    read: !!row.is_read,
    created_at: row.created_at,
    sender: {
      display_name: row.sender_name || null,
      avatar_url: row.sender_avatar || null,
      email: row.sender_email || null,
      phone_number: row.sender_phone_number || null,
    },
    receiver: {
      display_name: row.receiver_name || null,
      avatar_url: row.receiver_avatar || null,
      email: row.receiver_email || null,
      phone_number: row.receiver_phone_number || null,
    },
  };
};

const sendMessage = asyncHandler(async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id, subject, message, message_body, listing_id } = req.body;

  const created = await messageService.sendMessage(senderId, {
    receiver_id,
    subject,
    listing_id,
    message: message ?? message_body,
  });

  const hydrated = await messageService.getMessage(created.id, senderId);
  return sendCreated(res, "Message sent", { message: formatMessage(hydrated) });
});

const getUserMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { conversation_with, page = 1, limit = 20 } = req.query;

  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.max(1, parseInt(limit));
  const offset = (parsedPage - 1) * parsedLimit;

  const rows = await messageService.getUserMessages(userId, {
    conversation_with,
    limit: parsedLimit,
    offset,
  });

  return sendSuccess(res, "Messages retrieved", {
    messages: rows.map(formatMessage),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      returned: rows.length,
    },
  });
});

const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const conversations = await messageService.getConversationList(userId);
  return sendSuccess(res, "Conversations retrieved", { conversations });
});

const getMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const msg = await messageService.getMessage(id, userId);
  return sendSuccess(res, "Message retrieved", { message: formatMessage(msg) });
});

const markMessageAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const updated = await messageService.markAsRead(id, userId);
  const hydrated = await messageService.getMessage(id, userId);
  return sendSuccess(res, "Message marked as read", {
    message: formatMessage(hydrated || updated),
  });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  await messageService.deleteMessage(id, userId);
  return sendSuccess(res, "Message deleted");
});

const replyToMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { message, message_body } = req.body;

  const created = await messageService.replyToMessage(id, userId, {
    message: message ?? message_body,
  });

  const hydrated = await messageService.getMessage(created.id, userId);
  return sendCreated(res, "Reply sent", {
    message: formatMessage(hydrated || created),
  });
});

module.exports = {
  // Messages
  sendMessage,
  getUserMessages,
  getConversations,
  getMessage,
  markMessageAsRead,
  deleteMessage,
  replyToMessage,
};
