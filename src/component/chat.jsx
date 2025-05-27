import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import "./chat.css";
import { FaPlus } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Chat = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState("");
  const [rooms, setRooms] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [groupSettingModal, setGroupSettingModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("global");
  const [showOptions, setShowOptions] = useState(false);
  const [usersToInvite, setUsersToInvite] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupData, setGroupData] = useState();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedMessagesRef = useRef(new Set());
  // Function to fetch group details
  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/fetchGroupDetails?user=${encodeURIComponent(
          username
        )}`,
        {
          credentials: "include",
        }
      );
      const data = await response.json();
      setGroupData(data);
      if (data.groups) {
        setRooms(data.groups.map((g) => g.name));
        const groupsMap = {};
        data.groups.forEach((group) => {
          groupsMap[group.name] = group;
        });
        console.log("current creator", groupsMap);
        if (currentRoom !== "global" && groupsMap[currentRoom]) {
          const currentGroup = groupsMap[currentRoom];
          setGroupMembers(currentGroup.members.map((m) => m.username));
          const creatorUsernames = currentGroup.creator.map(
            (creator) => creator.username
          );
          const isAdmin =
            creatorUsernames.includes(username) ||
            currentGroup.admins?.some((admin) => admin.username === username) ||
            false;
          setIsCurrentUserAdmin(isAdmin);
          console.log("abcd", creatorUsernames);
        }
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      toast.error("Could not load your groups.");
    }
  };
  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // src/components/Chat.jsx (partial, showing only the modified useEffect)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            console.log(entry.target);
            console.log("Emitting messageSeen for:", {
              messageId,
              userId: username,
            });
            // Add HTTP fallback to /markSeen
            fetch("http://localhost:8000/api/messageSeen", {
              method: "POST",
              credentials: "include", // Include cookies for authentication
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageId }),
            })
              .then((response) => {
                if (!response.ok) {
                  console.error(
                    "Failed to mark message as seen:",
                    response.statusText
                  );
                }
              })
              .catch((err) =>
                console.error("Error marking message as seen:", err)
              );
          }
        });
      },
      { threshold: 1.0 }
    );
    const messageElements = document.querySelectorAll(".message");
    console.log("messages", messageElements);
    messageElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [messages, username]);
  // Socket setup and initial group fetch
  useEffect(() => {
    if (!username) return;
    // Initial fetch of group details
    fetchGroupDetails();
    const socket = io(
      process.env.REACT_APP_SOCKET_URL || "http://localhost:8000"
    );
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("join", { username });
      socket.emit("join-room", { username, room: currentRoom });
    });
    socket.on("connect_error", (err) => {
      console.error("Connection failed:", err);
      alert("Failed to connect to the chat server. Please try again later.");
    });
    socket.on("room-updated", (updatedRoom) => {
      if (updatedRoom.name === currentRoom) {
        setGroupMembers(updatedRoom.members.map((m) => m.username));
        const creatorUsernames =
          updatedRoom.creator?.map((creator) => creator.username) || [];
        const isAdmin =
          creatorUsernames.includes(username) ||
          updatedRoom.admins?.some((admin) => admin.username === username) ||
          false;
        setIsCurrentUserAdmin(isAdmin);
        // Update groupData with the latest room details
        setGroupData((prev) => {
          if (!prev?.groups) return prev;
          const updatedGroups = prev.groups.map((group) =>
            group.name === updatedRoom.name
              ? {
                  ...group,
                  members: updatedRoom.members,
                  admins: updatedRoom.admins || group.admins,
                  creator: updatedRoom.creator,
                }
              : group
          );
          return { ...prev, groups: updatedGroups };
        });
      }
    });
    // Handle typing event
    socket.on("typing", ({ from }) => {
      // Only add the typing user if they are relevant to the current context
      if (
        (selectedUser && from === selectedUser) || // Private chat
        (currentRoom && !selectedUser) // Group or global chat
      ) {
        setTypingUsers((prev) => {
          if (!prev.includes(from)) {
            return [...prev, from];
          }
          return prev;
        });
      }
    });

    // Handle stop-typing event
    socket.on("stop-typing", ({ from }) => {
      setTypingUsers((prev) => prev.filter((user) => user !== from));
    });
    const handleMessage = async (data) => {
      console.log("handle Message", data.message);
      const messageId = data.id || `${data.userId}-${data.message}-${uuidv4()}`;
      if (!processedMessagesRef.current.has(messageId)) {
        processedMessagesRef.current.add(messageId);
        setMessages((prev) => [...prev, data]);
      }
    };
    const handleActiveUsers = (users) => {
      setActiveUsers(users);
    };
    const handleRooms = (roomsList) => {
      const mine = roomsList
        .filter((r) => r.members?.includes(username))
        .map((r) => r.name);
      setRooms(Array.from(new Set(mine)));
    };
    const handleRoomCreated = (newRoom) => {
      setCurrentRoom(newRoom.name);
      setMessages([]);
      setSelectedUser(null);
      setRooms((prev) => Array.from(new Set([...prev, newRoom.name])));
      setGroupMembers(newRoom.members);
      setIsCurrentUserAdmin(true);
      setShowCreateRoomModal(false);
      setRoomName("");
      setUsersToInvite([]);
      // Fetch group details to update groupData
      fetchGroupDetails();
    };
    socket.on("message", handleMessage);
    socket.on("active-users", handleActiveUsers);
    socket.on("rooms", handleRooms);
    socket.on("room-created", handleRoomCreated);
    socket.on("leave-group", handleLeaveGroup);
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });
    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [username, currentRoom]);
  // Leave-group handler
  const handleLeaveGroup = async () => {
    if (socketRef.current && currentRoom && currentRoom !== "global") {
      socketRef.current.emit("leave-group", { username, room: currentRoom });
      try {
        const leaveGroup = await fetch("http://localhost:8000/api/leaveGroup", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: currentRoom }),
        });
        const result = await leaveGroup.json();
        toast.success(result.message);
      } catch (err) {
        toast.error("Error leaving the group");
      }
      setCurrentRoom("global");
      setMessages([]);
      setSelectedUser(null);
      setGroupMembers([]);
      setIsCurrentUserAdmin(false);
      // Fetch group details to update groupData
      fetchGroupDetails();
    }
  };
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    const isPrivate = selectedUser !== null;
    await fetch("http://localhost:8000/api/addChat", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.trim(),
        room: isPrivate ? null : currentRoom,
        isPrivate,
        receiver: isPrivate ? selectedUser : null,
      }),
    });
    socketRef.current.emit("message", {
      userId: username,
      message: input.trim(),
      room: currentRoom,
      to: selectedUser,
    });
    setInput("");
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socketRef.current) return;

    // Emit typing event when the user starts typing
    socketRef.current.emit("typing", {
      from: username,
      to: selectedUser, // For private chat
      room: selectedUser ? null : currentRoom, // For group or global chat
    });

    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a timeout to emit stop-typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop-typing", {
        from: username,
        to: selectedUser,
        room: selectedUser ? null : currentRoom,
      });
    }, 2000);
  };
  const handleCreateRoom = async () => {
    if (!roomName.trim() || usersToInvite.length === 0 || !socketRef.current) {
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/api/createGroup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName.trim(),
          members: [username, ...usersToInvite],
          creator: username,
        }),
      });
      if (response.ok) {
        const newGroup = await response.json();
        socketRef.current.emit("create-room", {
          roomName: roomName.trim(),
          users: usersToInvite,
          creator: username,
        });
      } else {
        const errorData = await response.json();
        toast.error("Failed to create group: " + errorData.message);
      }
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("An error occurred while creating the group.");
    }
  };
  const handleJoinRoom = async (roomName) => {
    if (!socketRef.current) return;
    socketRef.current.emit("join-room", { username, room: roomName });
    setCurrentRoom(roomName);
    setMessages([]);
    setSelectedUser(null);
    await fetchMessages(roomName, false);
  };
  const handleUserSelect = async (user) => {
    if (user === username) return;
    setSelectedUser(user);
    setCurrentRoom(null);
    setMessages([]);
    setIsCurrentUserAdmin(false);
    await fetchMessages(null, true, user);
  };
  const fetchMessages = async (room, isPrivate = false, receiver = null) => {
    try {
      const queryParams = new URLSearchParams();
      if (isPrivate && receiver) {
        queryParams.append("receiverUsername", receiver);
      } else {
        queryParams.append("room", room);
      }
      const response = await fetch(
        `http://localhost:8000/api/fetchChats?${queryParams.toString()}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      const normalizedMessages = data.messages.map((msg) => ({
        isPrivate: msg.isPrivate || null,
        userId: msg.sender.username,
        message: msg.content,
        room: msg.room?.name || null,
        to: msg.receiver?.username || null,
        messageID: msg?._id || null,
        status: msg.status || null,
        seenBy: msg.seenBy || null,
      }));
      setMessages(normalizedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages.");
    }
  };
  const toggleOptions = () => setShowOptions((o) => !o);
  const handleGroupSettings = async () => {
    setGroupSettingModal(true);
  };
  const handleAddAdmin = async (member) => {
    if (!socketRef.current || !isCurrentUserAdmin) return;
    try {
      const response = await fetch("http://localhost:8000/api/addAdmin", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: currentRoom, Username: member }),
      });
      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        // Fetch group details to update groupData
        await fetchGroupDetails();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to add admin: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error("An error occurred while adding admin.");
    }
  };
  const handleRemoveAdmin = async (member) => {
    if (!socketRef.current || !isCurrentUserAdmin) return;
    try {
      const response = await fetch("http://localhost:8000/api/removeAdmin", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: currentRoom, Username: member }),
      });
      if (response.ok) {
        const result = await response.json();
        socketRef.current.emit("update-room", {
          room: currentRoom,
          username: member,
          action: "remove-admin",
        });
        toast.success(`${member} removed as admin.`);
        // Fetch group details to update groupData
        await fetchGroupDetails();
      } else {
        const errorData = await response.json();
        toast.error(`Failed to remove admin: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("An error occurred while removing admin.");
    }
  };
  if (!username) {
    return (
      <div className="chat-container">
        <p>Please log in to join the chat.</p>
      </div>
    );
  }
  const filteredMessages = messages.filter((msg) => {
    if (selectedUser) {
      console.log("filteredMessages", msg);
      return (
        (msg.userId === selectedUser && msg.to === username) ||
        (msg.userId === username && msg.to === selectedUser)
      );
    } else if (currentRoom) {
      return msg.room === currentRoom;
    }
    return false;
  });
  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Active Users</h3>
          <FaPlus
            onClick={toggleOptions}
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Invite User / Create Group Chat"
            className="plus-icon"
          />
          <Tooltip id="my-tooltip" />
          {showOptions && (
            <div className="dropdown-options">
              <div
                onClick={() => {
                  setShowOptions(false);
                  setShowCreateRoomModal(true);
                }}
              >
                Invite User
              </div>
              <div
                onClick={() => {
                  setShowOptions(false);
                  setShowCreateRoomModal(true);
                }}
              >
                Create Group Chat
              </div>
            </div>
          )}
        </div>
        <ul className="sidebar-user-list">
          {activeUsers.map((user, i) => (
            <li
              key={i}
              onClick={() => handleUserSelect(user)}
              className={`sidebar-user ${
                selectedUser === user ? "selected" : ""
              } ${user === username ? "self" : ""}`}
            >
              {user}
              <span className="user-status">
                {user === username ? "(You)" : "🟢"}
              </span>
            </li>
          ))}
        </ul>
        <h3>Groups</h3>
        <ul>
          {rooms.map((room) => (
            <li
              key={room}
              className="sidebar-user"
              onClick={() => handleJoinRoom(room)}
            >
              {room}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-chat">
        <header className="chat-header">
         <h1 className="text-xl font-semibold mb-2">
  {selectedUser ? (
    <div className="flex items-center gap-2">
      <span>
        Chat with <strong>{selectedUser}</strong>
      </span>
      <span
        className={`ml-2 text-sm ${
          activeUsers.includes(selectedUser)
            ? "text-green-500"
            : "text-gray-500"
        }`}
      >
        {activeUsers.includes(selectedUser)
          ? "🟢 Online"
          : "🔘 Offline"}
      </span>
    </div>
  ) : (
    <div>
      <div>
        Room: <strong>{currentRoom}</strong>
      </div>

      {groupMembers.length > 0 && (
        <div className="mt-2 text-sm text-gray-700">
          <div className=" mb-1 font-bold">Members :</div>
          <div className="flex flex-wrap gap-2">
            {groupMembers.map((member, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  activeUsers.includes(member)
                    ? "bg-green-100 text-green-600 border-green-300"
                    : "bg-gray-100 text-gray-500 border-gray-300"
                }`}
              >
                {member}
                {activeUsers.includes(member) && " 🟢"}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )}
</h1>


          <div className="status">
            <span className="connected">Connected as: {username}</span>
            <br />
            {!selectedUser && currentRoom !== "global" && (
              <div className="flex flex-col items-start">
                <button onClick={handleGroupSettings}>Group Settings</button>
                <button onClick={handleLeaveGroup}>Leave Group</button>
              </div>
            )}
          </div>
        </header>
        {groupSettingModal && (
          <div className="modal-backdrop">
            <div className="modal1">
              <h2>Group Settings</h2>
              <h3>Members:</h3>
              {groupMembers.length > 0 ? (
                <ul className="group-members-list">
                  {groupMembers.map((member, index) => {
                    const isAdmin = groupData?.groups
                      ?.find((g) => g.name === currentRoom)
                      ?.admins?.some((admin) => admin.username === member);
                    const isCreator = groupData?.groups
                      ?.find((g) => g.name === currentRoom)
                      ?.creator.some((creator) => creator.username === member);
                    return (
                      <li key={index}>
                        {member}
                        {isAdmin || isCreator ? (
                          <>
                            <span>Admin</span>
                            <button onClick={() => handleRemoveAdmin(member)}>
                              Remove Admin
                            </button>
                          </>
                        ) : (
                          !isAdmin && (
                            <>
                              <button onClick={() => handleAddAdmin(member)}>
                                Add As Admin
                              </button>
                              <button onClick={() => handleRemoveAdmin(member)}>
                                Remove Admin
                              </button>
                            </>
                          )
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>No members in this group.</p>
              )}
              <button onClick={() => setGroupSettingModal(false)}>Close</button>
            </div>
          </div>
        )}
        {showCreateRoomModal && (
          <div className="modal-backdrop">
            <div className="modal1">
              <h2>Create New Room</h2>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name"
              />
              <h3>Select Users to Invite:</h3>
              <div className="checkbox-group">
                {activeUsers
                  .filter((u) => u !== username)
                  .map((u) => (
                    <div className="checkbox-item" key={u}>
                      <label>
                        <input
                          type="checkbox"
                          value={u}
                          checked={usersToInvite.includes(u)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUsersToInvite([...usersToInvite, u]);
                            } else {
                              setUsersToInvite(
                                usersToInvite.filter((x) => x !== u)
                              );
                            }
                          }}
                        />
                        {u}
                      </label>
                    </div>
                  ))}
              </div>
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim() || usersToInvite.length === 0}
              >
                Create Room
              </button>
              <button onClick={() => setShowCreateRoomModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="messages-container">
          {filteredMessages.length === 0 ? (
            <div className="no-messages">No messages yet. Start chatting!</div>
          ) : (
            filteredMessages.map((msg, idx) => (
              <div
                key={idx}
                data-message-id={msg.messageID}
                className={`message ${
                  msg.userId === username
                    ? "my-message"
                    : msg.userId === "System"
                    ? "system-message"
                    : "other-message"
                }`}
              >
                <span className="message-sender">{msg.userId}</span>
                <span className="message-text">{msg.message}</span>
                {msg.isPrivate
                  ? msg.userId === username &&
                    msg.status && (
                      <span className="message-status">
                        {msg.status === "seen" ? "Seen" : "Delivered"}
                      </span>
                    )
                  : msg.seenBy?.length > 0 && (
                      <span className="seen-by-list">
                        Seen by:{" "}
                        {msg.seenBy.map((entry) => entry.user).join(", ")}
                      </span>
                    )}
              </div>
            ))
          )}
          {/* Add typing indicator here */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator-main">
              {typingUsers
                .filter((user) =>
                  selectedUser
                    ? user === selectedUser // Show only for selected user in private chat
                    : currentRoom
                    ? groupMembers.includes(user) || currentRoom === "global" // Show for group/global chat
                    : false
                )
                .map((user, index) => (
                  <span key={index}>{user} is typing...</span>
                ))}
            </div>
          )}
          <div ref={messagesEndRef} />
          <div ref={messagesEndRef} />
        </div>
        <form className="message-form" onSubmit={sendMessage}>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <button type="submit" disabled={!input.trim()}>
            Send
          </button>
        </form>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
    </div>
  );
};

export default Chat;
