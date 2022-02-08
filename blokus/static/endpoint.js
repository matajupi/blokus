"use strict";
class Endpoint extends Colleague {
    constructor(uri) {
        super();
        this.uri = uri;
        this.socket = new WebSocket(this.uri);

        // Event listeners
        // 一度ラムダ式を挟んでメソッドを呼び出さないとスコープがおかしくなる(Handlerも同様)
        this.socket.addEventListener("open", (event) => { this.onOpen(event); }, false);
        this.socket.addEventListener("close", (event) => { this.onClose(event); }, false);
        this.socket.addEventListener("message", (event) => { this.onMessage(event); }, false);

        this.handlers = {
            "start_game": (json) => { this.startGame(json); },
            "get_place_mino_info": (json) => { this.getPlaceMinoInfo(json); },
            "mino_placed": (json) => { this.minoPlaced(json); },
            "invalid_mino_placed_location": (json) => { this.invalidMinoPlacedLocation(json); },
            "skip_turn": (json) => { this.skipTurn(json); },
            "finish_game": (json) => { this.finishGame(json); },
            "exception_occurred": (json) => { this.exceptionOccurred(json); },
            "test": (json) => { this.test(json); },
        };
    }

    onOpen(_) {
        console.log("WebSocket open...");
    }

    onClose(_) {
        console.log("WebSocket close...");
    }

    onMessage(event) {
        const json = JSON.parse(event.data);
        if (!(json.method in this.handlers)) {
            console.error(`WebSocketError: Unsupported method named '${json.method}' has called.`);
            return;
        }
        const handler = this.handlers[json.method];
        handler(json);
    }

    startGame(json) {
        console.log("start game");
        this.mediator.colleagueChanged({
            "type": "startGame",
            "minos": json.minos,
            "id": json.id,
        });
    }

    getPlaceMinoInfo(_) {
        this.mediator.colleagueChanged({
            "type": "getPlaceMinoInfo",
        });
    }

    minoPlaced(json) {
        this.mediator.colleagueChanged({
            "type": "minoPlaced",
            "id": json.id,
            "owner": json.owner,
            "rotateTimes": json.rotate_times,
            "flipped": json.flipped,
            "row": json.row,
            "col": json.col,
        });
    }

    invalidMinoPlacedLocation(_) {
        alert("Invalid mino placed location.");
    }

    skipTurn(_) {
        this.mediator.colleagueChanged({
            "type": "skipTurn",
        });
    }

    finishGame(json) {
        this.mediator.colleagueChanged({
            "type": "finishGame",
            "winners": json.winners,
            "numPrevMinos": json.num_prev_minos,
        });
    }

    exceptionOccurred(json) {
        alert(json.message);
    }

    test(json) {
        console.log(json.message);
    }

    sendMessage(json) {
        const obj = JSON.stringify(json);
        this.socket.send(obj);
    }

    replyMinoInfo(mino, row, col) {
        this.sendMessage({
            "method": "reply",
            "id": mino.id,
            "rotate_times": mino.rotateTimes,
            "flipped": mino.flipped,
            "row": row,
            "col": col,
        });
    }
}


// (function(global) {
//     "use strict"
//
//     // Class
//     function Socket() { }
//
//     // Headers
//     global.Socket = Socket;
//     global.Socket.init = init;
//     global.Socket.sendPlaceMinoInfo = sendPlaceMinoInfo;
//
//     // Members
//     let socket;
//     let endpoint;
//
//     function init(_endpoint) {
//         endpoint = _endpoint;
//         // TODO: サーバーの準備ができたらつなぐ
//         socket = new WebSocket(endpoint);
//
//         // EventListeners
//         socket.addEventListener("open", onOpen, false);
//         socket.addEventListener("close", onClose, false);
//         socket.addEventListener("message", onMessage, false);
//     }
//
//     function onOpen(event) {
//
//     }
//
//     function onClose(event) {
//
//     }
//
//     const handlers = {
//         "start_game": startGame,
//         "mino_placed": minoPlaced,
//         "get_place_mino_info": getPlaceMinoInfo,
//         "invalid_mino_placed_location": invalidMinoPlacedLocation,
//         "skip_turn": skipTurn,
//         "finish_game": finishGame,
//         "exception_occurred": exceptionOccurred,
//     };
//
//     function onMessage(event) {
//         const json = JSON.parse(event.data);
//         if (!(json.method in handlers)) {
//             console.error(`WebSocketError: Unsupported method named '${json.method}' has called.`);
//             return;
//         }
//         const handler = handlers[json.method];
//         handler(json);
//     }
//
//     function sendMessage(obj) {
//         const json = JSON.stringify(obj);
//         socket.send(json);
//     }
//
//     // Handle methods
//     function startGame(_) {
//     }
//
//     function minoPlaced(json) {
//         const id = json.id;
//         // owner 0: player
//         //       1: AI
//         const owner = json.owner;
//         const row = json.row;
//         const col = json.col;
//         let mino;
//         if (owner === 0) {
//             // ownerがplayerだったらrotate_timesやflippedの情報は必要ない
//             mino = Game.playerMinos[id];
//             MinoViewer.removeMino(mino);
//             Board.placeMino(row, col, mino);
//             // drawするために一度setEnabled(true)を呼び出す
//             Board.setEnabled(true);
//             Board.setEnabled(false);
//             Board.drawMessages([
//                 Board.aiTurnMessage,
//                 Board.thinkingMessage,
//             ]);
//         }
//         else {
//             const rotate_times = json.rotate_times;
//             const flipped = json.flipped;
//             mino = Game.aiMinos[id];
//             mino.rotate_times = rotate_times;
//             mino.flipped = flipped;
//             // placeしたMinoを反映させるため一度isEnabledをtrueにする
//             Board.placeMino(row, col, mino);
//             Board.setEnabled(true);
//             // SkipやFinishの可能性もあるから一概にisEnabledをtrueにできない
//             // getPlaceMinoInfoが送られてきてからisEnabledをtrueにする
//             Board.setEnabled(false);
//             Board.drawMessages([Board.loadingMessage]);
//         }
//     }
//
//     function getPlaceMinoInfo(_) {
//         Board.setEnabled(true);
//     }
//
//     function invalidMinoPlacedLocation(_) {
//         alert("Can't place Mino in the specified position.");
//         Board.setEnabled(true);
//     }
//
//     function skipTurn(_) {
//         Board.setEnabled(false);
//         messages.push();
//         Board.drawMessages([
//             Board.aiTurnMessage,
//             Board.thinkingMessage,
//             Board.skipMessage,
//         ]);
//     }
//
//     function finishGame(json) {
//         // TODO: 仕様変更したから書き直す
//         const winner = json.winner;
//         const num_prev = json.num_player_previous_minos;
//         const messages = [];
//         // TODO: 下のメッセージをBoardに移す
//         if (winner === 0) {
//             // Playerの勝ち
//             // TODO: 追加のやつは派手に飾りたい
//             // もし色がボケて地味だったら画像作る(余裕があれば)
//             if (num_prev === 0) {
//                 messages.push({
//                     "message": "Divine work!!",
//                     "font": "",
//                     "style": "blue",
//                     "posX": 0,
//                     "posY": 0,
//                 });
//             }
//             else if (num_prev <= 5) {
//                 messages.push({
//                     "message": "Excellent!!",
//                     "font": "",
//                     "style": "blue",
//                     "posX": 0,
//                     "posY": 0,
//                 });
//             }
//             else if (num_prev <= 10) {
//                 messages.push({
//                     "message": "Great!!",
//                     "font": "",
//                     "style": "blue",
//                     "posX": 0,
//                     "posY": 0,
//                 });
//             }
//             messages.push({
//                 "message": "You win!!",
//                 "font": "",
//                 "style": "blue",
//                 "posX": 0,
//                 "posY": 0,
//             });
//         }
//         else if (winner === 1) {
//             messages.push({
//                 "message": "You lose!!",
//                 "font": "",
//                 "style": "red",
//                 "posX": 0,
//                 "posY": 0,
//             });
//         }
//         else {
//             messages.push({
//                 "message": "Draw!!",
//                 "font": "",
//                 "style": "black",
//                 "posX": 0,
//                 "posY": 0,
//             });
//         }
//         messages.push({
//             "message": `Number of remaining minos: ${String(num_prev)}`,
//             "font": "",
//             "style": "black",
//             "posX": 0,
//             "posY": 0,
//         });
//         Board.setEnabled(false);
//         Board.drawMessages(messages);
//     }
//
//     function exceptionOccurred(json) {
//         const message = json.message;
//         alert(message);
//         socket.close();
//     }
//
//     // Public methods
//     function sendPlaceMinoInfo(mino, row, col) {
//         const json = {
//             "id": mino.id,
//             "row": row,
//             "col": col,
//             "rotate_times": mino.rotateTimes,
//             "flipped": mino.flipped,
//         }
//         sendMessage(json);
//     }
// })((this || 0).self || global);