import { db, auth } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import UserList from "../components/userlist";
import ChatPage from "../components/ChatPage";
import { Box, Stack } from "@mui/material";
import type { User as FirebaseUser } from "firebase/auth";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

const HomePage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentAuthUser, setCurrentAuthUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Set current logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setCurrentAuthUser(user));
    return () => unsubscribe();
  }, []);

  // Fetch users list excluding current user
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), snapshot => {
      const currentUserID = currentAuthUser?.uid;
      const usersData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          photoURL: doc.data().photoURL,
        }))
        .filter(user => user.id !== currentUserID);

      setUsers(usersData);
    });
    return () => unsubscribe();
  }, [currentAuthUser]);

  return (
    <Stack direction="row" height="100vh" bgcolor="#f0f2f5">
      {/* Sidebar - User List */}
      <Box
        sx={{
          width: { xs: '100%', sm: '30%', md: '25%', lg: '20%' },
          minWidth: 250,
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto',
          bgcolor: 'background.paper'
        }}
      >
        <UserList setSelectedUser={setSelectedUser} users={users} />
      </Box>

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <ChatPage selectedUser={selectedUser} />
      </Box>
    </Stack>
  );
};

export default HomePage;
