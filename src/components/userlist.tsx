import React, {  useState } from "react";
import List from "@mui/material/List";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { InputBase, ListItemButton, Stack, Typography } from "@mui/material";

interface UserData {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

interface UserListProps {
  users: UserData[];
  setSelectedUser: (user: UserData) => void;
}

const UserList: React.FC<UserListProps> = ({ users, setSelectedUser }) => {
  const [searchTerm, setSearchTerm] = useState("");


  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    return user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term);
  });

  return (
    <Stack direction="column" gap={2}>
      <InputBase
        fullWidth
        placeholder="Search users..."
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{
          position: "sticky",
          top: "5px",
          zIndex: 1,
          bgcolor: "background.paper", 
          borderRadius: "8px",
          padding: "8px 12px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          margin: 1, 
          width: "calc(100% - 16px)",
        }}
      />
      <List sx={{ width: "100%", bgcolor: "background.paper", overflowY: "auto", flexGrow: 1, paddingTop: 0,overflow:'hidden'}}>
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            
             <ListItemButton key={user.id} alignItems="flex-start" onClick={() => setSelectedUser(user)}>
              <ListItemAvatar>
                <Avatar alt={user.name || user.email} src={user.photoURL || undefined} />
              </ListItemAvatar>
              <ListItemText primary={user.name || user.email?.split("@")[0]} secondary={user.email} />
             </ListItemButton>
          ))
        ) : (<Typography sx={{textAlign: 'center', color: 'text.secondary', mt: 2}}>No users found.</Typography>)}
      </List>
    </Stack>
  );
};

export default UserList;