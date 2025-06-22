import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, User, Clock, Paperclip, Image, Smile, Download, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { WorkOrderWithUsers, WorkOrderChat } from "@shared/schema";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderWithUsers;
}

interface ChatWithUser extends WorkOrderChat {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function ChatModal({ isOpen, onClose, workOrder }: ChatModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch chat messages
  const { data: chats = [], isLoading } = useQuery<ChatWithUser[]>({
    queryKey: [`/api/work-orders/${workOrder.id}/chats`],
    enabled: isOpen,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message?: string; file?: File }) => {
      if (data.file) {
        // Send file message
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('messageType', 'file');
        formData.append('userId', user?.id?.toString() || '1');
        formData.append('workOrderId', workOrder.id.toString());
        formData.append('message', data.file.name);

        const response = await fetch(`/api/work-orders/${workOrder.id}/chats/file`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to send file');
        }

        return response.json();
      } else {
        // Send text message
        return apiRequest("POST", `/api/work-orders/${workOrder.id}/chats`, {
          workOrderId: workOrder.id,
          userId: user?.id,
          message: data.message?.trim(),
          messageType: 'text'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrder.id}/chats`] });
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Success",
        description: selectedFile ? "File sent successfully" : "Message sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (selectedFile) {
      sendMessageMutation.mutate({ file: selectedFile });
    } else if (message.trim()) {
      sendMessageMutation.mutate({ message: message.trim() });
    } else {
      toast({
        title: "Error",
        description: "Please enter a message or select a file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // Less than a week
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isCurrentUser = (chatUserId: number) => {
    return chatUserId === user?.id;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] h-[700px]">
          <DialogHeader>
            <DialogTitle>Loading Chat</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading messages...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[700px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Chat - {workOrder.workOrderNumber}</span>
          </DialogTitle>
          <DialogDescription>
            Project communication for {workOrder.clientName}
          </DialogDescription>
        </DialogHeader>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex ${isCurrentUser(chat.userId) ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-3 max-w-[80%] ${isCurrentUser(chat.userId) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs ${isCurrentUser(chat.userId) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {getInitials(chat.user.firstName, chat.user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col ${isCurrentUser(chat.userId) ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {isCurrentUser(chat.userId) ? 'You' : `${chat.user.firstName} ${chat.user.lastName}`}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(chat.createdAt)}
                      </span>
                    </div>
                    
                    <Card className={`${isCurrentUser(chat.userId) ? 'bg-blue-600 text-white' : 'bg-white border-gray-200'}`}>
                      <CardContent className="p-3">
                        {chat.messageType === 'file' && chat.fileUrl ? (
                          <div className="space-y-2">
                            {chat.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <div>
                                <img 
                                  src={chat.fileUrl} 
                                  alt={chat.message || "Shared image"} 
                                  className="max-w-xs max-h-48 rounded cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(chat.fileUrl, '_blank')}
                                />
                                {chat.message && (
                                  <p className="text-sm mt-1">{chat.message}</p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm flex-1">{chat.message}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(chat.fileUrl, '_blank')}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {chat.message}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-gray-600">Start the conversation by sending the first message.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Area */}
        <div className="flex-shrink-0 border-t pt-4">
          {/* File Preview */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Paperclip className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-blue-900">{selectedFile.name}</span>
                  <span className="text-xs text-blue-600">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={removeSelectedFile}>
                  Remove
                </Button>
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mb-3 p-3 bg-white border rounded-lg shadow-lg">
              <div className="text-sm text-gray-600 mb-2">Quick Emojis:</div>
              <div className="grid grid-cols-8 gap-2">
                {['😊', '👍', '👎', '❤️', '😂', '😢', '😮', '😡', '🎉', '🔥', '💯', '✅', '❌', '⚠️', '💡', '🚀'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="text-lg hover:bg-gray-100 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <div className="flex space-x-1">
              {/* File Upload Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendMessageMutation.isPending}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              {/* Emoji Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={sendMessageMutation.isPending}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>

            <Input
              placeholder={selectedFile ? "Add a caption..." : "Type your message..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            
            <Button 
              onClick={handleSendMessage}
              disabled={sendMessageMutation.isPending || (!message.trim() && !selectedFile)}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
          />

          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line • Max file size: 10MB
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}