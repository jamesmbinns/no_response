import React from "react";

import { HUD } from "./HUD";

interface EndGameProps {
  zombiesDestroyed: number;
  hordesDestroyed: number;
  civiliansEaten: number;
  soldiersEaten: number;
  civiliansStarved: number;
  soldiersStarved: number;
  totalCivilians: number;
}

export const EndGame: React.FC<EndGameProps> = ({
  zombiesDestroyed,
  hordesDestroyed,
  civiliansEaten,
  soldiersEaten,
  civiliansStarved,
  soldiersStarved,
  totalCivilians,
}) => {
  return (
    <div>
      <h1 className="mb-2">You won the game!</h1>
      <p className="mt-1">
        <span className="text-red-500 font-bold">
          {totalCivilians - civiliansEaten - civiliansStarved}
        </span>{" "}
        civilians saved
      </p>
      <HUD
        zombiesDestroyed={zombiesDestroyed}
        hordesDestroyed={hordesDestroyed}
        civiliansEaten={civiliansEaten}
        soldiersEaten={soldiersEaten}
        civiliansStarved={civiliansStarved}
        soldiersStarved={soldiersStarved}
      />
      <p className="mt-2">Big thanks to all of our testers:</p>
      <p>James Binns</p>
    </div>
  );
};
