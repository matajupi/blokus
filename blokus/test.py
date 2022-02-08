import asyncio
import time

from blokus.blokus import Blokus
from blokus.players import TestPlayer


if __name__ == "__main__":
    player1 = TestPlayer(1)
    player2 = TestPlayer(2)
    blokus = Blokus([player1, player2])
    # start = time.time()
    asyncio.run(blokus.start())
    # print(time.time() - start)
