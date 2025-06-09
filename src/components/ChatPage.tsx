import { Avatar, Box, Button, InputBase, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography, } from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { listenForMessages, sendMessage } from "../firebase/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";


interface UserData {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

interface ChatPageProps {
  selectedUser: UserData | null;
}

interface IsOnline {
  isOnline: boolean;
  isTyping: boolean;
}

const ChatPage: React.FC<ChatPageProps> = ({ selectedUser }) => {
  const [messages, setMessages] = useState<Message[]>([]); //this is to store listned messages
  const [messageText, setMessageText] = useState(""); //this is to store input message
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); //this is to store the id of user who signed in
  const [isOnline, setIsOnline] = useState<IsOnline>();
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);  //this for typng status

  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


  // Set current user and chat ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && selectedUser) {
        const uid = user.uid;
        setCurrentUserId(uid);
        const selectedUid = selectedUser.id;
        setChatId(
          uid < selectedUid ? `${uid}-${selectedUid}` : `${selectedUid}-${uid}`
        );
      }
    });
    return unsubscribe;
  }, [selectedUser]);

  // Fetch online status
  useEffect(() => {
    if (!selectedUser?.id) return;
    const onlineRef = doc(db, "isOnline", selectedUser.id);
    const unsub = onSnapshot(onlineRef, (doc) => {
      const data = doc.data() as IsOnline;
      if (data) {
        setIsOnline(data);
      } else {
        setIsOnline(undefined);
      }
    });
    return () => unsub();
  }, [selectedUser?.id]);

  // Listen for messages in real-time
  useEffect(() => {
    if (!chatId) return setMessages([]);

    const unsubscribe = listenForMessages(chatId, (fetchedMessages: any[]) => {
      const processed = fetchedMessages
        .map((msg) => ({
          id: msg.id,
          text: msg.text,
          senderId: msg.senderId,
          timestamp: msg.timestamp?.toDate
            ? msg.timestamp.toDate()
            : new Date(),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setMessages(processed);
    });

    return unsubscribe;
  }, [chatId]);




  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  //handle logout


  const handleLogout = async () => {
    try {
      if (currentUserId) {
        const onlineStatusRef = doc(db, "isOnline", currentUserId);
        await setDoc(onlineStatusRef, {
          isOnline: false,
          isTyping: false,
        }, { merge: true });
      }
      navigate('/login');
    } catch (error) {
      console.error("Error during logout:", error);

      navigate('/login');
    }
  };


  //handling send message here


  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !currentUserId || !selectedUser)
      return;

    try {
      await sendMessage(messageText, chatId, currentUserId, selectedUser.id);
      setMessageText("");
      if (selectedUser.id) return;
      const onlineRef = doc(db, "isOnline", selectedUser.id);
      setDoc(onlineRef, {
        isOnline: true,
        isTyping: false,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };


  //checking if no user is selected
  if (!selectedUser) {
    return (
      <Stack
        sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}
      >
        <Typography variant="h6">Select a user to start chatting</Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="column" height="100%">

      {/* Chat top user image and name*/}
      <Stack direction={"row"} gap={1} sx={{ borderBottom: 1, borderColor: "divider", p: 1, }}>
        <ListItem disableGutters  >
          <ListItemAvatar>
            <Avatar src={selectedUser.photoURL || undefined}>
              {selectedUser.name?.charAt(0)}
            </Avatar>
            <Button variant="contained" color="warning" onClick={handleLogout}>
              Logout
            </Button>
          </ListItemAvatar>
          <ListItemText
            primary={selectedUser.name || selectedUser.email}
            secondary={isOnline?.isOnline ? (
              <Typography variant="caption" color="green">
                {isOnline?.isTyping ? "Typing..." : "Online"}
              </Typography>
            ) : (
              <Typography variant="caption" color="gray">
                Offline
              </Typography>
            )}
          />
        </ListItem>
      </Stack>

      {/* Messages of the chat start here*/}

      <Stack spacing={1.5} sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 1 }}>
        {messages.map((msg) => {
          const isSender = msg.senderId === currentUserId;
          return (
            <Box
              key={msg.id}
              display="flex"
              justifyContent={isSender ? "flex-end" : "flex-start"}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: isSender ? "#e0f7fa" : "#f1f1f1",
                  maxWidth: "70%",
                  wordBreak: "break-word",
                }}
              >
                <Typography variant="body1">{msg.text}</Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="right"
                  display="block"
                  mt={0.5}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <Box ref={chatEndRef} />
      </Stack>

      {/* Input */}
      <Stack direction="row" gap={1} p={2} borderTop={1} borderColor="divider">
        <InputBase
          fullWidth
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value);
            if (!currentUserId) return;
            const onlineRef = doc(db, "isOnline", currentUserId);
            setDoc(onlineRef, {
              isOnline: true,
              isTyping: true,
            });
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => {
              setDoc(onlineRef, {
                isOnline: true,
                isTyping: false,
              });
            }, 1500);
          }}
          sx={{
            bgcolor: "#f5f5f5",
            borderRadius: 2,
            px: 2,
            py: 1,
            width: "100%",
            padding: "10px",
            border: "none",
            outline: "none",
          }}
        />

        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
        >
          Send
        </Button>
      </Stack>
    </Stack>
  );
};

export default ChatPage;
