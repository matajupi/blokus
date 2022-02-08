"use strict";

class Mino {
    get rows() {
        return this.field.length;
    }

    get cols() {
        return this.field[0].length;
    }

    get field() {
        if (this.fieldUpdated) {
            this.cachedField = this.createField();
        }
        return this.cachedField;
    }

    get rotateTimes() { return this._rotateTimes; }
    get flipped() { return this._flipped; }

    constructor(id, field, imageSrc) {
        this.id = id;
        this._field = field;
        this.cachedField = this._field;
        this.fieldUpdated = false;
        this.imageSrc = imageSrc;
        this._rotateTimes = 0;
        this._flipped = false;
    }

    createField() {
        let newArray = Mino.get2DArrayCopy(this._field);
        for (let i = 0; this.rotateTimes > i; i++) {
            newArray = Mino.rotate90DegreesLeft(newArray);
        }
        if (this.flipped) {
            newArray = Mino.flipHorizontally(newArray);
        }
        return newArray;
    }

    static rotate90DegreesLeft(array) {
        const rows = array.length;
        const cols = array[0].length;
        const newArray = [];
        for (let row = 0; cols > row; row++) {
            newArray[row] = [];
            for (let col = 0; rows > col; col++) {
                newArray[row][col] = array[col][cols - row - 1];
            }
        }
        return newArray;
    }

    static flipHorizontally(array) {
        const rows = array.length;
        const cols = array[0].length;
        const newArray = [];
        for (let row = 0; rows > row; row++) {
            newArray[row] = [];
            for (let col = 0; cols > col; col++) {
                newArray[row][col] = array[row][cols - col - 1];
            }
        }
        return newArray;
    }

    static get2DArrayCopy(array) {
        const newArray = [];
        for (let row = 0; array.length > row; row++) {
            newArray[row] = [];
            for (let col = 0; array[0].length > col; col++) {
                newArray[row][col] = array[row][col];
            }
        }
        return newArray;
    }

    rotate(right=false) {
        if (right)
            this.setRotateTimes((this.rotateTimes - 1 + 4) % 4);
        else
            this.setRotateTimes((this.rotateTimes + 1) % 4);
    }

    setRotateTimes(value) {
        this._rotateTimes = value % 4;
        this.fieldUpdated = true;
    }

    flip() {
        this.setFlipped(!this.flipped);
    }

    setFlipped(value) {
        this._flipped = value;
        this.fieldUpdated = true;
    }

    draw(context, x, y, cellWidth, cellHeight, onload=null) {
        this.drawFromMatrix(context, x, y, cellWidth, cellHeight, this.field, onload);
    }

    drawFromMatrixSize(context, x, y, cellWidth, cellHeight, matrixRows, matrixCols, onload=null) {
        this.drawFromMatrix(context, x, y, cellWidth, cellHeight, this.getMatrix(matrixRows, matrixCols), onload);
    }

    drawFromMatrix(context, x, y, cellWidth, cellHeight, matrix, onload=null) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const numBlocks = this.countBlocks(matrix);

        let blockCounter = 0;
        for (let row = 0; rows > row; row++) {
            for (let col = 0; cols > col; col++) {
                if (matrix[row][col] === 1) {
                    const dx = x + col * cellWidth;
                    const dy = y + row * cellHeight;
                    const image = new Image();
                    image.src = this.imageSrc;
                    image.addEventListener("load", () => {
                        context.drawImage(image, dx, dy, cellWidth, cellHeight);
                        if (++blockCounter === numBlocks && onload)
                            onload();
                    }, false);
                }
            }
        }
    }

    countBlocks(matrix) {
        let numBlocks = 0;
        for (let row = 0; matrix.length > row; row++)
            for (let col = 0; matrix[0].length > col; col++)
                if (matrix[row][col] === 1)
                    numBlocks++;
        return numBlocks;
    }

    getMatrix(matrixRows, matrixCols) {
        if (matrixRows < this.rows || matrixCols < this.cols)
            return null;
        const matrix = [];
        for (let row = 0; matrixRows > row; row++) {
            matrix[row] = [];
            for (let col = 0; matrixCols > col; col++) {
                matrix[row][col] = 0;
            }
        }
        const insertRow = Math.floor((matrixRows - this.rows) / 2);
        const insertCol = Math.floor((matrixCols - this.cols) / 2);
        for (let row = 0; this.rows > row; row++) {
            for (let col = 0; this.cols > col; col++) {
                matrix[row + insertRow][col + insertCol] = this.field[row][col];
            }
        }
        return matrix;
    }
}

// // Class
// class Mino {
//     constructor(id, src, rows, cols) {
//         this.id = id;
//         this.src = src;
//         this.rows = rows;
//         this.cols = cols;
//         this.rotateTimes = 0;
//         this.flipped = false;
//         this.posX = 0;
//         this.posY = 0;
//     }
//
//     rotate(left=false) {
//         if (left)
//             this.rotateTimes = (this.rotateTimes - 1 + 4) % 4;
//         else
//             this.rotateTimes = (this.rotateTimes + 1) % 4;
//     }
//
//     flip() {
//         this.flipped = !this.flipped;
//     }
//
//     draw(context, row, col, cellWidth, cellHeight, onload=null) {
//         this.drawFromCoordinate(context, col * cellWidth, row * cellHeight,
//             cellWidth, cellHeight, onload);
//     }
//
//     drawFromCoordinate(context, x, y, cellWidth, cellHeight, onload=null) {
//         this.posX = x;
//         this.posY = y;
//
//         const imageWidth = this.cols * cellWidth;
//         const imageHeight = this.rows * cellHeight;
//         const dummyImageWidth = this.cols % 2 === 0 ?
//             imageWidth + cellWidth : imageWidth;
//         const dummyImageHeight = this.rows % 2 === 0 ?
//             imageHeight + cellHeight : imageHeight;
//         const centerPointX = this.posX
//             + dummyImageWidth / 2;
//         const centerPointY = this.posY
//             + dummyImageHeight / 2;
//
//         const image = new Image();
//         image.src = this.src;
//
//         image.addEventListener("load", () => {
//             context.save();
//             context.translate(centerPointX, centerPointY);
//             context.rotate(Math.PI / 2 * this.rotateTimes);
//             if (this.flipped) {
//                 context.translate(-centerPointX, -centerPointY);
//                 context.scale(-1, 1);
//                 context.drawImage(image, -this.posX, this.posY,
//                     -imageWidth, imageHeight);
//             }
//             else {
//                 context.drawImage(image, -dummyImageWidth / 2, -dummyImageHeight / 2,
//                     imageWidth, imageHeight);
//             }
//             context.restore();
//
//             if (onload)
//                 onload();
//         }, false);
//     }
// }