class NineBoardGo {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.currentPlayer = 1; // 1: 黑, -1: 白
        this.history = []; // 記錄每一步後的盤面
        this.consecutivePasses = 0;
        this.gameOver = false;
        this.aiEnabled = true;
        this.initBoard();
        this.render();
    }

    initBoard() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        const starPoints = ["2,2", "2,6", "4,4", "6,2", "6,6"];

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if (starPoints.includes(`${r},${c}`)) cell.classList.add('star');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.onclick = () => this.handleMove(r, c);
                boardEl.appendChild(cell);
            }
        }
    }

    handleMove(r, c) {
        if (this.gameOver || this.board[r][c] !== 0) return;
        if (this.currentPlayer !== 1) return; // 玩家回合

        const result = this.makeMove(r, c, 1);
        if (result === true) {
            this.consecutivePasses = 0;
            this.nextTurn();
        } else {
            // 處理錯誤提示
            if (result === 'KO') alert("⚠️ 打劫 (Ko)：禁止全局同形，請隔一手再下！");
            else if (result === 'SUICIDE') alert("⚠️ 禁著點：此處下子後無氣且無法提子。");
        }
    }

    // ✅ 核心落子邏輯 (回傳: true=成功, 'KO'=打劫, 'SUICIDE'=自殺, false=其他)
    makeMove(r, c, player, isSimulation = false) {
        // 1. 複製盤面進行模擬
        let nextBoard = this.board.map(row => [...row]);
        nextBoard[r][c] = player;

        const opponent = -player;
        let capturedAny = false;
        const neighbors = this.getNeighbors(r, c);

        // 2. 提子檢查
        neighbors.forEach(([nr, nc]) => {
            if (nextBoard[nr][nc] === opponent) {
                if (!this.checkLiberty(nextBoard, nr, nc)) {
                    this.removeGroup(nextBoard, nr, nc);
                    capturedAny = true;
                }
            }
        });

        // 3. 禁著點檢查 (自殺)
        if (!capturedAny && !this.checkLiberty(nextBoard, r, c)) {
            return 'SUICIDE';
        }

        // 4. ✅ 打劫檢查 (Ko Rule)
        // 只有在非模擬狀態下才需要嚴格阻擋，AI模擬時此函數會回傳狀態供AI判斷
        if (!isSimulation && this.isKo(nextBoard)) {
            return 'KO';
        }

        // 5. 若是模擬，到此回傳成功
        if (isSimulation) return true;

        // 6. 正式落子：更新歷史與盤面
        this.history.push(JSON.stringify(this.board));
        this.board = nextBoard;
        return true;
    }

    // ✅ 判斷是否構成打劫 (新盤面是否等於倒數第二手)
    isKo(nextBoard) {
        if (this.history.length < 2) return false;
        // 歷史紀錄: [狀態0, 狀態1, ... 狀態N]
        // 當前盤面是 狀態N。
        // 如果我這手下完變成 狀態N-1 (即對手下這手之前的狀態)，那就是打劫
        const previousState = this.history[this.history.length - 1]; // 對手下完後的狀態 (現在的盤面)
        const stateBeforeOpponent = this.history[this.history.length - 2]; // 對手下之前的狀態
        
        // 簡單判斷：如果新盤面 === 兩手前的盤面，即為打劫
        // 注意：history 存的是 JSON string
        return JSON.stringify(nextBoard) === stateBeforeOpponent;
    }

    checkLiberty(board, r, c) {
        const color = board[r][c];
        const visited = new Set();
        const stack = [[r, c]];
        
        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            const key = `${currR},${currC}`;
            if (visited.has(key)) continue;
            visited.add(key);

            const neighbors = this.getNeighbors(currR, currC);
            for (const [nr, nc] of neighbors) {
                if (board[nr][nc] === 0) return true;
                if (board[nr][nc] === color && !visited.has(`${nr},${nc}`)) {
                    stack.push([nr, nc]);
                }
            }
        }
        return false;
    }

    // 修改 removeGroup 加入提子動畫消失效果
    removeGroup(board, r, c) {
        const color = board[r][c];
        const stack = [[r, c]];
        const boardEl = document.getElementById('board');

        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            if (board[currR][currC] === color) {
                board[currR][currC] = 0;
                
                // 視覺效果：如果在當前畫面上，加入消失動畫
                const cell = boardEl.children[currR * 9 + currC];
                const stone = cell.querySelector('.stone');
                if (stone) {
                    stone.classList.add('capturing');
                    setTimeout(() => stone.remove(), 300); // 動畫結束後移除
                }
                
                this.getNeighbors(currR, currC).forEach(n => stack.push(n));
            }
        }
    }

    getNeighbors(r, c) {
        const res = [];
        if (r > 0) res.push([r - 1, c]);
        if (r < 8) res.push([r + 1, c]);
        if (c > 0) res.push([r, c - 1]);
        if (c < 8) res.push([r, c + 1]);
        return res;
    }

    pass() {
        this.consecutivePasses++;
        if (this.consecutivePasses >= 2) {
            this.endGame();
        } else {
            this.history.push(JSON.stringify(this.board)); // 虛手也要記錄盤面(不變)以維持步數順序
            this.nextTurn();
        }
    }

    nextTurn() {
        this.currentPlayer = -this.currentPlayer;
        this.render();
        if (!this.gameOver && this.currentPlayer === -1 && this.aiEnabled) {
            setTimeout(() => this.aiMove(), 500);
        }
    }

    // ✅ AI 邏輯：加入打劫與權重判斷
    aiMove() {
        if (this.gameOver) return;
        let bestScore = -Infinity;
        let bestMoves = [];

        // 模擬所有空點
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 0) {
                    // 檢查合法性 (包含自殺與打劫)
                    // 注意：這裡不傳入 isSimulation=true，而是手動檢查
                    // 為了方便，我們使用一個輔助函數來獲取模擬後的盤面
                    let tempBoard = this.board.map(row => [...row]);
                    
                    // 模擬 AI 落子 (-1)
                    if (this.simulateMove(tempBoard, r, c, -1)) {
                        // 如果合法，且不是打劫
                        if (!this.isKo(tempBoard)) {
                            let score = this.evaluateMove(tempBoard, r, c, -1);
                            if (score > bestScore) {
                                bestScore = score;
                                bestMoves = [{r, c}];
                            } else if (score === bestScore) {
                                bestMoves.push({r, c});
                            }
                        }
                    }
                }
            }
        }

        if (bestMoves.length > 0) {
            const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
            this.makeMove(move.r, move.c, -1);
            this.consecutivePasses = 0;
            this.nextTurn();
        } else {
            this.pass();
        }
    }

    // AI 輔助：模擬落子並回傳是否合法 (不包含打劫檢查，打劫由 AI 主迴圈檢查)
    simulateMove(board, r, c, player) {
        board[r][c] = player;
        const opponent = -player;
        let captured = false;
        
        // 提子邏輯
        this.getNeighbors(r, c).forEach(([nr, nc]) => {
            if (board[nr][nc] === opponent && !this.checkLiberty(board, nr, nc)) {
                this.removeGroup(board, nr, nc);
                captured = true;
            }
        });

        // 自殺檢查
        if (!captured && !this.checkLiberty(board, r, c)) return false;
        return true;
    }

    // ✅ 評估函數 (權重系統)
    evaluateMove(board, r, c, player) {
        let score = 0;
        const opponent = -player;

        // 1. 星位與天元加分 (開局佈局)
        const starPoints = ["2,2", "2,6", "4,4", "6,2", "6,6"];
        if (starPoints.includes(`${r},${c}`)) score += 10;

        // 2. 邊角優勢 (金角銀邊)
        if (r >= 2 && r <= 6 && c >= 2 && c <= 6) score += 4;
        if (r === 0 || r === 8 || c === 0 || c === 8) score -= 2; // 一線通常價值低

        // 3. 氣數安全性 (避免被吃)
        let liberties = this.countLiberties(board, r, c);
        score += liberties * 2;

        // 4. 攻擊性 (貼著對手下)
        let contact = false;
        this.getNeighbors(r, c).forEach(([nr, nc]) => {
            if (this.board[nr][nc] === opponent) contact = true;
        });
        if (contact) score += 5;

        // 5. 隨機擾動 (讓 AI 不會太死板)
        score += Math.random() * 2;

        return score;
    }

    countLiberties(board, r, c) {
        const visited = new Set();
        const stack = [[r, c]];
        const libSet = new Set();
        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            const key = `${currR},${currC}`;
            if (visited.has(key)) continue;
            visited.add(key);
            this.getNeighbors(currR, currC).forEach(([nr, nc]) => {
                if (board[nr][nc] === 0) libSet.add(`${nr},${nc}`);
                else if (board[nr][nc] === board[r][c]) stack.push([nr, nc]);
            });
        }
        return libSet.size;
    }

    endGame() {
        this.gameOver = true;
        let blackPoints = 0;
        let whitePoints = 0;
        const visited = Array(9).fill().map(() => Array(9).fill(false));

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] === 1) blackPoints++;
                else if (this.board[r][c] === -1) whitePoints++;
                else if (!visited[r][c]) {
                    const area = this.calculateArea(r, c, visited);
                    if (area.owner === 1) blackPoints += area.size;
                    if (area.owner === -1) whitePoints += area.size;
                }
            }
        }

        const winner = blackPoints > 40.5 ? "🖤 黑棋勝" : "⚪ 白棋勝";
        const statusEl = document.getElementById('status');
        statusEl.innerHTML = `終局決算：黑 ${blackPoints} vs 白 ${whitePoints}<br>${winner}`;
        statusEl.classList.add('game-over');
    }

    calculateArea(r, c, globalVisited) {
        const stack = [[r, c]];
        const cells = [];
        let touchesBlack = false;
        let touchesWhite = false;

        while (stack.length > 0) {
            const [currR, currC] = stack.pop();
            if (globalVisited[currR][currC] || this.board[currR][currC] !== 0) continue;
            globalVisited[currR][currC] = true;
            cells.push([currR, currC]);

            this.getNeighbors(currR, currC).forEach(([nr, nc]) => {
                if (this.board[nr][nc] === 1) touchesBlack = true;
                else if (this.board[nr][nc] === -1) touchesWhite = true;
                else if (!globalVisited[nr][nc]) stack.push([nr, nc]);
            });
        }

        let owner = 0;
        if (touchesBlack && !touchesWhite) owner = 1;
        if (touchesWhite && !touchesBlack) owner = -1;
        return { size: cells.length, owner };
    }

    render() {
        const boardEl = document.getElementById('board');
        // 清除舊棋子與氣數標記
        document.querySelectorAll('.stone, .liberty-badge').forEach(s => s.remove());

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] !== 0) {
                    const cell = boardEl.children[r * 9 + c];
                    
                    // 建立棋子
                    const stone = document.createElement('div');
                    stone.className = `stone ${this.board[r][c] === 1 ? 'black' : 'white'}`;
                    cell.appendChild(stone);

                    // 計算並顯示氣數 (活棋範圍顯示)
                    const libs = this.countLiberties(this.board, r, c);
                    const badge = document.createElement('span');
                    badge.className = 'liberty-badge';
                    badge.innerText = libs;
                    if (libs === 1) badge.classList.add('atari-warning'); // 叫吃警告視覺
                    cell.appendChild(badge);
                }
            }
        }
        
        // 更新狀態文字與叫吃警告
        this.updateStatusAndCheckAtari();
    }
    // 新增：偵測是否有棋子處於「叫吃」狀態並警告
    updateStatusAndCheckAtari() {
        let atariCount = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (this.board[r][c] !== 0 && this.countLiberties(this.board, r, c) === 1) {
                    atariCount++;
                }
            }
        }

        const statusEl = document.getElementById('status');
        let turnText = this.currentPlayer === 1 ? "🖤 黑棋回合" : "⚪ 白棋(AI)回合";
        if (atariCount > 0 && !this.gameOver) {
            turnText += ` <span style="color: #ff4757; font-weight: bold;">⚠️ 叫吃中！</span>`;
        }
        statusEl.innerHTML = turnText;
    }

    undoMove() {
        // 悔棋需要回退兩步 (如果是跟AI下)，或者一步(如果是雙人)
        // 這裡設定回退到上一個玩家回合
        if (this.history.length >= 2 && !this.gameOver) {
            // 回退兩步 (因為 AI 馬上下了)
            this.history.pop(); // AI 的紀錄
            const prevState = this.history.pop(); // 玩家的紀錄
            this.board = JSON.parse(prevState); // 回到玩家下之前的狀態?
            // 修正邏輯：悔棋應該回到 "玩家下這手之前"
            // 目前 history 存的是 "下完後的狀態"
            // 所以要拿出 倒數第3個狀態 才是 玩家下之前的狀態
            // 簡單處理：直接重置遊戲或只支援單步悔棋會比較簡單，這裡做簡單的單步狀態回溯
            
            // 實際上，如果 history 存的是 [State1, State2(AI)]
            // 我們要把 board 變回 State0 (未在 history 中) 或是重做...
            // 為了簡單，這裡實作「重新載入」或簡單的 board 回復
             if (this.history.length > 0) {
                 this.board = JSON.parse(this.history[this.history.length-1]);
             } else {
                 this.board = Array(9).fill().map(() => Array(9).fill(0));
             }
             this.currentPlayer = 1;
             this.consecutivePasses = 0;
             this.render();
        } else if (this.history.length === 1) {
             this.board = Array(9).fill().map(() => Array(9).fill(0));
             this.history = [];
             this.currentPlayer = 1;
             this.render();
        }
    }
}

let game;
function newGame() { game = new NineBoardGo(); }
function toggleAI() {
    game.aiEnabled = !game.aiEnabled;
    document.getElementById('aiToggleBtn').innerText = `AI: ${game.aiEnabled ? '開' : '關'}`;
}
window.onload = newGame;