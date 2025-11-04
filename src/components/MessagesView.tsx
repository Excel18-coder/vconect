import { useState, useEffect } from 'react';
import { messageAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    display_name: string;
    avatar_url?: string;
    email?: string;
    phone_number?: string;
  };
  receiver?: {
    display_name: string;
    avatar_url?: string;
    email?: string;
    phone_number?: string;
  };
}

const MessagesView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages();
      setMessages(response.data?.messages || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      try {
        await messageAPI.markAsRead(message.id);
        setMessages(prev =>
          prev.map(m => (m.id === message.id ? { ...m, read: true } : m))
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setSending(true);
      await messageAPI.sendMessage(
        selectedMessage.sender_id,
        `Re: ${selectedMessage.subject}`,
        replyText
      );
      toast.success('Reply sent successfully!');
      setReplyText('');
      fetchMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleContactViaWhatsApp = (phone?: string) => {
    if (!phone) {
      toast.error('Phone number not available');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent('Hi, I\'m following up on our conversation.');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No messages yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Messages from buyers and sellers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Messages List */}
      <div className="md:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
        {messages.map(message => {
          const otherUser = message.sender || message.receiver;
          return (
            <Card
              key={message.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                selectedMessage?.id === message.id ? 'border-primary bg-muted/50' : ''
              } ${!message.read ? 'border-l-4 border-l-primary' : ''}`}
              onClick={() => handleSelectMessage(message)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherUser?.avatar_url} />
                    <AvatarFallback>{getInitials(otherUser?.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {otherUser?.display_name || 'Unknown User'}
                      </p>
                      {!message.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {message.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Message Details */}
      <div className="md:col-span-2">
        {selectedMessage ? (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Sender Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedMessage.sender?.avatar_url} />
                    <AvatarFallback>
                      {getInitials(selectedMessage.sender?.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedMessage.sender?.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Contact Options */}
                <div className="flex gap-2">
                  {selectedMessage.sender?.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`mailto:${selectedMessage.sender?.email}`)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  {selectedMessage.sender?.phone_number && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`tel:${selectedMessage.sender?.phone_number}`)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 hover:bg-green-100 text-green-700"
                        onClick={() => handleContactViaWhatsApp(selectedMessage.sender?.phone_number)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm font-semibold">Subject</Label>
                <p className="text-sm">{selectedMessage.subject}</p>
              </div>

              {/* Message Body */}
              <div>
                <Label className="text-sm font-semibold">Message</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Reply Section */}
              <div className="space-y-4 border-t pt-4">
                <Label>Reply to this message</Label>
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>

              {/* WhatsApp Contact Info */}
              {selectedMessage.sender?.phone_number && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-800 mb-2">
                    Contact via WhatsApp
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    Phone: {selectedMessage.sender.phone_number}
                  </p>
                  <Button
                    onClick={() => handleContactViaWhatsApp(selectedMessage.sender?.phone_number)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Open WhatsApp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Select a message to view details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
