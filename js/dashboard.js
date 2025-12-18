import { 
    getAuth, onAuthStateChanged, signOut, collection, db, getDocs, query, where, 
    doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot, orderBy 
} from "./config.js";

const auth = getAuth();

const appData = {
    currentUser: null,
    users: [],
    friends: [],
    currentSection: "friends"
};

const chatState = {
    currentChatFriendId: null,
    unsubscribeMessages: null 
};

document.addEventListener("DOMContentLoaded", () => {
    initTheme();      
    initNavigation(); 
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            appData.currentUser = user;
            await refreshData();
            switchSection(appData.currentSection);
        } else {
            window.location.replace("index.html");
        }
    });
});

function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (themeToggle) {
        themeToggle.onclick = () => {
            const newTheme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
        };
    }
}

function initNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.onclick = () => switchSection(btn.getAttribute("data-section"));
    });
}

function switchSection(section) {
    appData.currentSection = section;
    document.querySelectorAll(".nav-btn").forEach(btn => 
        btn.classList.toggle("active", btn.getAttribute("data-section") === section));
    document.querySelectorAll(".content-section").forEach(sec => 
        sec.classList.toggle("active", sec.id === `${section}Section`));
}

async function refreshData() {
    const uid = appData.currentUser.uid;
    const userSnap = await getDoc(doc(db, "users", uid));
    
    if (userSnap.exists()) {
        const data = userSnap.data();
        appData.friends = data.friends || [];
        document.getElementById("userName").innerText = data.UserName || "User";
        document.getElementById("userInitials").innerText = (data.UserName ? data.UserName[0] : "U").toUpperCase();
    }

    const usersSnapshot = await getDocs(query(collection(db, "users"), where("userId", "!=", uid)));
    appData.users = [];
    usersSnapshot.forEach(doc => appData.users.push({ id: doc.id, ...doc.data() }));

    renderUsers();
    renderChatList();
}

function renderUsers() {
    const container = document.getElementById("allUsersList");
    if (!container) return;
    container.innerHTML = "";

    appData.users.forEach(user => {
        const isFriend = appData.friends.includes(user.id);
        const name = user.UserName || "Unknown";
        
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
            <div class="user-card-header">
                <div class="avatar" style="background:#6366f1"><span>${name[0].toUpperCase()}</span></div>
                <div class="user-card-info">
                    <div class="user-card-name">${name}</div>
                </div>
            </div>
            <div class="user-card-actions">
                ${isFriend ? `<button class="btn btn-primary" onclick="openChat('${user.id}')">💬 Message</button>` : 
                `<button class="btn btn-primary" onclick="addFriend('${user.id}')">Add Friend</button>`}
            </div>`;
        container.appendChild(card);
    });
}

function renderChatList() {
    const container = document.getElementById("chatListItems");
    if (!container) return;
    container.innerHTML = "";
    
    const friends = appData.users.filter(u => appData.friends.includes(u.id));
    friends.forEach(user => {
        const div = document.createElement("div");
        div.className = `chat-list-item ${chatState.currentChatFriendId === user.id ? 'active' : ''}`;
        div.onclick = () => openChat(user.id);
        div.innerHTML = `
            <div class="avatar" style="background:#8b5cf6"><span>${user.UserName[0].toUpperCase()}</span></div>
            <div class="chat-list-info">
                <div class="chat-list-name">${user.UserName}</div>
                <div class="chat-list-preview">Tap to message</div>
            </div>`;
        container.appendChild(div);
    });
}

window.openChat = (friendId) => {
    switchSection("chat");
    chatState.currentChatFriendId = friendId;
    renderChatList();
    
    const friend = appData.users.find(u => u.id === friendId);
    const container = document.getElementById("chatWindow");
    
    container.innerHTML = `
        <div class="chat-header">
            <div class="avatar" style="background:#8b5cf6"><span>${friend.UserName[0].toUpperCase()}</span></div>
            <div class="chat-header-info">
                <div class="chat-header-name">${friend.UserName}</div>
                <div class="chat-header-status">online</div>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-container">
            <div class="chat-input-wrapper">
                <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off">
                <button class="btn btn-primary" id="sendBtn" onclick="sendMessage()">Send</button>
            </div>
        </div>`;

    document.getElementById("chatInput").focus();
    document.getElementById("chatInput").onkeypress = (e) => { if(e.key === "Enter") sendMessage(); };
    listenToMessages(friendId);
};

function listenToMessages(friendId) {
    if (chatState.unsubscribeMessages) chatState.unsubscribeMessages();
    const roomId = [appData.currentUser.uid, friendId].sort().join("_");

    const q = query(collection(db, "messages"), where("roomId", "==", roomId), orderBy("timestamp", "asc"));

    // metadataChanges: true ensures the message shows up locally before reaching the server
    chatState.unsubscribeMessages = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        const msgContainer = document.getElementById("chatMessages");
        if (!msgContainer) return;
        msgContainer.innerHTML = "";
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const isMe = data.senderId === appData.currentUser.uid;
            
            // Time logic
            const time = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "sending...";

            const div = document.createElement("div");
            div.className = `message ${isMe ? "sent" : "received"}`;
            div.innerHTML = `
                <div class="message-content">
                    <div class="message-bubble">${data.text}</div>
                    <div class="message-time">${time}</div>
                </div>`;
            msgContainer.appendChild(div);
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, (error) => {
        console.error("Chat Listener Error:", error);
    });
}

window.sendMessage = async () => {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || !chatState.currentChatFriendId) return;

    const roomId = [appData.currentUser.uid, chatState.currentChatFriendId].sort().join("_");
    input.value = ""; // Clear input immediately for better UX

    try {
        await addDoc(collection(db, "messages"), {
            roomId,
            senderId: appData.currentUser.uid,
            text,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Send Error:", e);
    }
};

window.addFriend = async (id) => {
    const uid = appData.currentUser.uid;
    await updateDoc(doc(db, "users", id), { friendRequest: arrayUnion(uid) });
    await updateDoc(doc(db, "users", uid), { sendrequest: arrayUnion(id) });
    refreshData();
};

window.signout = () => signOut(auth).then(() => window.location.replace("index.html"));