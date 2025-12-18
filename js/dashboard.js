import { 
    getAuth, onAuthStateChanged, signOut, collection, db, getDocs, query, where, 
    doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, onSnapshot, orderBy 
} from "./config.js";

const auth = getAuth();

// ==============================
// 1. App State
// ==============================
const appData = {
    currentUser: null,
    users: [],
    friends: [],
    pendingRequests: [],
    friendRequests: [],
    currentSection: "friends",
    currentTab: "all"
};

const chatState = {
    currentChatFriendId: null,
    unsubscribeMessages: null 
};

// ==============================
// 2. Initialization
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();      
    initNavigation(); 
    initTabs();       
    
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

// ==============================
// 3. Theme & UI Logic
// ==============================
function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.onclick = () => {
            const currentTheme = document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "light" ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateThemeIcon(newTheme);
        };
    }
}

function updateThemeIcon(theme) {
    const iconSpan = document.querySelector(".theme-icon");
    if (iconSpan) iconSpan.innerHTML = theme === "light" ? "🌙" : "☀️";
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

function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.onclick = () => switchTab(btn.getAttribute("data-tab"));
    });
}

function switchTab(tab) {
    appData.currentTab = tab;
    document.querySelectorAll(".tab-btn").forEach(btn => 
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tab));
    
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    const target = document.getElementById(`${tab}Tab`);
    if (target) target.classList.add("active");
}

// ==============================
// 4. Data Core
// ==============================
async function refreshData() {
    try {
        const uid = appData.currentUser.uid;
        const userSnap = await getDoc(doc(db, "users", uid));
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            appData.friends = data.friends || [];
            appData.pendingRequests = data.sendrequest || [];
            appData.friendRequests = data.friendRequest || [];
            
            const name = data.UserName || "User";
            document.getElementById("userName").innerText = name;
            document.getElementById("userInitials").innerText = name[0].toUpperCase();
        }

        const q = query(collection(db, "users"), where("userId", "!=", uid));
        const usersSnapshot = await getDocs(q);
        
        appData.users = [];
        usersSnapshot.forEach(doc => appData.users.push({ id: doc.id, ...doc.data() }));

        renderUsers();
        renderChatList();
    } catch (e) {
        console.error("Refresh Error:", e);
    }
}

function renderUsers() {
    const containers = {
        all: document.getElementById("allUsersList"),
        friends: document.getElementById("friendsList"),
        requests: document.getElementById("requestsList")
    };

    Object.values(containers).forEach(c => { if(c) c.innerHTML = "" });

    appData.users.forEach(user => {
        const isFriend = appData.friends.includes(user.id);
        const isPending = appData.pendingRequests.includes(user.id);
        const hasRequest = appData.friendRequests.includes(user.id);
        const name = user.UserName || "Unknown";
        const initial = name[0].toUpperCase();

        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
            <div class="user-card-header">
                <div class="avatar" style="background:#6366f1"><span>${initial}</span></div>
                <div class="user-card-info">
                    <div class="user-card-name">${name}</div>
                    <div class="user-card-status">${user.email || "No email"}</div>
                </div>
            </div>
            <div class="user-card-actions">
                ${isFriend ? `<button class="btn btn-primary" onclick="openChat('${user.id}')">💬 Message</button>` : 
                  isPending ? `<button class="btn btn-secondary" disabled>Sent</button>` :
                  hasRequest ? `
                    <button class="btn btn-success" onclick="acceptFriend('${user.id}')">Accept</button>
                    <button class="btn btn-danger" onclick="rejectFriend('${user.id}')">Reject</button>` :
                  `<button class="btn btn-primary" onclick="addFriend('${user.id}')">➕ Add</button>`}
            </div>`;
        
        if (containers.all) containers.all.appendChild(card);
        if (isFriend && containers.friends) containers.friends.appendChild(card.cloneNode(true));
        if (hasRequest && containers.requests) containers.requests.appendChild(card.cloneNode(true));
    });
}

// ==============================
// 5. Real-time Chat Logic
// ==============================
function renderChatList() {
    const container = document.getElementById("chatListItems");
    if (!container) return;
    container.innerHTML = "";
    
    const friends = appData.users.filter(u => appData.friends.includes(u.id));
    if (friends.length === 0) {
        container.innerHTML = `<div class="empty-state"><h3>No friends yet</h3></div>`;
        return;
    }

    friends.forEach(user => {
        const name = user.UserName || "User";
        const div = document.createElement("div");
        div.className = "chat-list-item";
        div.onclick = () => openChat(user.id);
        div.innerHTML = `
            <div class="avatar" style="background:#8b5cf6"><span>${name[0].toUpperCase()}</span></div>
            <div class="chat-list-info">
                <div class="chat-list-name">${name}</div>
                <div class="chat-list-preview">Tap to message</div>
            </div>`;
        container.appendChild(div);
    });
}

window.openChat = (friendId) => {
    switchSection("chat");
    chatState.currentChatFriendId = friendId;
    
    const friend = appData.users.find(u => u.id === friendId);
    if(!friend) return;
    
    const container = document.getElementById("chatWindow");
    container.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-name">${friend.UserName}</div>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-container">
            <div class="chat-input-wrapper">
                <input type="text" id="chatInput" placeholder="Type a message..." autocomplete="off">
                <button class="btn btn-primary" onclick="sendMessage()">Send</button>
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

    chatState.unsubscribeMessages = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
        const msgContainer = document.getElementById("chatMessages");
        if (!msgContainer) return;
        msgContainer.innerHTML = "";
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const isMe = data.senderId === appData.currentUser.uid;
            const div = document.createElement("div");
            div.className = `message ${isMe ? "sent" : "received"}`;
            div.innerHTML = `<div class="message-bubble">${data.text}</div>`;
            msgContainer.appendChild(div);
        });
        msgContainer.scrollTop = msgContainer.scrollHeight;
    });
}

window.sendMessage = async () => {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text || !chatState.currentChatFriendId) return;

    const roomId = [appData.currentUser.uid, chatState.currentChatFriendId].sort().join("_");
    input.value = ""; // Turant clear karein taake user ko lage send ho gaya
    
    try {
        await addDoc(collection(db, "messages"), {
            roomId,
            senderId: appData.currentUser.uid,
            text,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error("Error sending:", e);
    }
};

// ==============================
// 6. Social Actions
// ==============================
window.addFriend = async (id) => {
    const uid = appData.currentUser.uid;
    await updateDoc(doc(db, "users", id), { friendRequest: arrayUnion(uid) });
    await updateDoc(doc(db, "users", uid), { sendrequest: arrayUnion(id) });
    refreshData();
};

window.acceptFriend = async (id) => {
    const uid = appData.currentUser.uid;
    await updateDoc(doc(db, "users", uid), { friends: arrayUnion(id), friendRequest: arrayRemove(id) });
    await updateDoc(doc(db, "users", id), { friends: arrayUnion(uid), sendrequest: arrayRemove(uid) });
    refreshData();
};

window.rejectFriend = async (id) => {
    const uid = appData.currentUser.uid;
    await updateDoc(doc(db, "users", uid), { friendRequest: arrayRemove(id) });
    await updateDoc(doc(db, "users", id), { sendrequest: arrayRemove(uid) });
    refreshData();
};

window.signout = () => signOut(auth).then(() => window.location.replace("index.html"));