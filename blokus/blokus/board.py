import numpy as np
from .mino import Mino


class Board:
    rows: int
    cols: int
    field: np.array
    player_valid_corners: dict[set[tuple[int, int]]]

    def __init__(self, rows, cols):
        self.rows = rows
        self.cols = cols
        self.field = np.full((rows, cols), -1)
        self.player_valid_corners = dict()

    def __exists_can_place_location_slow_algorithm(self, player):
        """
        高速化のために作ったが逆に遅くなったアルゴリズム
        """
        valid_corners = self.player_valid_corners[player.id]
        remove_corners = set()
        flag = False
        searched = set()

        for row, col in valid_corners:
            if self.field[row, col] != -1:
                remove_corners.add((row, col))
        self.player_valid_corners[player.id] -= remove_corners

        for row, col in valid_corners:
            for mino in player.own_minos:
                for rt in range(4):
                    for fp in range(2):
                        mino.rotate_times = rt
                        mino.flipped = fp == 1
                        for r in range(-mino.rows + 1, 1):
                            for c in range(-mino.cols + 1, 1):
                                pr = row + r
                                pc = col + c
                                if (pr, pc, rt, fp, mino.id) in searched:
                                    continue
                                searched.add((pr, pc, rt, fp, mino.id))
                                flag |= self.can_place(mino, pr, pc)
                                if flag:
                                    return flag
        return flag

    def __exists_can_place_location_fast_algorithm(self, player):
        """
        置ける場所有効リストがなかったときの遅いアルゴリズム(多分使わない)
        """
        flag = False
        for mino in player.own_minos:
            for rt in range(4):
                for fp in range(2):
                    mino.rotate_times = rt
                    mino.flipped = fp == 1
                    for row in range(self.rows):
                        for col in range(self.cols):
                            flag |= self.can_place(mino, row, col)
                            # 枝狩り
                            if flag:
                                return flag
        return flag

    def exists_can_place_location(self, player):
        """
        Playerの持っているMinoを置ける場所が存在するか
        """
        # if player.id in self.player_valid_corners:
        #     return self.__exists_can_place_location_slow_algorithm(player)
        return self.__exists_can_place_location_fast_algorithm(player)

    def __is_valid_range(self, row, col):
        """
        row, colが範囲内に収まっているかチェックする
        """
        return 0 <= row < self.rows and 0 <= col < self.cols

    def __is_adjacent_corner(self, mino, row, col):
        """
        Minoをrow, colに置く時に盤面の角に接するか判定する
        """
        if row == 0:
            r = 0
        elif row == self.rows - mino.rows:
            r = mino.rows - 1
        else:
            return False

        if col == 0:
            c = 0
        elif col == self.cols - mino.cols:
            c = mino.cols - 1
        else:
            return False

        return mino.field[r, c] == 1

    def __is_same_owner(self, mino, row, col):
        """
        すでにrow, colにおいてあるMinoと引数で受け取ったminoのOwnerが同じか判定する
        """
        return self.__is_valid_range(row, col) \
            and self.field[row, col] == mino.owner.id

    def __field_empty(self, mino, row, col):
        """
        row, colにminoを置く時、すでにおいてあるMinoと重ならないか判定する
        """
        flag = True
        for r in range(mino.rows):
            for c in range(mino.cols):
                if mino.field[r, c] == 0:
                    continue
                flag &= self.field[row + r, col + c] == -1
        return flag

    def __place(self, mino, row, col, value, force=False):
        """
        盤面のrow, colにミノを置く。この時盤面に実際に置かれる値はvalueの値となる。
        """
        if not (force or self.__field_empty(mino, row, col)):
            return False

        for r in range(mino.rows):
            for c in range(mino.cols):
                if mino.field[r, c] == 0:
                    continue
                self.field[row + r, col + c] = value
        return True

    def __is_adjacent_specified_value(
            self, value, current_row, current_col, check_delta_rows, check_delta_cols, default=-2, on_checked=None):
        """
        check_delta_rows, check_delta_colsに基づいてdefaultが置かれているミノブロックがvalueと接しているか判定する
        """
        return self.__is_adjacent_specified_value_helper(
            value, current_row, current_col, check_delta_rows, check_delta_cols, default, on_checked, set()
        )

    def __is_adjacent_specified_value_helper(
            self, value, current_row, current_col, check_delta_rows, check_delta_cols, default, on_checked, visited):
        if not self.__is_valid_range(current_row, current_col) \
                or (current_row, current_col) in visited:
            return False
        if self.field[current_row, current_col] != default:
            return False
        visited.add((current_row, current_col))

        flag = False
        # Check
        for cdr, cdc in zip(check_delta_rows, check_delta_cols):
            cpr = current_row + cdr
            cpc = current_col + cdc
            vr = self.__is_valid_range(cpr, cpc)
            if not vr:
                continue
            f = self.field[current_row + cdr, current_col + cdc] == value
            if on_checked:
                on_checked(cpr, cpc, f)
            flag |= f
        # Move
        move_delta_rows = [1, -1, 0, 0]
        move_delta_cols = [0, 0, 1, -1]
        for mdr, mdc in zip(move_delta_rows, move_delta_cols):
            flag |= self.__is_adjacent_specified_value_helper(
                value, current_row + mdr, current_col + mdc, check_delta_rows, check_delta_cols, default, on_checked,
                visited
            )
        return flag

    @staticmethod
    def __find_start_position(mino, row, col):
        start_row = 0
        start_col = 0
        for r in range(mino.rows):
            for c in range(mino.cols):
                if mino.field[r, c] == 1:
                    start_row = r + row
                    start_col = c + col
        return start_row, start_col

    def can_place(self, mino: Mino, row, col, first=False):
        """
        (row, col)に基準（Minoをきれいに囲む長方形の左上）を置くとして
        Minoを置くことができるか
        """
        # 範囲チェック
        if not (self.__is_valid_range(row, col)
                and self.__is_valid_range(row + mino.rows - 1, col + mino.cols - 1)):
            return False
        # 初回であれば角の隣接とそこに置けるかだけを判定する
        if first:
            return self.__is_adjacent_corner(mino, row, col) and self.__field_empty(mino, row, col)
        # 仮にFieldに-2をおいてみる
        if not self.__place(mino, row, col, -2):
            return False

        # 始点を探す
        start_row, start_col = self.__find_start_position(mino, row, col)

        # 同じPlayerのMinoと側面で隣接していないか判定
        check_delta_rows = [1, -1, 0, 0]
        check_delta_cols = [0, 0, 1, -1]
        if self.__is_adjacent_specified_value(mino.owner.id, start_row, start_col, check_delta_rows, check_delta_cols):
            self.__place(mino, row, col, -1, True)
            return False

        # 同じPlayerのMinoと角で隣接しているか判定
        check_delta_rows = [1, 1, -1, -1]
        check_delta_cols = [1, -1, 1, -1]
        if not self.__is_adjacent_specified_value(
                mino.owner.id, start_row, start_col, check_delta_rows, check_delta_cols):
            self.__place(mino, row, col, -1, True)
            return False

        # 今回は置けるかの判定だけなので元の状態に戻す
        self.__place(mino, row, col, -1, True)
        return True

    def try_place(self, mino: Mino, row, col, first=False):
        """
        (row, col)を基準（Minoをきれいに囲む長方形の左上）としてMinoを
        おいてみる
        おけなかったらFalseを返す
        """
        # 置けるか確かめる
        if not self.can_place(mino, row, col, first):
            return False

        # 置く
        self.__place(mino, row, col, mino.owner.id)

        # おいたミノでまだ何にも接していない角を取得してキャッシュする
        # valid_corners = self.__get_valid_corners(mino, row, col)
        # if mino.owner.id not in self.player_valid_corners:
        #     self.player_valid_corners[mino.owner.id] = valid_corners
        # else:
        #     self.player_valid_corners[mino.owner.id] |= valid_corners
        return True

    def __get_valid_corners(self, mino, row, col):
        valid_corners = set()

        def on_checked(r, c, _):
            if self.field[r, c] != -1:
                return
            valid_corners.add((r, c))

        start_row, start_col = self.__find_start_position(mino, row, col)

        check_delta_rows = [1, 1, -1, -1]
        check_delta_cols = [1, -1, 1, -1]
        self.__is_adjacent_specified_value(mino.owner.id, start_row, start_col, check_delta_rows, check_delta_cols,
                                           default=mino.owner.id, on_checked=on_checked)
        return valid_corners
