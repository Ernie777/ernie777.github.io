// 遊戲主變數
let board = Array(9).fill(null); // 棋盤狀態：0-8
let currentPlayer = 'X'; // 當前玩家 (X: 玩家, O: 電腦)
let isGameActive = true; // 控制遊戲是否進行中
const COMPUTER_PLAYER = 'O';
const HUMAN_PLAYER = 'X';

// 勝利條件集合 (所有可能的3子連線)
const WINNING_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// 初始化棋盤
function init() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = ''; 
    board = Array(9).fill(null);
    isGameActive = true;
    currentPlayer = HUMAN_PLAYER;
    document.getElementById('status').innerText = '玩家 (X) 先手';

    // 建立9個格子，並綁定點擊事件
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i; 
        cell.onclick = () => handlePlayerMove(i);
        boardEl.appendChild(cell);
    }
    updateBoard();
}

// 判斷勝利 (公用函數)
function checkWin(currentBoard, player) {
    return WINNING_CONDITIONS.some(([a, b, c]) => 
        currentBoard[a] === player && currentBoard[b] === player && currentBoard[c] === player
    );
}

// 判斷是否平手 (公用函數)
function getEmptyIndices(currentBoard) {
    return currentBoard
        .map((value, index) => value === null ? index : null)
        .filter(index => index !== null);
}

// Minimax 演算法實現
function minimax(newBoard, player) {
    const availableSpots = getEmptyIndices(newBoard);

    // 終端狀態檢查 (Terminal State)
    if (checkWin(newBoard, HUMAN_PLAYER)) {
        // 如果玩家(X)贏了，回傳負分 (-10)
        return { score: -10 }; 
    } else if (checkWin(newBoard, COMPUTER_PLAYER)) {
        // 如果電腦(O)贏了，回傳正分 (+10)
        return { score: 10 };
    } else if (availableSpots.length === 0) {
        // 平手，回傳 0 分
        return { score: 0 }; 
    }

    // 收集所有可能的移動 (Moves)
    const moves = [];

    // 遍歷所有空位
    for (let i = 0; i < availableSpots.length; i++) {
        const move = {};
        const index = availableSpots[i];
        
        move.index = index; // 儲存當前移動的索引

        // 嘗試這個移動
        newBoard[index] = player; 

        // 遞迴調用 Minimax
        if (player === COMPUTER_PLAYER) {
            // 電腦是 Maximize Player，嘗試最大化分數
            const result = minimax(newBoard, HUMAN_PLAYER);
            move.score = result.score;
        } else {
            // 玩家是 Minimize Player，嘗試最小化分數
            const result = minimax(newBoard, COMPUTER_PLAYER);
            move.score = result.score;
        }

        // 重置棋盤 (清理現場，以便嘗試下一個移動)
        newBoard[index] = null; 
        
        moves.push(move);
    }

    // 評估所有移動並返回最佳選擇
    let bestMove;
    if (player === COMPUTER_PLAYER) {
        // Maximize Player (電腦): 選擇分數最大的移動
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    } else {
        // Minimize Player (玩家): 選擇分數最小的移動
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    }

    return bestMove;
}

// 處理玩家下棋
function handlePlayerMove(index) {
    // 檢查：遊戲是否活躍、是否為當前玩家、該格子是否為空
    if (!isGameActive || board[index] !== null || currentPlayer !== HUMAN_PLAYER) {
        return;
    }

    board[index] = HUMAN_PLAYER;
    updateBoard();

    if (checkWin(board, HUMAN_PLAYER)) {
        endGame('玩家 (X) 勝利！');
        return;
    }
    if (getEmptyIndices(board).length === 0) {
        endGame('平手！');
        return;
    }

    // 切換到電腦回合
    currentPlayer = COMPUTER_PLAYER;
    document.getElementById('status').innerText = '電腦思考中...';
    // 給予電腦思考時間
    setTimeout(computerMove, 700); 
}

// 電腦AI下棋邏輯 (使用 Minimax)
function computerMove() {
    // Minimax 將返回最佳移動的物件 { index: N, score: S }
    const bestSpot = minimax(board, COMPUTER_PLAYER);
    const moveIndex = bestSpot.index; 
    
    // 執行移動
    board[moveIndex] = COMPUTER_PLAYER;
    updateBoard();

    if (checkWin(board, COMPUTER_PLAYER)) {
        endGame('電腦 (O) 勝利！');
        return;
    }
    if (getEmptyIndices(board).length === 0) {
        endGame('平手！');
        return;
    }
    
    // 切換回玩家回合
    currentPlayer = HUMAN_PLAYER;
    document.getElementById('status').innerText = '輪到玩家 (X)';
}

// 更新畫面 (配合優化後的 CSS)
function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        const marker = board[i];
        cell.innerText = marker || '';
        
        // --- UI 優化關鍵 ---
        // 移除所有標記類別
        cell.classList.remove('X', 'O'); 
        
        // 根據棋盤狀態添加相應的類別來應用顏色
        if (marker) {
            cell.classList.add(marker);
        }
        // ------------------
    });
}

// 結束遊戲
function endGame(message) {
    document.getElementById('status').innerText = message;
    isGameActive = false;
}

// 重開一局
function resetGame() {
    init();
}

// 遊戲啟動
document.addEventListener('DOMContentLoaded', init);