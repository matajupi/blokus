from .board import Board
from .players import BasePlayer

FIELD_ROWS = 20
FIELD_COLS = 20


class Blokus:
    board: Board
    players: list[BasePlayer]

    def __init__(self, players):
        self.board = Board(FIELD_ROWS, FIELD_COLS)
        self.players = players

    async def start(self):
        """
        Blokusのメインロジック
        入出力などの制御はBlokusとPlayerによって行われる
        """
        # ゲームがスタートしたことを通知
        for player in self.players:
            await player.start_game(self.board)

        # 最初のターン
        for player in self.players:
            await self.__turn(player, True)

        # 中間のターン
        while not self.__is_finished():
            for player in self.players:
                await self.__turn(player)

        # 終了時の処理
        winner_info = self.__get_winner_info()
        for player in self.players:
            await player.finish_game(winner_info)

    async def __turn(self, player: BasePlayer, first=False):
        """
        Playerの一回のターン
        """
        # ミノを置ける場所がなければスキップ
        if not(first or self.board.exists_can_place_location(player)):
            await player.skip_turn()
            return

        while True:
            place_mino_info = await player.get_place_mino_info(first)
            # place_mino_infoの仕様 { "mino": Mino, "row": int, "col": int }
            # なお、RotateTimesやFlippedはすでにMinoに施されている
            try:
                mino = place_mino_info["mino"]
                row = place_mino_info["row"]
                col = place_mino_info["col"]
                if not self.board.try_place(mino, row, col, first):
                    raise ValueError()
            except (KeyError, TypeError, AttributeError, ValueError):
                await player.invalid_mino_placed_location()
                continue

            # ミノが置かれたことを通知
            for p in self.players:
                await p.mino_placed(mino, row, col)
            player.remove_mino(mino)
            break

    def __is_finished(self):
        """
        ゲームが終了したか
        """
        flag = False
        for player in self.players:
            flag |= len(player.own_minos) != 0 and self.board.exists_can_place_location(player)
        return not flag

    def __get_winner_info(self):
        """
        勝ち負けの情報を返す
        """
        num_prev_minos = list(
            map(lambda p: (p.id, len(p.own_minos)), self.players)
        )
        min_num_prev_minos = min(num_prev_minos, key=lambda t: t[1])[1]
        winners = list(map(
            lambda p: p.id,
            filter(lambda p: len(p.own_minos) == min_num_prev_minos, self.players)
        ))
        if len(winners) == len(self.players):
            winners = list()
        retval = {
            "winners": winners,
            "num_prev_minos": dict(num_prev_minos),
        }
        return retval
