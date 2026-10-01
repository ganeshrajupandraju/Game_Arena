const $ = (id) => document.getElementById(id);

function setupMenu() {
    const button = $("menuBtn");
    const links = $("navLinks");

    if (!button || !links) return;

    button.addEventListener("click", () => {
        links.classList.toggle("open");
        button.textContent = links.classList.contains("open") ? "×" : "☰";
    });
}

setupMenu();

function getUsers() {
    return JSON.parse(localStorage.getItem("gameArenaUsers") || "[]");
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("gameArenaLoggedIn") || "null");
}

let authMode = "login";

function setAuthMode(mode) {
    authMode = mode;

    const loginTab = $("loginTab");
    const registerTab = $("registerTab");

    if (!loginTab || !registerTab) return;

    loginTab.classList.toggle("active", mode === "login");
    registerTab.classList.toggle("active", mode === "register");

    $("authSubmit").textContent =
        mode === "login" ? "LOGIN →" : "CREATE ACCOUNT →";

    $("authGameGroup").style.display =
        mode === "register" ? "block" : "none";

    $("authMessage").textContent = "";
}

if ($("authForm")) {
    const params = new URLSearchParams(location.search);
    setAuthMode(params.get("mode") === "register" ? "register" : "login");

    $("authForm").addEventListener("submit", (event) => {
        event.preventDefault();

        const name = $("authName").value.trim();
        const email = $("authEmail").value.trim().toLowerCase();
        const password = $("authPassword").value;

        let users = getUsers();

        if (authMode === "register") {
            if (users.some((user) => user.email === email)) {
                $("authMessage").textContent =
                    "❌ An account with this email already exists.";
                return;
            }

            const user = {
                name,
                email,
                password,
                game: $("authGame").value,
                registeredAt: new Date().toLocaleString()
            };

            users.push(user);

            localStorage.setItem("gameArenaUsers", JSON.stringify(users));
            localStorage.setItem("gameArenaLoggedIn", JSON.stringify(user));

            $("authMessage").textContent =
                "✅ Account created. Opening dashboard...";

            setTimeout(() => {
                location.href = "dashboard.html";
            }, 500);
        } else {
            const user = users.find(
                (item) => item.email === email && item.password === password
            );

            if (!user) {
                $("authMessage").textContent =
                    "❌ Invalid email or password.";
                return;
            }

            localStorage.setItem("gameArenaLoggedIn", JSON.stringify(user));

            $("authMessage").textContent =
                "✅ Login successful. Opening dashboard...";

            setTimeout(() => {
                location.href = "dashboard.html";
            }, 500);
        }
    });
}

if ($("teamForm")) {
    const user = getCurrentUser();
    if (!user) {
        location.href = "auth.html?mode=login";
    } else {
        $("teamCaptain").value = `${user.name} (${user.email})`;

        $("teamForm").addEventListener("submit", (event) => {
            event.preventDefault();

            const teamName = $("teamName").value.trim();
            if (!teamName) return;

            const teams = JSON.parse(localStorage.getItem("gameArenaTeams") || "[]");
            if (teams.some(team => team.teamName.toLowerCase() === teamName.toLowerCase())) {
                $("teamMessage").textContent = "❌ A team with this name already exists.";
                return;
            }

            const members = [
                { name: user.name, role: "Captain" },
                $("member2").value.trim() ? { name: $("member2").value.trim(), role: "Member" } : null,
                $("member3").value.trim() ? { name: $("member3").value.trim(), role: "Member" } : null,
                $("member4").value.trim() ? { name: $("member4").value.trim(), role: "Member" } : null
            ].filter(Boolean);

            teams.push({
                id: Date.now().toString(),
                teamName,
                captain: user.name,
                captainEmail: user.email,
                game: $("teamGame").value,
                members,
                wins: 0,
                tournaments: 0,
                createdAt: new Date().toLocaleString()
            });

            localStorage.setItem("gameArenaTeams", JSON.stringify(teams));
            $("teamMessage").textContent = "🏆 Team created successfully. Opening Teams...";
            setTimeout(() => location.href = "teams.html", 500);
        });
    }
}

function getGameClass(game) {
    const value = (game || "").toLowerCase();
    if (value.includes("bgmi")) return "bgmi";
    if (value.includes("valorant")) return "valorant";
    if (value.includes("call of duty")) return "cod";
    return "";
}

function getGameIcon(game) {
    const value = (game || "").toLowerCase();
    if (value.includes("bgmi")) return "🎯";
    if (value.includes("valorant")) return "⚡";
    if (value.includes("call of duty")) return "🎖️";
    if (value.includes("minecraft")) return "⛏️";
    if (value.includes("gta")) return "🚗";
    if (value.includes("ark")) return "🦖";
    return "🔥";
}

function showTeamDetails(teamId) {
    const teams = JSON.parse(localStorage.getItem("gameArenaTeams") || "[]");
    const team = teams.find(item => item.id === teamId);
    if (!team) return;

    $("detailTeamGame").textContent = (team.game || "TEAM").toUpperCase();
    $("detailTeamName").textContent = team.teamName;
    $("detailTeamCaptain").textContent = `👑 Captain: ${team.captain || team.captainEmail}`;
    $("detailMembers").textContent = `${(team.members || []).length} / 4`;
    $("detailWins").textContent = team.wins ?? 0;
    $("detailTournaments").textContent = team.tournaments ?? 0;

    const list = $("detailMembersList");
    list.innerHTML = (team.members || []).map(member => `
        <div class="team-member"><span>${escapeHtml(member.name)}</span><small>${escapeHtml(member.role)}</small></div>
    `).join("") || `<div class="empty">No members added yet.</div>`;

    $("teamDetailsModal").classList.add("show");
}

function closeTeamDetails() {
    $("teamDetailsModal")?.classList.remove("show");
}

function renderTeams() {
    const box = $("teamsList");
    if (!box) return;

    const teams = JSON.parse(localStorage.getItem("gameArenaTeams") || "[]");
    $("teamCountLabel").textContent = `${teams.length} TEAM${teams.length === 1 ? "" : "S"}`;

    if (!teams.length) {
        box.innerHTML = `<div class="empty" style="grid-column:1/-1">No teams yet. Create the first squad and start competing!</div>`;
        return;
    }

    box.innerHTML = teams.map(team => `
        <article class="dashboard-card team-card">
            <div class="team-banner ${getGameClass(team.game)}">
                <div class="team-logo">${getGameIcon(team.game)}</div>
            </div>
            <div class="team-body">
                <h3>${escapeHtml(team.teamName)}</h3>
                <p class="team-captain">${escapeHtml(team.game)} · 👑 ${escapeHtml(team.captain || team.captainEmail)}</p>
                <div class="team-stats">
                    <div class="team-stat"><span>MEMBERS</span><strong>${(team.members || []).length}/4</strong></div>
                    <div class="team-stat"><span>WINS</span><strong>${team.wins ?? 0}</strong></div>
                    <div class="team-stat"><span>EVENTS</span><strong>${team.tournaments ?? 0}</strong></div>
                </div>
                <div class="team-actions">
                    <button class="btn outline-btn" onclick="showTeamDetails('${team.id}')">VIEW TEAM</button>
                    <span class="team-status">ACTIVE</span>
                </div>
            </div>
        </article>
    `).join("");
}

renderTeams();
if ($("teamDetailsModal")) {
    $("teamDetailsModal").addEventListener("click", event => {
        if (event.target.id === "teamDetailsModal") closeTeamDetails();
    });
}

function getCustomTournaments() {
    try { return JSON.parse(localStorage.getItem("gameArenaCustomTournaments") || "[]"); }
    catch (e) { return []; }
}

function parseSlotCapacity(slotText) {
    const match = String(slotText || "").match(/\/?\s*(\d+)\s*$/);
    return match ? Number(match[1]) : 32;
}

function getTournamentRegistrationCount(title) {
    const registrations = JSON.parse(localStorage.getItem("gameArenaRegistrations") || "[]");
    return registrations.filter(r => r.tournament === title).length;
}

function updateCustomTournamentSlots(title) {
    const tournaments = getCustomTournaments();
    const tournament = tournaments.find(t => t.title === title);
    if (!tournament) return;
    const capacity = parseSlotCapacity(tournament.teams);
    const count = getTournamentRegistrationCount(title);
    tournament.teams = `${Math.min(count, capacity)} / ${capacity}`;
    tournament.status = count >= capacity ? "FULL" : "OPEN";
    localStorage.setItem("gameArenaCustomTournaments", JSON.stringify(tournaments));
    if (typeof renderCustomTournaments === "function") renderCustomTournaments();
    if (typeof renderAdminTournaments === "function") renderAdminTournaments();
}

function registerTournament(title, game, prize, entry, teams, date) {
    const user = getCurrentUser();
    if (!user) {
        location.href = "auth.html?mode=login";
        return;
    }

    const registrations = JSON.parse(localStorage.getItem("gameArenaRegistrations") || "[]");
    const existing = registrations.find(item => item.email === user.email && item.tournament === title);
    if (existing) {
        showRegistrationNotice("already", existing);
        return;
    }

    const custom = getCustomTournaments().find(t => t.title === title);
    if (custom) {
        const capacity = parseSlotCapacity(custom.teams);
        const count = getTournamentRegistrationCount(title);
        if (count >= capacity || custom.status === "FULL") {
            alert(`❌ ${title} is full. No more registrations are available.`);
            return;
        }
        teams = `${count + 1} / ${capacity}`;
    }

    const registration = {
        id: Date.now().toString(),
        playerName: user.name,
        email: user.email,
        game, tournament: title, prize, entry, teams, date,
        status: "REGISTERED",
        registeredAt: new Date().toLocaleString()
    };
    registrations.push(registration);
    localStorage.setItem("gameArenaRegistrations", JSON.stringify(registrations));
    if (custom) updateCustomTournamentSlots(title);
    notifyRegistration(registration);
    showRegistrationNotice("success", registration);
    renderDashboard();
}

function showRegistrationNotice(type, item) {
    const modal = $("registrationModal");
    if (!modal) {
        alert(type === "success" ? `✅ Registered for ${item.tournament}!` : "You are already registered for this tournament.");
        return;
    }
    $("registrationIcon").textContent = type === "success" ? "🏆" : "ℹ️";
    $("registrationTitle").textContent = type === "success" ? "REGISTRATION CONFIRMED" : "ALREADY REGISTERED";
    $("registrationText").textContent = type === "success"
        ? `You're in! ${item.tournament} has been added to your dashboard.`
        : `You already have a registration for ${item.tournament}.`;
    $("registrationSummary").innerHTML = `
        <div><span>GAME</span><strong>${escapeHtml(item.game)}</strong></div>
        <div><span>ENTRY</span><strong>${escapeHtml(item.entry || "FREE")}</strong></div>
        <div><span>DATE</span><strong>${escapeHtml(item.date)}</strong></div>
        <div><span>STATUS</span><strong>${escapeHtml(item.status || "REGISTERED")}</strong></div>`;
    modal.classList.add("show");
}
function closeRegistrationNotice() { $("registrationModal")?.classList.remove("show"); }

function cancelTournamentRegistration(id) {
    const user = getCurrentUser();
    if (!user) return;
    const registrations = JSON.parse(localStorage.getItem("gameArenaRegistrations") || "[]");
    const item = registrations.find(r => r.id === id && r.email === user.email);
    if (!item) return;
    if (!confirm(`Cancel your registration for ${item.tournament}?`)) return;
    const remaining = registrations.filter(r => r.id !== id);
    localStorage.setItem("gameArenaRegistrations", JSON.stringify(remaining));
    if (getCustomTournaments().some(t => t.title === item.tournament)) {
        updateCustomTournamentSlots(item.tournament);
    }
    renderDashboard();
}

function renderDashboard() {
    if (!$('dashProfile')) return;

    const user = getCurrentUser();

    if (!user) {
        location.href = 'auth.html?mode=login';
        return;
    }

    const allRegistrations = JSON.parse(
        localStorage.getItem('gameArenaRegistrations') || '[]'
    );

    const registrations = allRegistrations.filter(
        (item) => item.email === user.email
    );

    const allTeams = JSON.parse(
        localStorage.getItem('gameArenaTeams') || '[]'
    );

    const teams = allTeams.filter(
        (team) => team.captainEmail.toLowerCase() === user.email.toLowerCase()
    );

    $('dashWelcome').textContent =
        `Welcome back, ${user.name}. Your Game Arena activity is here.`;

    $('dashProfileChip').textContent = `👤 ${user.name}`;
    $('dashTournamentCount').textContent = registrations.length;
    $('dashTeamCount').textContent = teams.length;
    $('dashGame').textContent = user.game || '—';
    $('dashWins').textContent = '0';

    $('dashProfile').innerHTML = `
        <div class="profile-detail">
            <span>USERNAME</span>
            <strong>${escapeHtml(user.name)}</strong>
        </div>
        <div class="profile-detail">
            <span>MAIN GAME</span>
            <strong>${escapeHtml(user.game || 'Not selected')}</strong>
        </div>
        <div class="profile-detail">
            <span>EMAIL</span>
            <strong>${escapeHtml(user.email)}</strong>
        </div>
        <div class="profile-detail">
            <span>MEMBER SINCE</span>
            <strong>${escapeHtml(user.registeredAt || 'Recently')}</strong>
        </div>
    `;

    const registrationBox = $('dashRegistrations');

    registrationBox.innerHTML = registrations.length
        ? registrations.map((item) => `
            <div class="dashboard-registration">
                <div>
                    <div class="registration-title">🏆 ${escapeHtml(item.tournament)}</div>
                    <div class="registration-meta">
                        ${escapeHtml(item.game)} · Prize ${escapeHtml(item.prize || '—')} · Entry ${escapeHtml(item.entry || '—')} · Registered ${escapeHtml(item.registeredAt || 'Recently')}
                    </div>
                </div>
                <div class="registration-actions">
                    <span class="registration-badge">REGISTERED</span>
                    <button class="registration-cancel" onclick="cancelTournamentRegistration('${item.id}')">CANCEL</button>
                </div>
            </div>
        `).join('')
        : `
            <div class="empty">
                No tournament registrations yet. Go to Games and join your first battle.
            </div>
        `;

    const teamBox = $('dashTeams');

    teamBox.innerHTML = teams.length
        ? teams.map((team) => `
            <div class="dashboard-team">
                <div>
                    <div class="team-title">🏆 ${escapeHtml(team.teamName)}</div>
                    <div class="team-meta">
                        ${escapeHtml(team.game)} · Captain: ${escapeHtml(team.captainEmail)} · Created ${escapeHtml(team.createdAt || 'Recently')}
                    </div>
                </div>
                <span class="team-badge">MY TEAM</span>
            </div>
        `).join('')
        : `
            <div class="empty">
                You haven't created a team yet. Build your squad and start competing.
            </div>
        `;
}

renderDashboard();

function logout() {
    localStorage.removeItem("gameArenaLoggedIn");
    location.href = "index.html";
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

// STEP 4 - Matches System
const defaultMatches = [
    {id:"m1",status:"live",game:"Free Fire",tournament:"Free Fire Championship",teamA:"Team Alpha",teamB:"Shadow X",date:"Today",time:"06:00 PM",map:"Bermuda · Squad",result:"LIVE NOW"},
    {id:"m2",status:"upcoming",game:"BGMI",tournament:"BGMI Pro League",teamA:"God Squad",teamB:"Night Owls",date:"Today",time:"07:30 PM",map:"Erangel · Squad",result:"Starts Soon"},
    {id:"m3",status:"upcoming",game:"Valorant",tournament:"Valorant Masters",teamA:"Nova",teamB:"Reapers",date:"Today",time:"09:00 PM",map:"Ascent · 5v5",result:"Upcoming"},
    {id:"m4",status:"completed",game:"COD Mobile",tournament:"COD Mobile Elite",teamA:"RDX",teamB:"Phantoms",date:"Yesterday",time:"08:00 PM",map:"Nuketown · 5v5",result:"RDX WON"},
    {id:"m5",status:"completed",game:"Minecraft",tournament:"Minecraft Battle Cup",teamA:"Block Masters",teamB:"Creeper Kings",date:"Yesterday",time:"06:30 PM",map:"Arena · Squad",result:"BLOCK MASTERS WON"},
    {id:"m6",status:"upcoming",game:"GTA",tournament:"GTA Street Kings",teamA:"Los Santos",teamB:"Street Lords",date:"Tomorrow",time:"05:30 PM",map:"City Circuit · Duo",result:"Upcoming"}
];

function getMatches(){
    const saved=JSON.parse(localStorage.getItem("gameArenaMatches")||"null");
    if(!saved){localStorage.setItem("gameArenaMatches",JSON.stringify(defaultMatches));return defaultMatches;}
    return saved;
}

function renderMatches(filter="all"){
    const box=$("matchesList"); if(!box)return;
    const matches=getMatches();
    const shown=filter==="all"?matches:matches.filter(m=>m.status===filter);
    $("matchCount").textContent=`${shown.length} MATCH${shown.length===1?"":"ES"}`;
    if(!shown.length){box.innerHTML=`<div class="empty" style="grid-column:1/-1">No matches found in this category.</div>`;return;}
    box.innerHTML=shown.map(m=>`<article class="match-card ${m.status}">
        <div class="match-top"><span class="match-game">${escapeHtml(m.game)}</span><span class="match-status ${m.status}">${m.status==='live'?'🔴 LIVE':m.status.toUpperCase()}</span></div>
        <div class="match-tournament">🏆 ${escapeHtml(m.tournament)}</div>
        <div class="match-teams"><div class="match-team"><span>⚔️</span>${escapeHtml(m.teamA)}</div><div class="match-vs-small">VS</div><div class="match-team"><span>🛡️</span>${escapeHtml(m.teamB)}</div></div>
        <div class="match-info"><div><small>DATE</small><strong>${escapeHtml(m.date)}</strong></div><div><small>TIME</small><strong>${escapeHtml(m.time)}</strong></div><div><small>MAP / MODE</small><strong>${escapeHtml(m.map)}</strong></div><div><small>RESULT</small><strong>${escapeHtml(m.result)}</strong></div></div>
        <button class="btn outline-btn" onclick="showMatchDetails('${m.id}')">VIEW MATCH DETAILS</button>
    </article>`).join("");
}

function showMatchDetails(id){
    const match=getMatches().find(m=>m.id===id); if(!match)return;
    $("detailMatchStatus").textContent=match.status==='live'?'🔴 LIVE MATCH':match.status.toUpperCase();
    $("detailMatchTitle").textContent=`${match.teamA} vs ${match.teamB}`;
    $("detailMatchTournament").textContent=`🏆 ${match.tournament}`;
    $("detailTeamA").textContent=match.teamA; $("detailTeamB").textContent=match.teamB;
    $("detailMatchGame").textContent=match.game; $("detailMatchDate").textContent=`${match.date} · ${match.time}`;
    $("detailMatchMap").textContent=match.map; $("detailMatchResult").textContent=match.result;
    $("matchDetailsModal").classList.add("show");
}
function closeMatchDetails(){$("matchDetailsModal")?.classList.remove("show")}

if($("matchesList")){
    renderMatches();
    document.querySelectorAll(".match-filter").forEach(button=>button.addEventListener("click",()=>{
        document.querySelectorAll(".match-filter").forEach(b=>b.classList.remove("active"));
        button.classList.add("active"); renderMatches(button.dataset.filter);
    }));
    $("matchDetailsModal").addEventListener("click",event=>{if(event.target.id==="matchDetailsModal")closeMatchDetails();});
}

// STEP 5 - Leaderboard System
const defaultLeaderboard = [
    {id:"p1",name:"ArjunX",game:"Free Fire",wins:24,matches:26,points:2480},
    {id:"p2",name:"Rogue",game:"BGMI",wins:22,matches:25,points:2310},
    {id:"p3",name:"Viper",game:"Valorant",wins:20,matches:23,points:2190},
    {id:"p4",name:"Nova",game:"COD Mobile",wins:19,matches:23,points:2050},
    {id:"p5",name:"KingOP",game:"Free Fire",wins:18,matches:22,points:1970},
    {id:"p6",name:"Shadow X",game:"BGMI",wins:17,matches:22,points:1890},
    {id:"p7",name:"Reapers",game:"Valorant",wins:16,matches:21,points:1810},
    {id:"p8",name:"Block Masters",game:"Minecraft",wins:15,matches:21,points:1740},
    {id:"p9",name:"RDX",game:"COD Mobile",wins:14,matches:20,points:1650},
    {id:"p10",name:"Creeper Kings",game:"Minecraft",wins:12,matches:20,points:1510}
];
function getLeaderboard(){
    const saved=JSON.parse(localStorage.getItem("gameArenaLeaderboard")||"null");
    if(!saved){localStorage.setItem("gameArenaLeaderboard",JSON.stringify(defaultLeaderboard));return defaultLeaderboard;}
    return saved;
}
function renderLeaderboard(game="All",search=""){
    const body=$("leaderboardBody"), podium=$("podium"), empty=$("leaderboardEmpty"); if(!body)return;
    const term=search.trim().toLowerCase();
    let rows=getLeaderboard().filter(item=>game==="All"||item.game===game).filter(item=>!term||item.name.toLowerCase().includes(term)||item.game.toLowerCase().includes(term));
    rows.sort((a,b)=>b.points-a.points);
    podium.innerHTML=rows.slice(0,3).map((item,index)=>`<div class="podium-card ${index===0?'first':''}"><div class="podium-rank">${['🥇','🥈','🥉'][index]}</div><div class="podium-name">${escapeHtml(item.name)}</div><div>${escapeHtml(item.game)}</div><div class="podium-points">${item.points.toLocaleString()} POINTS</div></div>`).join("");
    body.innerHTML=rows.map((item,index)=>{const rate=item.matches?Math.round(item.wins/item.matches*100):0;return `<tr><td class="rank-cell">#${String(index+1).padStart(2,'0')}</td><td class="player-cell"><strong>${escapeHtml(item.name)}</strong><small>Competitive Player</small></td><td>${escapeHtml(item.game)}</td><td>${item.wins}</td><td>${item.matches}</td><td class="points-cell">${item.points.toLocaleString()}</td><td class="winrate">${rate}%</td></tr>`}).join("");
    empty.style.display=rows.length?"none":"block";
}
if($("leaderboardBody")){
    let selectedGame="All";
    renderLeaderboard();
    document.querySelectorAll(".leaderboard-filter").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".leaderboard-filter").forEach(b=>b.classList.remove("active"));button.classList.add("active");selectedGame=button.dataset.game;renderLeaderboard(selectedGame,$("leaderboardSearch").value);}));
    $("leaderboardSearch").addEventListener("input",()=>renderLeaderboard(selectedGame,$("leaderboardSearch").value));
}

// STEP 9 - User Profile & Settings
const defaultAvatars = ["🎮","🔥","⚡","👑","💀","🐉","🎯","🦅","🤖","🏆"];
function getProfileData(user){
    const profiles = JSON.parse(localStorage.getItem("gameArenaProfiles") || "{}");
    return profiles[user.email] || {avatar:"🎮",tag:"",bio:"",game:user.game || "Free Fire"};
}
function saveProfileData(user, data){
    const profiles = JSON.parse(localStorage.getItem("gameArenaProfiles") || "{}");
    profiles[user.email] = data;
    localStorage.setItem("gameArenaProfiles", JSON.stringify(profiles));
}
function updateStoredUser(updatedUser){
    const users = getUsers();
    const index = users.findIndex(item => item.email === updatedUser.email);
    if(index >= 0){users[index] = updatedUser;localStorage.setItem("gameArenaUsers", JSON.stringify(users));}
    localStorage.setItem("gameArenaLoggedIn", JSON.stringify(updatedUser));
}
function getUserStats(user){
    const teams = JSON.parse(localStorage.getItem("gameArenaTeams") || "[]").filter(t => t.captainEmail === user.email || t.captain === user.name);
    const registrations = JSON.parse(localStorage.getItem("gameArenaRegistrations") || "[]").filter(r => r.userEmail === user.email || r.email === user.email);
    const leaderboard = getLeaderboard ? getLeaderboard() : [];
    const ownRows = leaderboard.filter(r => r.name === user.name || r.email === user.email);
    const wins = ownRows.reduce((sum,r)=>sum + Number(r.wins || 0),0);
    const matches = ownRows.reduce((sum,r)=>sum + Number(r.matches || 0),0);
    const teamWins = teams.reduce((sum,t)=>sum + Number(t.wins || 0),0);
    return {teams,registrations,wins:wins || teamWins,matches, tournaments:registrations.length};
}
function renderProfile(){
    const user=getCurrentUser();
    if(!user){location.href="auth.html?mode=login";return;}
    const data=getProfileData(user), stats=getUserStats(user);
    $("profileName").value=user.name || ""; $("profileEmail").value=user.email || "";
    $("profileGame").value=data.game || user.game || "Free Fire"; $("profileTag").value=data.tag || ""; $("profileBio").value=data.bio || "";
    $("profileAvatarPreview").textContent=data.avatar || "🎮"; $("profileAvatarSmall").textContent=data.avatar || "🎮";
    $("profileWins").textContent=stats.wins; $("profileMatches").textContent=stats.matches; $("profileTournaments").textContent=stats.tournaments; $("profileTeams").textContent=stats.teams.length;
    const unlocked=[stats.wins>=1,stats.tournaments>=1,stats.teams.length>=1,stats.matches>=10];
    const achievements=[
        ["🔥","First Victory","Win your first battle"],["🏆","Tournament Ready","Register for a tournament"],["⚔️","Squad Builder","Create your first team"],["💯","Battle Veteran","Play 10+ matches"]
    ];
    $("achievementGrid").innerHTML=achievements.map((a,i)=>`<div class="achievement ${unlocked[i]?"":"locked"}"><div class="achievement-icon">${a[0]}</div><strong>${a[1]}</strong><small>${unlocked[i]?"Unlocked":"Locked · " + a[2]}</small></div>`).join("");
    $("avatarOptions").innerHTML=defaultAvatars.map(a=>`<button type="button" class="avatar-option ${a===data.avatar?"active":""}" data-avatar="${a}">${a}</button>`).join("");
    document.querySelectorAll(".avatar-option").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".avatar-option").forEach(b=>b.classList.remove("active"));btn.classList.add("active");$("profileAvatarPreview").textContent=btn.dataset.avatar;$("profileAvatarSmall").textContent=btn.dataset.avatar;}));
}
if($("profileForm")){
    const user=getCurrentUser();
    if(!user){location.href="auth.html?mode=login";} else {
        renderProfile();
        $("profileForm").addEventListener("submit",e=>{
            e.preventDefault();
            const updated={...user,name:$("profileName").value.trim(),game:$("profileGame").value};
            if(!updated.name){$("profileMessage").textContent="❌ Display name cannot be empty.";return;}
            const avatar=$("profileAvatarPreview").textContent || "🎮";
            saveProfileData(updated,{avatar,tag:$("profileTag").value.trim(),bio:$("profileBio").value.trim(),game:updated.game});
            updateStoredUser(updated); $("profileMessage").textContent="✅ Profile saved successfully."; renderProfile();
        });
        $("passwordForm").addEventListener("submit",e=>{
            e.preventDefault();
            const current=$("currentPassword").value,newPass=$("newPassword").value,confirm=$("confirmPassword").value;
            const fresh=getCurrentUser();
            if(current!==fresh.password){$("passwordMessage").textContent="❌ Current password is incorrect.";return;}
            if(newPass!==confirm){$("passwordMessage").textContent="❌ New passwords do not match.";return;}
            const updated={...fresh,password:newPass}; updateStoredUser(updated);
            $("passwordMessage").textContent="✅ Password updated successfully."; $("passwordForm").reset();
        });
    }
}


/* STEP 10 - Notifications & Announcements */
function getNotifications() {
    try { return JSON.parse(localStorage.getItem("gameArenaNotifications") || "[]"); }
    catch (e) { return []; }
}
function saveNotifications(items) { localStorage.setItem("gameArenaNotifications", JSON.stringify(items)); }
function addNotification(type, title, message, userEmail = null) {
    const items = getNotifications();
    items.unshift({ id: Date.now().toString() + Math.random().toString(16).slice(2), type, title, message, userEmail, read: false, createdAt: new Date().toLocaleString() });
    saveNotifications(items.slice(0, 100));
    updateNotificationCount();
}
function notificationIcon(type) { return ({announcement:"📢", tournament:"🏆", match:"⚔️", result:"🥇"}[type] || "🔔"); }
function getUserNotifications() {
    const user = getCurrentUser();
    if (!user) return [];
    return getNotifications().filter(n => !n.userEmail || n.userEmail.toLowerCase() === user.email.toLowerCase());
}
function updateNotificationCount() {
    const user = getCurrentUser();
    const count = user ? getUserNotifications().filter(n => !n.read).length : 0;
    document.querySelectorAll("#notificationCount").forEach(el => el.textContent = count > 99 ? "99+" : count);
}
function markNotificationRead(id) {
    const user = getCurrentUser(); if (!user) return;
    const items = getNotifications(); const n = items.find(x => x.id === id && (!x.userEmail || x.userEmail.toLowerCase() === user.email.toLowerCase()));
    if (n) n.read = true; saveNotifications(items); renderNotifications(); updateNotificationCount();
}
function markAllNotificationsRead() {
    const user = getCurrentUser(); if (!user) return;
    const items = getNotifications(); items.forEach(n => { if (!n.userEmail || n.userEmail.toLowerCase() === user.email.toLowerCase()) n.read = true; });
    saveNotifications(items); renderNotifications(); updateNotificationCount();
}
function clearNotifications() {
    const user = getCurrentUser(); if (!user) return;
    if (!confirm("Clear all your notifications?")) return;
    saveNotifications(getNotifications().filter(n => n.userEmail && n.userEmail.toLowerCase() !== user.email.toLowerCase()));
    renderNotifications(); updateNotificationCount();
}
function renderNotifications(filter="all") {
    const box = $("notificationsList"); if (!box) return;
    const items = getUserNotifications(); const shown = filter === "unread" ? items.filter(n => !n.read) : items;
    box.innerHTML = shown.length ? shown.map(n => `<article class="notification-item ${n.read ? "read" : "unread"}">
        <div class="notification-icon ${escapeHtml(n.type)}">${notificationIcon(n.type)}</div><div class="notification-content"><div class="notification-head"><h3>${escapeHtml(n.title)}</h3><span>${escapeHtml(n.createdAt)}</span></div><p>${escapeHtml(n.message)}</p><div class="notification-row"><span class="notification-type">${escapeHtml(n.type.toUpperCase())}</span>${n.read ? '<span class="notification-read">✓ READ</span>' : `<button class="notification-read-btn" onclick="markNotificationRead('${n.id}')">MARK AS READ</button>`}</div></div>
    </article>`).join("") : '<div class="empty notification-empty">No notifications here. You are all caught up! 🎮</div>';
}
if ($("notificationsList")) {
    renderNotifications(); updateNotificationCount();
    document.querySelectorAll(".notification-filter").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".notification-filter").forEach(b => b.classList.remove("active")); btn.classList.add("active"); renderNotifications(btn.dataset.filter); }));
}
updateNotificationCount();

function createAnnouncement() {
    const title = $("announcementTitle")?.value.trim(); const message = $("announcementMessage")?.value.trim(); const type = $("announcementType")?.value || "announcement";
    const status = $("announcementMessageStatus");
    if (!title || !message) { if(status) status.textContent = "❌ Enter both a title and message."; return; }
    addNotification(type, title, message, null);
    if(status) status.textContent = "✅ Announcement published to all players.";
    $("announcementTitle").value = ""; $("announcementMessage").value = ""; renderAdminAnnouncements();
}
function renderAdminAnnouncements() {
    const box = $("adminAnnouncementsList"); if (!box) return;
    const items = getNotifications().filter(n => !n.userEmail).slice(0, 10);
    box.innerHTML = items.length ? items.map(n => `<div class="admin-list-item"><div><strong>${notificationIcon(n.type)} ${escapeHtml(n.title)}</strong><small>${escapeHtml(n.message)} · ${escapeHtml(n.createdAt)}</small></div><button class="admin-action" onclick="deleteAnnouncement('${n.id}')">DELETE</button></div>`).join("") : '<div class="admin-empty">No announcements published yet.</div>';
}
function deleteAnnouncement(id) { saveNotifications(getNotifications().filter(n => n.id !== id)); renderAdminAnnouncements(); updateNotificationCount(); }

function notifyRegistration(registration) {
    addNotification("tournament", "Tournament Registration Confirmed", `You are registered for ${registration.tournament}. Entry: ${registration.entry || "FREE"}.`, registration.email);
}
function notifyMatchChange(match, oldStatus) {
    if (match.status !== oldStatus) addNotification("match", `Match Update: ${match.teamA} vs ${match.teamB}`, `${match.tournament} is now ${match.status.toUpperCase()}.`, null);
    if (match.status === "completed" && match.result) addNotification("result", `Match Result: ${match.result}`, `${match.teamA} vs ${match.teamB} has been completed.`, null);
}


/* ================= STEP 12 — SLOT & PARTICIPANT MANAGEMENT ================= */
function renderCustomTournaments() {
    const section = $("customTournamentSection");
    const box = $("customTournamentList");
    if (!section || !box) return;

    const tournaments = getCustomTournaments();
    if (!tournaments.length) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    box.innerHTML = tournaments.map(t => {
        const capacity = parseSlotCapacity(t.teams);
        const count = getTournamentRegistrationCount(t.title);
        const full = count >= capacity || t.status === "FULL";
        const slots = `${Math.min(count, capacity)} / ${capacity}`;
        const safeTitle = String(t.title).replace(/'/g, "\\'");
        return `
        <article class="game-card custom-game-card">
            <div class="game-art"><span>🏆 ${escapeHtml(t.game)}</span><b>${full ? "FULL" : "OPEN"}</b></div>
            <div class="game-body">
                <h3>${escapeHtml(t.title)}</h3>
                <p class="muted">${escapeHtml(t.mode)}</p>
                <div class="info-row"><span>Prize <strong>${escapeHtml(t.prize)}</strong></span><span>Entry <strong>${escapeHtml(t.entry || "FREE")}</strong></span></div>
                <div class="info-row"><span>Slots <strong>${escapeHtml(slots)}</strong></span><span>Date <strong>${escapeHtml(t.date)}</strong></span></div>
                <div class="action-row">
                    <button class="btn details-btn" onclick="showGameDetails('${safeTitle}','${String(t.game).replace(/'/g, "\\'")}','${String(t.prize).replace(/'/g, "\\'")}','${String(t.entry || "FREE").replace(/'/g, "\\'")}','${String(slots).replace(/'/g, "\\'")}','${String(t.date).replace(/'/g, "\\'")}','${String(t.mode).replace(/'/g, "\\'")}')">VIEW DETAILS</button>
                    <button class="btn primary-btn" ${full ? "disabled" : ""} onclick="registerTournament('${safeTitle}','${String(t.game).replace(/'/g, "\\'")}','${String(t.prize).replace(/'/g, "\\'")}','${String(t.entry || "FREE").replace(/'/g, "\\'")}','${String(slots).replace(/'/g, "\\'")}','${String(t.date).replace(/'/g, "\\'")}')">${full ? "TOURNAMENT FULL" : "REGISTER"}</button>
                </div>
            </div>
        </article>`;
    }).join("");
}

if ($("customTournamentList")) renderCustomTournaments();

/* ================= STEP 13 — TOURNAMENT BRACKET & MATCH SCHEDULING ================= */
function getTournamentParticipants(title) {
    return JSON.parse(localStorage.getItem("gameArenaRegistrations") || "[]")
        .filter(r => r.tournament === title);
}

function tournamentBracketMatches(title) {
    return JSON.parse(localStorage.getItem("gameArenaMatches") || "[]")
        .filter(m => m.generatedForTournament === title);
}

function populateAdminBracketTournaments() {
    const select = $("bracketAdminTournament");
    if (!select) return;
    const tournaments = getCustomTournaments();
    select.innerHTML = `<option value="">Select a tournament</option>` + tournaments.map(t =>
        `<option value="${escapeHtml(t.title)}">${escapeHtml(t.title)} · ${escapeHtml(t.game)}</option>`
    ).join("");
}

function generateTournamentBracket() {
    const select = $("bracketAdminTournament");
    const status = $("bracketMessageStatus");
    const title = select?.value;
    if (!title) { if (status) status.textContent = "❌ Select a tournament first."; return; }

    const participants = getTournamentParticipants(title);
    if (participants.length < 2) {
        if (status) status.textContent = "❌ At least 2 registered participants are required.";
        return;
    }

    const tournament = getCustomTournaments().find(t => t.title === title);
    const matches = JSON.parse(localStorage.getItem("gameArenaMatches") || "[]");
    const kept = matches.filter(m => m.generatedForTournament !== title);
    const roundMatches = [];
    for (let i = 0; i + 1 < participants.length; i += 2) {
        const a = participants[i], b = participants[i + 1];
        roundMatches.push({
            id: `bracket-${Date.now()}-${i}`,
            status: "upcoming",
            game: tournament?.game || a.game || "Game",
            tournament: title,
            teamA: a.playerName || a.userName || "Player A",
            teamB: b.playerName || b.userName || "Player B",
            date: tournament?.date || "TBA",
            time: "TBA",
            map: tournament?.mode || "Round 1",
            result: "Upcoming",
            generatedForTournament: title,
            bracketRound: "Round 1"
        });
    }
    if (participants.length % 2 === 1) {
        const bye = participants[participants.length - 1];
        roundMatches.push({
            id: `bracket-bye-${Date.now()}`,
            status: "upcoming",
            game: tournament?.game || bye.game || "Game",
            tournament: title,
            teamA: bye.playerName || bye.userName || "Player",
            teamB: "BYE",
            date: tournament?.date || "TBA",
            time: "TBA",
            map: tournament?.mode || "Round 1",
            result: "BYE",
            generatedForTournament: title,
            bracketRound: "Round 1"
        });
    }
    localStorage.setItem("gameArenaMatches", JSON.stringify(kept.concat(roundMatches)));
    if (status) status.textContent = `✅ Round 1 generated with ${roundMatches.length} matchup${roundMatches.length === 1 ? "" : "s"}.`;
    renderAdminBracketPreview();
    if (typeof refreshAdmin === "function") refreshAdmin();
}

function renderAdminBracketPreview() {
    const box = $("adminBracketPreview");
    const select = $("bracketAdminTournament");
    if (!box) return;
    const title = select?.value;
    if (!title) { box.innerHTML = `<div class="admin-empty">Select a tournament to preview its generated matches.</div>`; return; }
    const matches = tournamentBracketMatches(title);
    box.innerHTML = matches.length ? matches.map(m =>
        `<div class="admin-list-item"><div><strong>⚔️ ${escapeHtml(m.teamA)} vs ${escapeHtml(m.teamB)}</strong><small>${escapeHtml(m.bracketRound || "Round 1")} · ${escapeHtml(m.game)} · ${escapeHtml(m.date)}</small></div><span>${escapeHtml(m.result)}</span></div>`
    ).join("") : `<div class="admin-empty">No bracket generated yet. Click GENERATE ROUND 1.</div>`;
}

function populateBracketTournaments() {
    const select = $("bracketTournamentSelect");
    if (!select) return;
    const tournaments = getCustomTournaments();
    select.innerHTML = `<option value="">Select a tournament</option>` + tournaments.map(t =>
        `<option value="${escapeHtml(t.title)}">${escapeHtml(t.title)} · ${escapeHtml(t.game)}</option>`
    ).join("");
}

function renderBracket() {
    const select = $("bracketTournamentSelect"), box = $("bracketList"), summary = $("bracketSummary");
    if (!select || !box) return;
    const title = select.value;
    if (!title) { box.innerHTML = `<div class="admin-empty">Select a tournament to view its bracket.</div>`; if (summary) summary.innerHTML = ""; return; }
    const matches = tournamentBracketMatches(title);
    const participants = getTournamentParticipants(title);
    if (summary) summary.innerHTML = `<div class="bracket-stat"><span>TOURNAMENT</span><strong>${escapeHtml(title)}</strong></div><div class="bracket-stat"><span>PARTICIPANTS</span><strong>${participants.length}</strong></div><div class="bracket-stat"><span>ROUND 1 MATCHES</span><strong>${matches.length}</strong></div>`;
    if (!matches.length) { box.innerHTML = `<div class="admin-empty">The admin has not generated Round 1 for this tournament yet.</div>`; return; }
    box.innerHTML = `<div class="bracket-round"><div class="bracket-round-head"><span>ROUND 1</span><small>${matches.length} MATCHES</small></div><div class="bracket-match-grid">${matches.map(m => `<article class="bracket-match"><div class="bracket-match-status">${m.result === "BYE" ? "BYE" : "UPCOMING"}</div><div class="bracket-player"><span>${escapeHtml(m.teamA)}</span><b>—</b></div><div class="bracket-vs">VS</div><div class="bracket-player"><span>${escapeHtml(m.teamB)}</span><b>—</b></div><small>${escapeHtml(m.date)} · ${escapeHtml(m.time)} · ${escapeHtml(m.map)}</small></article>`).join("")}</div></div>`;
}

if ($("bracketAdminTournament")) {
    $("bracketAdminTournament").addEventListener("change", renderAdminBracketPreview);
}

// ===== STEP 14: LIVE MATCH & SCORE MANAGEMENT =====

function getMatchById(id) {
  return getMatches().find(m => String(m.id) === String(id));
}

function saveMatches(items) {
  localStorage.setItem("gameArenaMatches", JSON.stringify(items));
}

function updateMatchScore(id, scoreA, scoreB) {
  const a = Number(scoreA);
  const b = Number(scoreB);

  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) {
    alert("Enter valid non-negative scores.");
    return false;
  }

  const matches = getMatches();
  const match = matches.find(m => String(m.id) === String(id));
  if (!match) return false;

  const oldStatus = match.status;
  match.scoreA = a;
  match.scoreB = b;
  match.status = "LIVE";
  match.result = `${match.teamA} ${a} - ${b} ${match.teamB}`;
  match.updatedAt = new Date().toLocaleString();

  saveMatches(matches);

  if (oldStatus !== "LIVE") notifyMatchChange(match, oldStatus);
  addNotification(
    "match",
    `🔴 Live Score: ${match.teamA} vs ${match.teamB}`,
    `${match.teamA} ${a} - ${b} ${match.teamB}`
  );

  renderAdminMatches();
  if (typeof renderMatches === "function") renderMatches();
  if (typeof renderBracket === "function") renderBracket();
  return true;
}

function updateLeaderboardForCompletedMatch(match) {
  if (match.leaderboardUpdated) return;

  const leaderboard = JSON.parse(localStorage.getItem("gameArenaLeaderboard") || "[]");
  const game = match.game || "Gaming";
  const a = Number(match.scoreA || 0);
  const b = Number(match.scoreB || 0);

  function findOrCreate(name) {
    let item = leaderboard.find(x =>
      String(x.player || x.name || "").toLowerCase() === String(name || "").toLowerCase() &&
      String(x.game || "").toLowerCase() === String(game).toLowerCase()
    );
    if (!item) {
      item = {
        player: name,
        game,
        wins: 0,
        matches: 0,
        points: 0
      };
      leaderboard.push(item);
    }
    return item;
  }

  const teamA = findOrCreate(match.teamA);
  const teamB = findOrCreate(match.teamB);

  teamA.matches = Number(teamA.matches || 0) + 1;
  teamB.matches = Number(teamB.matches || 0) + 1;

  if (a > b) {
    teamA.wins = Number(teamA.wins || 0) + 1;
    teamA.points = Number(teamA.points || 0) + 100;
    teamB.points = Number(teamB.points || 0) + 25;
  } else if (b > a) {
    teamB.wins = Number(teamB.wins || 0) + 1;
    teamB.points = Number(teamB.points || 0) + 100;
    teamA.points = Number(teamA.points || 0) + 25;
  } else {
    teamA.points = Number(teamA.points || 0) + 50;
    teamB.points = Number(teamB.points || 0) + 50;
  }

  match.leaderboardUpdated = true;
  localStorage.setItem("gameArenaLeaderboard", JSON.stringify(leaderboard));
}

function completeScoredMatch(id) {
  const matches = getMatches();
  const match = matches.find(m => String(m.id) === String(id));
  if (!match) return false;

  const a = Number(match.scoreA);
  const b = Number(match.scoreB);

  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) {
    alert("Update the scores before completing this match.");
    return false;
  }

  const oldStatus = match.status;
  match.status = "COMPLETED";

  if (a > b) {
    match.winner = match.teamA;
    match.result = `${match.teamA} WON ${a} - ${b}`;
  } else if (b > a) {
    match.winner = match.teamB;
    match.result = `${match.teamB} WON ${b} - ${a}`;
  } else {
    match.winner = "DRAW";
    match.result = `DRAW ${a} - ${b}`;
  }

  match.completedAt = new Date().toLocaleString();
  updateLeaderboardForCompletedMatch(match);
  saveMatches(matches);

  notifyMatchChange(match, oldStatus);
  addNotification(
    "result",
    `🏆 Match Result: ${match.teamA} vs ${match.teamB}`,
    match.result
  );

  renderAdminMatches();
  if (typeof renderMatches === "function") renderMatches();
  if (typeof renderBracket === "function") renderBracket();
  if (typeof renderLeaderboard === "function") renderLeaderboard();
  return true;
}

function scoreInputValue(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function renderAdminMatches() {
  const body = document.getElementById("adminMatchesBody");
  if (!body) return;

  const matches = getMatches();
  if (!matches.length) {
    body.innerHTML = `<tr><td colspan="7" class="muted">No matches available.</td></tr>`;
    return;
  }

  body.innerHTML = matches.map(m => {
    const a = scoreInputValue(m.scoreA);
    const b = scoreInputValue(m.scoreB);
    return `
      <tr>
        <td>${escapeHtml(m.teamA || "-")}<br><span class="muted">vs</span><br>${escapeHtml(m.teamB || "-")}</td>
        <td>${escapeHtml(m.tournament || m.generatedForTournament || "-")}</td>
        <td>${escapeHtml(m.status || "UPCOMING")}</td>
        <td>
          <div class="score-editor">
            <input id="scoreA-${m.id}" type="number" min="0" value="${a}">
            <span>:</span>
            <input id="scoreB-${m.id}" type="number" min="0" value="${b}">
          </div>
        </td>
        <td>${escapeHtml(m.result || "-")}</td>
        <td>
          <button class="btn secondary" onclick="updateMatchScore('${m.id}', document.getElementById('scoreA-${m.id}').value, document.getElementById('scoreB-${m.id}').value)">UPDATE SCORE</button>
          <button class="btn primary" onclick="completeScoredMatch('${m.id}')">COMPLETE</button>
        </td>
      </tr>
    `;
  }).join("");
}


