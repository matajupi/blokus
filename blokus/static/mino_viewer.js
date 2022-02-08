"use strict";

class MinoViewer extends Colleague {
    static get VIEWER_ROWS() { return 7; }
    static get VIEWER_COLS() { return 7; }

    get currentMino() {
        if (this.minos.length === 0)
            return null;
        return this.minos[this.currentMinoIndex];
    }

    constructor(baseCanvas, advanceButton, backButton, rotateButton, flipButton) {
        super();
        this.baseCanvas = baseCanvas;
        this.height = baseCanvas.height;
        this.width = baseCanvas.width;
        this.cellHeight = this.height / MinoViewer.VIEWER_ROWS;
        this.cellWidth = this.width / MinoViewer.VIEWER_COLS;
        // TODO: Add Event Listeners

        this.advanceButton = advanceButton;
        this.backButton = backButton;
        this.rotateButton = rotateButton;
        this.flipButton = flipButton;

        this.advanceButton.addEventListener("click", () => { this.advance(); }, false);
        this.backButton.addEventListener("click", () => { this.back(); }, false);
        this.rotateButton.addEventListener("click", () => { this.rotate(); }, false);
        this.flipButton.addEventListener("click", () => { this.flip(); }, false);

        this.currentMinoIndex = 0;
        this.minos = [];
        this.fieldCreated = false;
        this.minoUpdated = false;

        // Construct Layers
        this.fieldCanvas = document.createElement("canvas");
        // 直接メンバに値を入れるとうまく反映されないときがあった
        this.fieldCanvas.setAttribute("height", this.height);
        this.fieldCanvas.setAttribute("width", this.width);

        this.minoCanvas = document.createElement("canvas");
        this.minoCanvas.setAttribute("height", this.height);
        this.minoCanvas.setAttribute("width", this.width);

        this.draw();
    }

    draw() {
        this.baseCanvas.getContext("2d").clearRect(0, 0, this.width, this.height);
        this.drawField();
        this.drawMino();
    }

    drawField() {
        if (!this.fieldCreated) {
            this.createField();
            this.fieldCreated = true;
        }
        this.baseCanvas.getContext("2d").drawImage(this.fieldCanvas, 0, 0, this.width, this.height);
    }

    createField() {
        const context = this.fieldCanvas.getContext("2d");
        context.clearRect(0, 0, this.width, this.height);
        for (let row = 0; MinoViewer.VIEWER_ROWS > row; row++) {
            for (let col = 0; MinoViewer.VIEWER_COLS > col; col++) {
                context.beginPath();
                context.strokeStyle = Game.CELL_LINE_STYLE;
                context.strokeRect(this.cellWidth * col, this.cellHeight * row, this.cellWidth, this.cellHeight);
            }
        }
        context.beginPath();
        context.lineWidth = Game.OUTLINE_WIDTH;
        context.strokeStyle = Game.CELL_LINE_STYLE;
        context.strokeRect(0, 0, this.width, this.height);
    }

    drawMino() {
        if (this.minoUpdated) {
            this.createMino(() => {
                this.baseCanvas.getContext("2d").drawImage(this.minoCanvas, 0, 0, this.width, this.height);
            });
            this.minoUpdated = false;
            return;
        }
        this.baseCanvas.getContext("2d").drawImage(this.minoCanvas, 0, 0, this.width, this.height);
    }

    createMino(onload=null) {
        if (this.minos.length === 0)
            return;
        const context = this.minoCanvas.getContext("2d");
        context.clearRect(0, 0, this.width, this.height);

        const currentMino = this.minos[this.currentMinoIndex];
        currentMino.drawFromMatrixSize(context, 0, 0, this.cellWidth, this.cellHeight, MinoViewer.VIEWER_ROWS, MinoViewer.VIEWER_COLS, onload);
    }

    advance() {
        if (this.minos.length === 0)
            return;
        this.currentMinoIndex = (this.currentMinoIndex + 1) % this.minos.length;
        this.minoUpdated = true;
        this.draw();
    }

    back() {
        if (this.minos.length === 0)
            return;
        this.currentMinoIndex = (this.currentMinoIndex + this.minos.length - 1) % this.minos.length;
        this.minoUpdated = true;
        this.draw();
    }

    rotate(right=false) {
        if (this.minos.length === 0)
            return;
        this.minos[this.currentMinoIndex].rotate(right);
        this.minoUpdated = true;
        this.draw();
    }

    flip() {
        if (this.minos.length === 0)
            return;
        this.minos[this.currentMinoIndex].flip();
        this.minoUpdated = true;
        this.draw();
    }

    setMinos(minos) {
        this.minos = [...minos];
        this.minoUpdated = true;
        this.draw();
    }

    removeMinoById(id) {
        let removeMinoIndex = -1;
        for (let i = 0; this.minos.length > i; i++) {
            if (this.minos[i].id === id)
                removeMinoIndex = i;
        }
        if (removeMinoIndex >= 0)
            this.minos.splice(removeMinoIndex, 1);
        this.currentMinoIndex %= this.minos.length;
        this.minoUpdated = true;
        this.draw();
    }
}

// (function(global) {
//     "use strict"
//
//     // Class
//     function MinoViewer() { }
//
//     // Headers
//     global.MinoViewer = MinoViewer;
//     global.MinoViewer.init = init;
//     global.MinoViewer.draw = draw;
//     global.MinoViewer.advance = advance;
//     global.MinoViewer.back = back;
//     global.MinoViewer.rotate = rotate;
//     global.MinoViewer.flip = flip;
//     global.MinoViewer.removeMino = removeMino;
//
//     // Readonly numbers
//     let HEIGHT;
//     let WIDTH;
//
//     let CELL_HEIGHT;
//     let CELL_WIDTH;
//
//     // Members
//     let baseCanvas;
//     let fieldCanvas;
//     let isFieldCreated = false;
//     let minoCanvas;
//     let ownMinos;
//     let currentMinoIndex = 0;
//
//     function init(_baseCanvas) {
//         baseCanvas = _baseCanvas;
//         ownMinos = [...Game.playerMinos];
//
//         HEIGHT = baseCanvas.height;
//         WIDTH = baseCanvas.width;
//
//         CELL_HEIGHT = HEIGHT / VIEWER_ROWS;
//         CELL_WIDTH = WIDTH / VIEWER_COLS;
//
//         fieldCanvas = document.createElement("canvas");
//         fieldCanvas.width = WIDTH;
//         fieldCanvas.height = HEIGHT;
//
//         minoCanvas = document.createElement("canvas");
//         minoCanvas.width = WIDTH;
//         minoCanvas.height = HEIGHT;
//
//         draw();
//
//         // EventListeners
//         baseCanvas.addEventListener("click", onClick, false);
//     }
//
//     function draw() {
//         baseCanvas.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
//         drawField();
//         drawMino();
//         resetCapturedMinoInfo();
//     }
//
//     function drawField() {
//         if (!isFieldCreated) {
//             createField(fieldCanvas.getContext("2d"));
//             isFieldCreated = true;
//         }
//         baseCanvas.getContext("2d").drawImage(fieldCanvas, 0, 0,
//             WIDTH, HEIGHT);
//     }
//
//     function createField(context) {
//         for (let row = 0; VIEWER_ROWS > row; row++) {
//             for (let col = 0; VIEWER_COLS > col; col++) {
//                 context.beginPath();
//                 context.strokeStyle = CELL_LINE_STYLE;
//                 context.strokeRect(CELL_WIDTH * col, CELL_HEIGHT * row,
//                     CELL_WIDTH, CELL_HEIGHT);
//             }
//         }
//         context.beginPath();
//         context.lineWidth = OUTLINE_WIDTH;
//         context.strokeStyle = CELL_LINE_STYLE;
//         context.strokeRect(0, 0, WIDTH, HEIGHT);
//     }
//
//     function drawMino() {
//         if (ownMinos.length === 0)
//             return;
//         let context = minoCanvas.getContext("2d");
//         context.clearRect(0, 0, WIDTH, HEIGHT);
//
//         const currentMino = ownMinos[currentMinoIndex];
//         const row = Math.floor((VIEWER_ROWS - currentMino.rows) / 2);
//         const col = Math.floor((VIEWER_COLS - currentMino.cols) / 2);
//         currentMino.draw(context, row, col, CELL_WIDTH, CELL_HEIGHT, () => {
//             baseCanvas.getContext("2d")
//                 .drawImage(minoCanvas, 0, 0, WIDTH, HEIGHT);
//         });
//     }
//
//     function advance() {
//         if (ownMinos.length === 0)
//             return;
//         currentMinoIndex = (currentMinoIndex + 1) % ownMinos.length;
//         draw();
//     }
//
//     function back() {
//         if (ownMinos.length === 0)
//             return;
//         currentMinoIndex = (currentMinoIndex - 1 + ownMinos.length)
//             % ownMinos.length;
//         draw();
//     }
//
//     function rotate() {
//         if (ownMinos.length === 0)
//             return;
//         ownMinos[currentMinoIndex].rotate();
//         draw();
//     }
//
//     // rotateが90°か270°の時にFlipがhorizontallyではなくverticallyになってしまう
//     // これはバグではなく仕様だ!!(直すの面倒だから無理やり)
//     // TODO: いつか気が向けば直す
//     function flip() {
//         if (ownMinos.length === 0)
//             return;
//         ownMinos[currentMinoIndex].flip();
//         draw();
//     }
//
//     function onClick(event) {
//         if (ownMinos.length === 0) {
//             Game.capturedMinoInfo.captured = false;
//             return;
//         }
//         const x = event.clientX - baseCanvas.offsetLeft;
//         const y = event.clientY - baseCanvas.offsetTop;
//         const mino = ownMinos[currentMinoIndex];
//         Game.capturedMinoInfo.captured = true;
//         Game.capturedMinoInfo.mino = mino;
//         // ここで一回drawをcallするのは、前回にboardでminoをdrawした場合
//         // minoがposX, posYを引きずってdiffX, diffYがおかしな値になるから
//         draw();
//         Game.capturedMinoInfo.diffX = x - mino.posX;
//         Game.capturedMinoInfo.diffY = y - mino.posY;
//     }
//
//     function resetCapturedMinoInfo() {
//         if (ownMinos.length === 0) {
//             Game.capturedMinoInfo.captured = false;
//             return;
//         }
//         const mino = ownMinos[currentMinoIndex];
//         Game.capturedMinoInfo.captured = true;
//         Game.capturedMinoInfo.mino = mino;
//         // 偶数個のrotateなどの関係で少し中点とはずれるがだいたい中点
//         // このことが後で大きな問題を引き起こすとはこのとき考えもしていなかった
//         Game.capturedMinoInfo.diffX = CELL_WIDTH * mino.cols / 2;
//         Game.capturedMinoInfo.diffY = CELL_HEIGHT * mino.rows / 2;
//     }
//
//     function removeMino(mino) {
//         ownMinos = ownMinos.filter((x) => { return x !== mino; });
//         currentMinoIndex %= ownMinos.length;
//         draw();
//     }
// })((this || 0).self || global);