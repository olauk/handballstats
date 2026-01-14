# HANDBALL ANALYTICS v3.0 - ARKITEKTUR-DOKUMENTASJON

**Dato:** 2026-01-12
**Versjon:** v3.0
**Formål:** Visuell dokumentasjon av systemarkitektur

---

## INNHOLDSFORTEGNELSE

1. [System Overview](#1-system-overview)
2. [Fil-avhengigheter](#2-fil-avhengigheter)
3. [Dataflyt: Skuddregistrering](#3-dataflyt-skuddregistrering)
4. [Lagringsstrategi](#4-lagringsstrategi)
5. [State Management](#5-state-management)
6. [Firebase Arkitektur](#6-firebase-arkitektur)
7. [UI Rendering Flow](#7-ui-rendering-flow)
8. [Event Handling Strategy](#8-event-handling-strategy)

---

## 1. SYSTEM OVERVIEW

### High-Level Architecture

```mermaid
graph TB
    subgraph "Browser"
        subgraph "Presentation Layer"
            UI[UI Components<br/>8 files]
            Router[Router<br/>render.js]
            Modals[Modal Management<br/>modals.js]
        end

        subgraph "Business Logic Layer"
            Shots[Shot Registration<br/>shots.js]
            Players[Player Management<br/>players.js]
            Stats[Statistics<br/>statistics.js]
            Timer[Timer<br/>timer.js]
            Events[Event Delegation<br/>events.js]
        end

        subgraph "State Management"
            State[Global State<br/>APP object<br/>state.js]
            Cache[Performance Cache<br/>PERFORMANCE object]
        end

        subgraph "Persistence Layer"
            LocalStorage[localStorage<br/>storage.js]
            FirestoreClient[Firestore Client<br/>firestore-storage.js]
        end
    end

    subgraph "Firebase Cloud"
        Auth[Firebase Auth]
        Firestore[Cloud Firestore]
        DebugLogs[Debug Logs Collection]
    end

    User((User)) -->|Interacts| UI
    UI -->|render| Router
    Router -->|delegates| Events
    Events -->|modifies| State
    State -->|persists| LocalStorage
    State -->|syncs| FirestoreClient

    Shots -->|updates| State
    Players -->|updates| State
    Stats -->|reads| Cache
    Cache -->|backed by| State

    LocalStorage -->|300ms debounce| LocalStorage
    FirestoreClient -->|1000ms debounce| Firestore
    FirestoreClient -->|authenticates| Auth

    State -->|logs events| DebugLogs

    style User fill:#4a90e2
    style State fill:#f39c12
    style Firestore fill:#27ae60
    style LocalStorage fill:#e74c3c
```

### Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        VanillaJS[Vanilla JavaScript<br/>ES6 Modules]
        HTML5[HTML5]
        CSS3[CSS3<br/>Responsive]
    end

    subgraph "Firebase Services"
        FirebaseAuth[Firebase Auth<br/>Email/Password]
        CloudFirestore[Cloud Firestore<br/>NoSQL Database]
        FirebaseHosting[Firebase Hosting<br/>Static Site]
    end

    subgraph "Development"
        Git[Git<br/>Version Control]
        VSCode[Development<br/>Environment]
    end

    VanillaJS --> FirebaseAuth
    VanillaJS --> CloudFirestore
    HTML5 --> FirebaseHosting

    style VanillaJS fill:#f1c40f
    style FirebaseAuth fill:#3498db
    style CloudFirestore fill:#2ecc71
```

---

## 2. FIL-AVHENGIGHETER

### Complete Dependency Graph

```mermaid
graph TB
    subgraph "Entry Point"
        app[app.js<br/>22 lines]
    end

    subgraph "Core Services"
        state[state.js<br/>Global State + Cache<br/>127 lines]
        storage[storage.js<br/>localStorage Wrapper<br/>64 lines]
        auth[auth.js<br/>Firebase Auth<br/>327 lines]
        firebaseConfig[firebase-config.js<br/>Firebase Setup<br/>48 lines]
        firestoreStorage[firestore-storage.js<br/>Firestore CRUD<br/>277 lines]
    end

    subgraph "Business Logic"
        events[events.js<br/>Event Delegation<br/>562 lines]
        shots[shots.js<br/>Shot Registration<br/>368 lines]
        statistics[statistics.js<br/>Stats Calculation<br/>48 lines]
        players[players.js<br/>Player Management<br/>229 lines]
        timer[timer.js<br/>Match Timer<br/>204 lines]
        teamRoster[team-roster.js<br/>Roster Persistence<br/>307 lines]
        utils[utils.js<br/>Utilities<br/>264 lines]
        debugLogger[debug-logger.js<br/>Event Logging<br/>245 lines]
    end

    subgraph "UI Layer"
        render[ui/render.js<br/>Router<br/>354 lines]
        match[ui/match.js<br/>Match Page<br/>427 lines]
        setup[ui/setup.js<br/>Setup Page<br/>259 lines]
        home[ui/home.js<br/>Home Page<br/>101 lines]
        history[ui/history.js<br/>History Page<br/>168 lines]
        modals[ui/modals.js<br/>Modal Management<br/>255 lines]
        eventFeed[ui/event-feed.js<br/>Live Feed<br/>189 lines]
        teamRosterUI[ui/team-roster.js<br/>Roster UI<br/>220 lines]
    end

    %% Entry point dependencies
    app -->|loads state| storage
    app -->|setup listeners| events
    app -->|init auth| auth
    app -->|first render| render

    %% Core service dependencies
    storage -->|saves to| state
    storage -->|syncs to| firestoreStorage
    auth -->|uses| firebaseConfig
    auth -->|updates| state
    firestoreStorage -->|uses| firebaseConfig
    firestoreStorage -->|reads/writes| state
    firestoreStorage -->|logs| debugLogger

    %% Business logic dependencies
    events -->|delegates to| shots
    events -->|delegates to| players
    events -->|delegates to| auth
    events -->|delegates to| utils
    events -->|delegates to| timer

    shots -->|updates| state
    shots -->|uses| statistics
    shots -->|logs| debugLogger
    shots -->|uses| timer
    shots -->|renders| eventFeed
    shots -->|saves| storage

    statistics -->|reads| state
    players -->|updates| state
    players -->|saves| storage
    timer -->|updates| state
    teamRoster -->|saves| firestoreStorage
    utils -->|saves| firestoreStorage
    utils -->|updates| state

    %% UI dependencies
    render -->|routes to| match
    render -->|routes to| setup
    render -->|routes to| home
    render -->|routes to| history
    render -->|routes to| teamRosterUI

    match -->|uses| modals
    match -->|uses| eventFeed
    match -->|reads| state

    modals -->|reads| state
    eventFeed -->|reads| state

    style app fill:#e74c3c,color:#fff
    style state fill:#f39c12,color:#fff
    style shots fill:#e74c3c,color:#fff
    style events fill:#e67e22,color:#fff
    style render fill:#3498db,color:#fff
```

### Critical Path for Shot Registration

```mermaid
graph LR
    A[app.js] --> B[events.js]
    B --> C[shots.js]
    C --> D[state.js]
    C --> E[statistics.js]
    C --> F[storage.js]
    F --> G[firestore-storage.js]
    G --> H[Firebase]

    style C fill:#e74c3c,color:#fff
    style D fill:#f39c12,color:#fff
    style H fill:#27ae60,color:#fff
```

---

## 3. DATAFLYT: SKUDDREGISTRERING

### Complete Shot Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant GoalArea as Goal Area<br/>(DOM)
    participant Shots as shots.js
    participant State as state.js<br/>(APP)
    participant Cache as PERFORMANCE<br/>(Cache)
    participant Storage as storage.js
    participant Firestore as Firestore
    participant UI as UI Update

    User->>GoalArea: Klikk på målområde
    GoalArea->>Shots: handleGoalClick(event)

    Note over Shots: Beregner x, y koordinater<br/>relativ til målområde
    Shots->>State: APP.tempShot = {x, y, zone}
    Shots->>State: APP.selectedResult = null
    Shots->>UI: render() → Vis shot popup

    User->>UI: Velg resultat (mål/redning)
    UI->>Shots: selectShotResult(result)
    Shots->>State: APP.selectedResult = result
    Shots->>UI: Partial update (kun knapper)

    User->>UI: Velg spiller
    UI->>Shots: registerShot(playerId)

    Note over Shots: Henter player/opponent/keeper
    Note over Shots: Lager event object med<br/>timestamp, koordinater, etc.

    Shots->>State: APP.events.push(event)

    rect rgb(255, 200, 200)
        Note over Cache: KRITISK: Cache invalideres
        Shots->>Cache: invalidateStatsCache()
        Cache->>Cache: cacheVersion++
        Cache->>Cache: statsCache.clear()
    end

    rect rgb(200, 255, 200)
        Note over Storage: Debounced save (300ms)
        Shots->>Storage: saveToLocalStorage()
        Storage-->>Storage: setTimeout(300ms)
        Storage->>State: JSON.stringify(APP)
        Storage->>localStorage: setItem('handballApp')

        Note over Firestore: Debounced sync (1000ms)
        Storage->>Firestore: saveMatchToFirestoreDebounced()
        Firestore-->>Firestore: setTimeout(1000ms)
        Firestore->>Firestore: Save to 'active' document
    end

    Shots->>UI: updateGoalVisualization()<br/>(Partial update)
    Shots->>UI: updateStatisticsOnly()<br/>(Partial update)

    UI-->>User: Oppdatert visning<br/>med nytt skudd

    Note over User,UI: Total tid: ~1-2 sekunder<br/>300ms localStorage<br/>1000ms Firestore
```

### Shot Event Object Structure

```mermaid
classDiagram
    class ShotEvent {
        +number id
        +number half
        +string mode
        +Player player
        +Opponent opponent
        +Keeper keeper
        +number x
        +number y
        +string result
        +string zone
        +string timestamp
        +TimerTimestamp timerTimestamp
    }

    class Player {
        +number id
        +number number
        +string name
        +boolean isKeeper
    }

    class Opponent {
        +number id
        +number number
        +string name
    }

    class Keeper {
        +number id
        +number number
        +string name
        +boolean isKeeper
    }

    class TimerTimestamp {
        +number minutes
        +number seconds
    }

    ShotEvent --> Player
    ShotEvent --> Opponent
    ShotEvent --> Keeper
    ShotEvent --> TimerTimestamp

    note for ShotEvent "id: Date.now() (unique)\nhalf: 1 or 2\nmode: 'attack' | 'defense'\nresult: 'mål' | 'redning' | 'utenfor'\nzone: 'goal' | 'outside'\nx, y: 0-100 (percentage)"
```

### Coordinate System

```mermaid
graph TB
    subgraph "Goal Area Coordinate System"
        direction TB

        TopLeft["(0, 0)<br/>Top Left"]
        TopRight["(100, 0)<br/>Top Right"]
        BottomLeft["(0, 100)<br/>Bottom Left"]
        BottomRight["(100, 100)<br/>Bottom Right"]
        Center["(50, 50)<br/>Center"]

        TopLeft -.->|X axis| TopRight
        TopLeft -.->|Y axis| BottomLeft
    end

    note1[X: 0-100% horizontal<br/>Y: 0-100% vertical<br/>Origin: Top-left corner]

    style Center fill:#f39c12
    style note1 fill:#ecf0f1
```

---

## 4. LAGRINGSSTRATEGI

### Dual Storage Architecture

```mermaid
graph TB
    subgraph "Application State"
        APP[APP Object<br/>In-Memory State]
    end

    subgraph "Local Storage Strategy"
        LocalSave[saveToLocalStorage<br/>Debounce: 300ms]
        LocalData[(localStorage<br/>'handballApp')]
        LocalLoad[loadFromLocalStorage<br/>On App Start]
    end

    subgraph "Cloud Storage Strategy"
        FirestoreSave[saveMatchToFirestore<br/>Debounce: 1000ms]
        FirestoreData[(Firestore<br/>users/{uid}/matches)]
        FirestoreLoad[syncFromFirestore<br/>On Auth]
    end

    subgraph "Sync Events"
        Event1[New Shot]
        Event2[Player Added]
        Event3[Match Finished]
        Event4[Setup Reset]
    end

    Event1 --> APP
    Event2 --> APP
    Event3 --> APP
    Event4 --> APP

    APP -->|Triggers| LocalSave
    LocalSave -->|After 300ms| LocalData

    APP -->|Triggers| FirestoreSave
    FirestoreSave -->|After 1000ms| FirestoreData

    LocalData -->|On Reload| LocalLoad
    LocalLoad -->|Restores| APP

    FirestoreData -->|On Login| FirestoreLoad
    FirestoreLoad -->|Overwrites| APP

    style APP fill:#f39c12,color:#fff
    style LocalData fill:#e74c3c,color:#fff
    style FirestoreData fill:#27ae60,color:#fff
```

### Storage Comparison

```mermaid
graph LR
    subgraph "localStorage"
        L1[Fast Access<br/>~1ms]
        L2[Size Limit<br/>5-10 MB]
        L3[Synchronous<br/>Blocking]
        L4[No Auth<br/>Required]
        L5[Device-specific<br/>No sync]
    end

    subgraph "Firestore"
        F1[Network Dependent<br/>100-500ms]
        F2[Large Storage<br/>1 GB free]
        F3[Asynchronous<br/>Non-blocking]
        F4[Auth Required<br/>Secure]
        F5[Cross-device<br/>Real-time sync]
    end

    style localStorage fill:#e74c3c,color:#fff
    style Firestore fill:#27ae60,color:#fff
```

### Data Flow Priority

```mermaid
flowchart TD
    Start([App Starts])

    Start --> LoadLocal{localStorage<br/>exists?}
    LoadLocal -->|Yes| UseLocal[Use localStorage data<br/>Show UI immediately]
    LoadLocal -->|No| EmptyState[Start with empty state]

    UseLocal --> CheckAuth{User<br/>authenticated?}
    EmptyState --> CheckAuth

    CheckAuth -->|No| ShowLogin[Show Login Page]
    CheckAuth -->|Yes| SyncFirestore[Sync from Firestore]

    SyncFirestore --> CompareData{Firestore data<br/>exists?}

    CompareData -->|Yes| Overwrite[Overwrite local with<br/>Firestore data]
    CompareData -->|No| UseLocal2[Keep localStorage data<br/>Migrate to Firestore]

    Overwrite --> Ready[App Ready]
    UseLocal2 --> Migrate[migrateLocalStorageToFirestore]
    Migrate --> Ready
    ShowLogin --> Ready

    style LoadLocal fill:#f39c12
    style SyncFirestore fill:#27ae60
    style Ready fill:#3498db,color:#fff
```

### Save Debouncing Strategy

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DebounceTimer
    participant localStorage
    participant Firestore

    User->>App: Action 1 (t=0ms)
    App->>DebounceTimer: Schedule save in 300ms

    User->>App: Action 2 (t=100ms)
    App->>DebounceTimer: Cancel previous, schedule 300ms

    User->>App: Action 3 (t=200ms)
    App->>DebounceTimer: Cancel previous, schedule 300ms

    Note over DebounceTimer: Timer runs (t=500ms)

    DebounceTimer->>localStorage: Save (300ms after last action)
    localStorage-->>App: Saved locally

    DebounceTimer->>Firestore: Schedule Firestore save (1000ms)

    Note over Firestore: Longer debounce (t=1200ms)

    Firestore-->>App: Saved to cloud

    Note over User,Firestore: Only 1 save executed<br/>despite 3 actions
```

---

## 5. STATE MANAGEMENT

### Global APP Object Structure

```mermaid
graph TB
    subgraph "APP Object (state.js)"
        subgraph "User State"
            currentUser[currentUser<br/>Firebase User]
        end

        subgraph "Navigation State"
            page[page: string<br/>'home'|'match'|'setup'|etc]
        end

        subgraph "Match Configuration"
            homeTeam[homeTeam: string]
            awayTeam[awayTeam: string]
            matchDate[matchDate: string]
            currentHalf[currentHalf: 1|2]
            matchMode[matchMode: 'simple'|'advanced']
        end

        subgraph "Teams"
            players[players: Array~Player~]
            opponents[opponents: Array~Opponent~]
            activeKeeper[activeKeeper: Keeper]
        end

        subgraph "Match Events"
            events[events: Array~ShotEvent~]
            mode[mode: 'attack'|'defense']
        end

        subgraph "Timer State (Advanced)"
            timerState[timerState: Object<br/>currentTime, isRunning,<br/>duration, intervalId]
        end

        subgraph "Temporary UI State"
            tempShot[tempShot: {x, y, zone}]
            selectedResult[selectedResult: string]
            tempPlayersList[tempPlayersList: Array]
            editingPlayerId[editingPlayerId: number]
        end

        subgraph "History"
            completedMatches[completedMatches: Array~Match~]
            viewingMatch[viewingMatch: Match]
        end

        subgraph "Saved Rosters"
            savedTeams[savedTeams: Array~TeamRoster~]
        end
    end

    style APP fill:#f39c12,color:#fff
    style events fill:#e74c3c,color:#fff
    style tempShot fill:#3498db,color:#fff
```

### Performance Cache Structure

```mermaid
graph TB
    subgraph "PERFORMANCE Object"
        statsCache[statsCache: Map<br/>In-memory cache]
        cacheVersion[cacheVersion: number<br/>Global version counter]
        saveTimeout[saveTimeout: number<br/>Debounce timer ID]

        invalidate[invalidateStatsCache<br/>cacheVersion++<br/>statsCache.clear]
        getCached[getCachedStats<br/>key, calculator<br/>Lazy evaluation]
    end

    subgraph "Cache Keys"
        key1[player-123-1-v5]
        key2[player-123-2-v5]
        key3[opponent-456-1-v5]
    end

    subgraph "Cache Values"
        val1[goals: 5<br/>saved: 2<br/>outside: 1]
        val2[goals: 3<br/>saved: 4<br/>outside: 0]
        val3[goals: 2<br/>saved: 5<br/>shots: Array]
    end

    getCached -->|Lookup| statsCache
    statsCache --> key1
    statsCache --> key2
    statsCache --> key3

    key1 --> val1
    key2 --> val2
    key3 --> val3

    invalidate -->|Increments| cacheVersion
    invalidate -->|Clears| statsCache

    style PERFORMANCE fill:#9b59b6,color:#fff
    style cacheVersion fill:#e74c3c,color:#fff
```

### Cache Invalidation Flow

```mermaid
flowchart TD
    Event([User Action:<br/>New shot, Reset, etc])

    Event --> Update[Update APP.events]
    Update --> Invalidate[PERFORMANCE.invalidateStatsCache]

    Invalidate --> Increment[cacheVersion++]
    Invalidate --> Clear[statsCache.clear]

    Increment --> NewVersion[New version: v6]

    subgraph "Old Cache (Invalid)"
        old1[player-123-1-v5]
        old2[player-456-2-v5]
    end

    Clear -.->|Deletes| old1
    Clear -.->|Deletes| old2

    NewVersion --> Render[UI Render]

    Render --> Request[Request stats:<br/>player-123-1-v6]
    Request --> Miss{Cache<br/>Hit?}

    Miss -->|No| Calculate[Calculate fresh stats]
    Calculate --> Store[Store in cache:<br/>player-123-1-v6]

    Miss -->|Yes| Return[Return cached value]
    Store --> Return

    Return --> Display[Display to user]

    style Event fill:#e74c3c,color:#fff
    style Invalidate fill:#f39c12,color:#fff
    style Calculate fill:#27ae60,color:#fff
```

---

## 6. FIREBASE ARKITEKTUR

### Firestore Database Schema

```mermaid
graph TB
    subgraph "Firestore Database"
        root[(Cloud Firestore)]

        subgraph "Users Collection"
            users[users/]
            user1[{uid1}]
            user2[{uid2}]

            users --> user1
            users --> user2
        end

        root --> users

        subgraph "User Document Fields"
            userFields["email: string<br/>name: string<br/>homeTeam: string<br/>migrated: boolean<br/>migratedAt: timestamp"]
        end

        user1 --> userFields

        subgraph "Matches Subcollection"
            matches[matches/]
            activeDoc['active']
            match1[{matchId1}]
            match2[{matchId2}]

            matches --> activeDoc
            matches --> match1
            matches --> match2
        end

        user1 --> matches

        subgraph "Match Document Fields"
            matchFields["homeTeam: string<br/>awayTeam: string<br/>matchDate: string<br/>currentHalf: 1|2<br/>players: Array<br/>opponents: Array<br/>events: Array<br/>activeKeeper: Object<br/>mode: string<br/>status: 'active'|'completed'<br/>updatedAt: timestamp<br/>completedAt: timestamp"]
        end

        activeDoc --> matchFields
        match1 --> matchFields

        subgraph "Debug Logs Collection"
            debugLogs[debug-logs/]
            log1[{logId1}]
            log2[{logId2}]

            debugLogs --> log1
            debugLogs --> log2
        end

        root --> debugLogs

        subgraph "Debug Log Fields"
            logFields["userId: string<br/>userEmail: string<br/>eventType: string<br/>data: Object<br/>timestamp: string<br/>appVersion: string<br/>browser: string"]
        end

        log1 --> logFields
    end

    style root fill:#27ae60,color:#fff
    style users fill:#3498db,color:#fff
    style debugLogs fill:#e67e22,color:#fff
```

### Firebase Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant UI
    participant Auth as auth.js
    participant Firebase as Firebase Auth
    participant Firestore as Cloud Firestore
    participant State as APP State

    Note over User,State: Registration Flow

    User->>UI: Enter email, password, name
    UI->>Auth: handleRegister(email, password, name)
    Auth->>Firebase: createUserWithEmailAndPassword()
    Firebase-->>Auth: userCredential
    Auth->>Firebase: updateProfile(displayName: name)
    Auth->>Firestore: createUserProfile(uid, email, name)
    Firestore-->>Auth: Profile created
    Auth->>State: Update APP.currentUser
    Auth-->>UI: Registration success
    UI-->>User: Redirect to home

    Note over User,State: Login Flow

    User->>UI: Enter email, password
    UI->>Auth: handleLogin(email, password)
    Auth->>Firebase: signInWithEmailAndPassword()
    Firebase-->>Auth: userCredential
    Auth->>Firestore: fetchUserProfile(uid)
    Firestore-->>Auth: User profile data
    Auth->>State: Update APP.currentUser

    rect rgb(200, 255, 200)
        Note over Auth,Firestore: One-time Migration
        Auth->>Firestore: migrateLocalStorageToFirestore()
        Firestore-->>Auth: Migration complete
    end

    Auth->>Firestore: syncFromFirestore()
    Firestore-->>Auth: Active match + history
    Auth->>State: Update APP data
    Auth-->>UI: Login success
    UI-->>User: Redirect to home

    Note over User,State: Logout Flow

    User->>UI: Click logout
    UI->>Auth: handleLogout()
    Auth->>State: Clear APP.currentUser
    Auth->>Firebase: signOut()
    Firebase-->>Auth: Signed out
    Auth-->>UI: Logout success
    UI-->>User: Redirect to login
```

### Firestore Operations

```mermaid
graph TB
    subgraph "Read Operations"
        R1[loadActiveMatchFromFirestore<br/>Load current match]
        R2[loadCompletedMatchesFromFirestore<br/>Load history]
        R3[fetchUserProfile<br/>Load user data]
        R4[fetchSavedTeams<br/>Load rosters]
    end

    subgraph "Write Operations"
        W1[saveMatchToFirestore<br/>Save active match<br/>debounced 1000ms]
        W2[saveCompletedMatchToFirestore<br/>Archive finished match]
        W3[createUserProfile<br/>Create user document]
        W4[saveTeamRoster<br/>Save team list]
    end

    subgraph "Delete Operations"
        D1[deleteCompletedMatchFromFirestore<br/>Remove match from history]
        D2[deleteTeamRoster<br/>Remove saved team]
    end

    subgraph "Special Operations"
        S1[migrateLocalStorageToFirestore<br/>One-time data migration]
        S2[syncFromFirestore<br/>Full sync on login]
    end

    subgraph "Firestore Collections"
        C1[(users/{uid})]
        C2[(users/{uid}/matches)]
        C3[(debug-logs)]
    end

    R1 --> C2
    R2 --> C2
    R3 --> C1
    R4 --> C1

    W1 --> C2
    W2 --> C2
    W3 --> C1
    W4 --> C1

    D1 --> C2
    D2 --> C1

    S1 --> C1
    S1 --> C2
    S2 --> C1
    S2 --> C2

    style C1 fill:#3498db,color:#fff
    style C2 fill:#27ae60,color:#fff
    style C3 fill:#e67e22,color:#fff
```

---

## 7. UI RENDERING FLOW

### Page Routing System

```mermaid
flowchart TD
    Start([User Action or<br/>App Start])

    Start --> Trigger[APP.page = 'newPage']
    Trigger --> CallRender[render function called]

    CallRender --> Router{Route based on<br/>APP.page}

    Router -->|'login'| Login[renderLoginPage]
    Router -->|'register'| Register[renderRegisterPage]
    Router -->|'home'| Home[renderHomePage]
    Router -->|'setup'| Setup[renderSetupPage]
    Router -->|'match'| Match[renderMatchPage]
    Router -->|'history'| History[renderHistoryPage]
    Router -->|'viewMatch'| ViewMatch[renderViewMatchPage]
    Router -->|'teamRoster'| TeamRoster[renderTeamRosterPage]

    Login --> Inject[Inject HTML into #app]
    Register --> Inject
    Home --> Inject
    Setup --> Inject
    Match --> Inject
    History --> Inject
    ViewMatch --> Inject
    TeamRoster --> Inject

    Inject --> AttachListeners[attachEventListeners]
    AttachListeners --> Complete([Render Complete])

    Complete -.->|User interacts| Start

    style Router fill:#3498db,color:#fff
    style Inject fill:#27ae60,color:#fff
    style AttachListeners fill:#e67e22,color:#fff
```

### Rendering Strategy

```mermaid
graph TB
    subgraph "Full Re-render (Heavy)"
        F1[User navigates to new page]
        F2[APP.page changes]
        F3[render called]
        F4[Entire #app innerHTML replaced]
        F5[All event listeners re-attached]
    end

    subgraph "Partial Update (Optimized)"
        P1[User registers shot]
        P2[Event data added to APP.events]
        P3[updateGoalVisualization]
        P4[Only shot markers updated]
        P5[updateStatisticsOnly]
        P6[Only stats section updated]
    end

    subgraph "Modal Update (Lazy)"
        M1[User selects shot result]
        M2[APP.selectedResult updated]
        M3[selectShotResult]
        M4[Only result buttons updated]
        M5[No full re-render]
    end

    F1 --> F2 --> F3 --> F4 --> F5
    P1 --> P2 --> P3 --> P4
    P2 --> P5 --> P6
    M1 --> M2 --> M3 --> M4 --> M5

    style F4 fill:#e74c3c,color:#fff
    style P4 fill:#27ae60,color:#fff
    style P6 fill:#27ae60,color:#fff
    style M4 fill:#f39c12,color:#fff
```

---

## 8. EVENT HANDLING STRATEGY

### Global Event Delegation

```mermaid
graph TB
    subgraph "Event Delegation Pattern"
        Document[document]
        GlobalListener[Global Click Listener<br/>Attached ONCE in events.js]

        Document -->|addEventListener| GlobalListener
    end

    subgraph "Event Routing"
        GlobalListener -->|Check data-action| Router{Action<br/>Attribute?}

        Router -->|data-action=| Actions[50+ Actions]
    end

    subgraph "Action Handlers"
        A1[registerShot]
        A2[selectShotResult]
        A3[handleGoalClick]
        A4[logout]
        A5[finishMatch]
        A6[resetMatch]
        A7[switchHalf]
        A8[toggleMode]
        A9[...]

        Actions --> A1
        Actions --> A2
        Actions --> A3
        Actions --> A4
        Actions --> A5
        Actions --> A6
        Actions --> A7
        Actions --> A8
        Actions --> A9
    end

    subgraph "Direct Listeners (Re-attached)"
        Forms[Form Submit<br/>Login, Register, Setup]
        FileInputs[File Inputs<br/>Player imports]
        Modals[Modal Close Buttons]
    end

    style GlobalListener fill:#27ae60,color:#fff
    style Router fill:#3498db,color:#fff
    style Forms fill:#e67e22,color:#fff
```

### Event Flow Example

```mermaid
sequenceDiagram
    actor User
    participant DOM
    participant GlobalListener
    participant EventsJS as events.js
    participant ShotsJS as shots.js
    participant State as APP State
    participant UI

    User->>DOM: Click button<br/>data-action="registerShot"<br/>data-player-id="123"
    DOM->>GlobalListener: click event bubbles up
    GlobalListener->>EventsJS: Check e.target.dataset.action

    EventsJS->>EventsJS: action === 'registerShot'
    EventsJS->>ShotsJS: registerShot(playerId=123)

    ShotsJS->>State: APP.events.push(event)
    ShotsJS->>State: PERFORMANCE.invalidateStatsCache()
    ShotsJS->>UI: updateGoalVisualization()
    ShotsJS->>UI: updateStatisticsOnly()

    UI-->>User: Updated display

    Note over GlobalListener,EventsJS: Single listener handles<br/>all actions via delegation
```

---

## 9. ARKITEKTUR-INSIGHTS

### Styrker

1. **Enkel State Management**
   - Ett globalt objekt, lett å debugge
   - Ingen kompleks state-synkronisering

2. **Dual Persistence**
   - localStorage for rask tilgang
   - Firestore for backup og sync
   - Debouncing reduserer database-writes

3. **Event Delegation**
   - Ett event listener for alle knapper
   - Ingen listener leaks fra knapper
   - Fungerer med dynamisk DOM

4. **Partial Updates**
   - Ikke full re-render ved hver endring
   - Bedre ytelse på store kamper

5. **Versioned Caching**
   - Enkel invalidering (increment version)
   - Lazy evaluation av stats

### Svakheter

1. **Global State**
   - Ingen innkapsling
   - Lett å mutere feil fra hvor som helst
   - Vanskelig å skalere

2. **Modal Event Listeners**
   - Re-attached ved hver render
   - Potensielle memory leaks

3. **Ingen TypeScript**
   - Ingen compile-time validering
   - Vanskelig å refaktorere trygt

4. **Stor events.js**
   - 562 linjer, vanskelig å vedlikeholde
   - Bør splittes i moduler

5. **Race Conditions**
   - Debounced saves kan miste data
   - Timing issues ved rask input

### Forbedringspotensial

1. Introduser state setter-funksjoner med validering
2. Implementer modal state machine
3. Split events.js i feature-moduler
4. Legg til TypeScript (gradvis migrasjon)
5. Implementer konfliktløsning for Firestore sync
6. Legg til comprehensive error handling

---

**Dokument versjon:** 1.0
**Sist oppdatert:** 2026-01-12
**Laget av:** Claude Code Agent
