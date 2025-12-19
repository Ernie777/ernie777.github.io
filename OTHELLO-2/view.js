const board = document.getElementById('board');
let white = parseInt(document.getElementById('white-score').innerHTML );
let black = parseInt(document.getElementById('black-score').innerHTML );


let color = [
    [0,0,0 ,0, 0,0,0,0],
    [0,0,0, 0, 0,0,0,0],
    [0,0,0 ,0, 0,0,0,0],
    [0,0,0, 1,-1,0,0,0],
    [0,0,0,-1, 1,0,0,0],
    [0,0,0, 0, 0,0,0,0],
    [0,0,0, 0, 0,0,0,0],
    [0,0,0, 0, 0,0,0,0]
];

let OK =[
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
    [false,false,false,false,false,false,false,false],
]



let state = 1;

function initializeBoard() {
    for (let i = 0; i < 8; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div');
            const flag = document.createElement('div');
            flag.className = 'flag';
            cell.className = 'cell';
            if (i == 3 && j == 3) {
                flag.className += ' black';
            }
            if (i == 3 && j == 4) {
                flag.className += ' white';
            }
            if (i == 4 && j == 3) {
                flag.className += ' white';
            }
            if (i == 4 && j == 4) {
                flag.className += ' black';
            }
            cell.dataset.row = i;
            cell.dataset.col = j;

            cell.addEventListener('click', handleCellClick);
            cell.appendChild(flag);
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}


let isAnimating = false; // 新增：鎖定狀態標記

function handleCellClick(event) {
    // 如果正在動畫中，或者現在不是玩家回合（輪到電腦時），禁止點擊
    const mode = document.getElementById('game-mode').value;
    if (isAnimating) return; 
    if (mode !== 'pvp' && state === -1) return; 

    let clickedCell = event.currentTarget.querySelector('.flag');
    let x = parseInt(event.currentTarget.dataset.row);
    let y = parseInt(event.currentTarget.dataset.col);

    if (clickedCell.classList.contains('info')) {
        put(x, y);
    }
}

// 修改原有的 put 函式最後呼叫 checkAI
function put(x, y) {
    isAnimating = true; // 下子瞬間立刻鎖定，防止連續點擊
    
    // 放置棋子
    const cellFlag = queryBoard(x, y).querySelector('.flag');
    cellFlag.classList.remove('black', 'white');
    cellFlag.classList.add(state === 1 ? 'black' : 'white');
    color[x][y] = state;

    // 取得翻轉最長延遲時間，用來解鎖
    let maxDelay = directionReverse(x, y); 
    
    removeInfo();
    changeState();
    
    // 在所有動畫結束後，才執行後續邏輯
    setTimeout(() => {
        OKdetect(0);
        updateBoard();
        isAnimating = false; // 解鎖，允許下一手
        
        // 檢查是否輪到 AI
        const mode = document.getElementById('game-mode').value;
        if (mode !== 'pvp' && state === -1) {
            checkAI();
        }
    }, maxDelay + 200); // 緩衝 200ms 確保視覺流暢
}

function changeState(){
    state *= -1;
    let style = document.querySelector('style');
    if (state==1){
        style.innerHTML = ".cell:hover {.flag.info{background-color: rgba(0, 0, 0, 0.13);}";
    }
    else if (state==-1){
        style.innerHTML = ".cell:hover {.flag.info{background-color: rgba(235, 235, 235, 0.13);border: 1px solid rgba(0, 0, 0, 0.13); }";
    }
}
function removeInfo(){
    let info = board.querySelectorAll('.info');
    info.forEach(element => {
        element.classList.remove('info');
    });
    for (let i = 0; i < 8; i++  ){
        for (let j = 0; j <8; j++ ){
            OK[i][j] = false;
        }
    }
}


function inBoard(x,y){  //return true if the board is not ouy of range
    return x >= 0 && y >= 0 && x < 8 && y < 8;
}


function canPut(x,y){ // returns true if canPut
    return (
        checkDirection(x, y, -1, -1) ||
        checkDirection(x, y, -1,  0) ||
        checkDirection(x, y, -1,  1) ||
        checkDirection(x, y,  0, -1) ||
        checkDirection(x, y,  0,  1) ||
        checkDirection(x, y,  1, -1) ||
        checkDirection(x, y,  1,  0) ||
        checkDirection(x, y,  1,  1)
    );
}

function checkDirection(x,y,dx,dy){ // check this direction can be put or not
    let x1, y1;
    let flag = false;
    x1 = x + dx;
    y1 = y + dy;
    while( inBoard(x1, y1) && color[x1][y1] !== state && color[x1][y1] !== 0 ) {
        x1 += dx;
        y1 += dy;
        flag = true;
    }
    if (flag && inBoard(x1, y1) && color[x1][y1] === state){
        return true;
    }
    return false;
}

function OKdetect(x){
    let flag = false;
    for (i = 0; i <8;i++){
        for (j=0;j<8;j++){
            if (color[i][j] === 0 && canPut(i,j)){
                OK[i][j] = true;
                flag = true;
            }
        }
    }
    if (!flag){
        if (x==1){
            alert('Game end');
            gameEnd();
            return;
        }
        alert('Change to other color!!!!');
        state *= -1;
        if (state === -1) checkAI();
        OKdetect(x+1);
        updateBoard();
    }
}
function gameEnd(){
    if (white>black){
        alert('White Win');
        document.querySelector('.title').innerHTML = "White Win";
        document.querySelector('.title').setAttribute("style", "color:red;");
    }
    else if (white<black){
        alert('Black Win');
        document.querySelector('.title').innerHTML = "Black Win";
        document.querySelector('.title').setAttribute("style", "color:red;");
    }
    else if (white===black){
        alert('Draw');
        document.querySelector('.title').innerHTML = "Draw";
        document.querySelector('.title').setAttribute("style", "color:red;");
    }
}
function queryBoard(x,y){
    let row = board.querySelectorAll('.row');
    let col = row[x].querySelectorAll('.cell')[y];
    return col;
}


function updateBoard(x,y){
    for (i = 0; i <8;i++){
        for (j=0;j<8;j++){
            if (OK[i][j]){
               let cell = queryBoard(i,j).querySelector('.flag');
               cell.classList.add('info');
            }
        }
    }
    score();
}

function directionReverse(x, y) {
    let totalMaxDelay = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            if (checkDirection(x, y, dx, dy)) {
                let delay = reverse(x, y, dx, dy);
                if (delay > totalMaxDelay) totalMaxDelay = delay;
            }
        }
    }
    return totalMaxDelay;
}

function score(){
    black = 0;
    white = 0; 
    for(var i=0;i<8 ; i++){
        for (var j=0;j<8 ; j++){
            if(color[i][j]==1){
                black++;
            }
            else if (color[i][j]==-1){
                white++;
            }
        }
    }
    document.getElementById('white-score').innerHTML = white;
    document.getElementById('black-score').innerHTML = black;
}

function reverse(x, y, dx, dy) {
    let x1 = x + dx;
    let y1 = y + dy;
    while (inBoard(x1, y1) && color[x1][y1] !== state && color[x1][y1] !== 0) {
        x1 += dx;
        y1 += dy;
    }

    let delayCount = 1;
    const targetColor = state;
    const stepDelay = 350; // 每顆翻轉間隔時間

    if (inBoard(x1, y1) && color[x1][y1] === state) {
        let rx = x + dx;
        let ry = y + dy;
        while (rx !== x1 || ry !== y1) {
            const tx = rx;
            const ty = ry;
            const finalDelay = delayCount * stepDelay;

            color[tx][ty] = targetColor;
            setTimeout(() => {
                const cellFlag = queryBoard(tx, ty).querySelector('.flag');
                cellFlag.classList.remove('black', 'white');
                cellFlag.classList.add(targetColor === 1 ? 'black' : 'white');
                score();
            }, finalDelay);

            rx += dx;
            ry += dy;
            delayCount++;
        }
    }
    return delayCount * stepDelay; // 回傳這條路徑總共花了多少時間
}

function reverseColor(x, y){
    //alert(`reverse, ${x}, ${y}`);
    //color[x][y] *= -1;
    queryBoard(x, y).querySelector('.flag').classList.toggle('black');
    queryBoard(x, y).querySelector('.flag').classList.toggle('white');
}

// 權重表：角落(100), 邊緣(10), 角落鄰近區(-20)
const weights = [
    [100, -20, 10,  5,  5, 10, -20, 100],
    [-20, -40,  1,  1,  1,  1, -40, -20],
    [ 10,   1,  5,  2,  2,  5,   1,  10],
    [  5,   1,  2,  1,  1,  2,   1,   5],
    [  5,   1,  2,  1,  1,  2,   1,   5],
    [ 10,   1,  5,  2,  2,  5,   1,  10],
    [-20, -40,  1,  1,  1,  1, -40, -20],
    [100, -20, 10,  5,  5, 10, -20, 100]
];

function checkAI() {
    const mode = document.getElementById('game-mode').value;
    if (mode === 'pvp' || state === 1) return; // 玩家對戰或輪到玩家時不動作

    let moves = [];
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (OK[i][j]) moves.push({x: i, y: j});
        }
    }

    if (moves.length === 0) return;

    let target;
    if (mode === 'easy') {
        target = moves[Math.floor(Math.random() * moves.length)];
    } else {
        target = moves.reduce((prev, curr) => 
            weights[curr.x][curr.y] > weights[prev.x][prev.y] ? curr : prev
        );
    }

    // 電腦思考 1.2 秒後下棋
    setTimeout(() => put(target.x, target.y), 1000);
}
function resetGame() {
    const boardEl = document.getElementById('board');
    boardEl.classList.remove('resetting');
    void boardEl.offsetWidth; // 強制重繪觸發動畫
    boardEl.classList.add('resetting');
    // 1. 如果正在動畫中，禁止重設（或強制停止動畫）
    isAnimating = false; 

    // 2. 重設棋盤數值陣列
    color = [
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,1,-1,0,0,0],
        [0,0,0,-1,1,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0]
    ];

    // 3. 重設玩家狀態
    state = 1;

    // 4. 清除畫面上所有棋子的樣式
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cellFlag = queryBoard(i, j).querySelector('.flag');
            cellFlag.classList.remove('black', 'white', 'info');
            
            // 根據初始數值重新上色
            if (color[i][j] === 1) cellFlag.classList.add('black');
            if (color[i][j] === -1) cellFlag.classList.add('white');
        }
    }

    // 5. 更新分數與提示點
    score();
    OKdetect(0);
    updateBoard();
    
    console.log("遊戲已重設");
}

// Call the initialization function
initializeBoard();
OKdetect(0);
updateBoard();

