/**
 * シンプル・テトリス - JavaScript
 * 
 * 1. 盤面データ構造の設計
 * 2. テトリミノの定義
 * 3. 衝突判定ロジック
 * 4. ライン消去ロジック
 * 5. 描画処理
 * 6. 入力処理
 * 7. ゲームループ
 */

// DOMContentLoadedイベントで、HTMLが完全に読み込まれてからゲームを初期化
document.addEventListener('DOMContentLoaded', function() {
    // DOM要素を取得
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const gameOverElement = document.getElementById('game-over');
    const restartBtn = document.getElementById('restart-btn');

    // キャンバスの拡大
    context.scale(20, 20);

    // テトリミノの形状定義
    function createPiece(type) {
        if (type === 'I') {
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        } else if (type === 'L') {
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        } else if (type === 'J') {
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        } else if (type === 'O') {
            return [
                [4, 4],
                [4, 4],
            ];
        } else if (type === 'Z') {
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        } else if (type === 'S') {
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        } else if (type === 'T') {
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
        }
    }

    // テトリミノの色
    const colors = [
        null,
        '#FF0D72',
        '#0DC2FF',
        '#0DFF72',
        '#F538FF',
        '#FF8E0D',
        '#FFE138',
        '#3877FF',
    ];

    // 盤面（アリーナ）の作成 (12x20)
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    // 衝突判定
    function collide(arena, player) {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                   (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    // 盤面にテトリミノを固定
    function merge(arena, player) {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }

    // ライン消去とスコア加算
    function arenaSweep() {
        let rowCount = 1;
        outer: for (let y = arena.length - 1; y > 0; --y) {
            for (let x = 0; x < arena[y].length; ++x) {
                if (arena[y][x] === 0) {
                    continue outer;
                }
            }
            const row = arena.splice(y, 1)[0].fill(0);
            arena.unshift(row);
            ++y;

            player.score += rowCount * 100;
            rowCount *= 2; // 複数同時消しボーナス
        }
        updateScore();
    }

    // 回転処理
    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [
                    matrix[x][y],
                    matrix[y][x],
                ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    // 描画処理
    function draw() {
        // 背景のクリア
        context.fillStyle = '#000';
        context.fillRect(0, 0, canvas.width / 20, canvas.height / 20);

        drawMatrix(arena, {x: 0, y: 0});
        drawMatrix(player.matrix, player.pos);
    }

    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    context.fillStyle = colors[value];
                    context.fillRect(x + offset.x,
                                     y + offset.y,
                                     1, 1);
                }
            });
        });
    }

    // プレイヤーの操作
    function playerDrop() {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }

    function playerMove(dir) {
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    function playerRotate(dir) {
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    // 次のテトリミノを生成
    function playerReset() {
        const pieces = 'ILJOTSZ';
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.pos.y = 0;
        player.pos.x = (arena[0].length / 2 | 0) -
                       (player.matrix[0].length / 2 | 0);
        
        // ゲームオーバー判定
        if (collide(arena, player)) {
            arena.forEach(row => row.fill(0));
            player.score = 0;
            updateScore();
            gameOver();
        }
    }

    function updateScore() {
        scoreElement.innerText = player.score;
    }

    function gameOver() {
        gameOverElement.classList.remove('hidden');
        isPaused = true;
    }

    // ゲームループ
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let isPaused = false;

    function update(time = 0) {
        if (isPaused) return;

        const deltaTime = time - lastTime;
        lastTime = time;

        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }

        draw();
        requestAnimationFrame(update);
    }

    // 初期化
    const arena = createMatrix(12, 20);

    const player = {
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0,
    };

    // キーボード入力（デフォルト挙動を抑制）
    document.addEventListener('keydown', event => {
        if (isPaused) return;
        
        if (event.keyCode === 37) { // Left
            event.preventDefault();
            playerMove(-1);
        } else if (event.keyCode === 39) { // Right
            event.preventDefault();
            playerMove(1);
        } else if (event.keyCode === 40) { // Down
            event.preventDefault();
            playerDrop();
        } else if (event.keyCode === 38) { // Up
            event.preventDefault();
            playerRotate(1);
        }
    });

    // リスタートボタン
    restartBtn.addEventListener('click', () => {
        gameOverElement.classList.add('hidden');
        isPaused = false;
        playerReset();
        update();
    });

    // ゲーム開始
    playerReset();
    updateScore();
    update();
});
