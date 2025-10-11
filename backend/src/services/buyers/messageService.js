/**
 * Message Service
 * Handles all messaging business logic
 */

const messageRepository = require('../../repositories/messageRepository');
const notificationService = require('./notificationService');
const userRepository = require('../../repositories/userRepository');
const logger = require('../../utils/logger');
const { NotFoundError, AuthorizationError, ValidationError } = require('../../errors');

class MessageService {
  /**
   * Send message
   */
  async sendMessage(senderId, messageData) {
    logger.debug('Sending message', { senderId });

    const {
      receiver_id,
      subject,
      message,
      parent_message_id,
      listing_id,
      property_id,
      job_id,
      attachments
    } = messageData;

    if (!receiver_id || !message) {
      throw new ValidationError('receiver_id and message are required');
    }

    if (senderId === receiver_id) {
      throw new ValidationError('Cannot send message to yourself');
    }

    // Verify receiver exists
    const receiver = await userRepository.findById(receiver_id);
    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    // Create message
    const newMessage = await messageRepository.create({
      sender_id: senderId,
      receiver_id,
      subject: subject?.trim() || null,
      message: message.trim(),
      parent_message_id: parent_message_id || null,
      listing_id: listing_id || null,
      property_id: property_id || null,
      job_id: job_id || null,
      attachments: attachments || null
    });

    // Create notification for receiver
    try {
      await notificationService.createNotification({
        user_id: receiver_id,
        type: 'message',
        title: 'New Message',
        message: `You have a new message${subject ? ': ' + subject : ''}`,
        action_url: `/messages/${newMessage.id}`,
        related_id: newMessage.id,
        related_type: 'message'
      });
    } catch (error) {
      logger.error('Failed to create notification for message', error);
      // Don't fail message send if notification fails
    }

    logger.info('Message sent', { 
      senderId, 
      receiverId: receiver_id, 
      messageId: newMessage.id 
    });

    return newMessage;
  }

  /**
   * Get user messages (inbox and sent)
   */
  async getUserMessages(userId, filters = {}) {
    logger.debug('Getting user messages', { userId });

    const { conversation_with, limit = 50, offset = 0 } = filters;

    let messages;

    if (conversation_with) {
      // Get conversation between two users
      messages = await messageRepository.getConversation(
        userId, 
        parseInt(conversation_with),
        { limit: parseInt(limit), offset: parseInt(offset) }
      );
    } else {
      // Get all messages for user
      messages = await messageRepository.findByUserId(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    }

    return messages;
  }

  /**
   * Get conversation list (unique users user has conversed with)
   */
  async getConversationList(userId) {
    logger.debug('Getting conversation list', { userId });

    const conversations = await messageRepository.getConversationList(userId);

    return conversations;
  }

  /**
   * Get message by ID
   */
  async getMessage(messageId, userId) {
    logger.debug('Getting message', { messageId, userId });

    const message = await messageRepository.findByIdWithDetails(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Verify user is sender or receiver
    if (message.sender_id !== userId && message.receiver_id !== userId) {
      throw new AuthorizationError('Not authorized to view this message');
    }

    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, userId) {
    logger.debug('Marking message as read', { messageId, userId });

    const message = await messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Only receiver can mark as read
    if (message.receiver_id !== userId) {
      throw new AuthorizationError('Only the receiver can mark message as read');
    }

    if (message.is_read) {
      // Already read, just return
      return message;
    }

    const updated = await messageRepository.markAsRead(messageId);

    logger.info('Message marked as read', { userId, messageId });

    return updated;
  }

  /**
   * Mark multiple messages as read
   */
  async markMultipleAsRead(messageIds, userId) {
    logger.debug('Marking multiple messages as read', { 
      userId, 
      count: messageIds.length 
    });

    // Verify all messages belong to user
    for (const messageId of messageIds) {
      const message = await messageRepository.findById(messageId);
      if (message && message.receiver_id === userId && !message.is_read) {
        await messageRepository.markAsRead(messageId);
      }
    }

    logger.info('Multiple messages marked as read', { 
      userId, 
      count: messageIds.length 
    });

    return { updated_count: messageIds.length };
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId, userId) {
    logger.debug('Deleting message', { messageId, userId });

    const message = await messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Only sender or receiver can delete
    if (message.sender_id !== userId && message.receiver_id !== userId) {
      throw new AuthorizationError('Not authorized to delete this message');
    }

    // Soft delete (mark as deleted for this user)
    await messageRepository.softDelete(messageId, userId);

    logger.info('Message deleted', { userId, messageId });

    return { message: 'Message deleted successfully' };
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId) {
    logger.debug('Getting unread message count', { userId });

    const count = await messageRepository.countUnread(userId);

    return { unread_count: count };
  }

  /**
   * Reply to message
   */
  async replyToMessage(parentMessageId, senderId, replyData) {
    logger.debug('Replying to message', { parentMessageId, senderId });

    // Get parent message
    const parentMessage = await messageRepository.findById(parentMessageId);

    if (!parentMessage) {
      throw new NotFoundError('Parent message not found');
    }

    // Verify sender is part of the conversation
    if (parentMessage.sender_id !== senderId && parentMessage.receiver_id !== senderId) {
      throw new AuthorizationError('Not authorized to reply to this message');
    }

    // Determine receiver (reply to the other person in conversation)
    const receiver_id = parentMessage.sender_id === senderId 
      ? parentMessage.receiver_id 
      : parentMessage.sender_id;

    // Send reply
    return await this.sendMessage(senderId, {
      ...replyData,
      receiver_id,
      parent_message_id: parentMessageId
    });
  }
}

module.exports = new MessageService();
