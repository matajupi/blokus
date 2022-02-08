"use strict";

class Game {
    static get CELL_LINE_STYLE() { return "black"; }
    static get OUTLINE_WIDTH() { return 5; }

    constructor(board, minoViewer, endpoint, playerMinoSrc, aiMinoSrc, messages) {
        this.board = board;
        this.minoViewer = minoViewer;
        this.endpoint = endpoint;

        this.board.setMediator(this);
        this.minoViewer.setMediator(this);
        this.endpoint.setMediator(this);

        this.playerMinoSrc = playerMinoSrc;
        this.aiMinoSrc = aiMinoSrc;
        this.messages = messages;
        this.id = -1;

        this.playerMinos = [];
        this.aiMinos = [];
    }

    colleagueChanged(info) {
        if (info.type === "startGame") {
            this.createMinos(info.minos);
            this.minoViewer.setMinos(this.playerMinos);
            this.id = info.id;
        }
        else if (info.type === "getPlaceMinoInfo") {
            this.board.clearMessage();
            this.board.setEnabled(true);
        }
        else if (info.type === "mouseMoveBoard") {
            const x = info.x;
            const y = info.y;
            const mino = this.minoViewer.currentMino;
            if (mino)
                this.board.setCapturedMinoInfo(mino, x, y);
        }
        else if (info.type === "clickBoard") {
            const mino = info.mino;
            const row = info.row;
            const col = info.col;
            if (this.board.enabled) {
                this.endpoint.replyMinoInfo(mino, row, col);
                this.board.setEnabled(false);
                // this.board.setMessage(this.messages.loading);
            }
        }
        else if (info.type === "minoPlaced") {
            const owner = info.owner;
            const id = info.id;
            const mino = this.getMino(owner, id);

            if (owner === this.id) {
                this.minoViewer.removeMinoById(id);
                // this.board.setMessage(this.messages.thinking);
            }
            else {
                this.board.clearMessage();
            }

            mino.setRotateTimes(info.rotateTimes);
            mino.setFlipped(info.flipped);
            this.board.placeMino(mino, info.row, info.col);
        }
        else if (info.type === "finishGame") {
            const winners = info.winners;
            const numPrevMinos = info.numPrevMinos;
            let message;
            if (winners.length === 0) {
                message = this.messages.draw;
            }
            else if (winners[0] === this.id) {
                message = this.messages.win;
            }
            else {
                message = this.messages.lose;
            }
            this.board.setMessage(message);
        }
        else if (info.type === "skipTurn") {
            this.board.setMessage(this.messages.skip);
        }
    }

    createMinos(jsonMinos) {
        for (let i = 0; jsonMinos.length > i; i++) {
            const jsonMino = jsonMinos[i];
            this.playerMinos.push(new Mino(jsonMino.id, jsonMino.field, this.playerMinoSrc));
            this.aiMinos.push(new Mino(jsonMino.id, jsonMino.field, this.aiMinoSrc));
        }
    }

    getMino(owner, id) {
        let targetMinos;
        if (owner === this.id)
            targetMinos = this.playerMinos;
        else
            targetMinos = this.aiMinos;

        let targetMino;
        for (let i = 0; targetMinos.length > i; i++) {
            if (targetMinos[i].id === id)
                targetMino = targetMinos[i];
        }
        return targetMino;
    }
}

// (function(global) {
//     "use strict"
//
//     // Magic numbers
//     const CELL_LINE_STYLE = 'black'
//     const OUTLINE_WIDTH = 5;
//
//
//     // Class
//     function Game() { }
//
//     // new Mino(0, "minos/player0.png", 1, 3),
//     // new Mino(1, "minos/player0.png", 1, 3),
//     // new Mino(2, "minos/player1.png", 1, 2),
//     // new Mino(3, "minos/player1.png", 1, 2),
//     // new Mino(4, "minos/player2.png", 2, 3),
//     // new Mino(5, "minos/player2.png", 2, 3),
//
//     const capturedMinoInfo = {
//         captured: false,
//         mino: null,
//         diffX: 0,
//         diffY: 0,
//     }
//
//     // Headers
//     // 注意：当たり前だが値型をGlobal空間に代入すると現在の空間に存在する変数の値と
//     // 違う値となってしまうためgetter, setterを設ける。
//     global.CELL_LINE_STYLE = CELL_LINE_STYLE;
//     global.OUTLINE_WIDTH = OUTLINE_WIDTH;
//     global.BOARD_ROWS = BOARD_ROWS;
//     global.BOARD_COLS = BOARD_COLS;
//     global.VIEWER_ROWS = VIEWER_ROWS;
//     global.VIEWER_COLS = VIEWER_COLS;
//     global.Game = Game;
//     global.Game.init = init;
//     global.Game.capturedMinoInfo = capturedMinoInfo;
//
//     // Members
//     let boardCanvas;
//     let minoViewerCanvas;
//     let endpoint;
//     let playerMinos;
//     let aiMinos;
//
//     function init(_boardCanvas, _minoViewerCanvas, _endpoint, _playerMinos, _aiMinos, filterSrc) {
//         boardCanvas = _boardCanvas;
//         minoViewerCanvas = _minoViewerCanvas;
//         endpoint = _endpoint;
//         playerMinos = _playerMinos;
//         aiMinos = _aiMinos;
//         global.Game.playerMinos = playerMinos;
//         global.Game.aiMinos = aiMinos;
//
//         Board.init(boardCanvas, filterSrc);
//         MinoViewer.init(minoViewerCanvas);
//         Socket.init(endpoint);
//     }
// })((this || 0).self || global);