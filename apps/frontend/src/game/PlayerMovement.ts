import { PositionInterface, HasPlayerMovedInterface } from './types';

export class PlayerMovement {
  constructor(
    private startPosition: PositionInterface,
    private startTick: number,
    private endPosition: HasPlayerMovedInterface,
    private endTick: number
  ) {}

  isOutdated(tick: number): boolean {
    // If the endPosition is NOT moving, no extrapolation needed.
    if (this.endPosition.moving === false && tick > this.endTick) {
      return true;
    }
    return tick > this.endTick + 1000; // 1 second extrapolation max
  }

  getPosition(tick: number): HasPlayerMovedInterface {
    // Special case: end position reached and end position is not moving
    if (tick >= this.endTick && this.endPosition.moving === false) {
      return this.endPosition;
    }

    const progress = Math.min(
      1,
      (tick - this.startTick) / (this.endTick - this.startTick)
    );
    const x =
      (this.endPosition.x - this.startPosition.x) * progress +
      this.startPosition.x;
    const y =
      (this.endPosition.y - this.startPosition.y) * progress +
      this.startPosition.y;

    return {
      x,
      y,
      oldX: this.startPosition.x,
      oldY: this.startPosition.y,
      direction: this.endPosition.direction,
      moving: this.isOutdated(tick) ? false : this.endPosition.moving,
    };
  }
}
