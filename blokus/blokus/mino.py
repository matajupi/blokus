import numpy as np

MINO_SHAPES = [
    np.array([
        [1],
    ]),
    np.array([
        [1, 1],
    ]),
    np.array([
        [0, 1],
        [1, 1],
    ]),
    np.array([
        [1, 1, 1],
    ]),
    np.array([
        [1, 1, 1, 1],
    ]),
    np.array([
        [0, 0, 1],
        [1, 1, 1],
    ]),
    np.array([
        [1, 1, 0],
        [0, 1, 1],
    ]),
    np.array([
        [1, 1],
        [1, 1],
    ]),
    np.array([
        [1, 1, 1],
        [0, 1, 0],
    ]),
    np.array([
        [0, 1, 1],
        [1, 1, 0],
        [0, 1, 0],
    ]),
    np.array([
        [1, 1, 1, 1, 1],
    ]),
    np.array([
        [0, 0, 0, 1],
        [1, 1, 1, 1],
    ]),
    np.array([
        [1, 1, 0, 0],
        [0, 1, 1, 1],
    ]),
    np.array([
        [1, 1, 0],
        [1, 1, 1],
    ]),
    np.array([
        [1, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
    ]),
    np.array([
        [1, 0, 1],
        [1, 1, 1],
    ]),
    np.array([
        [0, 0, 1],
        [0, 0, 1],
        [1, 1, 1],
    ]),
    np.array([
        [0, 0, 1],
        [0, 1, 1],
        [1, 1, 0],
    ]),
    np.array([
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
    ]),
    np.array([
        [0, 0, 1, 0],
        [1, 1, 1, 1],
    ]),
    np.array([
        [1, 1, 0],
        [0, 1, 0],
        [0, 1, 1],
    ]),
]


class Mino:
    __rotate_times = 0
    __flipped = False
    __updated = True
    __field_cache = None

    id: int
    shape: int
    rows: int
    cols: int
    owner = None

    @property
    def rotate_times(self):
        return self.__rotate_times

    @rotate_times.setter
    def rotate_times(self, value):
        self.__rotate_times = value % 4
        self.__updated = True

    @property
    def flipped(self):
        return self.__flipped

    @flipped.setter
    def flipped(self, value):
        self.__flipped = value
        self.__updated = True

    @property
    def rows(self):
        return MINO_SHAPES[self.shape].shape[self.rotate_times % 2]

    @property
    def cols(self):
        return MINO_SHAPES[self.shape].shape[(self.rotate_times + 1) % 2]

    @property
    def field(self):
        """
        MinoのFieldを取得する
        """
        # 毎回計算するとコストが高く付くのでキャッシュする
        if self.__updated:
            field = MINO_SHAPES[self.shape].copy()
            field = np.rot90(field, self.rotate_times)
            if self.flipped:
                field = np.flip(field, 1)
            self.__field_cache = field
            self.__updated = False
        return self.__field_cache

    def __init__(self, m_id, shape, owner):
        self.id = m_id
        self.shape = shape
        self.owner = owner

    def rotate(self, times=1, right=False):
        """
        Minoを回転させる
        """
        times = times % 4
        if right:
            self.rotate_times = (self.rotate_times - times + 4) % 4
        else:
            self.rotate_times = (self.rotate_times + times) % 4

    def flip(self):
        """
        MinoをY軸を軸として反転させる
        """
        self.flipped = not self.flipped
