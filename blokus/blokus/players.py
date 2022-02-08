import abc
import random

from starlette.websockets import WebSocket

from .mino import Mino, MINO_SHAPES
from .board import Board


class BasePlayer(object, metaclass=abc.ABCMeta):
    id: int
    own_minos: list[Mino]
    board: Board

    def __init__(self, p_id):
        self.id = p_id
        len_shapes = len(MINO_SHAPES)
        self.own_minos = [
            Mino(i, i % len_shapes, self) for i in range(len_shapes * 2)
        ]

    async def start_game(self, board: Board):
        self.board = board

    @abc.abstractmethod
    async def get_place_mino_info(self, first: bool):
        pass

    @abc.abstractmethod
    async def mino_placed(self, mino, row, col):
        pass

    @abc.abstractmethod
    async def skip_turn(self):
        pass

    @abc.abstractmethod
    async def invalid_mino_placed_location(self):
        pass

    @abc.abstractmethod
    async def finish_game(self, winner_info: dict):
        pass

    def remove_mino(self, mino):
        self.own_minos.remove(mino)

    def get_mino_by_id(self, mino_id):
        """
        IDよりミノを返す
        """
        for mino in self.own_minos:
            if mino.id == mino_id:
                return mino
        return None


class WebSocketPlayer(BasePlayer):
    sock: WebSocket

    def __init__(self, p_id, sock: WebSocket):
        super().__init__(p_id)
        self.sock = sock

    async def start_game(self, board: Board):
        await super().start_game(board)
        minos = list()
        for mino in self.own_minos:
            mino.rotate_times = 0
            mino.flipped = False
            minos.append({
                "id": mino.id,
                "field": mino.field.tolist(),
            })
        await self.sock.send_json({
            "method": "start_game",
            "minos": minos,
            "id": self.id,
        })

    async def get_place_mino_info(self, first: bool):
        await self.sock.send_json({"method": "get_place_mino_info"})
        place_mino_info = await self.sock.receive_json()
        ret_info = dict()
        try:
            mino = self.get_mino_by_id(place_mino_info["id"])
            mino.rotate_times = place_mino_info["rotate_times"]
            mino.flipped = place_mino_info["flipped"]
            ret_info["mino"] = mino
            ret_info["row"] = place_mino_info["row"]
            ret_info["col"] = place_mino_info["col"]
        except (KeyError, AttributeError, TypeError):
            pass
        return ret_info

    async def mino_placed(self, mino, row, col):
        await self.sock.send_json({
            "method": "mino_placed",
            "id": mino.id,
            "owner": mino.owner.id,
            "rotate_times": mino.rotate_times,
            "flipped": mino.flipped,
            "row": row,
            "col": col,
        })

    async def skip_turn(self):
        await self.sock.send_json({"method": "skip_turn"})

    async def invalid_mino_placed_location(self):
        await self.sock.send_json({"method": "invalid_mino_placed_location"})

    async def finish_game(self, winner_info: dict):
        await self.sock.send_json({
            "method": "finish_game",
            "winners": winner_info["winners"],
            "num_prev_minos": winner_info["num_prev_minos"]
        })


class AIPlayer(BasePlayer):
    async def start_game(self, board: Board):
        await super().start_game(board)

    async def get_place_mino_info(self, first: bool):
        # TODO
        pass

    async def mino_placed(self, mino, row, col):
        pass

    async def skip_turn(self):
        pass

    async def invalid_mino_placed_location(self):
        pass

    async def finish_game(self, winner_info: dict):
        pass


class CUIPlayer(BasePlayer):
    def print_board(self):
        print("\t", end="")
        for col in range(self.board.cols):
            print(col, end="\t")
        print()
        for row in range(self.board.rows):
            print(row, end="\t")
            for col in range(self.board.cols):
                print("." if self.board.field[row, col] == -1 else self.board.field[row, col], end="\t")
            print()

    async def start_game(self, board: Board):
        await super().start_game(board)
        print("Start game!!")
        self.print_board()

    async def get_place_mino_info(self, first: bool):
        mino = None
        row = -1
        col = -1
        while True:
            try:
                mino_id = int(input("ID >> "))
                rotate_times = int(input("Rotate times >> "))
                flipped = bool(int(input("Flipped(0 or 1) >> ")))
                row = int(input("Row number >> "))
                col = int(input("Col number >> "))
                mino = self.get_mino_by_id(mino_id)
                mino.rotate_times = rotate_times % 4
                mino.flipped = flipped
            except (ValueError, AttributeError, TypeError):
                print("Error...Please try again.")
                continue
            break
        return {
            "mino": mino,
            "row": row,
            "col": col,
        }

    async def mino_placed(self, mino, row, col):
        self.print_board()

    async def skip_turn(self):
        print("Skip turn.")

    async def invalid_mino_placed_location(self):
        print("Error: Invalid_mino_placed_location.")

    async def finish_game(self, winner_info: dict):
        winners = winner_info["winners"]
        num_prev_minos = winner_info["num_prev_minos"]

        if len(winners) == 0:
            print("Draw!!")
        elif self.id in winners:
            print("You win!!")
        else:
            print("You lose!!")

        print("Previous minos: " + str(num_prev_minos[self.id]))


class TestPlayer(CUIPlayer):
    async def start_game(self, board: Board):
        await BasePlayer.start_game(self, board)
        print("Start game!!")

    async def get_place_mino_info(self, first: bool):
        oms_cpy = self.own_minos.copy()
        # random.shuffle(oms_cpy)

        rts = list(range(4))
        # random.shuffle(rts)

        fps = list(range(2))
        # random.shuffle(fps)

        rows = list(range(self.board.rows))
        # random.shuffle(rows)

        cols = list(range(self.board.cols))
        # random.shuffle(cols)

        for mino in oms_cpy:
            for rt in rts:
                for fp in fps:
                    for row in rows:
                        for col in cols:
                            mino.rotate_times = rt
                            mino.flipped = fp == 1
                            if self.board.can_place(mino, row, col, first):
                                print(f"Player: {self.id}, ID: {mino.id}, Row: {row}, Col: {col}")
                                return {
                                    "mino": mino,
                                    "row": row,
                                    "col": col,
                                }
        self.print_board()
        raise RuntimeError(f"There is no location where player{self.id} can place.")

    async def mino_placed(self, mino, row, col):
        pass

    async def skip_turn(self):
        print(f"Player{self.id} Skip turn.")

    async def invalid_mino_placed_location(self):
        raise RuntimeError(f"Player{self.id} Invalid mino placed location.")

    async def finish_game(self, winner_info: dict):
        self.print_board()
        await super().finish_game(winner_info)
