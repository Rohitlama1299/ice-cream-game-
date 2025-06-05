document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const nicknameInput = document.getElementById('nickname');
    const rememberCheckbox = document.getElementById('remember');
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    const difficultyLabel = document.getElementById('difficulty-label');
    const startBtn = document.getElementById('start-btn');
    const playerNameDisplay = document.getElementById('player-name-display');
    const difficultyDisplay = document.getElementById('difficulty-display');
    const scoreDisplay = document.getElementById('score');
    const targetScoreDisplay = document.getElementById('target-score');
    const gameTimerDisplay = document.getElementById('game-timer');
    const ordersList = document.getElementById('orders-list');
    const currentOrderScoops = document.getElementById('current-order-scoops');
    const meltMeterInner = document.getElementById('melt-meter-inner');
    const meltTimerDisplay = document.getElementById('melt-timer');
    const iceCreamCone = document.getElementById('ice-cream-cone');
    const colorBtns = document.querySelectorAll('.color-btn');
    const mixBoardImg = document.getElementById('mix-board-img');
    const addScoopBtn = document.getElementById('add-scoop-btn');
    const completeOrderBtn = document.getElementById('complete-order-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // Audio elements
    const bgMusic = document.getElementById('bg-music');
    const successSound = document.getElementById('success-sound');
    const failSound = document.getElementById('fail-sound');
    const winSound = document.getElementById('win-sound');
    const loseSound = document.getElementById('lose-sound');
    
    // Game state
    let gameState = {
        playerName: '',
        difficulty: 'normal',
        score: 0,
        targetScore: 100,
        orders: [],
        currentOrder: null,
        scoopsOnCone: [],
        selectedColors: [],
        currentMixColor: 'gray',
        meltInterval: null,
        gameInterval: null,
        timeLeft: 30,
        totalTime: 30,
        gameTimeLeft: 120,
        gameActive: false,
        maxOrders: 10,
        completedOrders: 0
    };
    
    // Color mixing rules
    const colorMixes = {
        'red,green': 'yellow',
        'red,blue': 'magenta',
        'green,blue': 'cyan',
        'red,green,blue': 'white',
        // Add reverse combinations for consistency
        'green,red': 'yellow',
        'blue,red': 'magenta',
        'blue,green': 'cyan',
        'red,blue,green': 'white',
        'green,red,blue': 'white',
        'green,blue,red': 'white',
        'blue,red,green': 'white',
        'blue,green,red': 'white'
    };
    
    // Initialize game
    function init() {
        setupEventListeners();
        checkSavedPlayer();
        updateDifficultyLabel();
        validateSetup();
        hideAllToasts();
    }
    
    function setupEventListeners() {
        nicknameInput.addEventListener('input', validateSetup);
        difficultyRadios.forEach(radio => radio.addEventListener('change', updateDifficultySettings));
        startBtn.addEventListener('click', startGame);
        colorBtns.forEach(btn => btn.addEventListener('click', handleColorClick));
        addScoopBtn.addEventListener('click', addScoopToCone);
        completeOrderBtn.addEventListener('click', completeOrder);
        playAgainBtn.addEventListener('click', restartGame);
        document.addEventListener('keydown', handleKeyboardInput);
    }
    
    function validateSetup() {
        startBtn.disabled = !(nicknameInput.value.trim() && 
                            Array.from(difficultyRadios).some(radio => radio.checked));
    }
    
    function updateDifficultySettings() {
        const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
        
        const difficultySettings = {
            '1': { text: 'Easy', totalTime: 40, maxOrders: 8, gameTime: 80, target: 80 },
            '2': { text: 'Normal', totalTime: 30, maxOrders: 10, gameTime: 60, target: 100 },
            '3': { text: 'Hard', totalTime: 20, maxOrders: 12, gameTime: 50, target: 120 }
        };
        
        const settings = difficultySettings[difficulty];
        difficultyLabel.textContent = settings.text;
        
        // Update game state
        gameState.totalTime = settings.totalTime;
        gameState.maxOrders = settings.maxOrders;
        gameState.gameTimeLeft = settings.gameTime;
        gameState.targetScore = settings.target;
        
        validateSetup();
    }
    
    function startGame() {
        gameState = {
            ...gameState,
            playerName: nicknameInput.value.trim(),
            difficulty: document.querySelector('input[name="difficulty"]:checked').value,
            score: 0,
            orders: [],
            scoopsOnCone: [],
            completedOrders: 0,
            gameActive: true,
            currentMixColor: 'gray'
        };
        
        updateGameUI();
        
        if (rememberCheckbox.checked) {
            setCookie('playerName', gameState.playerName, 30);
        }
        
        setupScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        bgMusic.play();
        
        startGameTimer();
        generateNewOrder();
    }
    
    function updateGameUI() {
        playerNameDisplay.textContent = gameState.playerName;
        difficultyDisplay.textContent = difficultyLabel.textContent;
        scoreDisplay.textContent = gameState.score;
        targetScoreDisplay.textContent = gameState.targetScore;
        gameTimerDisplay.textContent = formatTime(gameState.gameTimeLeft);
    }
    
    function startGameTimer() {
        clearInterval(gameState.gameInterval);
        gameState.gameInterval = setInterval(() => {
            gameState.gameTimeLeft--;
            gameTimerDisplay.textContent = formatTime(gameState.gameTimeLeft);
            
            if (gameState.gameTimeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    function generateNewOrder() {
        resetCone();
        resetMixBoard();
        
        const numScoops = Math.floor(Math.random() * 3) + 1;
        const scoopColors = Array.from({ length: numScoops }, () => {
            const colors = ['red', 'green', 'blue', 'yellow', 'magenta', 'cyan', 'white'];
            return colors[Math.floor(Math.random() * colors.length)];
        });
        
        gameState.currentOrder = {
            id: Date.now(),
            scoopColors,
            completed: false,
            success: false
        };
        
        gameState.orders.push(gameState.currentOrder);
        updateOrderDisplays();
        startMeltTimer();
    }
    
    function updateOrderDisplays() {
        updateCurrentOrderDisplay();
        updateOrdersList();
    }
    
    function updateCurrentOrderDisplay() {
        currentOrderScoops.innerHTML = gameState.currentOrder.scoopColors
            .map(color => `<img src="images/${color}.png" alt="${color}" class="scoop-img">`)
            .join('');
    }
    
    function updateOrdersList() {
        ordersList.innerHTML = gameState.orders
            .slice() // Create a copy
            .reverse() // Newest first
            .map(order => `
                <div class="order-item">
                    <div class="order-scoops">
                        ${order.scoopColors.map(color => `
                            <img src="images/${color}.png" alt="${color}" class="scoop-img" 
                                 style="${order.completed ? 'opacity:0.5' : ''}">
                        `).join('')}
                    </div>
                    ${order.completed ? `
                        <img src="images/${order.success ? 'check' : 'cross'}.png" 
                             alt="${order.success ? 'Success' : 'Failed'}" class="order-status">
                    ` : ''}
                </div>
            `).join('');
        
        ordersList.scrollTop = 0;
    }
    
    function startMeltTimer() {
        clearInterval(gameState.meltInterval);
        
        gameState.timeLeft = gameState.totalTime;
        updateMeltDisplay();
        
        gameState.meltInterval = setInterval(() => {
            gameState.timeLeft--;
            updateMeltDisplay();
            
            if (gameState.timeLeft <= 0) {
                clearInterval(gameState.meltInterval);
                orderFailed();
            }
        }, 1000);
    }
    
    function updateMeltDisplay() {
        const percentage = (gameState.timeLeft / gameState.totalTime) * 100;
        meltMeterInner.style.width = `${percentage}%`;
        meltTimerDisplay.textContent = `${gameState.timeLeft}s`;
        
        // Update color based on percentage
        meltMeterInner.style.backgroundColor = 
            percentage < 30 ? '#f44336' : 
            percentage < 60 ? '#ff9800' : '#4CAF50';
    }
    
    function handleColorClick(e) {
        if (!gameState.gameActive) return;

        const color = e.currentTarget.dataset.color;
        const colors = gameState.selectedColors;
        const index = colors.indexOf(color);
        
        if (index === -1 && colors.length < 3) {
            colors.push(color);
        } else if (index !== -1) {
            colors.splice(index, 1);
        }

        updateMixBoard();
    }
    
    function updateMixBoard() {
        const colorKey = [...gameState.selectedColors].sort().join(',');
        gameState.currentMixColor = colorMixes[colorKey] || gameState.selectedColors[0] || 'gray';
        mixBoardImg.src = `images/${gameState.currentMixColor}.png`;
        mixBoardImg.alt = gameState.currentMixColor;
    }
    
    function addScoopToCone() {
        if (!gameState.gameActive || !gameState.selectedColors.length) return;
        
        gameState.scoopsOnCone.push(gameState.currentMixColor);
        updateConeDisplay();
        resetMixBoard();
    }
    
    function updateConeDisplay() {
        const coneImg = iceCreamCone.querySelector('.cone-img');
        iceCreamCone.innerHTML = coneImg ? coneImg.outerHTML : '';
        
        gameState.scoopsOnCone.forEach((scoop, index) => {
            const scoopImg = document.createElement('img');
            scoopImg.src = `images/${scoop}.png`;
            scoopImg.alt = scoop;
            scoopImg.className = 'scoop-on-cone';
            scoopImg.style.bottom = `${180 + (index * 25)}px`;
            iceCreamCone.appendChild(scoopImg);
        });
    }
    
    function completeOrder() {
        if (!gameState.gameActive || !gameState.scoopsOnCone.length) return;
        
        const isMatch = checkOrderMatch();
        gameState.currentOrder.completed = true;
        gameState.currentOrder.success = isMatch;
        gameState.completedOrders++;
        
        // Update score
        gameState.score += isMatch ? 
            gameState.scoopsOnCone.length * 10 : 
            -5;
        gameState.score = Math.max(0, gameState.score);
        
        // Play sound and show feedback
        (isMatch ? successSound : failSound).play();
        showOrderToast(
            isMatch ? 'Order Complete!' : 'Order Failed',
            isMatch ? 'Great job!' : 'Try the next one!'
        );
        
        // Update UI
        scoreDisplay.textContent = gameState.score;
        updateOrdersList();
        
        // Generate new order after delay
        setTimeout(generateNewOrder, 1500);
    }
    
    function checkOrderMatch() {
        return gameState.scoopsOnCone.length === gameState.currentOrder.scoopColors.length &&
               gameState.scoopsOnCone.every((scoop, i) => scoop === gameState.currentOrder.scoopColors[i]);
    }
    
    function handleKeyboardInput(e) {
        if (!gameState.gameActive) return;
        
        switch(e.key.toLowerCase()) {
            case 'm': resetMixBoard(); break;
            case 'r': 
                if (gameState.scoopsOnCone.length > 0) {
                    gameState.scoopsOnCone.pop();
                    updateConeDisplay();
                }
                break;
            case 'c': completeOrder(); break;
        }
    }
    
    function endGame() {
        gameState.gameActive = false;
        clearIntervals();
        bgMusic.pause();
        bgMusic.currentTime = 0;

        const won = gameState.score >= gameState.targetScore;
        showGameResult();
    }
    
    function showGameResult() {
        const won = gameState.score >= gameState.targetScore;
        
        toastTitle.textContent = won ? 'Congratulations!' : 'Game Over!';
        toastMessage.textContent = `${won ? 'You Won!' : 'You Lost!'} Final Score: ${gameState.score}/${gameState.targetScore} points`;
        
        // Play appropriate sound based on win/loss
        (won ? winSound : loseSound).play();
        
        toast.classList.remove('hidden');
    }
    
    function restartGame() {
        hideAllToasts();
        clearIntervals();
        resetGameState();
        resetUI();
    }
    
    function hideAllToasts() {
        toast.classList.add('hidden');
        document.getElementById('order-toast').classList.add('hidden');
    }
    
    function clearIntervals() {
        clearInterval(gameState.meltInterval);
        clearInterval(gameState.gameInterval);
    }
    
    function resetGameState() {
        gameState = {
            ...gameState,
            playerName: '',
            score: 0,
            orders: [],
            currentOrder: null,
            scoopsOnCone: [],
            selectedColors: [],
            currentMixColor: 'gray',
            meltInterval: null,
            gameInterval: null,
            gameActive: false,
            completedOrders: 0
        };
    }
    
    function resetUI() {
        setupScreen.classList.remove('hidden');
        gameScreen.classList.add('hidden');
        nicknameInput.value = '';
        difficultyRadios[0].checked = true;
        rememberCheckbox.checked = false;
        updateDifficultySettings();
    }
    
    // Utility functions
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    }
    
    function getCookie(name) {
        const cookieName = `${name}=`;
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(cookieName)) {
                return cookie.substring(cookieName.length);
            }
        }
        return '';
    }
    
    function checkSavedPlayer() {
        const savedName = getCookie('playerName');
        if (savedName) {
            nicknameInput.value = savedName;
            rememberCheckbox.checked = true;
        }
    }
    
    function showOrderToast(title, message) {
        const orderToast = document.getElementById('order-toast');
        document.getElementById('order-toast-title').textContent = title;
        document.getElementById('order-toast-message').textContent = message;
        
        orderToast.classList.remove('hidden');
        setTimeout(() => orderToast.classList.add('hidden'), 1500);
    }
    
    function resetMixBoard() {
        gameState.selectedColors = [];
        gameState.currentMixColor = 'gray';
        mixBoardImg.src = 'images/gray.png';
        mixBoardImg.alt = 'Mix Board';
    }
    
    function resetCone() {
        gameState.scoopsOnCone = [];
        updateConeDisplay();
    }
    
    // Initialize the game
    init();
});