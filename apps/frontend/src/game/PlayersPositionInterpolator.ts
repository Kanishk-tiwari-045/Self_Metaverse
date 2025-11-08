import { PlayerMovement } from './PlayerMovement';
import { HasPlayerMovedInterface } from './types';

export class PlayersPositionInterpolator {
  playerMovements: Map<number, PlayerMovement> = new Map<
    number,
    PlayerMovement
  >();

  updatePlayerPosition(userId: number, playerMovement: PlayerMovement): void {
    this.playerMovements.set(userId, playerMovement);
  }

  removePlayer(userId: number): void {
    this.playerMovements.delete(userId);
  }

  getUpdatedPositions(tick: number): Map<number, HasPlayerMovedInterface> {
    const positions = new Map<number, HasPlayerMovedInterface>();
    this.playerMovements.forEach(
      (playerMovement: PlayerMovement, userId: number) => {
        if (playerMovement.isOutdated(tick)) {
          this.playerMovements.delete(userId);
        }
        positions.set(userId, playerMovement.getPosition(tick));
      }
    );
    return positions;
  }
}
