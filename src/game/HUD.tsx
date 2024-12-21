import React from "react";

interface HUDProps {
  zombiesDestroyed: number;
  hordesDestroyed: number;
  civiliansEaten: number;
  soldiersEaten: number;
  civiliansStarved: number;
  soldiersStarved: number;
}

export const HUD: React.FC<HUDProps> = ({
  zombiesDestroyed,
  hordesDestroyed,
  civiliansEaten,
  soldiersEaten,
  civiliansStarved,
  soldiersStarved,
}) => {
  return (
    <>
      <p className="mt-1">
        <span className="text-red-500 font-bold">{zombiesDestroyed}</span>{" "}
        zombies destroyed
      </p>
      <p className="mt-1">
        <span className="text-red-500 font-bold">{hordesDestroyed}</span> hordes
        destroyed
      </p>
      <p className="mt-1">
        <span className="text-red-500 font-bold">{civiliansEaten}</span>{" "}
        civilians eaten
      </p>
      <p className="mt-1">
        <span className="text-red-500 font-bold">{soldiersEaten}</span> soldiers
        eaten
      </p>
      <p className="mt-1">
        <span className="text-red-500 font-bold">{civiliansStarved}</span>{" "}
        civilians starved
      </p>
      <p className="mt-1">
        <span className="text-red-500 font-bold">{soldiersStarved}</span>{" "}
        soldiers starved
      </p>
    </>
  );
};
