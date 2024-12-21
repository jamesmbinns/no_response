import React from "react";

interface StartGameProps {
  setGameStarted: (started: boolean) => void;
}

export const StartGame: React.FC<StartGameProps> = ({ setGameStarted }) => {
  return (
    <div className="text-white">
      <div className="text-white max-w-screen-md mx-auto">
        <div className="text-center mb-2">
          <p>Base des Forces canadiennes Bagotville, Quebec, Canada</p>
          <p>
            Force Aérienne Conjointe de l’Amérique du Nord / Joint North
            American Air Force
          </p>
          <p>Ordres Permanents 729-198 / Permanent Orders 729-198</p>
          <p>1ère Escadrille, Les Vautours / 1st Squadron, The Vultures</p>
          <p>Colonel Josephine Ducheval</p>
        </div>
        <div className="text-left mb-2">
          <p className="mb-2">
            <span className="fw-bold">Objectif:</span> La Reprise de L'Île
            Perrot
          </p>
          <p className="mb-2">
            <span className="fw-bold">Durée du Service:</span> Indéterminée
          </p>
          <p className="mb-2">
            <span className="fw-bold">Détails:</span> Par l’autorité du Colonel
            Josephine Ducheval, vous êtes par la présente ordonné de prendre le
            commandement de la 1ère Escadrille de la Force Aérienne Conjointe de
            l’Amérique du Nord, connue sous le nom des Vautours. Votre mission
            est de reprendre L’Île-Perrot des morts-vivants et d’assurer la
            sécurité de sa population civile. En tant qu’île possédant des
            ressources agricoles importantes située dans le fleuve
            Saint-Laurent, L’Île-Perrot est un territoire stratégique crucial.
            Elle servira de grenier, de centre de fabrication et de quartier
            général militaire pour la libération de Montréal et l’effort plus
            large de restauration de notre civilisation.
          </p>
          <p className="mb-10">
            Vous avez pleine autorité pour réquisitionner des ressources, y
            compris du personnel et des fournitures, par voie aérienne et
            maritime. Un effort maximal est attendu. L’échec n’est pas une
            option. Agissez avec la plus grande détermination pour accomplir
            cette mission.
          </p>
          <div style={{ color: "lightgrey" }}>
            <p className="mb-2">
              <span className="fw-bold">Objective:</span> The Reclaimation of
              L'Île-Perrot
            </p>
            <p className="mb-2">
              <span className="fw-bold">Period of Service: </span>
              Indefinite
            </p>

            <p className="mb-2">
              <span className="fw-bold">Details:</span> By authority of Colonel
              Josephine Ducheval, you are hereby ordered to assume command of
              the 1st Squadron of the Joint North American Air Force, known as
              The Vultures. Your mission is to reclaim L'Île-Perrot from the
              undead and secure the safety of its civilian population. As an
              island with significant agricultural assets situated in the St.
              Lawrence River, L'Île-Perrot is a critical strategic territory. It
              will serve as the breadbasket, manufacturing hub, and military
              headquarters for the liberation of Montreal and the broader effort
              to restore civilization.
            </p>
            <p className="mb-2">
              You are granted full authority to requisition resources, including
              personnel and supplies, by both air and water. Maximum effort is
              expected. Failure is not an option. Proceed with the utmost
              determination to fulfill this mission.
            </p>
          </div>
        </div>
      </div>
      <button
        className="bg-white text-black p-2 radius-sm float-right"
        onClick={() => setGameStarted(true)}
      >
        Start Mission
      </button>
    </div>
  );
};
