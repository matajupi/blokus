"use strict";

class Board extends Colleague {
    // Magic numbers
    static get FILTER_TRANSMITTANCE() { return 0.3; }
    static get BOARD_ROWS() { return 20; }
    static get BOARD_COLS() { return 20; }

    get enabled() { return this.isEnabled; }

    constructor(baseCanvas, filterSrc) {
        super();
        this.baseCanvas = baseCanvas;
        this.height = baseCanvas.height;
        this.width = baseCanvas.width;
        this.cellHeight = this.height / Board.BOARD_ROWS;
        this.cellWidth = this.width / Board.BOARD_COLS;

        this.baseCanvas.addEventListener("mousemove", (event) => { this.onMouseMove(event); }, false);
        this.baseCanvas.addEventListener("mouseout", (event) => { this.onMouseOut(event); }, false);
        this.baseCanvas.addEventListener("click", (event) => { this.onClick(event); }, false);

        this.filterSrc = filterSrc;
        this.fieldCreated = false;
        this.minosUpdated = false;
        this.filterCreated = false;
        this.existsCapturedMino = false;
        this.capturedMinoInfo = {"mino": null, "x": -1, "y": -1};
        this.placedMinosInfo = [];
        this.message = {"imageSrc": null, "x": 0, "y": 0, "magnification": 1};
        this.messageEmpty = true;

        // Construct layers
        this.fieldCanvas = document.createElement("canvas");
        this.fieldCanvas.setAttribute("height", this.height);
        this.fieldCanvas.setAttribute("width", this.width);

        this.minosCanvas = document.createElement("canvas");
        this.minosCanvas.setAttribute("height", this.height);
        this.minosCanvas.setAttribute("width", this.width);

        this.filterCanvas = document.createElement("canvas");
        this.filterCanvas.setAttribute("height", this.height);
        this.filterCanvas.setAttribute("width", this.width);

        this.messageCanvas = document.createElement("canvas");
        this.messageCanvas.setAttribute("height", this.height);
        this.messageCanvas.setAttribute("width", this.width);

        this.capturedMinoCanvas = document.createElement("canvas");
        this.capturedMinoCanvas.setAttribute("height", this.height);
        this.capturedMinoCanvas.setAttribute("width", this.width);

        this.setEnabled(false);
        this.draw();
    }

    setEnabled(value) {
        this.isEnabled = value;
        this.draw();
    }

    draw() {
        this.baseCanvas.getContext("2d").clearRect(0, 0, this.width, this.height);
        this.drawField();
        this.drawMinos();
        this.drawFilter();
        this.drawMessage();
        this.drawCapturedMino();
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
        for (let row = 0; Board.BOARD_ROWS > row; row++) {
            for (let col = 0; Board.BOARD_COLS > col; col++) {
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

    drawMinos() {
        if (this.minosUpdated) {
            this.createMinos(() => {
                this.baseCanvas.getContext("2d").drawImage(this.minosCanvas, 0, 0, this.width, this.height);
            });
            this.minosUpdated = false;
            return;
        }
        this.baseCanvas.getContext("2d").drawImage(this.minosCanvas, 0, 0, this.width, this.height);
    }

    createMinos(onload=null) {
        const context = this.minosCanvas.getContext("2d");
        context.clearRect(0, 0, this.width, this.height);

        let drawMinoCounter = 0;
        for (let i = 0; this.placedMinosInfo.length > i; i++) {
            const placedMinoInfo = this.placedMinosInfo[i];
            const mino = placedMinoInfo.mino;
            const row = placedMinoInfo.row;
            const col = placedMinoInfo.col;
            mino.draw(context, col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight, () => {
                if (++drawMinoCounter === this.placedMinosInfo.length && onload)
                    onload();
            });
        }
    }

    placeMino(mino, row, col) {
        this.placedMinosInfo.push({"mino": mino, "row": row, "col": col});
        this.minosUpdated = true;
        this.draw();
    }

    drawFilter() {
        if (this.isEnabled)
            return;
        if (!this.filterCreated) {
            this.createFilter(() => {
                this.baseCanvas.getContext("2d").drawImage(this.filterCanvas, 0, 0, this.width, this.height);
            });
            this.filterCreated = true;
            return;
        }
        this.baseCanvas.getContext("2d").drawImage(this.filterCanvas, 0, 0, this.width, this.height);
    }

    createFilter(onLoad=null) {
        const context = this.filterCanvas.getContext("2d");
        context.clearRect(0, 0, this.width, this.height);
        context.globalAlpha = Board.FILTER_TRANSMITTANCE;
        const image = new Image();
        image.src = this.filterSrc;
        image.addEventListener("load", () => {
           context.drawImage(image, 0, 0, this.width, this.height);
           if (onLoad)
               onLoad();
        }, false);
    }

    drawMessage() {
        if (this.isEnabled || this.messageEmpty)
            return;
        const context = this.messageCanvas.getContext("2d");
        context.clearRect(0, 0, this.width, this.height);

        const image = new Image();
        image.src = this.message.imageSrc;
        image.addEventListener("load", () => {
            const magnification = this.message.magnification;
            const imageWidth = image.width * magnification;
            const imageHeight = image.height * magnification;
            context.drawImage(image, this.message.x, this.message.y, imageWidth, imageHeight);

            this.baseCanvas.getContext("2d").drawImage(this.messageCanvas, 0, 0, this.width, this.height);
        }, false);
    }

    setMessage(message) {
        this.message = message;
        this.messageEmpty = false;
        this.draw();
    }

    clearMessage() {
        this.messageEmpty = true;
        this.draw();
    }

    drawCapturedMino() {
        if (!(this.isEnabled && this.existsCapturedMino))
            return;
        const context = this.capturedMinoCanvas.getContext("2d");
        context.clearRect(0, 0, this.width, this.height);

        const mino = this.capturedMinoInfo.mino;
        const x = this.capturedMinoInfo.x;
        const y = this.capturedMinoInfo.y;
        mino.draw(context, x, y, this.cellWidth, this.cellHeight, () => {
            this.baseCanvas.getContext("2d").drawImage(this.capturedMinoCanvas, 0, 0, this.width, this.height);
        });
    }

    onMouseMove(event) {
        this.mediator.colleagueChanged({
           "type": "mouseMoveBoard",
            "x": event.clientX - this.baseCanvas.offsetLeft,
            "y": event.clientY - this.baseCanvas.offsetTop,
        });
    }

    setCapturedMinoInfo(mino, x, y) {
        this.capturedMinoInfo.mino = mino;
        this.capturedMinoInfo.x = x;
        this.capturedMinoInfo.y = y;
        this.existsCapturedMino = true;
        if (this.enabled)
            this.draw();
    }

    onMouseOut(_) {
        this.existsCapturedMino = false;
        this.draw();
    }

    onClick(event) {
        const x = event.clientX - this.baseCanvas.offsetLeft;
        const y = event.clientY - this.baseCanvas.offsetTop;
        const position = this.adjustPosition(x, y);
        const row = position.row;
        const col = position.col;
        const mino = this.capturedMinoInfo.mino;
        this.mediator.colleagueChanged({
            "type": "clickBoard",
            "mino": mino,
            "row": row,
            "col": col,
        });
    }

    adjustPosition(x, y) {
        const col = Math.round(x / this.cellWidth);
        const row = Math.round(y / this.cellHeight);
        return {"row": row, "col": col};
    }
}

// (function(global) {
//     "use strict"
//     // Class
//     function Board() { }
//
//     // Magic numbers
//
//     // Headers
//     global.Board = Board;
//     global.Board.init = init;
//     global.Board.draw = draw;
//     global.Board.placeMino = placeMino;
//     global.Board.setEnabled = setEnabled;
//     global.Board.drawMessages = drawMessages;
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
//     let minosCanvas;
//     let capturedMinoCanvas;
//     let filterCanvas;
//     let messageCanvas;
//     let placedMinos = [];
//     let isEnabled = true;
//     let loadingMessage;
//     let aiTurnMessage;
//     let thinkingMessage;
//     let skipMessage;
//     let filterSrc;
//
//     function init(_baseCanvas, _filterSrc) {
//         baseCanvas = _baseCanvas;
//         filterSrc = _filterSrc;
//
//         HEIGHT = baseCanvas.height;
//         WIDTH = baseCanvas.width;
//
//         CELL_HEIGHT = HEIGHT / BOARD_ROWS;
//         CELL_WIDTH = WIDTH / BOARD_COLS;
//
//         fieldCanvas = document.createElement("canvas");
//         fieldCanvas.width = WIDTH;
//         fieldCanvas.height = HEIGHT;
//
//         minosCanvas = document.createElement("canvas");
//         minosCanvas.width = WIDTH;
//         minosCanvas.height = HEIGHT;
//
//         capturedMinoCanvas = document.createElement("canvas");
//         capturedMinoCanvas.width = WIDTH;
//         capturedMinoCanvas.height = HEIGHT;
//
//         filterCanvas = document.createElement("canvas");
//         filterCanvas.width = WIDTH;
//         filterCanvas.height = HEIGHT;
//
//         messageCanvas = document.createElement("canvas");
//         messageCanvas.width = WIDTH;
//         messageCanvas.height = HEIGHT;
//
//         // TODO: Message画像より後ろに行くので透過画像に変える
//         loadingMessage = {
//             "message": "Loading...",
//             "font": "100px serif",
//             "style": "rgb(0, 0, 0)",
//             "posX": WIDTH / 2 - CELL_WIDTH * 4,
//             "posY": HEIGHT / 2,
//         };
//
//         aiTurnMessage = {
//             "message": "AI's turn",
//             "font": "80px serif",
//             "style": "rgb(0, 0, 0)",
//             "posX": CELL_WIDTH,
//             "posY": CELL_HEIGHT * 2,
//         };
//
//         thinkingMessage = {
//             "message": "Thinking...",
//             "font": "100px serif",
//             "style": "rgb(0, 0, 0)",
//             "posX": WIDTH / 2 - CELL_WIDTH * 4,
//             "posY": HEIGHT / 2,
//         };
//
//         skipMessage = {
//             "message": "There is no location where you can place mino.",
//             "font": "",
//             "style": "rgb(0, 0, 0)",
//             "posX": 0,
//             "posY": 0,
//         };
//
//         global.Board.loadingMessage = loadingMessage;
//         global.Board.aiTurnMessage = aiTurnMessage;
//         global.Board.thinkingMessage = thinkingMessage;
//         global.Board.skipMessage = skipMessage;
//
//         draw();
//         setEnabled(false);
//
//         // EventListeners
//         baseCanvas.addEventListener("mousemove", onMouseMove, false);
//         baseCanvas.addEventListener("mouseout", onMouseOut, false);
//         baseCanvas.addEventListener("click", onClick, false);
//     }
//
//     // isEnabledがtrueのときのみ有効
//     function draw() {
//         if (!isEnabled)
//             return;
//         baseCanvas.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
//         drawField();
//         drawMinos();
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
//     // 開始して一度だけ実行される
//     function createField(context) {
//         for (let row = 0; BOARD_ROWS > row; row++) {
//             for (let col = 0; BOARD_COLS > col; col++) {
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
//     function drawMinos() {
//         const context = minosCanvas.getContext("2d");
//         context.clearRect(0, 0, WIDTH, HEIGHT);
//
//         let counter = 0;
//         for (let i = 0; placedMinos.length > i; i++) {
//             const placedMino = placedMinos[i];
//             const row = placedMino.row;
//             const col = placedMino.col;
//             const mino = placedMino.mino;
//             mino.draw(context, row, col, CELL_WIDTH, CELL_HEIGHT, () => {
//                 if (++counter === placedMinos.length)
//                     baseCanvas.getContext("2d")
//                         .drawImage(minosCanvas, 0, 0, WIDTH, HEIGHT);
//             });
//         }
//     }
//
//     function placeMino(row, col, mino) {
//         placedMinos.push({"mino": mino, "row": row, "col": col});
//         draw();
//     }
//
//     // isEnabledがtrueのときのみ有効
//     function onMouseMove(event) {
//         if (!(Game.capturedMinoInfo.captured && isEnabled))
//             return;
//         const x = event.clientX - baseCanvas.offsetLeft;
//         const y = event.clientY - baseCanvas.offsetTop;
//         const minoPosX = x - Game.capturedMinoInfo.diffX;
//         const minoPosY = y - Game.capturedMinoInfo.diffY;
//         const mino = Game.capturedMinoInfo.mino;
//
//         let context = capturedMinoCanvas.getContext("2d");
//         context.clearRect(0, 0, WIDTH, HEIGHT);
//
//         draw();
//         mino.drawFromCoordinate(context, minoPosX, minoPosY,
//             CELL_WIDTH, CELL_HEIGHT, () => {
//                 baseCanvas.getContext("2d")
//                     .drawImage(capturedMinoCanvas, 0, 0, WIDTH, HEIGHT);
//         });
//     }
//
//     // isEnabledがtrueのときのみ有効
//     function onMouseOut(_) {
//         if (!isEnabled)
//             return;
//         capturedMinoCanvas.getContext("2d").clearRect(0, 0, WIDTH, HEIGHT);
//         draw();
//     }
//
//     // isEnabledがtrueのときのみ有効
//     function onClick(event) {
//         if (!(Game.capturedMinoInfo.captured && isEnabled))
//             return;
//         const x = event.clientX - baseCanvas.offsetLeft;
//         const y = event.clientY - baseCanvas.offsetTop;
//         const minoPosX = x - Game.capturedMinoInfo.diffX;
//         const minoPosY = y - Game.capturedMinoInfo.diffY;
//         const mino = Game.capturedMinoInfo.mino;
//
//         // adjustした結果minoが外に出てしまう可能性があるという問題はserverに問い合わせて解決
//         const pos = adjustPosition(minoPosX, minoPosY);
//         const minoPosRow = pos.row;
//         const minoPosCol = pos.col;
//
//         const context = capturedMinoCanvas.getContext("2d");
//         context.clearRect(0, 0, WIDTH, HEIGHT);
//
//         draw();
//         mino.draw(context, minoPosRow, minoPosCol, CELL_WIDTH, CELL_HEIGHT,
//             () => {
//                 baseCanvas.getContext("2d")
//                     .drawImage(capturedMinoCanvas, 0, 0, WIDTH, HEIGHT);
//         });
//
//         setEnabled(false);
//         drawMessages([loadingMessage]);
// console.log(minoPosRow, minoPosCol);
//         // TODO:Serverに送信する前にminoPosRowとminoPosColをちゃんと仕様で定めてある所定の位置に設定する
//         Socket.sendPlaceMinoInfo(mino, minoPosRow, minoPosCol);
//     }
//
//     function adjustPosition(posX, posY) {
//         const posCol = Math.round(posX / CELL_WIDTH);
//         const posRow = Math.round(posY / CELL_HEIGHT);
//         return {"row": posRow, "col": posCol};
//     }
//
//     function setEnabled(value) {
//         if (isEnabled === value)
//             return;
//         isEnabled = value;
//
//         const fieldContext = filterCanvas.getContext("2d");
//         fieldContext.clearRect(0, 0, WIDTH, HEIGHT);
//
//         if (isEnabled) {
//             const messageContext = messageCanvas.getContext("2d");
//             messageContext.clearRect(0, 0, WIDTH, HEIGHT);
//             draw();
//         }
//         else {
//             fieldContext.globalAlpha = FILTER_TRANSMITTANCE;
//             // Imageでフィルターしないと既存のMinoがフィルタリングされない
//             const filter = new Image();
//             filter.src = filterSrc;
//             filter.addEventListener("load", () => {
//                 fieldContext.drawImage(filter, 0, 0, WIDTH, HEIGHT);
//                 baseCanvas.getContext("2d")
//                     .drawImage(filterCanvas, 0, 0, WIDTH, HEIGHT);
//             }, false);
//         }
//     }
//
//     // isEnabledが「false」のときのみ有効
//     // isEnabledがtrueになったら自動的にclearされる
//     function drawMessages(messages) {
//         if (isEnabled)
//             return;
//         const context = messageCanvas.getContext("2d");
//         for (let i = 0; messages.length > i; i++) {
//             let message = messages[i];
//             context.font = message.font;
//             context.fillStyle = message.style;
//             context.fillText(message.message, message.posX, message.posY);
//         }
//         baseCanvas.getContext("2d")
//             .drawImage(messageCanvas, 0, 0, WIDTH, HEIGHT);
//     }
// })((this || 0).self || global);